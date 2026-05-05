import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notas = await prisma.notaClinica.findMany({
      where: { alumnoId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notas);
  } catch (error) {
    console.error("Error al obtener notas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { title, description, photoUrl } = data;

    if (!title || !description) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const nuevaNota = await prisma.notaClinica.create({
      data: {
        title,
        description,
        photoUrl: photoUrl || null,
        alumnoId: id,
      },
    });

    return NextResponse.json(nuevaNota);
  } catch (error) {
    console.error("Error al crear nota:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
