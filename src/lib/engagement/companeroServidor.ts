// Compañero «héroe», lado servidor (vault/COMPANERO_HEROE.md, lane 220).
// El nivel y la XP son los de siempre (`xpTotal` + `nivelDe`): no hay economía propia, así que no hay que
// enganchar nada en tareas ni hábitos. En la base queda solo quién lo acompaña, el nombre, el último nivel
// festejado y lo que tiene puesto; los accesorios comprados van en `Companero_Accesorios`.
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { tz } from "@date-fns/tz";
import prisma from "../prisma.ts";
import { APP_TZ } from "../cartas/eventos.ts";
import { aClave, aFecha } from "../habitos/server.ts";
import { exigirSinSancion } from "../comportamiento/sancionServer.ts";
import { MONEDAS, type Saldos } from "../tienda/monedas.ts";
import { nivelDe, xpTotal } from "../niveles.ts";
import { reclamarSubidaNivel } from "../nivelesServidor.ts";
import { bienvenidaPendienteHoy, PUNTOS_INGRESO_DIARIO, rachaDe, registrarIngreso, XP_INGRESO_DIARIO } from "./servidor.ts";
import { HITOS_RACHA, type Hito } from "./hitos.ts";
import {
  datosDePersonaje,
  esElegible,
  personajeGuardado,
  mensajeDeRegreso,
  NOMBRE_POR_DEFECTO,
  poseDelMomento,
  posesDesbloqueadas,
  proximaPose,
  proximaRanura,
  ranurasDeObjetos,
  relacionDe,
  situacionDe,
  validarNombre,
  marcoDeNivel,
  type Personaje,
  type Pose,
  type Situacion,
} from "./companero.ts";
import { fraseDe, primerNombre } from "./companeroFrases.ts";
import { ACCESORIOS, accesorioDe, cambiarEquipado, EQUIPADOS_INICIALES, esDeRegalo, leerEquipados, tieneAccesorio, type Equipados } from "./accesorios.ts";

export type CompaneroVista = {
  /** Nombre de quien lo cuida (para las frases) */
  quien: string;
  /** Quién lo acompaña (null: todavía no eligió) */
  personaje: Personaje | null;
  nombre: string;
  /** Le puso nombre o eligió uno sugerido */
  tieneNombre: boolean;
  nivel: { numero: number; titulo: string; xp: number; xpEnNivel: number; xpDelTramo: number; faltan: number; avance: number };
  /** Subió de nivel desde la última vez que lo festejó */
  nivelNuevo: boolean;
  diasJuntos: number;
  relacion: { titulo: string; proximo: { titulo: string; faltan: number } | null };
  racha: number;
  /** Lo que dice y cómo se muestra ahora */
  pose: Pose;
  situacion: Situacion;
  frase: string;
  regreso: string | null;
  poses: { desbloqueadas: Pose[]; proxima: { nombre: string; nivel: number } | null };
  marco: number;
  ranuras: { total: number; proximaEnNivel: number | null };
  equipados: Equipados;
  /** Claves de los accesorios que ya son suyos (de regalo y comprados) */
  suyos: string[];
  saldos: Saldos;
  /** Hoy tiene sanción: la tienda de accesorios está cerrada */
  sancionado: boolean;
};

