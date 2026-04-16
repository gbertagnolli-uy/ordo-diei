import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { forceRun } = body;

    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    const dayOfMonth = today.getDate();

    const premios = await prisma.premio.findMany({
      where: { activo: true }
    });

    let totalEntregados = 0;

    for (const premio of premios) {
      let shouldRun = false;

      if (premio.tipoFrecuencia === "Semanal" && premio.diaEntregaSemana === dayOfWeek) {
        shouldRun = true;
      } else if (premio.tipoFrecuencia === "Mensual" && premio.diaDelMes === dayOfMonth) {
        shouldRun = true;
      }

      if (!shouldRun && !forceRun) continue;

      const tareasRequeridasIds = JSON.parse(premio.tareasRequeridasIds || "[]") as number[];
      const usuarios = await prisma.usuario.findMany({
        where: {
          rolFamiliar: { notIn: ["Padre", "Madre"] }
        }
      });

      for (const usuario of usuarios) {
        const existingEntrega = await prisma.premioEntregado.findFirst({
          where: {
            premioId: premio.id,
            usuarioId: usuario.id,
            estado: { in: ["Pendiente", "Entregado"] }
          }
        });

        if (existingEntrega) continue;

        let gano = false;

        if (tareasRequeridasIds.length === 0) {
          gano = true;
        } else {
          const tareas = await prisma.tarea.findMany({
            where: {
              id: { in: tareasRequeridasIds },
              asignadoId: usuario.id,
              estado: { in: ["Completada", "Aprobada"] }
            }
          });

          const completedIds = tareas.map(t => t.id);
          const allCompleted = tareasRequeridasIds.every(id => completedIds.includes(id));
          
          if (allCompleted) gano = true;
        }

        if (gano) {
          await prisma.premioEntregado.create({
            data: {
              premioId: premio.id,
              usuarioId: usuario.id,
              estado: "Pendiente"
            }
          });
          totalEntregados++;
        } else {
          await prisma.premioEntregado.create({
            data: {
              premioId: premio.id,
              usuarioId: usuario.id,
              estado: "No_ganado"
            }
          });
        }
      }
    }

    return NextResponse.json({ success: true, totalEntregados });
  } catch (error) {
    console.error("Error calculating premios:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}