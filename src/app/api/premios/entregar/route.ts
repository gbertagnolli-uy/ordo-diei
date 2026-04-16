import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { entregaId } = body;

    if (!entregaId) {
      return NextResponse.json({ error: "Falta el ID de entrega" }, { status: 400 });
    }

    const entrega = await prisma.premioEntregado.findUnique({
      where: { id: Number(entregaId) }
    });

    if (!entrega) {
      return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 });
    }

    if (entrega.usuarioId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.premioEntregado.update({
        where: { id: Number(entregaId) },
        data: { estado: "Entregado" }
      }),
      prisma.usuario.update({
        where: { id: session.user.id },
        data: { stars: { increment: 10 } }
      })
    ]);

    return NextResponse.json({ success: true, starsAdded: 10 });
  } catch (error) {
    console.error("Error delivering premio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}