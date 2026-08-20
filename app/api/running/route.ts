import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/running — Obtener logs de carrera de un Paciente o Alumno
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    const alumnoId = searchParams.get('alumnoId');

    if (!pacienteId && !alumnoId) {
      return NextResponse.json({ error: 'pacienteId o alumnoId es obligatorio.' }, { status: 400 });
    }

    const where: any = {};
    if (pacienteId) where.pacienteId = pacienteId;
    if (alumnoId) where.alumnoId = alumnoId;

    const logs = await prisma.runningLog.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error('Fetch Running Logs Error:', error);
    return NextResponse.json({ error: 'Error al obtener los logs de carrera' }, { status: 500 });
  }
}

// POST /api/running — Registrar una sesión de carrera
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { pacienteId, alumnoId, distanceEnKM, velocity, timeEnMin } = data;

    if (!pacienteId && !alumnoId) {
      return NextResponse.json({ error: 'pacienteId o alumnoId es obligatorio.' }, { status: 400 });
    }

    if (distanceEnKM === undefined || distanceEnKM === null || isNaN(Number(distanceEnKM))) {
      return NextResponse.json({ error: 'La distancia es obligatoria y debe ser un número.' }, { status: 400 });
    }

    if (timeEnMin === undefined || timeEnMin === null || isNaN(Number(timeEnMin))) {
      return NextResponse.json({ error: 'El tiempo es obligatorio y debe ser un número.' }, { status: 400 });
    }

    if (!velocity || typeof velocity !== 'string' || !velocity.trim()) {
      return NextResponse.json({ error: 'La velocidad/ritmo es obligatoria.' }, { status: 400 });
    }

    const newLog = await prisma.runningLog.create({
      data: {
        pacienteId: pacienteId || null,
        alumnoId: alumnoId || null,
        distanceEnKM: Number(distanceEnKM),
        velocity: velocity.trim(),
        timeEnMin: Number(timeEnMin),
        date: new Date(),
      }
    });

    return NextResponse.json({
      message: 'Sesión de carrera registrada con éxito',
      log: newLog
    }, { status: 201 });
  } catch (error) {
    console.error('Create Running Log Error:', error);
    return NextResponse.json({ error: 'Error al registrar la sesión de carrera' }, { status: 500 });
  }
}

// DELETE /api/running — Eliminar un registro de carrera
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const logId = searchParams.get('logId');

    if (!logId) {
      return NextResponse.json({ error: 'El logId es obligatorio.' }, { status: 400 });
    }

    const log = await prisma.runningLog.findUnique({
      where: { id: logId }
    });

    if (!log) {
      return NextResponse.json({ error: 'Registro de carrera no encontrado.' }, { status: 404 });
    }

    await prisma.runningLog.delete({
      where: { id: logId }
    });

    return NextResponse.json({ message: 'Sesión de carrera eliminada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('Delete Running Log Error:', error);
    return NextResponse.json({ error: 'Error al eliminar el registro de carrera' }, { status: 500 });
  }
}
