import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/ejercicios/peso — Actualizar peso de un EjercicioEnDia y registrar log histórico
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { ejercicioEnDiaId, exerciseId: inputExerciseId, pacienteId, alumnoId, weight } = data;

    if (weight === undefined || weight === null || isNaN(Number(weight))) {
      return NextResponse.json({ error: 'El peso es obligatorio y debe ser un número entero.' }, { status: 400 });
    }

    const numericWeight = Math.max(0, Math.round(Number(weight)));
    let resolvedExerciseId = inputExerciseId;
    let resolvedRutinaId: string | null = null;

    // Actualizar EjercicioEnDia si tenemos el ID
    if (ejercicioEnDiaId) {
      const updatedEjercicioEnDia = await prisma.ejercicioEnDia.update({
        where: { id: ejercicioEnDiaId },
        data: { weight: numericWeight },
        include: {
          dia: {
            select: { rutinaId: true }
          }
        }
      });
      if (!resolvedExerciseId) {
        resolvedExerciseId = updatedEjercicioEnDia.exerciseId;
      }
      resolvedRutinaId = updatedEjercicioEnDia.dia?.rutinaId || null;
    }

    if (!resolvedExerciseId) {
      return NextResponse.json({ error: 'Falta exerciseId o ejercicioEnDiaId válido.' }, { status: 400 });
    }

    // Si pacienteId o alumnoId no viene pero tenemos el ejercicioEnDiaId, podemos obtener el pacienteId/alumnoId de la rutina
    let finalPacienteId = pacienteId || null;
    let finalAlumnoId = alumnoId || null;

    if (resolvedRutinaId && (!finalPacienteId && !finalAlumnoId)) {
      const rutina = await prisma.rutina.findUnique({
        where: { id: resolvedRutinaId },
        select: { pacienteId: true, alumnoId: true }
      });
      if (rutina) {
        finalPacienteId = rutina.pacienteId;
        finalAlumnoId = rutina.alumnoId;
      }
    }

    // Registrar log histórico de peso
    const log = await prisma.ejercicioPesoLog.create({
      data: {
        ejercicioEnDiaId: ejercicioEnDiaId || null,
        exerciseId: resolvedExerciseId,
        rutinaId: resolvedRutinaId,
        pacienteId: finalPacienteId,
        alumnoId: finalAlumnoId,
        weight: numericWeight,
        date: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Peso actualizado y registrado con éxito',
      weight: numericWeight,
      log,
    }, { status: 200 });
  } catch (error) {
    console.error('Update Ejercicio Peso Error:', error);
    return NextResponse.json({ error: 'Error al registrar el peso del ejercicio' }, { status: 500 });
  }
}

// DELETE /api/ejercicios/peso — Eliminar un registro de peso histórico y restaurar el peso anterior si es el último
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('logId');

    if (!logId) {
      return NextResponse.json({ error: 'El logId es obligatorio.' }, { status: 400 });
    }

    const log = await prisma.ejercicioPesoLog.findUnique({
      where: { id: logId }
    });

    if (!log) {
      return NextResponse.json({ error: 'Registro de peso no encontrado.' }, { status: 404 });
    }

    await prisma.ejercicioPesoLog.delete({
      where: { id: logId }
    });

    let newWeight = 0;

    // Si tiene referencia a EjercicioEnDia, buscamos si era el último para actualizar el EjercicioEnDia.weight
    if (log.ejercicioEnDiaId) {
      const remainingLogs = await prisma.ejercicioPesoLog.findMany({
        where: { ejercicioEnDiaId: log.ejercicioEnDiaId },
        orderBy: { date: 'desc' },
        take: 1
      });

      newWeight = remainingLogs.length > 0 ? remainingLogs[0].weight : 0;

      await prisma.ejercicioEnDia.update({
        where: { id: log.ejercicioEnDiaId },
        data: { weight: newWeight }
      });
    }

    return NextResponse.json({
      message: 'Registro de peso eliminado con éxito',
      newWeight,
    }, { status: 200 });
  } catch (error) {
    console.error('Delete Ejercicio Peso Error:', error);
    return NextResponse.json({ error: 'Error al eliminar el registro de peso' }, { status: 500 });
  }
}
