// Acceso a datos del motor de hábitos: Prisma ⇄ motor y zona horaria de la familia.
import { addDays, format, parseISO } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../prisma.ts";
import type { Prisma } from "@prisma/client";
import {
  CATALOGO,
  CLAVE_LIBRO,
  DIAS_TODOS,
  LIMITES_HIJOS,
  MAX_PAGINAS_DIA,
  MAX_PAGINAS_LIBRO,
  RECOMPENSA,
  daPuntos,
  decidirLibro,
  identidadDe,
  misteriosDelDia,
  pasosDe,
  progresoLibro,
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
import { haySancion } from "../comportamiento/sancionServer.ts";
import { mitad } from "../comportamiento/sancion.ts";
import { claveDeUrl } from "../archivos.ts";
import { aplicarAceleradorRanking } from "../ranking.ts";
import { mapaRankingDeFamilia } from "../engagement/servidor.ts";

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
  imagen: string | null;
  pasos: Paso[];
  creador: { id: number; nombre: string } | null;
  puedeEditar: boolean;
  recomendado: boolean;
  /** Creado por un hijo y esperando aprobación: solo lo ve su creador */
  pendiente: boolean;
};

export type LibroVista = {
  id: number;
  titulo: string;
  paginas: number;
  leidas: number;
  pct: number;
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
  imagen: string | null;
  activo: boolean;
  /** false = empezar este hábito espera aprobación de un padre */
  aprobado: boolean;
  /** El "hecho" de hoy espera aprobación: todavía no suma puntos ni XP */
  hoyPendiente: boolean;
  /** Solo en "Leer un libro": libro en curso, último terminado y páginas registradas hoy */
  libro: LibroVista | null;
  libroTerminado: { titulo: string } | null;
  paginasHoy: number | null;
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
    // Los hábitos que esperan aprobación solo los ve su creador
    where: { archivado: false, OR: [{ aprobado: true }, { creadorId: usuarioId }] },
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
      imagen: h.imagen,
      pasos: pasosDe(h),
      creador: h.creador,
      puedeEditar: puedeEditarHabito(h, usuarioId),
      recomendado: def?.recomendado ?? false,
      pendiente: !h.aprobado,
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

  const [adopciones, registros, libros] = await Promise.all([
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
        paginas: true,
        libroId: true,
        aprobado: true,
      },
    }),
    prisma.libro.findMany({
      where: { usuarioId: { in: usuarioIds } },
      orderBy: { iniciadoEn: "desc" },
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
      const esLibro = adopcion.habito.clave === CLAVE_LIBRO;
      const misLibros = esLibro
        ? libros.filter((l) => l.usuarioId === usuarioId && l.habitoId === adopcion.habitoId)
        : [];
      const enCurso = misLibros.find((l) => !l.terminadoEn);
      const terminado = misLibros.find((l) => l.terminadoEn);
      const leidas = enCurso
        ? regHabito.reduce((t, r) => t + (r.libroId === enCurso.id ? r.paginas ?? 0 : 0), 0)
        : 0;

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
        imagen: adopcion.habito.imagen,
        activo: adopcion.activo,
        aprobado: adopcion.aprobado,
        hoyPendiente: regHabito.some((r) => aClave(r.fecha) === hoy && r.marca === "hecho" && !r.aprobado),
        libro: enCurso
          ? { id: enCurso.id, titulo: enCurso.titulo, paginas: enCurso.paginas, leidas, pct: progresoLibro(leidas, enCurso.paginas).pct }
          : null,
        libroTerminado: !enCurso && terminado ? { titulo: terminado.titulo } : null,
        paginasHoy: esLibro
          ? regHabito.find((r) => aClave(r.fecha) === hoy)?.paginas ?? null
          : null,
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

// Solo imágenes subidas por /api/upload (guardadas en la base, lib/archivos.ts)
function validarImagen(url: string | null | undefined): string | null {
  return claveDeUrl(url) ? url!.trim() : null;
}

export async function crearHabito(
  creadorId: number,
  datos: {
    nombre: string;
    categoria: Categoria;
    franja: Franja;
    ancla: string;
    minimo?: string | null;
    icono?: string;
    imagen?: string | null;
    adoptar?: { dias?: number; ancla?: string };
  },
  /** Los hijos crean hábitos que esperan aprobación de un padre */
  esPadre = false
) {
  const nombre = datos.nombre?.trim();
  const ancla = datos.ancla?.trim();
  const minimo = datos.minimo?.trim() || null;
  const icono = datos.icono?.trim() || "Sparkles";
  const imagen = validarImagen(datos.imagen);
  if (!imagen) throw new Error("Subí una imagen para el hábito");

  if (!nombre || nombre.length > 80) throw new Error("Nombre debe tener entre 1 y 80 caracteres");
  if (!ancla || ancla.length > 120) throw new Error("Ancla debe tener entre 1 y 120 caracteres");
  if (minimo && minimo.length > 120) throw new Error("Mínimo no puede exceder 120 caracteres");
  if (!["oracion", "orden", "cuidado"].includes(datos.categoria)) throw new Error("Categoría no válida");
  if (!["manana", "tarde", "noche"].includes(datos.franja)) throw new Error("Franja no válida");

  if (!esPadre) {
    const pendientes = await prisma.habito.count({ where: { creadorId, aprobado: false, archivado: false } });
    if (pendientes >= LIMITES_HIJOS.creacionesPendientes) {
      throw new Error("Ya tenés un hábito esperando aprobación. Esperá a que lo revise un padre.");
    }
  }

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
      imagen,
      creadorId,
      archivado: false,
      aprobado: esPadre,
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
        aprobado: esPadre,
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
    imagen: string | null;
  }>,
  esAdmin = false
) {
  const habito = await prisma.habito.findUnique({ where: { id } });
  if (!habito) throw new NoEncontradoError("Hábito no encontrado");
  if (!puedeEditarHabito(habito, actorId, esAdmin)) throw new NoAutorizadoError("No tenés permiso para editar este hábito");

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
  if (datos.imagen !== undefined) {
    const imagen = validarImagen(datos.imagen);
    if (!imagen) throw new Error("Imagen no válida");
    data.imagen = imagen;
  }
  if (datos.icono !== undefined) {
    data.icono = datos.icono.trim() || "Sparkles";
  }

  return prisma.habito.update({
    where: { id },
    data,
  });
}

export async function archivarHabito(actorId: number, id: number, esAdmin = false) {
  const habito = await prisma.habito.findUnique({ where: { id } });
  if (!habito) throw new NoEncontradoError("Hábito no encontrado");
  if (!puedeEditarHabito(habito, actorId, esAdmin)) throw new NoAutorizadoError("No tenés permiso para archivar este hábito");

  await prisma.habito.update({
    where: { id },
    data: { archivado: true },
  });
}

// ---------- Adopciones ----------

export type DatosLibro = { titulo: string; paginas: number };

/** Valida y normaliza el título y las páginas de un libro */
export function validarLibro(datos: unknown): DatosLibro {
  const d = (datos ?? {}) as { titulo?: unknown; paginas?: unknown };
  const titulo = typeof d.titulo === "string" ? d.titulo.trim() : "";
  const paginas = Number(d.paginas);
  if (!titulo || titulo.length > 200) throw new Error("El nombre del libro debe tener entre 1 y 200 caracteres");
  if (!Number.isInteger(paginas) || paginas < 1 || paginas > MAX_PAGINAS_LIBRO) {
    throw new Error(`La cantidad de páginas debe ser un número entre 1 y ${MAX_PAGINAS_LIBRO}`);
  }
  return { titulo, paginas };
}

/**
 * Empieza hábitos. Si quien pide no es padre, cada hábito que se empieza (o se retoma) queda
 * esperando aprobación y no se puede superar el límite de hábitos a la vez.
 */
export async function adoptar(
  usuarioIds: number[],
  items: { habitoId: number; dias?: number; ancla?: string; libro?: DatosLibro }[],
  esPadre = false
) {
  const hoy = hoyEnFamilia();
  const fechaHoy = aFecha(hoy);

  await prisma.$transaction(async (tx) => {
    const habitos = await tx.habito.findMany({ where: { id: { in: items.map((i) => i.habitoId) } } });

    for (const usuarioId of usuarioIds) {
      for (const item of items) {
        const habito = habitos.find((h) => h.id === item.habitoId);
        if (!habito || habito.archivado) throw new Error("El hábito no existe o está archivado");
        if (!habito.aprobado && habito.creadorId !== usuarioId) {
          throw new Error("Ese hábito todavía no fue aprobado");
        }
      }

      if (!esPadre) {
        const activos = await tx.habitoUsuario.findMany({
          where: { usuarioId, activo: true, habito: { archivado: false } },
          select: { habitoId: true },
        });
        const nuevos = new Set(items.map((i) => i.habitoId));
        activos.forEach((a) => nuevos.add(a.habitoId));
        if (nuevos.size > LIMITES_HIJOS.habitosActivos) {
          throw new Error(
            `Podés tener hasta ${LIMITES_HIJOS.habitosActivos} hábitos a la vez. Dejá de practicar alguno antes de sumar otro.`
          );
        }
      }

      for (const item of items) {
        if (item.libro) {
          const enCurso = await tx.libro.findFirst({
            where: { usuarioId, habitoId: item.habitoId, terminadoEn: null },
          });
          if (!enCurso) {
            await tx.libro.create({
              data: { usuarioId, habitoId: item.habitoId, ...item.libro },
            });
          }
        }

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
              // Retomar un hábito que se había dejado también necesita aprobación
              aprobado: existente.activo ? existente.aprobado : esPadre,
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
              aprobado: esPadre,
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
  cambios: { dias?: number; ancla?: string | null; activo?: boolean },
  esPadre = false
) {
  const data: Record<string, unknown> = {};
  if (cambios.dias !== undefined) data.dias = cambios.dias;
  if (cambios.ancla !== undefined) data.ancla = cambios.ancla?.trim() || null;
  if (cambios.activo !== undefined) data.activo = cambios.activo;

  // Retomar un hábito dejado necesita aprobación, igual que empezarlo
  if (cambios.activo === true && !esPadre) {
    await prisma.habitoUsuario.updateMany({
      where: { usuarioId: { in: usuarioIds }, habitoId, activo: false },
      data: { aprobado: false },
    });
  }

  await prisma.habitoUsuario.updateMany({
    where: {
      usuarioId: { in: usuarioIds },
      habitoId,
    },
    data,
  });
}

// ---------- Libros ("Leer un libro") ----------

/**
 * Recalcula un libro tras cambiar sus registros o su total: lo termina y crea el premio
 * "Un libro nuevo", o lo reabre si se deshizo lo que lo terminó (vault/HABITO_LIBRO.md D6).
 * Devuelve el título si el libro quedó terminado en esta llamada.
 */
export async function actualizarLibro(tx: Prisma.TransactionClient, libroId: number): Promise<string | null> {
  const libro = await tx.libro.findUnique({ where: { id: libroId }, include: { recompensa: true } });
  if (!libro) return null;
  const suma = await tx.registroHabito.aggregate({ where: { libroId, aprobado: true }, _sum: { paginas: true } });
  const otroEnCurso = await tx.libro.count({
    where: { usuarioId: libro.usuarioId, habitoId: libro.habitoId, terminadoEn: null, id: { not: libroId } },
  });

  const accion = decidirLibro({
    leidas: suma._sum.paginas ?? 0,
    total: libro.paginas,
    terminado: libro.terminadoEn !== null,
    premio: libro.recompensa?.estado ?? null,
    otroEnCurso: otroEnCurso > 0,
  });

  if (accion === "terminar") {
    await tx.libro.update({ where: { id: libroId }, data: { terminadoEn: new Date() } });
    await tx.recompensa.upsert({
      where: { libroId },
      create: {
        usuarioId: libro.usuarioId,
        tipo: "libro",
        titulo: "Un libro nuevo",
        origen: `Terminaste «${libro.titulo}»`,
        libroId,
      },
      update: {},
    });
    return libro.titulo;
  }
  if (accion === "reabrir") {
    await tx.recompensa.deleteMany({ where: { libroId, estado: "disponible" } });
    await tx.libro.update({ where: { id: libroId }, data: { terminadoEn: null } });
  }
  return null;
}

/**
 * Carga el libro que se empieza a leer. Si ya hay uno en curso, corrige su título y páginas.
 * Devuelve el título si al corregir las páginas el libro quedó terminado.
 */
export async function cargarLibro(usuarioIds: number[], habitoId: number, datos: DatosLibro) {
  const habito = await prisma.habito.findUnique({ where: { id: habitoId } });
  if (!habito || habito.clave !== CLAVE_LIBRO) throw new Error("Este hábito no lleva libro");

  return prisma.$transaction(async (tx) => {
    const terminados: { usuarioId: number; titulo: string }[] = [];
    for (const usuarioId of usuarioIds) {
      const enCurso = await tx.libro.findFirst({ where: { usuarioId, habitoId, terminadoEn: null } });
      if (enCurso) {
        await tx.libro.update({ where: { id: enCurso.id }, data: datos });
        const titulo = await actualizarLibro(tx, enCurso.id);
        if (titulo) terminados.push({ usuarioId, titulo });
      } else {
        await tx.libro.create({ data: { usuarioId, habitoId, ...datos } });
      }
    }
    return terminados;
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
  categoria: Categoria,
  /** Día con sanción (vault/LANE_200_SANCION_Y_ENGAGEMENT.md): puntos y XP valen la mitad */
  conSancion = false,
  /** Porcentaje de acelerador del podio en el ranking (1ro: 5%, 2do: 3%, 3ro: 1%) */
  aceleradorPct = 0
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
    nuevoPuntos = daPuntos(categoria)
      ? aplicarAceleradorRanking(RECOMPENSA.puntosDia, aceleradorPct).puntosTotales
      : 0;
    if (conSancion) {
      nuevoXp = mitad(nuevoXp);
      nuevoPuntos = mitad(nuevoPuntos);
    }
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
  paginas?: number | null;
  /** Los "hecho" de quien no es padre esperan aprobación y no dan puntos ni XP hasta entonces */
  esPadre?: boolean;
}): Promise<{ usuarioId: number; puntos: number; xp: number; libroTerminado: string | null; pendiente: boolean }[]> {
  const { actorId, usuarioIds, habitoId, fecha, marca, nota, esPadre = false } = input;
  const pendiente = !esPadre && marca === "hecho";
  const fechaDb = aFecha(fecha);
  const hoy = hoyEnFamilia();

  const habito = await prisma.habito.findUnique({ where: { id: habitoId } });
  if (!habito || habito.archivado) {
    throw new Error("El hábito no existe o está archivado");
  }

  const categoria = habito.categoria as Categoria;
  const pasos = pasosDe(habito);
  const esLibro = habito.clave === CLAVE_LIBRO;

  // Páginas: obligatorias al marcar "hecho" en "Leer un libro"; en el resto no se guardan
  let paginas: number | null = null;
  if (esLibro && marca === "hecho") {
    paginas = Number(input.paginas);
    if (!Number.isInteger(paginas) || paginas < 1 || paginas > MAX_PAGINAS_DIA) {
      throw new Error(`Indicá cuántas páginas leíste (entre 1 y ${MAX_PAGINAS_DIA})`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const resultados: { usuarioId: number; puntos: number; xp: number; libroTerminado: string | null; pendiente: boolean }[] = [];
    const mapaRanking = marca === "hecho" && !pendiente && daPuntos(categoria)
      ? await mapaRankingDeFamilia(new Date(), tx).catch(() => new Map())
      : new Map();

    for (const usuarioId of usuarioIds) {
      const adopcionActual = await tx.habitoUsuario.findUnique({
        where: { usuarioId_habitoId: { usuarioId, habitoId } },
      });
      if (adopcionActual && !adopcionActual.aprobado) {
        throw new Error("Este hábito todavía espera aprobación para empezar");
      }

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

      // Un "hecho" ya aprobado no vuelve a pedir aprobación al repetirse
      if (pendiente && previo?.marca === "hecho" && previo.aprobado) {
        resultados.push({ usuarioId, puntos: previo.puntos, xp: previo.xp, libroTerminado: null, pendiente: false });
        continue;
      }

      // 2. Si marca es 'hecho' y la fecha es hoy, simular reproducción para detectar ascenso/completo
      let eventos: Evento[] = [];
      if (marca === "hecho" && !pendiente && fecha === hoy) {
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
      const aceleradorPct = mapaRanking.get(usuarioId)?.aceleradorPct ?? 0;
      const recompensa = calcularRecompensa(
        previo ? { puntos: previo.puntos, xp: previo.xp } : null,
        pendiente ? null : marca,
        eventos,
        categoria,
        marca === "hecho" && !pendiente && (await haySancion(tx, usuarioId)),
        aceleradorPct
      );

      // 4. Modificar registro (en "Leer un libro", las páginas van al libro en curso)
      let libroId: number | null = null;
      if (paginas !== null) {
        libroId =
          previo?.libroId ??
          (await tx.libro.findFirst({
            where: { usuarioId, habitoId, terminadoEn: null },
            orderBy: { iniciadoEn: "desc" },
            select: { id: true },
          }))?.id ??
          null;
      }

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
            paginas,
            libroId,
            aprobado: !pendiente,
          },
          update: {
            marca: marca,
            nota: nota?.trim() || null,
            puntos: recompensa.nuevoPuntos,
            xp: recompensa.nuevoXp,
            registradoPorId: actorId,
            paginas,
            libroId,
            aprobado: !pendiente,
          },
        });
      }

      // 4b. Terminar o reabrir los libros afectados
      let libroTerminado: string | null = null;
      for (const id of new Set([previo?.libroId, libroId])) {
        if (id) libroTerminado = (await actualizarLibro(tx, id)) ?? libroTerminado;
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
        libroTerminado,
        pendiente,
      });
    }

    return resultados;
    // Un hábito en familia hace varias consultas por persona contra una base remota: 5 s (el default) no alcanza
  }, { maxWait: 10_000, timeout: 30_000 });
}
