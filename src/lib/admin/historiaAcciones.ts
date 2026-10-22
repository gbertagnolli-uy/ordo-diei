import prisma from "@/lib/prisma";
import { esPadre } from "@/lib/habitos/permisos";
import { updateUserCompletionPercentage } from "@/lib/userUtils";
import { actualizarLibro } from "@/lib/habitos/server";
import { resolverCompra } from "@/lib/tienda/server";

export type TipoAccionHistorial = "tarea" | "habito" | "premio" | "compra";

export interface AccionHistorial {
  id: string; // e.g. "tarea-123", "habito-45", "premio-67", "compra-89"
  tipo: TipoAccionHistorial;
  referenciaId: number;
  titulo: string;
  subtitulo?: string | null;
  fecha: string; // ISO string
  usuario: {
    id: number;
    nombre: string;
    fotoUrl: string | null;
    rolFamiliar: string;
  };
  actor?: {
    id: number;
    nombre: string;
    fotoUrl: string | null;
  } | null;
  detalles: {
    puntos?: number;
    estrellas?: number;
    xp?: number;
    costos?: any;
    estadoOriginal?: string;
  };
  revertible: boolean;
  estado: "activa" | "revertida";
}

/**
 * Obtiene el log unificado de acciones históricas (tareas aprobadas, hábitos aprobados,
 * premios entregados y compras completadas).
 */
export async function obtenerHistorialAcciones(limitePorTipo = 50): Promise<AccionHistorial[]> {
  const [accionesTareas, habitosAprobados, premiosEntregados, compras] = await Promise.all([
    // 1. Tareas aprobadas (desde HistorialAccion con estadoNuevo: "Aprobada")
    prisma.historialAccion.findMany({
      where: { estadoNuevo: "Aprobada" },
      orderBy: { timestamp: "desc" },
      take: limitePorTipo,
      include: {
        actor: { select: { id: true, nombre: true, fotoUrl: true } },
        tarea: {
          include: {
            asignado: { select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true } },
          },
        },
      },
    }),

    // 2. Hábitos aprobados
    prisma.registroHabito.findMany({
      where: { marca: "hecho" },
      orderBy: { createdAt: "desc" },
      take: limitePorTipo,
      include: {
        usuario: { select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true } },
        habito: { select: { id: true, nombre: true, icono: true, categoria: true } },
        registradoPor: { select: { id: true, nombre: true, fotoUrl: true } },
      },
    }),

    // 3. Premios entregados
    prisma.premioEntregado.findMany({
      orderBy: { fechaEntrega: "desc" },
      take: limitePorTipo,
      include: {
        premio: { select: { id: true, titulo: true, cantidad: true, esVale: true } },
        usuario: { select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true } },
      },
    }),

    // 4. Compras de tienda
    prisma.compraTienda.findMany({
      orderBy: { createdAt: "desc" },
      take: limitePorTipo,
      include: {
        producto: { select: { id: true, titulo: true, tipo: true, imagenClave: true } },
        usuario: { select: { id: true, nombre: true, fotoUrl: true, rolFamiliar: true } },
      },
    }),
  ]);

  const lista: AccionHistorial[] = [];

  // Mapear Tareas
  for (const h of accionesTareas) {
    if (!h.tarea || !h.tarea.asignado) continue;
    const esActiva = h.tarea.estado === "Aprobada";
    lista.push({
      id: `tarea-${h.id}`,
      tipo: "tarea",
      referenciaId: h.tarea.id,
      titulo: `Tarea aprobada: ${h.tarea.titulo}`,
      subtitulo: h.tarea.descripcion,
      fecha: h.timestamp.toISOString(),
      usuario: h.tarea.asignado,
      actor: h.actor,
      detalles: {
        puntos: h.tarea.puntosGenerados || 0,
        estrellas: Math.floor((h.tarea.puntosGenerados || 0) / 100),
        estadoOriginal: h.tarea.estado,
      },
      revertible: esActiva,
      estado: esActiva ? "activa" : "revertida",
    });
  }

  // Mapear Hábitos
  for (const r of habitosAprobados) {
    if (!r.usuario || !r.habito) continue;
    const esActiva = r.aprobado;
    lista.push({
      id: `habito-${r.id}`,
      tipo: "habito",
      referenciaId: r.id,
      titulo: `Hábito aprobado: ${r.habito.nombre}`,
      subtitulo: r.nota ? `Nota: ${r.nota}` : null,
      fecha: r.createdAt.toISOString(),
      usuario: r.usuario,
      actor: r.registradoPor,
      detalles: {
        puntos: r.puntos,
        xp: r.xp,
        estadoOriginal: r.aprobado ? "Aprobado" : "Pendiente/Revertido",
      },
      revertible: esActiva,
      estado: esActiva ? "activa" : "revertida",
    });
  }

  // Mapear Premios
  for (const p of premiosEntregados) {
    if (!p.usuario || !p.premio) continue;
    const esActiva = p.estado === "Entregado";
    lista.push({
      id: `premio-${p.id}`,
      tipo: "premio",
      referenciaId: p.id,
      titulo: `Premio entregado: ${p.premio.titulo}`,
      subtitulo: p.premio.esVale ? "Vale canjeable" : `Cantidad: ${p.premio.cantidad}`,
      fecha: p.fechaEntrega.toISOString(),
      usuario: p.usuario,
      actor: null,
      detalles: {
        estrellas: 10,
        estadoOriginal: p.estado,
      },
      revertible: esActiva,
      estado: esActiva ? "activa" : "revertida",
    });
  }

  // Mapear Compras
  for (const c of compras) {
    if (!c.usuario || !c.producto) continue;
    const esActiva = c.estado === "completada";
    lista.push({
      id: `compra-${c.id}`,
      tipo: "compra",
      referenciaId: c.id,
      titulo: `Compra en tienda: ${c.producto.titulo}`,
      subtitulo: `Tipo: ${c.producto.tipo}`,
      fecha: c.createdAt.toISOString(),
      usuario: c.usuario,
      actor: null,
      detalles: {
        costos: c.costos,
        estadoOriginal: c.estado,
      },
      revertible: esActiva && c.producto.tipo !== "sobre" && c.producto.tipo !== "fragmentos",
      estado: esActiva ? "activa" : "revertida",
    });
  }

  // Ordenar todo cronológicamente de más reciente a más antiguo
  return lista.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

