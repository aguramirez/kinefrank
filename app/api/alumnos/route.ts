import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkExpirations } from '@/lib/expiration';

export async function GET(req: Request) {
  try {
    await checkExpirations();
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');
    const where = adminId ? { OR: [{ adminId }, { adminId: null }] } : {};

    const alumnos = await prisma.alumno.findMany({
      where,
      include: {
        rutinas: {
          include: {
            dias: {
              include: { ejercicios: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(alumnos, { status: 200 });
  } catch (error) {
    console.error('Fetch Alumnos Error:', error);
    return NextResponse.json({ error: 'Error al obtener alumnos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Solo fullName y DNI son obligatorios
    if (!data.fullName?.trim() || !data.dni?.trim()) {
      return NextResponse.json({ error: 'Nombre completo y DNI son obligatorios.' }, { status: 400 });
    }

    let adminId = data.adminId;
    if (!adminId) {
      const firstAdmin = await prisma.admin.findFirst();
      if (firstAdmin) adminId = firstAdmin.id;
    }

    const newAlumno = await prisma.alumno.create({
      data: {
        fullName: data.fullName.trim(),
        dni: data.dni.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        gender: data.gender || null,
        age: data.age ? Number(data.age) : null,
        height: data.height ? Number(data.height) : null,
        weight: data.weight ? Number(data.weight) : null,
        notes: data.notes?.trim() || null,
        healthInsurance: data.healthInsurance?.trim() || null,
        diagnoses: data.diagnoses || [],
        totalSessions: data.totalSessions ? Number(data.totalSessions) : 0,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        adminId: adminId || null,
        runningEnabled: data.runningEnabled ?? false,
      }
    });

    return NextResponse.json(newAlumno, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El DNI ya se encuentra registrado.' }, { status: 409 });
    }
    console.error('Create Alumno Error:', error);
    return NextResponse.json({ error: 'Error al crear el alumno' }, { status: 500 });
  }
}