export async function companeroDe(usuarioId: number, ahora: Date = new Date(), opciones: { cartasNuevas?: boolean; sancionado?: boolean } = {}): Promise<CompaneroVista> {
  const hoy = format(ahora, "yyyy-MM-dd", { in: tz(APP_TZ) });
  const hora = Number(format(ahora, "H", { in: tz(APP_TZ) }));
  // Quien crea la fila del día es siempre registrarIngreso: así los días juntos ya cuentan el de hoy
  await registrarIngreso(usuarioId, ahora);

  const [usuario, fila, comprados, diasJuntos, previa, racha] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nombre: true, puntosAcumulados: true, experienciaHabitos: true, availablePoints: true, stars: true, incienso: true } }),
    prisma.companero.findUnique({ where: { usuarioId } }),
    prisma.companeroAccesorio.findMany({ where: { usuarioId }, select: { clave: true } }),
    prisma.actividadDia.count({ where: { usuarioId } }),
    prisma.actividadDia.findFirst({ where: { usuarioId, fecha: { lt: aFecha(hoy) } }, orderBy: { fecha: "desc" }, select: { fecha: true } }),
    rachaDe(usuarioId, ahora),
  ]);
  if (!usuario) throw new Error("Usuario no encontrado");

  const xp = xpTotal(usuario);
  const info = nivelDe(xp);
  const inicioDelNivel = (info.level - 1) ** 2 * 100;
  const personaje = personajeGuardado(fila?.personaje);
  const nombre = fila?.nombre ?? NOMBRE_POR_DEFECTO;
  const clavesCompradas = comprados.map((c) => c.clave);
  const desdeLaUltimaVez = previa ? differenceInCalendarDays(parseISO(hoy), parseISO(aClave(previa.fecha))) : null;
  // Sin personaje no hay nada que festejar: se estrena al elegirlo
  const nivelNuevo = personaje !== null && fila !== null && info.level > fila.nivelVisto;
  const momento = { hora, diasSinEntrar: personaje ? desdeLaUltimaVez : null, festejo: nivelNuevo, cartasNuevas: !!opciones.cartasNuevas };
  const situacion = situacionDe(momento);
  // La misma frase durante todo el día, y otra al día siguiente
  const semilla = Number(hoy.replaceAll("-", "")) + usuarioId;

  return {
    quien: usuario.nombre,
    personaje,
    nombre,
    tieneNombre: fila !== null,
    nivel: { numero: info.level, titulo: info.title, xp, xpEnNivel: xp - inicioDelNivel, xpDelTramo: info.nextLevelPoints - inicioDelNivel, faltan: info.pointsToNextLevel, avance: info.progressPercentage },
    nivelNuevo,
    diasJuntos,
    relacion: relacionDe(diasJuntos),
    racha: racha.dias,
    pose: poseDelMomento(momento, info.level),
    situacion,
    frase: fraseDe(personaje ?? "mujer", situacion, usuario.nombre, semilla),
    regreso: personaje ? mensajeDeRegreso(nombre, desdeLaUltimaVez) : null,
    poses: { desbloqueadas: posesDesbloqueadas(info.level), proxima: proximaPose(info.level) },
    marco: marcoDeNivel(info.level),
    ranuras: { total: ranurasDeObjetos(info.level), proximaEnNivel: proximaRanura(info.level) },
    equipados: leerEquipados(fila?.equipados, clavesCompradas, info.level),
    suyos: ACCESORIOS.filter((a) => tieneAccesorio(a.clave, clavesCompradas)).map((a) => a.clave),
    saldos: { puntos: usuario.availablePoints, estrellas: usuario.stars, incienso: usuario.incienso },
    sancionado: !!opciones.sancionado,
  };
}

async function nivelActual(usuarioId: number) {
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { puntosAcumulados: true, experienciaHabitos: true } });
  return nivelDe(xpTotal(u)).level;
}

/** Elige (o cambia) quién lo acompaña. La primera vez se estrena con un nombre sugerido y el nivel actual ya cuenta como visto. */
export async function elegirPersonaje(usuarioId: number, personaje: unknown, nombre?: unknown) {
  if (!esElegible(personaje)) throw new Error("Ese compañero no existe");
  const nivel = await nivelActual(usuarioId);
  const actual = await prisma.companero.findUnique({ where: { usuarioId }, select: { nombre: true } });
  // Si ya tenía nombre, se queda; si no, el que propone el personaje o el que escribió
  const elegido = nombre === undefined || nombre === "" ? (actual?.nombre ?? datosDePersonaje(personaje).nombre) : validarNombre(nombre);
  await prisma.companero.upsert({
    where: { usuarioId },
    create: { usuarioId, personaje, nombre: elegido, nivelVisto: nivel, equipados: EQUIPADOS_INICIALES },
    update: { personaje, nombre: elegido },
  });
}

