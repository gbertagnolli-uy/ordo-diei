// Acceso a datos del motor de hábitos: Prisma ⇄ motor y zona horaria de la familia.
import { addDays, format, parseISO } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../prisma.ts";
import {
  CATALOGO,
  DIAS_TODOS,
  RECOMPENSA,
  daPuntos,
  identidadDe,
  misteriosDelDia,
  pasosDe,
  type Categoria,
  type ClaveSistema,
  type Franja,
  type Marca,
  type Paso,
} from "./catalogo.ts";
import {
  reproducir,
  type EstadoMotor,
  type Evento,
} from "./engine.ts";
import { puedeEditarHabito } from "./permisos.ts";

export const APP_TZ = process.env.APP_TZ || "America/Montevideo";
/** Días hacia atrás que se pueden registrar o corregir */
export const DIAS_EDITABLES = 7;

export const hoyEnFamilia = () => format(new Date(), "yyyy-MM-dd", { in: tz(APP_TZ) });

// Columnas @db.Date: medianoche UTC ⇄ clave yyyy-MM-dd
export const aFecha = (clave: string) => new Date(`${clave}T00:00:00.000Z`);
export const aClave = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** La fecha es hoy o uno de los últimos DIAS_EDITABLES días */
export function fechaEditable(clave: string, hoy = hoyEnFamilia()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return false;
  const limite = format(addDays(parseISO(hoy), -DIAS_EDITABLES), "yyyy-MM-dd");
  return clave <= hoy && clave >= limite;
}

export class NoAutorizadoError extends Error {
  status = 403;
  constructor(message = "No autorizado") {
    super(message);
    this.name = "NoAutorizado";
  }
}

export class NoEncontradoError extends Error {
  status = 404;
  constructor(message = "No encontrado") {
    super(message);
    this.name = "NoEncontrado";
  }
}

// ---------- Asegurar catálogo del sistema (idempotente) ----------

let catalogoAsegurado = false;

export async function asegurarCatalogo(): Promise<void> {
  if (catalogoAsegurado) return;
  for (const def of Object.values(CATALOGO)) {
    await prisma.habito.upsert({
      where: { clave: def.clave },
      create: {
        clave: def.clave,
        nombre: def.nombre,
        descripcion: def.descripcion,
        categoria: def.categoria,
        franja: def.franja,
        ancla: def.ancla,
        icono: def.icono,
        minimo: null,
        creadorId: null,
        archivado: false,
      },
      update: {
        nombre: def.nombre,
        descripcion: def.descripcion,
        categoria: def.categoria,
        franja: def.franja,
        ancla: def.ancla,
        icono: def.icono,
      },
    });
  }
  catalogoAsegurado = true;
}

// ---------- Tipos de vista y estado ----------

export type HabitoVista = {
  id: number;
  clave: string | null;
  nombre: string;
  descripcion: string | null;
  categoria: Categoria;
  franja: Franja;
  ancla: string;
  icono: string;
  minimo: string | null;
  pasos: Paso[];
  creador: { id: number; nombre: string } | null;
  puedeEditar: boolean;
  recomendado: boolean;
};

export type EstadoHabito = EstadoMotor & {
  habitoId: number;
  clave: string | null;
  nombre: string;
  categoria: Categoria;
  franja: Franja;
  ancla: string;
  icono: string;
  dias: number;
  identidad: string;
  creadorId: number | null;
  activo: boolean;
};

export type EstadoUsuario = {
  usuarioId: number;
  hoy: string;
  misterios: ReturnType<typeof misteriosDelDia>;
  habitos: EstadoHabito[];
};

const ORDEN_FRANJAS: Record<Franja, number> = {
  manana: 1,
  tarde: 2,
  noche: 3,
};

// ---------- Consultas ----------

