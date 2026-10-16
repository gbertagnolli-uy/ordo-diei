import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { haySancion } from "@/lib/comportamiento/sancionServer";
import { mitad } from "@/lib/comportamiento/sancion";

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

    // Día con sanción: las estrellas valen la mitad
    const estrellas = (await haySancion(prisma, session.user.id)) ? mitad(10) : 10;

    await prisma.$transaction([
      prisma.premioEntregado.update({
        where: { id: Number(entregaId) },
        data: { estado: "Entregado" }
      }),
      prisma.usuario.update({
        where: { id: session.user.id },
        data: { stars: { increment: estrellas } }
      })
    ]);

    return NextResponse.json({ success: true, starsAdded: estrellas });
  } catch (error) {
    console.error("Error delivering premio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}