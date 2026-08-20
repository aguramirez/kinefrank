import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/alumnos/[id]/profile — Datos completos del alumno con rutinas y ejercicios
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const alumno = await prisma.alumno.findUnique({
      where: { id },
      include: {
        rutinas: {
          include: {
            dias: {
              include: {
                ejercicios: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
    }

    // Fetch exercise details for each ejercicioEnDia
    const ejercicioIds: string[] = [];
    for (const r of alumno.rutinas) {
      for (const d of r.dias) {
        for (const e of d.ejercicios) {
          ejercicioIds.push(e.exerciseId);
        }
      }
    }

    const uniqueIds = [...new Set(ejercicioIds)];
    const ejerciciosData = await prisma.ejercicio.findMany({
      where: { id: { in: uniqueIds } },
    });

    const ejercicioMap: Record<string, typeof ejerciciosData[0]> = {};
    for (const e of ejerciciosData) {
      ejercicioMap[e.id] = e;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = alumno as any;

    // Build rutinas response
    const rutinasResponse = [];
    for (const r of alumno.rutinas) {
      const diasResponse = [];
      for (const d of r.dias) {
        const ejerciciosResponse = [];
        for (const e of d.ejercicios) {
          ejerciciosResponse.push({
            id: e.id,
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight ?? 0,
            time: e.time,
            intervalo: e.intervalo,
            isCircuit: e.isCircuit,
            exercise: ejercicioMap[e.exerciseId] ?? null,
          });
        }
        diasResponse.push({
          id: d.id,
          name: d.name,
          ejercicios: ejerciciosResponse,
        });
      }
      rutinasResponse.push({
        id: r.id,
        name: r.name,
        description: r.description,
        dias: diasResponse,
      });
    }

    const result = {
      alumno: {
        id: a.id,
        fullName: a.fullName,
        dni: a.dni,
        sessionsCount: a.sessionsCount,
        totalSessions: a.totalSessions ?? 0,
        lastSessionDate: a.lastSessionDate ?? null,
        isActive: a.isActive,
        runningEnabled: a.runningEnabled ?? false,
      },
      rutinas: rutinasResponse,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Profile Error:', error);
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
  }
}