export async function getCatalogo(usuarioId: number): Promise<HabitoVista[]> {
  await asegurarCatalogo();
  const habitos = await prisma.habito.findMany({
    where: { archivado: false },
    include: {
      creador: { select: { id: true, nombre: true } },
    },
    orderBy: [{ clave: "desc" }, { id: "asc" }],
  });

  return habitos.map((h) => {
    const clave = h.clave as ClaveSistema | null;
    const def = clave ? CATALOGO[clave] : null;
    return {
      id: h.id,
      clave: h.clave,
      nombre: h.nombre,
      descripcion: h.descripcion,
      categoria: h.categoria as Categoria,
      franja: h.franja as Franja,
      ancla: h.ancla,
      icono: h.icono,
      minimo: h.minimo,
      pasos: pasosDe(h),
      creador: h.creador,
      puedeEditar: puedeEditarHabito(h, usuarioId),
      recomendado: def?.recomendado ?? false,
    };
  });
}

export async function getEstadoHabitos(usuarioId: number): Promise<EstadoUsuario> {
  const [estado] = await getEstadosHabitos([usuarioId]);
  return estado;
}

export async function getEstadosHabitos(usuarioIds: number[]): Promise<EstadoUsuario[]> {
  await asegurarCatalogo();
  const hoy = hoyEnFamilia();

  const [adopciones, registros] = await Promise.all([
    prisma.habitoUsuario.findMany({
      where: {
        usuarioId: { in: usuarioIds },
        activo: true,
      },
      include: {
        habito: true,
      },
    }),
    prisma.registroHabito.findMany({
      where: {
        usuarioId: { in: usuarioIds },
      },
      select: {
        usuarioId: true,
        habitoId: true,
        fecha: true,
        marca: true,
      },
    }),
  ]);

  return usuarioIds.map((usuarioId) => {
    const misAdopciones = adopciones.filter((a) => a.usuarioId === usuarioId && !a.habito.archivado);
    const misRegistros = registros.filter((r) => r.usuarioId === usuarioId);

    const habitos: EstadoHabito[] = misAdopciones.map((adopcion) => {
      const regHabito = misRegistros.filter((r) => r.habitoId === adopcion.habitoId);
      const marcas = new Map<string, Marca>();
      let primerRegistro: string | null = null;

      for (const r of regHabito) {
        const fechaStr = aClave(r.fecha);
        marcas.set(fechaStr, r.marca as Marca);
        if (!primerRegistro || fechaStr < primerRegistro) {
          primerRegistro = fechaStr;
        }
      }

      const desdeAdopcion = aClave(adopcion.desde);
      const desde = primerRegistro && primerRegistro < desdeAdopcion ? primerRegistro : desdeAdopcion;
      const pasos = pasosDe(adopcion.habito);

      const estadoMotor = reproducir({
        pasos,
        desde,
        hoy,
        marcas,
        dias: adopcion.dias,
      });

      return {
        ...estadoMotor,
        habitoId: adopcion.habitoId,
        clave: adopcion.habito.clave,
        nombre: adopcion.habito.nombre,
        categoria: adopcion.habito.categoria as Categoria,
        franja: adopcion.habito.franja as Franja,
        ancla: adopcion.ancla?.trim() || adopcion.habito.ancla,
        icono: adopcion.habito.icono,
        dias: adopcion.dias,
        identidad: identidadDe(adopcion.habito),
        creadorId: adopcion.habito.creadorId,
        activo: adopcion.activo,
      };
    });

    // Ordenar por franja (mañana → tarde → noche) y luego por nombre
    habitos.sort((a, b) => {
      const diff = ORDEN_FRANJAS[a.franja] - ORDEN_FRANJAS[b.franja];
      if (diff !== 0) return diff;
      return a.nombre.localeCompare(b.nombre, "es");
    });

    return {
      usuarioId,
      hoy,
      misterios: misteriosDelDia(hoy),
      habitos,
    };
  });
}

// ---------- CRUD de hábitos ----------

