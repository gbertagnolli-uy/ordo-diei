// Aprobaciones de hábitos (vault/APROBACION_HABITOS.md): un padre revisa lo que piden los hijos.
// Tres tipos de solicitud: crear un hábito, empezar un hábito y marcar un día como "hecho".
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../prisma.ts";
import { DIAS_TODOS, pasosDe, type Categoria, type Marca } from "./catalogo.ts";
import { reproducir } from "./engine.ts";
import { calcularRecompensa, actualizarLibro, aClave, APP_TZ } from "./server.ts";
import { haySancion } from "../comportamiento/sancionServer.ts";

export type TipoSolicitud = "habito" | "adopcion" | "registro";
export type ItemSolicitud = { tipo: TipoSolicitud; id: number };

export type SolicitudesUsuario = {
  usuario: { id: number; nombre: string; fotoUrl: string | null };
  /** Hábitos nuevos que crearon (incluye que ellos mismos lo empiecen) */
  habitos: { id: number; nombre: string; icono: string }[];
  /** Hábitos existentes que quieren empezar */
  adopciones: { id: number; nombre: string; icono: string }[];
  /** Días marcados como hecho */
  registros: { id: number; nombre: string; icono: string; fecha: string }[];
};

export type Solicitudes = { usuarios: SolicitudesUsuario[]; total: number };

export async function getSolicitudes(): Promise<Solicitudes> {
  const [habitos, adopciones, registros] = await Promise.all([
    prisma.habito.findMany({
      where: { aprobado: false, archivado: false, creadorId: { not: null } },
      select: { id: true, nombre: true, icono: true, creadorId: true },
      orderBy: { id: "asc" },
    }),
    prisma.habitoUsuario.findMany({
      where: { aprobado: false, activo: true, habito: { archivado: false } },
      select: { id: true, usuarioId: true, habito: { select: { nombre: true, icono: true, aprobado: true } } },
      orderBy: { id: "asc" },
    }),
    prisma.registroHabito.findMany({
      where: { aprobado: false, marca: "hecho" },
      select: { id: true, usuarioId: true, fecha: true, habito: { select: { nombre: true, icono: true } } },
      orderBy: [{ fecha: "asc" }, { id: "asc" }],
    }),
  ]);

  const ids = new Set<number>();
  habitos.forEach((h) => ids.add(h.creadorId!));
  adopciones.forEach((a) => ids.add(a.usuarioId));
  registros.forEach((r) => ids.add(r.usuarioId));
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, nombre: true, fotoUrl: true },
    orderBy: { id: "asc" },
  });

  let total = 0;
  const lista = usuarios.map<SolicitudesUsuario>((usuario) => {
    const r: SolicitudesUsuario = {
      usuario,
      habitos: habitos
        .filter((h) => h.creadorId === usuario.id)
        .map((h) => ({ id: h.id, nombre: h.nombre, icono: h.icono })),
      // La adopción de un hábito nuevo se aprueba junto con el hábito: no se lista aparte
      adopciones: adopciones
        .filter((a) => a.usuarioId === usuario.id && a.habito.aprobado)
        .map((a) => ({ id: a.id, nombre: a.habito.nombre, icono: a.habito.icono })),
      registros: registros
        .filter((x) => x.usuarioId === usuario.id)
        .map((x) => ({ id: x.id, nombre: x.habito.nombre, icono: x.habito.icono, fecha: aClave(x.fecha) })),
    };
    total += r.habitos.length + r.adopciones.length + r.registros.length;
    return r;
  });

  return { usuarios: lista.filter((u) => u.habitos.length + u.adopciones.length + u.registros.length > 0), total };
}