/** Le pone (o le cambia) el nombre. Debe haber elegido personaje. */
export async function nombrarCompanero(usuarioId: number, entrada: unknown) {
  const nombre = validarNombre(entrada);
  const r = await prisma.companero.updateMany({ where: { usuarioId }, data: { nombre } });
  if (r.count === 0) throw new Error("Primero elegí quién te acompaña");
}

/** Festejó el nivel nuevo: regala los puntos de subida de nivel (si aún no se reclamaron) y marca el nivel como visto */
export async function festejarNivel(usuarioId: number) {
  await reclamarSubidaNivel(usuarioId);
}

/**
 * Compra un accesorio con las monedas de la app (puntos, estrellas, incienso). Hoy con sanción la tienda está cerrada.
 * El cobro es atómico (`updateMany` con saldo mínimo) y la fila única impide pagarlo dos veces.
 */
export async function comprarAccesorio(usuarioId: number, clave: unknown) {
  const a = typeof clave === "string" ? accesorioDe(clave) : null;
  if (!a) throw new Error("Ese accesorio no existe");
  if (esDeRegalo(a)) throw new Error("Ese accesorio es de regalo");
  await exigirSinSancion(prisma, usuarioId, "tienda");

  await prisma.$transaction(async (tx) => {
    const nivel = nivelDe(xpTotal(await tx.usuario.findUnique({ where: { id: usuarioId }, select: { puntosAcumulados: true, experienciaHabitos: true } }))).level;
    if (nivel < a.nivel) throw new Error(`Se abre en el nivel ${a.nivel}`);
    if (await tx.companeroAccesorio.findUnique({ where: { usuarioId_clave: { usuarioId, clave: a.clave } } })) throw new Error("Ya lo tenés");
    const cobro = await tx.usuario.updateMany({
      where: { id: usuarioId, ...Object.fromEntries(a.costos.map((c) => [MONEDAS[c.moneda].campo, { gte: c.monto }])) },
      data: Object.fromEntries(a.costos.map((c) => [MONEDAS[c.moneda].campo, { decrement: c.monto }])),
    });
    if (cobro.count === 0) throw new Error("No te alcanzan las monedas.");
    await tx.companeroAccesorio.create({ data: { usuarioId, clave: a.clave } });
  });
}

/** Pone o saca un accesorio que ya es suyo (el fondo se reemplaza; los objetos tienen espacios limitados por nivel) */
export async function equiparAccesorio(usuarioId: number, clave: unknown, puesto: unknown) {
  if (typeof clave !== "string") throw new Error("Ese accesorio no existe");
  const [fila, comprados, nivel] = await Promise.all([
    prisma.companero.findUnique({ where: { usuarioId }, select: { equipados: true } }),
    prisma.companeroAccesorio.findMany({ where: { usuarioId }, select: { clave: true } }),
    nivelActual(usuarioId),
  ]);
  if (!fila) throw new Error("Primero elegí quién te acompaña");
  const claves = comprados.map((c) => c.clave);
  const nuevo = cambiarEquipado(leerEquipados(fila.equipados, claves, nivel), clave, puesto !== false, claves, nivel);
  await prisma.companero.update({ where: { usuarioId }, data: { equipados: nuevo } });
}

export type BienvenidaDiariaDatos = {
  usuarioId: number;
  fecha: string;
  quien: string;
  companero: {
    personaje: Personaje;
    nombre: string;
    emoji: string;
    pose: Pose;
    equipados: Equipados;
    marco: number;
    saludo: string;
    felicitacion: string;
  };
  rachaApp: number;
  diasJuntos: number;
  puntos: number;
  xp: number;
  hitoHoy: Hito | null;
};