export async function crearHabito(
  creadorId: number,
  datos: {
    nombre: string;
    categoria: Categoria;
    franja: Franja;
    ancla: string;
    minimo?: string | null;
    icono?: string;
    adoptar?: { dias?: number; ancla?: string };
  }
) {
  const nombre = datos.nombre?.trim();
  const ancla = datos.ancla?.trim();
  const minimo = datos.minimo?.trim() || null;
  const icono = datos.icono?.trim() || "Sparkles";

  if (!nombre || nombre.length > 80) throw new Error("Nombre debe tener entre 1 y 80 caracteres");
  if (!ancla || ancla.length > 120) throw new Error("Ancla debe tener entre 1 y 120 caracteres");
  if (minimo && minimo.length > 120) throw new Error("Mínimo no puede exceder 120 caracteres");
  if (!["oracion", "orden", "cuidado"].includes(datos.categoria)) throw new Error("Categoría no válida");
  if (!["manana", "tarde", "noche"].includes(datos.franja)) throw new Error("Franja no válida");

  const habito = await prisma.habito.create({
    data: {
      clave: null,
      nombre,
      descripcion: null,
      categoria: datos.categoria,
      franja: datos.franja,
      ancla,
      icono,
      minimo,
      creadorId,
      archivado: false,
    },
  });

  if (datos.adoptar) {
    const hoy = hoyEnFamilia();
    await prisma.habitoUsuario.create({
      data: {
        usuarioId: creadorId,
        habitoId: habito.id,
        desde: aFecha(hoy),
        dias: datos.adoptar.dias ?? DIAS_TODOS,
        ancla: datos.adoptar.ancla?.trim() || null,
        activo: true,
      },
    });
  }

  return habito;
}

export async function editarHabito(
  actorId: number,
  id: number,
  datos: Partial<{
    nombre: string;
    categoria: Categoria;
    franja: Franja;
    ancla: string;
    minimo: string | null;
    icono: string;
  }>
) {
  const habito = await prisma.habito.findUnique({ where: { id } });
  if (!habito) throw new NoEncontradoError("Hábito no encontrado");
  if (!puedeEditarHabito(habito, actorId)) throw new NoAutorizadoError("No tenés permiso para editar este hábito");

  const data: Record<string, unknown> = {};
  if (datos.nombre !== undefined) {
    const nombre = datos.nombre.trim();
    if (!nombre || nombre.length > 80) throw new Error("Nombre debe tener entre 1 y 80 caracteres");
    data.nombre = nombre;
  }
  if (datos.ancla !== undefined) {
    const ancla = datos.ancla.trim();
    if (!ancla || ancla.length > 120) throw new Error("Ancla debe tener entre 1 y 120 caracteres");
    data.ancla = ancla;
  }
  if (datos.minimo !== undefined) {
    const minimo = datos.minimo?.trim() || null;
    if (minimo && minimo.length > 120) throw new Error("Mínimo no puede exceder 120 caracteres");
    data.minimo = minimo;
  }
  if (datos.categoria !== undefined) {
    if (!["oracion", "orden", "cuidado"].includes(datos.categoria)) throw new Error("Categoría no válida");
    data.categoria = datos.categoria;
  }
  if (datos.franja !== undefined) {
    if (!["manana", "tarde", "noche"].includes(datos.franja)) throw new Error("Franja no válida");
    data.franja = datos.franja;
  }
  if (datos.icono !== undefined) {
    data.icono = datos.icono.trim() || "Sparkles";
  }

  return prisma.habito.update({
    where: { id },
    data,
  });
}

export async function archivarHabito(actorId: number, id: number) {
  const habito = await prisma.habito.findUnique({ where: { id } });
  if (!habito) throw new NoEncontradoError("Hábito no encontrado");
  if (!puedeEditarHabito(habito, actorId)) throw new NoAutorizadoError("No tenés permiso para archivar este hábito");

  await prisma.habito.update({
    where: { id },
    data: { archivado: true },
  });
}

// ---------- Adopciones ----------