/**
 * Revierte una acción aprobada/entregada/comprada.
 */
export async function revertirAccion(params: {
  actor: { id: number; rol?: string };
  tipo: TipoAccionHistorial;
  id: number;
}) {
  const { actor, tipo, id } = params;
  if (!esPadre(actor.rol)) {
    throw new Error("Solo los administradores (padres) pueden revertir acciones");
  }

  switch (tipo) {
    case "tarea": {
      const tarea = await prisma.tarea.findUnique({
        where: { id },
        include: { asignado: true },
      });
      if (!tarea) throw new Error("Tarea no encontrada");
      if (tarea.estado !== "Aprobada") {
        throw new Error("La tarea no está en estado Aprobada o ya fue revertida");
      }

      const puntos = tarea.puntosGenerados || 0;
      const bonusStars = Math.floor(puntos / 100);

      await prisma.$transaction([
        prisma.tarea.update({
          where: { id },
          data: { estado: "Esperando_Aprobacion" },
        }),
        prisma.usuario.update({
          where: { id: tarea.asignadoId },
          data: {
            availablePoints: { decrement: puntos },
            puntosAcumulados: { decrement: puntos },
            lockedPoints: { increment: puntos },
            totalTasksCompleted: { decrement: 1 },
            stars: { decrement: bonusStars },
          },
        }),
        prisma.historialAccion.create({
          data: {
            tareaId: id,
            actorId: actor.id,
            estadoAnterior: "Aprobada",
            estadoNuevo: "Esperando_Aprobacion",
          },
        }),
      ]);

      await updateUserCompletionPercentage(tarea.asignadoId);
      return { ok: true, mensaje: "Aprobación de tarea revertida (volvió a Esperando Aprobación)" };
    }

    case "habito": {
      const reg = await prisma.registroHabito.findUnique({
        where: { id },
        include: { usuario: true },
      });
      if (!reg) throw new Error("Registro de hábito no encontrado");
      if (!reg.aprobado) {
        throw new Error("El hábito ya no está aprobado o ya fue revertido");
      }

      await prisma.$transaction(async (tx) => {
        await tx.registroHabito.update({
          where: { id },
          data: { aprobado: false },
        });

        await tx.usuario.update({
          where: { id: reg.usuarioId },
          data: {
            availablePoints: { decrement: reg.puntos },
            puntosAcumulados: { decrement: reg.puntos },
            experienciaHabitos: { decrement: reg.xp },
          },
        });

        if (reg.libroId) {
          await actualizarLibro(tx, reg.libroId);
        }
      });

      return { ok: true, mensaje: "Aprobación de hábito revertida" };
    }

    case "premio": {
      const entrega = await prisma.premioEntregado.findUnique({
        where: { id },
        include: { usuario: true, premio: true },
      });
      if (!entrega) throw new Error("Entrega de premio no encontrada");
      if (entrega.estado !== "Entregado") {
        throw new Error("El premio no está entregado o ya fue revertido");
      }

      // Restablecer estrellas concedidas
      const estrellasARestar = Math.min(entrega.usuario.stars, 10);

      await prisma.$transaction([
        prisma.premioEntregado.update({
          where: { id },
          data: { estado: "Pendiente" },
        }),
        prisma.usuario.update({
          where: { id: entrega.usuarioId },
          data: {
            stars: { decrement: estrellasARestar },
          },
        }),
      ]);

      return { ok: true, mensaje: "Entrega de premio revertida a Pendiente" };
    }

    case "compra": {
      // Usar resolverCompra de tienda con "cancelar" para reembolso automático
      await resolverCompra({ id: actor.id, rol: actor.rol }, id, "cancelar");
      return { ok: true, mensaje: "Compra cancelada y reembolsada" };
    }

    default:
      throw new Error("Tipo de acción no soportado");
  }
}
