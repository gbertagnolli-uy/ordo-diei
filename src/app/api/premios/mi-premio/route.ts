import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const entregaPendiente = await prisma.premioEntregado.findFirst({
      where: {
        usuarioId: userId,
        estado: "Pendiente"
      },
      include: {
        premio: true
      },
      orderBy: { fechaEntrega: "desc" }
    });

    if (!entregaPendiente) {
      return NextResponse.json({ hasPremio: false });
    }

    return NextResponse.json({
      hasPremio: true,
      premio: {
        id: entregaPendiente.id,
        titulo: entregaPendiente.premio.titulo,
        cantidad: entregaPendiente.premio.cantidad,
        isSurprise: true,
      }
    });
  } catch (error) {
    console.error("Error fetching mi-premio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}