export async function adoptar(
  usuarioIds: number[],
  items: { habitoId: number; dias?: number; ancla?: string }[]
) {
  const hoy = hoyEnFamilia();
  const fechaHoy = aFecha(hoy);

  await prisma.$transaction(async (tx) => {
    for (const usuarioId of usuarioIds) {
      for (const item of items) {
        const existente = await tx.habitoUsuario.findUnique({
          where: {
            usuarioId_habitoId: {
              usuarioId,
              habitoId: item.habitoId,
            },
          },
        });

        if (existente) {
          await tx.habitoUsuario.update({
            where: { id: existente.id },
            data: {
              activo: true,
              dias: item.dias ?? existente.dias,
              ancla: item.ancla !== undefined ? item.ancla.trim() || null : existente.ancla,
            },
          });
        } else {
          await tx.habitoUsuario.create({
            data: {
              usuarioId,
              habitoId: item.habitoId,
              desde: fechaHoy,
              dias: item.dias ?? DIAS_TODOS,
              ancla: item.ancla?.trim() || null,
              activo: true,
            },
          });
        }
      }
    }
  });
}

export async function ajustarAdopcion(
  usuarioIds: number[],
  habitoId: number,
  cambios: { dias?: number; ancla?: string | null; activo?: boolean }
) {
  const data: Record<string, unknown> = {};
  if (cambios.dias !== undefined) data.dias = cambios.dias;
  if (cambios.ancla !== undefined) data.ancla = cambios.ancla?.trim() || null;
  if (cambios.activo !== undefined) data.activo = cambios.activo;

  await prisma.habitoUsuario.updateMany({
    where: {
      usuarioId: { in: usuarioIds },
      habitoId,
    },
    data,
  });
}

// ---------- Recompensas y registro ----------

/**
 * Cálculo puro de la recompensa para un registro de hábito.
 * Compara el registro previo con la nueva marca y eventos para determinar
 * deltas a aplicar en el usuario y los valores que se guardan en el registro.
 */
export function calcularRecompensa(
  previo: { puntos: number; xp: number } | null,
  nuevaMarca: Marca | null,
  eventos: Evento[],
  categoria: Categoria
): { deltaPuntos: number; deltaXp: number; nuevoPuntos: number; nuevoXp: number } {
  const previoPuntos = previo?.puntos ?? 0;
  const previoXp = previo?.xp ?? 0;

  let nuevoPuntos = 0;
  let nuevoXp = 0;

  if (nuevaMarca === "hecho") {
    let xpBono = 0;
    if (eventos.includes("completo")) {
      xpBono = RECOMPENSA.xpCompleto;
    } else if (eventos.includes("ascenso")) {
      xpBono = RECOMPENSA.xpAscenso;
    }
    nuevoXp = RECOMPENSA.xpDia + xpBono;
    nuevoPuntos = daPuntos(categoria) ? RECOMPENSA.puntosDia : 0;
  }

  const deltaPuntos = nuevoPuntos - previoPuntos;
  const deltaXp = nuevoXp - previoXp;

  return { deltaPuntos, deltaXp, nuevoPuntos, nuevoXp };
}

