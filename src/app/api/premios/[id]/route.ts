import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";

    if (!isParent) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { id } = await params;
    const premioId = Number(id);

    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
      include: {
        entregas: {
          include: {
            usuario: {
              select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true }
            }
          }
        }
      }
    });

    if (!premio) {
      return NextResponse.json({ error: "Premio no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ...premio,
      createdAt: premio.createdAt?.toISOString() || null,
      updatedAt: premio.updatedAt?.toISOString() || null,
      entregas: premio.entregas.map(e => ({
        ...e,
        fechaEntrega: e.fechaEntrega?.toISOString() || null,
      }))
    });
  } catch (error) {
    console.error("Error fetching premio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";

    if (!isParent) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { id } = await params;
    const premioId = Number(id);

    const body = await req.json();
    const {
      titulo,
      cantidad,
      tipoFrecuencia,
      diaEntregaSemana,
      diaDelMes,
      tareasRequeridasIds,
      activo,
    } = body;

    const updateData: any = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (cantidad !== undefined) updateData.cantidad = Number(cantidad);
    if (tipoFrecuencia !== undefined) updateData.tipoFrecuencia = tipoFrecuencia;
    if (diaEntregaSemana !== undefined) updateData.diaEntregaSemana = diaEntregaSemana ? Number(diaEntregaSemana) : null;
    if (diaDelMes !== undefined) updateData.diaDelMes = diaDelMes ? Number(diaDelMes) : null;
    if (tareasRequeridasIds !== undefined) updateData.tareasRequeridasIds = JSON.stringify(tareasRequeridasIds);
    if (activo !== undefined) updateData.activo = activo;

    const premio = await prisma.premio.update({
      where: { id: premioId },
      data: updateData
    });

    return NextResponse.json(premio);
  } catch (error) {
    console.error("Error updating premio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";

    if (!isParent) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { id } = await params;
    const premioId = Number(id);

    const entregas = await prisma.premioEntregado.findMany({
      where: { premioId, estado: "Entregado" }
    });

    if (entregas.length > 0) {
      return NextResponse.json({ error: "No se puede eliminar un premio que ya ha sido entregado" }, { status: 400 });
    }

    await prisma.premio.delete({
      where: { id: premioId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting premio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}