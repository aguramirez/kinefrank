import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Endpoint para crear el primer admin (útil para desarrollo/setup)
export async function POST(req: Request) {
  try {
    const { fullName, email, dni, password, username } = await req.json();

    if (!fullName || !email || !dni || !password || !username) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // Verificar si ya existe otro admin
    const existingAdminCount = await prisma.admin.count();
    // if (existingAdminCount > 0) {
    //   return NextResponse.json({ error: 'Ya existe un administrador en el sistema' }, { status: 403 });
    // }

    const newAdmin = await prisma.admin.create({
      data: {
        fullName,
        email,
        dni,
        username,
        password,
      }
    });

    return NextResponse.json({ message: 'Admin creado exitosamente', id: newAdmin.id }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El email, DNI o username ya está en uso' }, { status: 409 });
    }
    console.error('Register Admin Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