/** Aprueba un "hecho": recién ahí suma los puntos y la XP del día (y el bono de ascenso o de completar) */
async function aprobarRegistro(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], id: number) {
  const reg = await tx.registroHabito.findUnique({ where: { id }, include: { habito: true } });
  if (!reg || reg.aprobado || reg.marca !== "hecho") return;

  const fecha = aClave(reg.fecha);
  // El bono de ascenso o de completar solo corresponde si se registró el mismo día (igual que sin aprobación)
  const mismoDia = format(reg.createdAt, "yyyy-MM-dd", { in: tz(APP_TZ) }) === fecha;

  let eventos: ReturnType<typeof reproducir>["eventos"] = [];
  if (mismoDia) {
    const todos = await tx.registroHabito.findMany({
      where: { usuarioId: reg.usuarioId, habitoId: reg.habitoId },
      select: { fecha: true, marca: true },
    });
    const marcas = new Map<string, Marca>();
    let primero: string | null = null;
    for (const r of todos) {
      const f = aClave(r.fecha);
      if (f > fecha) continue;
      marcas.set(f, r.marca as Marca);
      if (!primero || f < primero) primero = f;
    }
    const adopcion = await tx.habitoUsuario.findUnique({
      where: { usuarioId_habitoId: { usuarioId: reg.usuarioId, habitoId: reg.habitoId } },
    });
    const desdeAdopcion = adopcion ? aClave(adopcion.desde) : fecha;
    eventos = reproducir({
      pasos: pasosDe(reg.habito),
      desde: primero && primero < desdeAdopcion ? primero : desdeAdopcion,
      hoy: fecha,
      marcas,
      dias: adopcion?.dias ?? DIAS_TODOS,
    }).eventos;
  }

  // Cuenta el día en que el niño hizo el hábito, no el día en que un padre lo aprueba
  const r = calcularRecompensa(null, "hecho", eventos, reg.habito.categoria as Categoria, await haySancion(tx, reg.usuarioId, reg.createdAt));
  await tx.registroHabito.update({
    where: { id },
    data: { aprobado: true, puntos: r.nuevoPuntos, xp: r.nuevoXp },
  });
  await tx.usuario.update({
    where: { id: reg.usuarioId },
    data: {
      availablePoints: { increment: r.nuevoPuntos },
      puntosAcumulados: { increment: r.nuevoPuntos },
      experienciaHabitos: { increment: r.nuevoXp },
    },
  });
  if (reg.libroId) await actualizarLibro(tx, reg.libroId);
}

export async function aprobar(items: ItemSolicitud[]) {
  // Los registros de más viejo a más nuevo, para que los ascensos se calculen en orden
  const registros = items.filter((i) => i.tipo === "registro").sort((a, b) => a.id - b.id);
  await prisma.$transaction(async (tx) => {
    for (const { id } of items.filter((i) => i.tipo === "habito")) {
      const habito = await tx.habito.findUnique({ where: { id } });
      if (!habito || habito.aprobado) continue;
      await tx.habito.update({ where: { id }, data: { aprobado: true } });
      // Quien lo creó lo empieza con la misma aprobación
      if (habito.creadorId) {
        await tx.habitoUsuario.updateMany({
          where: { habitoId: id, usuarioId: habito.creadorId, aprobado: false },
          data: { aprobado: true },
        });
      }
    }
    for (const { id } of items.filter((i) => i.tipo === "adopcion")) {
      await tx.habitoUsuario.updateMany({ where: { id, aprobado: false }, data: { aprobado: true } });
    }
    for (const { id } of registros) await aprobarRegistro(tx, id);
  });
}

export async function rechazar(items: ItemSolicitud[]) {
  await prisma.$transaction(async (tx) => {
    for (const { id } of items.filter((i) => i.tipo === "habito")) {
      // Un hábito sin aprobar no tiene registros: se borra con sus adopciones
      await tx.habito.deleteMany({ where: { id, aprobado: false } });
    }
    for (const { id } of items.filter((i) => i.tipo === "adopcion")) {
      await tx.habitoUsuario.deleteMany({ where: { id, aprobado: false } });
    }
    for (const { id } of items.filter((i) => i.tipo === "registro")) {
      await tx.registroHabito.deleteMany({ where: { id, aprobado: false } });
    }
  });
}
