import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pacientes/[id]/profile — Datos completos del paciente con rutinas y ejercicios
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const paciente = await prisma.paciente.findUnique({
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

    if (!paciente) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Fetch exercise details for each ejercicioEnDia
    const ejercicioIds: string[] = [];
    for (const r of paciente.rutinas) {
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
    const p = paciente as any;

    // Build rutinas response
    const rutinasResponse = [];
    for (const r of paciente.rutinas) {
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
      paciente: {
        id: p.id,
        fullName: p.fullName,
        dni: p.dni,
        sessionsCount: p.sessionsCount,
        totalSessions: p.totalSessions ?? 0,
        lastSessionDate: p.lastSessionDate ?? null,
        isActive: p.isActive,
      },
      rutinas: rutinasResponse,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Profile Error:', error);
    return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
  }
}
