// Reglas puras del día lectivo y su Tarea (ARQUITECTURA_DETALLADA §5): vencimiento, título, rango, estado y candados.
// Sin Prisma: las usan tests, servidor y componentes.
import { TZDate } from "@date-fns/tz";
import { HORA_LIMITE_LECCION } from "./config.ts";

export const TZ_FAMILIA = process.env.APP_TZ || "America/Montevideo";

const partes = (fecha: string) => {
  const [y, m, d] = fecha.split("-").map(Number);
  return { y, m: m - 1, d };
};

/** 00:00 de `fecha` ('YYYY-MM-DD') en la zona de la familia */
export function inicioDelDia(fecha: string, tz = TZ_FAMILIA): Date {
  const { y, m, d } = partes(fecha);
  return new Date(new TZDate(y, m, d, 0, 0, 0, tz).getTime());
}

/**
 * `horaEjecucion` de la Tarea de una lección: la hora límite de `fecha` (18:00 por defecto) menos el tiempo estimado,
 * nunca antes de las 00:00 de ese día. `complete` paga completo si `ahora <= horaEjecucion + estimado`, o sea hasta la hora límite.
 */
export function vencimientoLeccion(fecha: string, horaLimite = HORA_LIMITE_LECCION, estimadoSeg: number, tz = TZ_FAMILIA): Date {
  const { y, m, d } = partes(fecha);
  const [hh, mm] = horaLimite.split(":").map(Number);
  const limite = new TZDate(y, m, d, hh, mm, 0, tz).getTime();
  return new Date(Math.max(limite - estimadoSeg * 1000, inicioDelDia(fecha, tz).getTime()));
}

const PLURAL: Record<string, [string, string]> = {
  pagina: ["página", "páginas"],
  capitulo: ["capítulo", "capítulos"],
  leccion: ["lección", "lecciones"],
  unidad: ["unidad", "unidades"],
};
const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** «Páginas 22 a 25» / «Lección 7» */
export function rangoTexto(unidadTipo: string, desde: number, hasta: number): string {
  const [uno, varios] = PLURAL[unidadTipo] ?? PLURAL.unidad;
  return desde === hasta ? `${capitalizar(uno)} ${desde}` : `${capitalizar(varios)} ${desde} a ${hasta}`;
}

/** «Historia: Uruguay — lección 7» / «— páginas 22 a 25» */
export function tituloTarea(materia: string, recurso: string, unidadTipo: string, desde: number, hasta: number): string {
  return `${materia}: ${recurso} — ${rangoTexto(unidadTipo, desde, hasta).toLowerCase()}`;
}

/** Minutos estimados del día → segundos (`tiempoEjecucionEstimadoSeg`) */
export const estimadoSegundos = (desde: number, hasta: number, minutosPorUnidad: number) => (hasta - desde + 1) * minutosPorUnidad * 60;

export const ESTADOS_TAREA_HECHA = ["Completada", "Esperando_Aprobacion", "Aprobada"];

/**
 * Estado del día a partir de su Tarea (§5.3): un día pendiente pasa a `hecha` cuando la Tarea está completada o en revisión;
 * uno `hecha` vuelve a `pendiente` si el padre rechazó la Tarea. `movida` y `omitida` no cambian.
 */
export function estadoSincronizado(dia: string, tareaEstado: string | null): string {
  if (!tareaEstado) return dia;
  if (dia === "pendiente" && ESTADOS_TAREA_HECHA.includes(tareaEstado)) return "hecha";
  if (dia === "hecha" && tareaEstado === "Rechazada") return "pendiente";
  return dia;
}

/**
 * Candado de un día (§5.4): hoy siempre disponible; uno futuro solo con navegación libre y el día anterior del plan
 * hecho u omitido (adelantar sí, saltear no).
 */
export function estaBloqueado(e: { fecha: string; hoy: string; navegacionLibre: boolean; anteriorEstado: string | null }): boolean {
  if (e.fecha <= e.hoy) return false;
  if (!e.navegacionLibre) return true;
  return !(e.anteriorEstado === "hecha" || e.anteriorEstado === "omitida");
}

/** La unidad `u` ya está vista: tiene su ProgresoLeccion o la cubre un día hecho/omitido */
export const unidadSatisfecha = (u: number, conProgreso: Set<number>, cubiertasPorDias: Set<number>) => conProgreso.has(u) || cubiertasPorDias.has(u);

/** Una lección k exige la k−1 (la primera no exige nada). Devuelve el motivo o null */
export function motivoLeccionBloqueada(orden: number, tituloAnterior: string | undefined, satisfecha: (u: number) => boolean): string | null {
  if (orden <= 1 || satisfecha(orden - 1)) return null;
  return tituloAnterior ? `Terminá «${tituloAnterior}» primero` : "Terminá la lección anterior primero";
}

/**
 * Guardia de la Tarea de un día (§5.5): texto si no se puede completar todavía, o null.
 * `leccionesDelRango` solo cuenta en recursos con lecciones (curso de videos o enlaces).
 */
export function motivoGuardia(e: { diaEstado: string; conLecciones: boolean; leccionesDelRango: number; leccionesHechas: number }): string | null {
  if (e.diaEstado === "movida") return "Esta lección se pasó a otro día; usá la del día nuevo";
  if (e.diaEstado === "omitida") return "Este día fue omitido por tus padres";
  if (e.conLecciones && e.leccionesHechas < e.leccionesDelRango) return "Primero terminá las lecciones del día en «Estudio»";
  return null;
}
