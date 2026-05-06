import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/rutinas/[id]/assign — Clone a routine and assign it to a patient
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { pacienteId, alumnoId } = await req.json();

    if (!pacienteId && !alumnoId) {
      return NextResponse.json({ error: 'pacienteId o alumnoId es obligatorio.' }, { status: 400 });
    }

    // Fetch the source routine with all its days and exercises
    const sourceRutina = await prisma.rutina.findUnique({
      where: { id },
      include: {
        dias: {
          include: { ejercicios: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!sourceRutina) {
      return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });
    }

    // Check if this patient/alumno already has a routine with this name
    const existing = await prisma.rutina.findFirst({
      where: {
        name: sourceRutina.name,
        OR: [
          pacienteId ? { pacienteId } : { id: 'impossible-id' },
          alumnoId ? { alumnoId } : { id: 'impossible-id' }
        ]
      },
    });

    if (existing) {
      const target = pacienteId ? 'El paciente' : 'El alumno';
      return NextResponse.json({ error: `${target} ya tiene esta rutina asignada.` }, { status: 409 });
    }

    // Clone the routine
    const cloned = await prisma.rutina.create({
      data: {
        name: sourceRutina.name,
        description: sourceRutina.description,
        pacienteId: pacienteId || null,
        alumnoId: alumnoId || null,
        dias: {
          create: sourceRutina.dias.map((dia) => ({
            name: dia.name,
            ejercicios: {
              create: dia.ejercicios.map((ej) => ({
                exerciseId: ej.exerciseId,
                sets: ej.sets,
                reps: ej.reps,
                time: ej.time,
                intervalo: ej.intervalo,
                isCircuit: ej.isCircuit,
              })),
            },
          })),
        },
      },
      include: {
        dias: { include: { ejercicios: true } },
        paciente: { select: { id: true, fullName: true, dni: true } },
        alumno: { select: { id: true, fullName: true, dni: true } },
      },
    });

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error('Assign Rutina Error:', error);
    return NextResponse.json({ error: 'Error al asignar la rutina' }, { status: 500 });
  }
}

// DELETE /api/rutinas/[id]/assign — Unassign a routine (delete the clone)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { pacienteId, alumnoId } = await req.json();

    if (!pacienteId && !alumnoId) {
      return NextResponse.json({ error: 'pacienteId o alumnoId es obligatorio.' }, { status: 400 });
    }

    // Find the source routine to get its name
    const sourceRutina = await prisma.rutina.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!sourceRutina) {
      return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });
    }

    // Find and delete the patient's/alumno's copy of this routine
    const copy = await prisma.rutina.findFirst({
      where: {
        OR: [
          { pacienteId: pacienteId || undefined, name: sourceRutina.name },
          { alumnoId: alumnoId || undefined, name: sourceRutina.name }
        ]
      },
    });

    if (!copy) {
      const target = pacienteId ? 'El paciente' : 'El alumno';
      return NextResponse.json({ error: `${target} no tiene esta rutina asignada.` }, { status: 404 });
    }

    // Delete
    await prisma.rutina.delete({ where: { id: copy.id } });

    return NextResponse.json({ message: 'Rutina desasignada correctamente.' }, { status: 200 });
  } catch (error) {
    console.error('Unassign Rutina Error:', error);
    return NextResponse.json({ error: 'Error al desasignar la rutina' }, { status: 500 });
  }
}
