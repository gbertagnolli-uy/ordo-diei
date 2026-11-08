// Diario (lane 292): lectores de los respaldos de otras apps. Portado de vendor/Daily_You/lib/utils/imports/{import_daylio,import_daybook,import_diaro}.dart (Demizo/Daily_You@7cc237d).
import { limpiarNombre, MAX_NOMBRE } from "../etiquetas.ts";
import { animoDePuntaje, aTexto, buscarPorNombre, leerCsv, leerTablasXml, limpiarCuerpo, momentoDePared, nombreDe, resolverArchivo, titulo } from "./comun.ts";
import { htmlAMarkdown } from "./html.ts";
import { entradaBase, ImportacionError, paqueteVacio, type Archivos, type EtiquetaPuestaImport, type MomentoImport, type PaqueteImport } from "./tipos.ts";

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const nombreLimpio = (v: unknown): string => limpiarNombre(typeof v === "string" ? v : "").slice(0, MAX_NOMBRE).trim();

// ── Daylio ───────────────────────────────────────────────────────────────────

/** `backup.daylio`: un JSON en base64. */
export function esDaylio(archivos: Archivos): boolean {
  return [...archivos.keys()].some((k) => k.endsWith("backup.daylio"));
}

function decodificarBase64(texto: string): string {
  const limpio = texto.replace(/[\r\n\s]/g, "");
  const binario = atob(limpio);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return aTexto(bytes);
}

const porOrden = (xs: unknown): Obj[] =>
  lista(xs)
    .filter(esObj)
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

