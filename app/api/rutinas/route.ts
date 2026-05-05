import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    
    // Si adminId está presente, traemos rutinas sin paciente o las de sus pacientes
    const where = adminId ? {
      OR: [
        { pacienteId: null },
        { paciente: { adminId } }
      ]
    } : {};

    const rutinas = await prisma.rutina.findMany({
      where,
      include: {
        dias: {
          include: {
            ejercicios: true
          }
        },
        paciente: {
          select: { id: true, fullName: true, dni: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(rutinas, { status: 200 });
  } catch (error) {
    console.error('Fetch Rutinas Error:', error);
    return NextResponse.json({ error: 'Error al obtener rutinas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!data.name || !data.description || !data.dias || !Array.isArray(data.dias)) {
      return NextResponse.json({ error: 'Faltan datos obligatorios para crear la rutina.' }, { status: 400 });
    }

    // Regla de negocio: Crear rutina, sus días y sus ejercicios asignados
    // data.dias = [{ name: "Lunes", ejercicios: [{ exerciseId: "...", sets: 3, reps: 10, time: "30s" }] }]
    
    const newRutina = await prisma.rutina.create({
      data: {
        name: data.name,
        description: data.description,
        pacienteId: data.pacienteId || null,
        dias: {
          create: data.dias.map((dia: any) => ({
            name: dia.name,
            ejercicios: {
              create: dia.ejercicios.map((ej: any) => ({
                exerciseId: ej.exerciseId,
                sets: ej.sets,
                reps: ej.reps,
                time: ej.time,
                intervalo: ej.intervalo,
                isCircuit: ej.isCircuit || false
              }))
            }
          }))
        }
      },
      include: {
        dias: {
          include: { ejercicios: true }
        }
      }
    });

    return NextResponse.json(newRutina, { status: 201 });
  } catch (error) {
    console.error('Create Rutina Error:', error);
    return NextResponse.json({ error: 'Error al crear la rutina' }, { status: 500 });
  }
}
