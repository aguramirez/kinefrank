import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/rutinas/[id]/pacientes — Get all patients and alumnos assigned to copies of this routine
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sourceRutina = await prisma.rutina.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!sourceRutina) {
      return NextResponse.json({ error: 'Rutina no encontrada.' }, { status: 404 });
    }

    // Find all routines with the same name that are assigned to a patient or alumno
    const assignedRutinas = await prisma.rutina.findMany({
      where: {
        name: sourceRutina.name,
        OR: [
          { pacienteId: { not: null } },
          { alumnoId: { not: null } }
        ]
      },
      select: {
        id: true,
        pacienteId: true,
        alumnoId: true,
      },
    });

    // Extract unique IDs
    const assignedPatientIds = assignedRutinas
      .map((r) => r.pacienteId)
      .filter((id): id is string => id !== null);
      
    const assignedAlumnoIds = assignedRutinas
      .map((r) => r.alumnoId)
      .filter((id): id is string => id !== null);

    return NextResponse.json({ assignedPatientIds, assignedAlumnoIds }, { status: 200 });
  } catch (error) {
    console.error('Get Assigned Users Error:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios asignados' }, { status: 500 });
  }
}