export function leerDaylio(archivos: Archivos): PaqueteImport {
  const ruta = [...archivos.keys()].find((k) => k.endsWith("backup.daylio"));
  if (!ruta) throw new ImportacionError("No se encontró backup.daylio en el archivo");
  let copia: Obj;
  try {
    const v = JSON.parse(decodificarBase64(aTexto(archivos.get(ruta)!)));
    if (!esObj(v)) throw new Error();
    copia = v;
  } catch {
    throw new ImportacionError("El respaldo de Daylio está dañado");
  }
  const p = paqueteVacio("daylio");

  // Fotos por suma de verificación: assets/photos/<checksum>.<ext>
  const fotosPorSuma = new Map<string, string>();
  for (const k of archivos.keys()) if (/^assets\/photos\//.test(k) || k.includes("/assets/photos/")) fotosPorSuma.set(nombreDe(k).replace(/\.[^.]*$/, ""), k);
  const activos = new Map<unknown, Obj>(lista(copia.assets).filter(esObj).map((a) => [a.id, a]));

  const nombreDeGrupo = new Map<unknown, string>();
  for (const g of porOrden(copia.tag_groups)) {
    const nombre = nombreLimpio(g.name);
    if (g.id == null || !nombre) continue;
    nombreDeGrupo.set(g.id, nombre);
    p.grupos.push({ nombre, icono: null, tipoIcono: "emoji", color: null, seleccionUnica: false });
  }
  const nombreDeEtiqueta = new Map<unknown, string>();
  for (const t of porOrden(copia.tags)) {
    const nombre = nombreLimpio(t.name);
    if (t.id == null || !nombre) continue;
    nombreDeEtiqueta.set(t.id, nombre);
    p.etiquetas.push({ nombre, tipo: "etiqueta", grupo: nombreDeGrupo.get(t.id_tag_group) ?? null, icono: null, tipoIcono: "emoji", color: null });
  }

  for (const e of lista(copia.dayEntries).filter(esObj)) {
    const momento = momentoDePared(Number(e.datetime), Number(e.timeZoneOffset ?? 0));
    if (!momento) continue;
    const nota = typeof e.note === "string" ? e.note : "";
    const fotos: string[] = [];
    for (const id of lista(e.assets)) {
      const a = activos.get(id);
      const f = a && a.type === 1 ? fotosPorSuma.get(String(a.checksum)) : undefined;
      if (f && !fotos.includes(f)) fotos.push(f);
    }
    const etiquetas: EtiquetaPuestaImport[] = [];
    for (const id of lista(e.tags)) {
      const nombre = nombreDeEtiqueta.get(id);
      if (nombre && !etiquetas.some((x) => x.nombre === nombre)) etiquetas.push({ nombre, tipo: "etiqueta", valor: null });
    }
    // Daylio puntúa de 1 (mejor) a 5 (peor)
    const animo = typeof e.mood === "number" ? animoDePuntaje(e.mood, true) : null;
    p.entradas.push(entradaBase({ ...momento, titulo: titulo(e.note_title), markdown: nota ? htmlAMarkdown(nota) : "", animo, etiquetas, fotos }));
  }
  return p;
}

// ── Daybook ──────────────────────────────────────────────────────────────────

export const esDaybook = (archivos: Archivos): boolean => archivos.has("entries.csv");

const FECHA_DAYBOOK = /^(\d{4})-(\d{2})-(\d{2})-(\d{2}):(\d{2})$/;

export function leerDaybook(archivos: Archivos): PaqueteImport {
  const bytes = archivos.get("entries.csv");
  if (!bytes) throw new ImportacionError("No se encontró entries.csv en el archivo");
  const filas = leerCsv(aTexto(bytes));
  if (!filas.length) throw new ImportacionError("entries.csv está vacío");
  const cab = filas[0].map((c) => c.trim());
  const [iFecha, iTitulo, iTexto, iImagenes] = ["Date", "Title", "Text", "Images"].map((c) => cab.indexOf(c));
  if ([iFecha, iTitulo, iTexto, iImagenes].includes(-1)) throw new ImportacionError("entries.csv no tiene el formato de Daybook");
  const p = paqueteVacio("daybook");
  let malas = 0;
  for (const f of filas.slice(1)) {
    const texto = f[iFecha]?.trim() ?? "";
    if (!texto) continue;
    const m = FECHA_DAYBOOK.exec(texto);
    if (!m) {
      malas++;
      continue;
    }
    const momento: MomentoImport = { fecha: `${m[1]}-${m[2]}-${m[3]}`, hora: Number(m[4]) * 60 + Number(m[5]), instante: null };
    const fotos: string[] = [];
    for (const n of (f[iImagenes] ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
      const ruta = resolverArchivo(archivos, "", n);
      if (ruta) fotos.push(ruta);
      else p.fotosFaltantes++;
    }
    p.entradas.push(entradaBase({ ...momento, titulo: titulo(f[iTitulo]), markdown: limpiarCuerpo(f[iTexto]), fotos }));
  }
  if (malas) p.avisos.push(`${malas} entradas con una fecha que no es de Daybook no se leyeron`);
  return p;
}

// ── Diaro ────────────────────────────────────────────────────────────────────

export const esDiaro = (archivos: Archivos): boolean => [...archivos.keys()].some((k) => k.endsWith("DiaroBackup.xml"));

/** `+02:00` / `-03:00` → milisegundos. */
function desfaseDe(texto: string): number | null {
  const m = /^([+-])(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60_000;
}

export function leerDiaro(archivos: Archivos): PaqueteImport {
  const ruta = [...archivos.keys()].find((k) => k.endsWith("DiaroBackup.xml"));
  if (!ruta) throw new ImportacionError("No se encontró DiaroBackup.xml en el archivo");
  const tablas = leerTablasXml(aTexto(archivos.get(ruta)!));
  const entradas = tablas.get("diaro_entries");
  if (!entradas) throw new ImportacionError("El respaldo de Diaro no tiene entradas");
  const carpeta = ruta.includes("/") ? ruta.slice(0, ruta.lastIndexOf("/") + 1) : "";
  const p = paqueteVacio("diaro");

  const fotosPorEntrada = new Map<string, { nombre: string; posicion: number }[]>();
  for (const f of tablas.get("diaro_attachments") ?? []) {
    if (f.type !== "photo") continue;
    const posicion = Number.parseInt(f.position ?? "", 10);
    if (!f.entry_uid || !f.filename || Number.isNaN(posicion)) continue;
    fotosPorEntrada.set(f.entry_uid, [...(fotosPorEntrada.get(f.entry_uid) ?? []), { nombre: f.filename, posicion }]);
  }

  for (const f of entradas) {
    if (!f.uid || !f.date || !f.tz_offset) continue;
    const desfase = desfaseDe(f.tz_offset);
    const momento = desfase === null ? null : momentoDePared(Number(f.date), desfase);
    if (!momento) continue;
    const fotos: string[] = [];
    for (const { nombre } of [...(fotosPorEntrada.get(f.uid) ?? [])].sort((a, b) => a.posicion - b.posicion)) {
      const r = resolverArchivo(archivos, `${carpeta}media/photo`.replace(/\/$/, ""), nombre) ?? buscarPorNombre(archivos, nombre);
      if (r) fotos.push(r);
      else p.fotosFaltantes++;
    }
    const puntaje = Number.parseInt(f.mood ?? "", 10);
    p.entradas.push(
      entradaBase({ ...momento, titulo: titulo(f.title), markdown: limpiarCuerpo(f.text), animo: Number.isNaN(puntaje) ? null : animoDePuntaje(puntaje, true), fotos }),
    );
  }
  return p;
}
