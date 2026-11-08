// Diario (lane 292): qué formato es lo que se abrió y quién lo lee. Es el `ImportRegistry` de Daily You
// (vendor/Daily_You/lib/utils/imports/import_registry.dart, Demizo/Daily_You@7cc237d) pero eligiendo solo, por el contenido.
import { esDaybook, esDaylio, esDiaro, leerDaybook, leerDaylio, leerDiaro } from "./apps.ts";
import { carpetaDe, esZip, extensionDe, leerZip, nombreDe } from "./comun.ts";
import { esJsonDailyYou, esJsonPropio, jsonDe, leerDailyYouJson, leerJsonPropio, leerMyBrain, leerOneShot, leerPixels } from "./json.ts";
import { hayMarkdown, leerMarkdown } from "./markdown.ts";
import { ImportacionError, type Archivos, type PaqueteImport } from "./tipos.ts";

export const MAX_ENTRADAS_IMPORTAR = 20_000;
export const MAX_BYTES_ARCHIVO_IMPORTAR = 300 * 1024 * 1024;

const esObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Lo que se abrió: un ZIP se descomprime; cualquier otro archivo queda solo, con su nombre. */
export function abrirArchivo(nombre: string, bytes: Uint8Array): Archivos {
  if (esZip(bytes)) return leerZip(bytes);
  return new Map([[nombreDe(nombre.replace(/\\/g, "/")) || "archivo", bytes]]);
}

function leerJson(archivos: Archivos): PaqueteImport | null {
  const jsons = [...archivos.keys()].filter((k) => extensionDe(k) === ".json");
  if (!jsons.length) return null;
  // Con varios, el del respaldo manda; si no, el de la raíz
  const ruta = jsons.find((k) => /(^|\/)(diario|daily_you_export)\.json$/i.test(k)) ?? jsons.sort((a, b) => a.split("/").length - b.split("/").length)[0];
  const raiz = jsonDe(archivos.get(ruta)!);
  const carpeta = carpetaDe(ruta);
  if (esJsonPropio(raiz)) return leerJsonPropio(raiz, archivos, carpeta);
  if (esJsonDailyYou(raiz)) {
    const primero = Array.isArray(raiz) ? raiz[0] : null;
    if (!Array.isArray(raiz) || (esObj(primero) && "timeCreated" in primero) || raiz.length === 0) return leerDailyYouJson(raiz, archivos, carpeta);
  }
  if (esObj(raiz) && Array.isArray(raiz.diary)) return leerMyBrain(raiz);
  if (Array.isArray(raiz)) {
    const primero = raiz.find(esObj);
    if (primero && primero.type === "Mood" && "scores" in primero) return leerPixels(raiz);
    if (primero && "created" in primero && ("textContent" in primero || "happiness" in primero)) return leerOneShot(raiz);
  }
  throw new ImportacionError("El JSON no es de ningún formato conocido (Ordo Diei, Daily You, MyBrain, OneShot o Pixels)");
}

/** Reconoce el formato y lo lee. Lanza `ImportacionError` con un mensaje para el usuario. */
export function leerArchivos(archivos: Archivos): PaqueteImport {
  let p: PaqueteImport | null = null;
  if (esDaylio(archivos)) p = leerDaylio(archivos);
  else if (esDiaro(archivos)) p = leerDiaro(archivos);
  else if (esDaybook(archivos)) p = leerDaybook(archivos);
  else p = leerJson(archivos) ?? (hayMarkdown(archivos) ? leerMarkdown(archivos) : null);
  if (!p) {
    if ([...archivos.keys()].some((k) => /\.(sqlite|db)$/i.test(k) || /diarium/i.test(k))) throw new ImportacionError("Los respaldos de Diarium (SQLite) todavía no se pueden importar");
    throw new ImportacionError("No se reconoce el formato. Se aceptan JSON, Markdown y los respaldos ZIP de Daylio, Daybook y Diaro");
  }
  if (!p.entradas.length) throw new ImportacionError("El archivo no tiene entradas para importar");
  if (p.entradas.length > MAX_ENTRADAS_IMPORTAR) throw new ImportacionError(`Son ${p.entradas.length} entradas y el máximo por importación es ${MAX_ENTRADAS_IMPORTAR}`);
  return p;
}

export interface ResumenImport {
  entradas: number;
  desde: string | null;
  hasta: string | null;
  etiquetas: number;
  categorias: number;
  conFotos: number;
}

/** Para mostrar antes de importar. Las fechas con zona horaria se muestran en UTC (el servidor las pasa a la zona de la familia). */
export function resumirPaquete(p: PaqueteImport): ResumenImport {
  const fechas = p.entradas.map((e) => e.fecha ?? e.instante?.slice(0, 10) ?? null).filter((f): f is string => !!f).sort();
  const nombres = new Set<string>();
  for (const e of p.entradas) for (const t of e.etiquetas) nombres.add(`${t.tipo}:${t.nombre.toLowerCase()}`);
  for (const t of p.etiquetas) nombres.add(`${t.tipo}:${t.nombre.toLowerCase()}`);
  return {
    entradas: p.entradas.length,
    desde: fechas[0] ?? null,
    hasta: fechas[fechas.length - 1] ?? null,
    etiquetas: nombres.size,
    categorias: new Set([...p.categorias.map((c) => c.camino), ...p.entradas.flatMap((e) => (e.categoria ? [e.categoria] : []))]).size,
    conFotos: p.entradas.filter((e) => e.fotos.length > 0 || e.imagenes.length > 0).length,
  };
}
