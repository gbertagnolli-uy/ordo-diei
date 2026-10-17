// Lógica pura de lectura del título litúrgico del día para la pantalla de reposo (SPEC idle-marco-fotos §4.1, §5.4).
import type { RepoLiturgia } from "../liturgia/repositorio.ts";

export const APP_TZ = process.env.APP_TZ || "America/Montevideo";

/**
 * Fecha ISO `YYYY-MM-DD` en la zona horaria familiar (por defecto Montevideo).
 */
export function fechaHoyEnTz(ahora: Date = new Date(), timezone: string = APP_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

export type DiaReposoRespuesta = {
  version: string;
  fecha: string;
  titulo: string;
  tituloEs: string | null;
  rango: string;
  lineas: string[];
  color: string;
  tiempo: string;
  dominical: boolean;
};

/**
 * Consulta el día litúrgico en la versión Tridentine 1906 (D40).
 * Devuelve `null` si aún no fue generado en la base (SPEC §4.6).
 */
export async function consultarDiaReposo(
  repo: RepoLiturgia,
  fechaISO: string = fechaHoyEnTz(),
): Promise<DiaReposoRespuesta | null> {
  const dia = await repo.dia("1906", fechaISO);
  if (!dia) return null;
  return {
    version: dia.version,
    fecha: dia.fecha,
    titulo: dia.titulo,
    tituloEs: dia.tituloEs,
    rango: dia.rango,
    lineas: dia.lineas,
    color: dia.color,
    tiempo: dia.tiempo,
    dominical: dia.dominical,
  };
}
