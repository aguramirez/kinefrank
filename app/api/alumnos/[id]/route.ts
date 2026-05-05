import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const alumno = await prisma.alumno.findUnique({
      where: { id },
      include: {
        rutinas: {
          include: { dias: { include: { ejercicios: true } } }
        }
      }
    });

    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
    }

    return NextResponse.json(alumno, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el alumno' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const updateData = { ...data };
    if (updateData.expirationDate) {
      updateData.expirationDate = new Date(updateData.expirationDate);
    }

    const updatedAlumno = await prisma.alumno.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedAlumno, { status: 200 });
  } catch (error) {
    console.error("Update Alumno Error:", error);
    return NextResponse.json({ error: 'Error al actualizar el alumno' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.alumno.delete({
      where: { id }
    });
    return NextResponse.json({ message: 'Alumno eliminado correctamente' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el alumno' }, { status: 500 });
  }
}
