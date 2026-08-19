import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/rutinas/[id] — Obtener una rutina con sus días y ejercicios
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rutina = await prisma.rutina.findUnique({
      where: { id },
      include: {
        dias: {
          include: { ejercicios: true },
          orderBy: { createdAt: 'asc' },
        },
        paciente: {
          select: { id: true, fullName: true, dni: true },
        },
      },
    });

    if (!rutina) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    return NextResponse.json(rutina, { status: 200 });
  } catch (error) {
    console.error('Get Rutina Error:', error);
    return NextResponse.json({ error: 'Error al obtener la rutina' }, { status: 500 });
  }
}

// PUT /api/rutinas/[id] — Actualizar rutina (reemplaza días y ejercicios)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (!data.name || !data.description) {
      return NextResponse.json({ error: 'Nombre y descripción son obligatorios.' }, { status: 400 });
    }

    // Estrategia: eliminar días existentes (el cascade borra Dia y EjercicioEnDia, pero NO los Ejercicios globales) y recrearlos
    await prisma.dia.deleteMany({ where: { rutinaId: id } });

    const updated = await prisma.rutina.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        pacienteId: data.pacienteId ?? undefined,
        dias: {
          create: (data.dias || []).map((dia: any) => ({
            name: dia.name,
            ejercicios: {
              create: (dia.ejercicios || []).map((ej: any) => ({
                exerciseId: ej.exerciseId,
                sets: ej.sets,
                reps: ej.reps,
                weight: ej.weight !== undefined ? Number(ej.weight) : 0,
                time: ej.time || null,
                intervalo: ej.intervalo || null,
                isCircuit: ej.isCircuit || false,
              })),
            },
          })),
        },
      },
      include: {
        dias: {
          include: { ejercicios: true },
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update Rutina Error:', error);
    return NextResponse.json({ error: 'Error al actualizar la rutina' }, { status: 500 });
  }
}

// DELETE /api/rutinas/[id] — Eliminar una rutina (su cascade borra los Dia y EjercicioEnDia, pero mantiene intactos los objetos Ejercicio del catálogo)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.rutina.delete({ where: { id } });

    return NextResponse.json({ message: 'Rutina eliminada correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Delete Rutina Error:', error);
    return NextResponse.json({ error: 'Error al eliminar la rutina' }, { status: 500 });
  }
}
