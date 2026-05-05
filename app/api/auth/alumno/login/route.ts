import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signJwt } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { dni } = await req.json();

    if (!dni) {
      return NextResponse.json({ error: 'El DNI es requerido' }, { status: 400 });
    }

    const alumno = await prisma.alumno.findUnique({
      where: { dni }
    });

    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
    }

    // Regla de Negocio: Acceso Post-Alta
    if (!alumno.isActive) {
      if (alumno.dischargeDate) {
        const now = new Date();
        const dischargeLimit = new Date(alumno.dischargeDate);
        
        if (now > dischargeLimit) {
          return NextResponse.json({ error: 'Acceso denegado: El periodo post-alta ha finalizado.' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Acceso denegado: Alumno dado de alta sin periodo de gracia.' }, { status: 403 });
      }
    }

    const token = signJwt({ id: alumno.id, role: 'ALUMNO', dni: alumno.dni });

    return NextResponse.json({ 
      message: 'Login exitoso', 
      token, 
      alumno: { id: alumno.id, fullName: alumno.fullName } 
    }, { status: 200 });

  } catch (error) {
    console.error('Login Alumno Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
