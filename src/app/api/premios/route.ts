import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";

    if (!isParent) {
      return NextResponse.json({ error: "Solo administradores pueden ver premios" }, { status: 403 });
    }

    const premios = await prisma.premio.findMany({
      include: {
        entregas: {
          include: {
            usuario: {
              select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const serialized = premios.map(p => ({
      ...p,
      createdAt: p.createdAt?.toISOString() || null,
      updatedAt: p.updatedAt?.toISOString() || null,
      entregas: p.entregas.map(e => ({
        ...e,
        fechaEntrega: e.fechaEntrega?.toISOString() || null,
      }))
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching premios:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { user } = session;
    const isParent = user.rolFamiliar === "Padre" || user.rolFamiliar === "Madre";

    if (!isParent) {
      return NextResponse.json({ error: "Solo administradores pueden crear premios" }, { status: 403 });
    }

    const body = await req.json();
    const {
      titulo,
      cantidad,
      tipoFrecuencia,
      diaEntregaSemana,
      diaDelMes,
      tareasRequeridasIds,
    } = body;

    if (!titulo || !cantidad || !tipoFrecuencia) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const premio = await prisma.premio.create({
      data: {
        titulo,
        cantidad: Number(cantidad),
        tipoFrecuencia,
        diaEntregaSemana: diaEntregaSemana ? Number(diaEntregaSemana) : null,
        diaDelMes: diaDelMes ? Number(diaDelMes) : null,
        tareasRequeridasIds: tareasRequeridasIds ? JSON.stringify(tareasRequeridasIds) : "[]",
      }
    });

    return NextResponse.json(premio, { status: 201 });
  } catch (error) {
    console.error("Error creating premio:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}