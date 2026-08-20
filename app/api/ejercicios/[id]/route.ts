import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/ejercicios/[id] — Obtener un ejercicio por ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ejercicio = await prisma.ejercicio.findUnique({ where: { id } });

    if (!ejercicio) {
      return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(ejercicio, { status: 200 });
  } catch (error) {
    console.error('Get Ejercicio Error:', error);
    return NextResponse.json({ error: 'Error al obtener el ejercicio' }, { status: 500 });
  }
}

// PUT /api/ejercicios/[id] — Actualizar un ejercicio
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

    const updated = await prisma.ejercicio.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        categories: data.categories,
        videoUrl: data.videoUrl === undefined ? undefined : data.videoUrl,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update Ejercicio Error:', error);
    return NextResponse.json({ error: 'Error al actualizar el ejercicio' }, { status: 500 });
  }
}

// DELETE /api/ejercicios/[id] — Eliminar un ejercicio
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.ejercicio.delete({ where: { id } });

    return NextResponse.json({ message: 'Ejercicio eliminado correctamente' }, { status: 200 });
  } catch (error) {
    console.error('Delete Ejercicio Error:', error);
    return NextResponse.json({ error: 'Error al eliminar el ejercicio' }, { status: 500 });
  }
}
