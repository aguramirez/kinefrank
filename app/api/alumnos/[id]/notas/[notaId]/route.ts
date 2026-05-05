import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; notaId: string }> }
) {
  try {
    const { notaId } = await params;
    await prisma.notaClinica.delete({
      where: { id: notaId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar nota:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