export async function registrar(input: {
  actorId: number;
  usuarioIds: number[];
  habitoId: number;
  fecha: string;
  marca: Marca | null;
  nota?: string | null;
}): Promise<{ usuarioId: number; puntos: number; xp: number }[]> {
  const { actorId, usuarioIds, habitoId, fecha, marca, nota } = input;
  const fechaDb = aFecha(fecha);
  const hoy = hoyEnFamilia();

  const habito = await prisma.habito.findUnique({ where: { id: habitoId } });
  if (!habito || habito.archivado) {
    throw new Error("El hábito no existe o está archivado");
  }

  const categoria = habito.categoria as Categoria;
  const pasos = pasosDe(habito);

  return prisma.$transaction(async (tx) => {
    const resultados: { usuarioId: number; puntos: number; xp: number }[] = [];

    for (const usuarioId of usuarioIds) {
      // 1. Obtener registro previo
      const previo = await tx.registroHabito.findUnique({
        where: {
          usuarioId_habitoId_fecha: {
            usuarioId,
            habitoId,
            fecha: fechaDb,
          },
        },
      });

      // 2. Si marca es 'hecho' y la fecha es hoy, simular reproducción para detectar ascenso/completo
      let eventos: Evento[] = [];
      if (marca === "hecho" && fecha === hoy) {
        const registrosUsuario = await tx.registroHabito.findMany({
          where: { usuarioId, habitoId },
          select: { fecha: true, marca: true },
        });

        const marcasMap = new Map<string, Marca>();
        let primerRegistro: string | null = null;
        for (const r of registrosUsuario) {
          const f = aClave(r.fecha);
          marcasMap.set(f, r.marca as Marca);
          if (!primerRegistro || f < primerRegistro) primerRegistro = f;
        }
        marcasMap.set(hoy, "hecho");
        if (!primerRegistro || hoy < primerRegistro) primerRegistro = hoy;

        const adopcion = await tx.habitoUsuario.findUnique({
          where: { usuarioId_habitoId: { usuarioId, habitoId } },
        });

        const desdeAdopcion = adopcion ? aClave(adopcion.desde) : hoy;
        const desde = primerRegistro && primerRegistro < desdeAdopcion ? primerRegistro : desdeAdopcion;

        const motorSimulado = reproducir({
          pasos,
          desde,
          hoy,
          marcas: marcasMap,
          dias: adopcion?.dias ?? DIAS_TODOS,
        });
        eventos = motorSimulado.eventos;
      }

      // 3. Calcular recompensas
      const recompensa = calcularRecompensa(
        previo ? { puntos: previo.puntos, xp: previo.xp } : null,
        marca,
        eventos,
        categoria
      );

      // 4. Modificar registro
      if (marca === null) {
        if (previo) {
          await tx.registroHabito.delete({
            where: { id: previo.id },
          });
        }
      } else {
        await tx.registroHabito.upsert({
          where: {
            usuarioId_habitoId_fecha: {
              usuarioId,
              habitoId,
              fecha: fechaDb,
            },
          },
          create: {
            usuarioId,
            habitoId,
            fecha: fechaDb,
            marca: marca,
            nota: nota?.trim() || null,
            puntos: recompensa.nuevoPuntos,
            xp: recompensa.nuevoXp,
            registradoPorId: actorId,
          },
          update: {
            marca: marca,
            nota: nota?.trim() || null,
            puntos: recompensa.nuevoPuntos,
            xp: recompensa.nuevoXp,
            registradoPorId: actorId,
          },
        });
      }

      // 5. Actualizar puntos y XP del usuario
      const usuario = await tx.usuario.findUniqueOrThrow({
        where: { id: usuarioId },
        select: { availablePoints: true, puntosAcumulados: true, experienciaHabitos: true },
      });

      let nuevosAvailable = usuario.availablePoints;
      let nuevosAcumulados = usuario.puntosAcumulados;

      if (recompensa.deltaPuntos < 0) {
        // Revertir como máximo hasta availablePoints actuales (nunca negativos)
        const aRevertir = Math.min(-recompensa.deltaPuntos, usuario.availablePoints);
        nuevosAvailable = usuario.availablePoints - aRevertir;
        nuevosAcumulados = Math.max(0, usuario.puntosAcumulados - aRevertir);
      } else if (recompensa.deltaPuntos > 0) {
        nuevosAvailable = usuario.availablePoints + recompensa.deltaPuntos;
        nuevosAcumulados = usuario.puntosAcumulados + recompensa.deltaPuntos;
      }

      const nuevaExperiencia = Math.max(0, usuario.experienciaHabitos + recompensa.deltaXp);

      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          availablePoints: nuevosAvailable,
          puntosAcumulados: nuevosAcumulados,
          experienciaHabitos: nuevaExperiencia,
        },
      });

      resultados.push({
        usuarioId,
        puntos: recompensa.nuevoPuntos,
        xp: recompensa.nuevoXp,
      });
    }

    return resultados;
  });
}
