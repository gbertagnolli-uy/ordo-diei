// Lecturas puras de la liturgia (SPEC liturgia §6): reciben el repositorio, devuelven datos listos
// para la API. Sin Next, sin sesión, sin Prisma directo.
import { aISO as fechaAISO, sumarDias } from "./calendario.ts";
import { claveEsDeLibro, PREFIJO_CLAVE_LIBRO } from "./parametros.ts";
import type { TipoLibro } from "./parametros.ts";
import type { FilaDia, FilaDocumento, RepoLiturgia } from "./repositorio.ts";
import type { DocumentoResuelto, Hora, SeccionResuelta, TituloDia, VersionLiturgica } from "./tipos.ts";

/** Cuando falta el dato, la pantalla dice «Este día todavía no se generó» y no rompe (SPEC §2). */
export type Lectura<T> = { estado: "ok"; datos: T } | { estado: "no-generado" };
const ok = <T>(datos: T): Lectura<T> => ({ estado: "ok", datos });
const NO_GENERADO = { estado: "no-generado" } as const;

export async function leerDia(repo: RepoLiturgia, version: VersionLiturgica, fecha: string): Promise<Lectura<FilaDia>> {
  const d = await repo.dia(version, fecha);
  return d ? ok(d) : NO_GENERADO;
}

/** Días de un mes (`mes` 1–12). Si la base no tiene ninguno, `no-generado`. */
export async function leerMes(repo: RepoLiturgia, version: VersionLiturgica, anio: number, mes: number): Promise<Lectura<FilaDia[]>> {
  const desde = fechaAISO({ y: anio, m: mes, d: 1 });
  const hasta = fechaAISO(sumarDias({ y: anio, m: mes, d: 1 }, diasDelMes(anio, mes)));
  const dias = await repo.dias(version, desde, hasta);
  return dias.length ? ok(dias) : NO_GENERADO;
}

export function diasDelMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Cambia los hashes de cada sección por los bloques reales. Un hash que falta se omite (no rompe). */
export async function resolverDocumento(repo: RepoLiturgia, fila: FilaDocumento): Promise<DocumentoResuelto> {
  const hashes = fila.secciones.flatMap((s) => s.bloques);
  const mapa = await repo.bloques(hashes);
  const secciones: SeccionResuelta[] = fila.secciones.map((s) => ({
    ...s,
    bloques: s.bloques.flatMap((h) => {
      const b = mapa.get(h);
      return b ? [b] : [];
    }),
  }));
  return { titulo: (fila.titulo as TituloDia | null) ?? null, secciones };
}

export async function leerHora(repo: RepoLiturgia, version: VersionLiturgica, fecha: string, hora: Hora): Promise<Lectura<DocumentoResuelto>> {
  const fila = await repo.documento(version, "hora", `${fecha}/${hora}`);
  return fila ? ok(await resolverDocumento(repo, fila)) : NO_GENERADO;
}

export async function leerMisa(repo: RepoLiturgia, version: VersionLiturgica, fecha: string): Promise<Lectura<DocumentoResuelto>> {
  const fila = await repo.documento(version, "missa", fecha);
  return fila ? ok(await resolverDocumento(repo, fila)) : NO_GENERADO;
}

export async function leerMartirologio(repo: RepoLiturgia, version: VersionLiturgica, fecha: string): Promise<Lectura<DocumentoResuelto>> {
  // El martirologio se guarda por día del año («MM-DD»), no por año (lane 133).
  const fila = await repo.documento(version, "martyrologium", fecha.slice(5));
  return fila ? ok(await resolverDocumento(repo, fila)) : NO_GENERADO;
}

export async function leerLibro(repo: RepoLiturgia, version: VersionLiturgica, tipo: TipoLibro, clave: string): Promise<Lectura<DocumentoResuelto> | { estado: "clave-invalida" }> {
  if (!claveEsDeLibro(tipo, clave)) return { estado: "clave-invalida" };
  const fila = await repo.documento(version, "libro", clave);
  return fila ? ok(await resolverDocumento(repo, fila)) : NO_GENERADO;
}

export type EntradaIndice = { clave: string; titulo: string; secciones: { clave: string; tituloLa: string; tituloEs: string | null }[] };

/** Índice de un libro: claves y títulos, sin cargar los bloques. */
export async function leerIndice(repo: RepoLiturgia, version: VersionLiturgica, tipo: TipoLibro): Promise<Lectura<EntradaIndice[]>> {
  const filas = await repo.indiceLibros(version, PREFIJO_CLAVE_LIBRO[tipo]);
  if (!filas.length) return NO_GENERADO;
  return ok(
    filas.map((f) => ({
      clave: f.clave,
      titulo: tituloDeLibro(f.titulo, f.clave),
      secciones: f.secciones.map((s) => ({ clave: s.clave, tituloLa: s.tituloLa, tituloEs: s.tituloEs })),
    })),
  );
}

function tituloDeLibro(t: TituloDia | null, clave: string): string {
  return t?.titulo?.trim() || clave.split("/").pop() || clave;
}

/** Entrada del Kalendarium de una versión (1570 + diferencias de 1888 y 1906 combinadas). */
export type EntradaKalendarium = {
  fecha: string; // "MM-DD"
  archivo: string; // "Sancti/10-14"
  nombre: string;
  rango: number;
  conmemoracion?: { archivo: string; nombre: string; rango: number };
};

export async function leerKalendarium(repo: RepoLiturgia, version: VersionLiturgica): Promise<Lectura<EntradaKalendarium[]>> {
  const fila = await repo.documento(version, "kalendarium", version);
  return fila && Array.isArray(fila.titulo) ? ok(fila.titulo as EntradaKalendarium[]) : NO_GENERADO;
}
