import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/alumnos/[id]/session — Incrementa sessionsCount y actualiza lastSessionDate
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const alumno = await prisma.alumno.findUnique({ where: { id } });
    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
    }

    // Check if already completed session today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (alumno.lastSessionDate && new Date(alumno.lastSessionDate) >= today) {
      return NextResponse.json({ error: 'Ya finalizaste tu sesión de hoy.' }, { status: 400 });
    }

    const updated = await prisma.alumno.update({
      where: { id },
      data: {
        sessionsCount: { increment: 1 },
        lastSessionDate: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Sesión finalizada correctamente',
      sessionsCount: updated.sessionsCount,
      totalSessions: updated.totalSessions,
    }, { status: 200 });
  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json({ error: 'Error al registrar la sesión' }, { status: 500 });
  }
}