/**
 * Datos para el modal automático de bienvenida diaria:
 * El compañero saluda al usuario y lo felicita por haber vuelto, y enseguida muestra los premios (+5 XP y +5 puntos).
 * Devuelve `null` si ya vio la bienvenida de hoy.
 */
export async function bienvenidaDiariaDe(usuarioId: number, ahora: Date = new Date()): Promise<BienvenidaDiariaDatos | null> {
  const hoy = format(ahora, "yyyy-MM-dd", { in: tz(APP_TZ) });
  const hora = Number(format(ahora, "H", { in: tz(APP_TZ) }));
  await registrarIngreso(usuarioId, ahora);
  if (!(await bienvenidaPendienteHoy(usuarioId, ahora))) return null;

  const [usuario, fila, comprados, diasJuntos, previa, racha] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nombre: true, puntosAcumulados: true, experienciaHabitos: true } }),
    prisma.companero.findUnique({ where: { usuarioId } }),
    prisma.companeroAccesorio.findMany({ where: { usuarioId }, select: { clave: true } }),
    prisma.actividadDia.count({ where: { usuarioId } }),
    prisma.actividadDia.findFirst({ where: { usuarioId, fecha: { lt: aFecha(hoy) } }, orderBy: { fecha: "desc" }, select: { fecha: true } }),
    rachaDe(usuarioId, ahora),
  ]);
  if (!usuario) return null;

  const xp = xpTotal(usuario);
  const info = nivelDe(xp);
  const personaje = personajeGuardado(fila?.personaje) ?? "angelito";
  const datosHeroe = datosDePersonaje(personaje);
  const nombre = fila?.nombre ?? datosHeroe.nombre;
  const clavesCompradas = comprados.map((c) => c.clave);
  const desdeLaUltimaVez = previa ? differenceInCalendarDays(parseISO(hoy), parseISO(aClave(previa.fecha))) : null;
  const semilla = Number(hoy.replaceAll("-", "")) + usuarioId;
  const nombreCorto = primerNombre(usuario.nombre);

  const esRegresoTrasFalta = desdeLaUltimaVez !== null && desdeLaUltimaVez >= 2;
  const pose: Pose = esRegresoTrasFalta ? "abrazo" : hora >= 5 && hora < 12 ? "buenos-dias" : "felicitando";
  const tipoSaludo = esRegresoTrasFalta ? "regreso" : hora >= 5 && hora < 12 ? "manana" : hora >= 19 || hora < 5 ? "noche" : "tarde";
  const saludo = fraseDe(personaje, tipoSaludo, usuario.nombre, semilla);

  const felicitacion =
    racha.dias > 1
      ? `¡Qué alegría que volviste hoy, ${nombreCorto}! Te felicito por tu constancia: ya llevamos ${racha.dias} días seguidos en la app.`
      : diasJuntos > 1
      ? `¡Qué bueno tenerte de vuelta hoy, ${nombreCorto}! Te felicito por volver a encontrarnos un día más.`
      : `¡Qué alegría recibirte hoy, ${nombreCorto}! Te felicito por dar este primer paso juntos en la app.`;

  const hitoHoy = HITOS_RACHA.find((h) => h.dias === racha.dias) ?? null;

  return {
    usuarioId,
    fecha: hoy,
    quien: usuario.nombre,
    companero: {
      personaje,
      nombre,
      emoji: datosHeroe.emoji,
      pose,
      equipados: leerEquipados(fila?.equipados, clavesCompradas, info.level),
      marco: marcoDeNivel(info.level),
      saludo,
      felicitacion,
    },
    rachaApp: racha.dias,
    diasJuntos,
    puntos: PUNTOS_INGRESO_DIARIO,
    xp: XP_INGRESO_DIARIO,
    hitoHoy,
  };
}

