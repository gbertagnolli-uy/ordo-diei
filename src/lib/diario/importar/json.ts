// Diario (lane 292): lectores de los JSON. Portado de vendor/Daily_You/lib/utils/imports/{import_json,import_mybrain,import_oneshot,import_pixels}.dart
// (Demizo/Daily_You@7cc237d). El JSON propio (`ordo-diei-diario`) es el de la lane 291.
import type { NodoDoc } from "../contenido.ts";
import { esColor, esEmojiUnico, limpiarNombre, MAX_NOMBRE } from "../etiquetas.ts";
import { FORMATO_JSON, reescribirImagenes, VERSION_JSON } from "../exportar.ts";
import {
  animoDePuntaje,
  animoLegado,
  animoValido,
  aTexto,
  colorDeEntero,
  fechaValida,
  limpiarCuerpo,
  momentoDeInstante,
  momentoDeIso,
  resolverArchivo,
  titulo,
} from "./comun.ts";
import { entradaBase, ImportacionError, MARCADOR_IMAGEN, paqueteVacio, type Archivos, type EtiquetaPuestaImport, type PaqueteImport, type TipoIconoImport } from "./tipos.ts";

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const nombreDeEtiqueta = (v: unknown): string => limpiarNombre(v).slice(0, MAX_NOMBRE).trim();

/** Para los JSON de otras apps: no se arma el paquete si el archivo no tiene la forma. */
function exigirObjeto(raiz: unknown, mensaje: string): Obj {
  if (!esObj(raiz)) throw new ImportacionError(mensaje);
  return raiz;
}

// ── Fotos ────────────────────────────────────────────────────────────────────

/** Las rutas que existen en `archivos` (relativas a `carpeta`); cuenta las que faltan. */
export function resolverFotos(paquete: PaqueteImport, archivos: Archivos, carpeta: string, rutas: string[]): string[] {
  const salida: string[] = [];
  for (const r of rutas) {
    const ruta = resolverArchivo(archivos, carpeta, r);
    if (ruta) {
      if (!salida.includes(ruta)) salida.push(ruta);
    } else paquete.fotosFaltantes++;
  }
  return salida;
}

// ── Enlaces entre entradas: se pasan a texto ─────────────────────────────────

/** I8: un `diaryLink` de otro diario no vale acá; queda como `[[rótulo]]`. */
export function sinEnlaces(doc: NodoDoc): NodoDoc {
  const recorrer = (n: NodoDoc): NodoDoc => {
    if (n.type === "diaryLink") return { type: "text", text: `[[${String(n.attrs?.label ?? "").trim() || "entrada"}]]` };
    return n.content ? { ...n, content: n.content.map(recorrer) } : n;
  };
  return recorrer(doc);
}

// ── JSON propio (lane 291) ───────────────────────────────────────────────────

const HORA = /^(\d{1,2}):(\d{2})$/;

function iconoDe(icono: unknown, tipo: unknown): { icono: string | null; tipoIcono: TipoIconoImport } {
  const t: TipoIconoImport = tipo === "icono" ? "icono" : "emoji";
  const i = texto(icono);
  if (!i) return { icono: null, tipoIcono: t };
  return t === "emoji" && !esEmojiUnico(i) ? { icono: null, tipoIcono: t } : { icono: i, tipoIcono: t };
}

export function esJsonPropio(raiz: unknown): boolean {
  return esObj(raiz) && raiz.format === FORMATO_JSON;
}

export function leerJsonPropio(raiz: unknown, archivos: Archivos, carpeta: string): PaqueteImport {
  const r = exigirObjeto(raiz, "No es un respaldo de Ordo Diei");
  if (r.format !== FORMATO_JSON) throw new ImportacionError("No es un respaldo de Ordo Diei");
  if (r.version !== VERSION_JSON) throw new ImportacionError(`Versión ${String(r.version)} del respaldo no soportada`);
  const p = paqueteVacio("ordo-json");

  for (const g of lista(r.tagGroups)) {
    if (!esObj(g)) continue;
    const nombre = nombreDeEtiqueta(g.name);
    if (nombre) p.grupos.push({ nombre, ...iconoDe(g.icon, g.iconType), color: esColor(g.color) ? (g.color as string) : null, seleccionUnica: g.singleChoice === true });
  }
  for (const t of lista(r.tags)) {
    if (!esObj(t)) continue;
    const nombre = nombreDeEtiqueta(t.name);
    if (nombre && (t.type === "etiqueta" || t.type === "contador"))
      p.etiquetas.push({ nombre, tipo: t.type, grupo: nombreDeEtiqueta(t.group) || null, ...iconoDe(t.icon, t.iconType), color: esColor(t.color) ? (t.color as string) : null });
  }
  for (const c of lista(r.categories)) {
    if (!esObj(c)) continue;
    const camino = texto(c.path) ?? texto(c.name);
    if (camino) p.categorias.push({ camino, color: esColor(c.color) ? (c.color as string) : null });
  }

  let sinFecha = 0;
  for (const e of lista(r.entries)) {
    if (!esObj(e)) continue;
    const momento = momentoDeIso(e.date);
    const h = typeof e.time === "string" ? HORA.exec(e.time) : null;
    if (!momento?.fecha) {
      sinFecha++;
      continue;
    }
    const creada = momentoDeIso(e.created);
    // Las imágenes del documento apuntan a su archivo dentro del ZIP: se cambian por marcadores que la interfaz reemplaza al subirlas
    const imagenes: string[] = [];
    const contenido = esObj(e.content)
      ? reescribirImagenes(sinEnlaces(e.content as unknown as NodoDoc), (src) => {
          if (src.startsWith("/api/archivos/")) return src;
          const ruta = resolverArchivo(archivos, carpeta, src);
          if (!ruta) {
            p.fotosFaltantes++;
            return null;
          }
          let i = imagenes.indexOf(ruta);
          if (i < 0) i = imagenes.push(ruta) - 1;
          return `${MARCADOR_IMAGEN}${i}`;
        })
      : null;
    const etiquetas: EtiquetaPuestaImport[] = [];
    for (const t of lista(e.tags)) {
      if (!esObj(t)) continue;
      const nombre = nombreDeEtiqueta(t.name);
      if (nombre && (t.type === "etiqueta" || t.type === "contador")) etiquetas.push({ nombre, tipo: t.type, valor: t.type === "contador" ? (texto(t.value) ?? (typeof t.value === "number" ? String(t.value) : null)) : null });
    }
    const todas = resolverFotos(p, archivos, carpeta, lista(e.photos).filter((x): x is string => typeof x === "string"));
    // Las que ya están dentro del documento no se repiten como fotos de la entrada
    const fotos = todas.filter((f) => !imagenes.includes(f));
    p.entradas.push(
      entradaBase({
        fecha: momento.fecha,
        hora: h ? Number(h[1]) * 60 + Number(h[2]) : null,
        instante: creada?.instante ?? null,
        titulo: titulo(e.title),
        markdown: limpiarCuerpo(typeof e.text === "string" ? e.text : ""),
        contenido,
        animo: animoValido(e.mood),
        categoria: texto(e.category),
        etiquetas,
        favorita: e.favorite === true,
        fijada: e.pinned === true,
        fotos,
        imagenes,
      }),
    );
  }
  if (sinFecha) p.avisos.push(`${sinFecha} entradas sin fecha válida no se leyeron`);
  return p;
}

// ── Daily You ────────────────────────────────────────────────────────────────

export const FORMATO_DAILY_YOU = "daily-you";
export const VERSION_DAILY_YOU = 2;

export function esJsonDailyYou(raiz: unknown): boolean {
  return Array.isArray(raiz) || (esObj(raiz) && raiz.format === FORMATO_DAILY_YOU);
}

const ICONO_CARACTER = "character";

function iconoDeDart(icono: unknown, tipo: unknown): { icono: string | null; tipoIcono: TipoIconoImport } {
  // I7: un ícono de Material no existe en esta app
  if (tipo !== undefined && tipo !== ICONO_CARACTER) return { icono: null, tipoIcono: "emoji" };
  return iconoDe(icono, "emoji");
}

const colorDeDart = (v: unknown): string | null => colorDeEntero(v);

/** `import_json.dart`: la versión 2 (con `format`) o la lista vieja. */
export function leerDailyYouJson(raiz: unknown, archivos: Archivos, carpeta: string): PaqueteImport {
  const p = paqueteVacio("daily-you-json");
  if (Array.isArray(raiz)) {
    for (const e of raiz) {
      if (!esObj(e)) continue;
      const m = momentoDeIso(e.timeCreated);
      if (!m) continue;
      const rutas = [...(typeof e.imgPath === "string" ? [e.imgPath] : []), ...lista(e.images).flatMap((i) => (esObj(i) && typeof i.imgPath === "string" ? [i.imgPath] : []))];
      p.entradas.push(entradaBase({ ...m, markdown: limpiarCuerpo(typeof e.text === "string" ? e.text : ""), animo: animoLegado(typeof e.mood === "number" ? e.mood : null), fotos: resolverFotos(p, archivos, carpeta, rutas) }));
    }
    return p;
  }
  const r = exigirObjeto(raiz, "No es un JSON de Daily You");
  if (r.format !== FORMATO_DAILY_YOU) throw new ImportacionError("No es un JSON de Daily You");
  if (r.version !== VERSION_DAILY_YOU) throw new ImportacionError(`Versión ${String(r.version)} de Daily You no soportada`);

  for (const c of lista(r.categories)) {
    if (!esObj(c)) continue;
    const nombre = nombreDeEtiqueta(c.name);
    if (nombre) p.grupos.push({ nombre, ...iconoDeDart(c.icon, c.iconType), color: colorDeDart(c.color), seleccionUnica: false });
  }
  for (const t of lista(r.tags)) {
    if (!esObj(t)) continue;
    const nombre = nombreDeEtiqueta(t.name);
    if (nombre && (t.type === "label" || t.type === "tracker"))
      p.etiquetas.push({ nombre, tipo: t.type === "label" ? "etiqueta" : "contador", grupo: nombreDeEtiqueta(t.category) || null, ...iconoDeDart(t.icon, t.iconType), color: colorDeDart(t.color) });
  }
  let noImagenes = 0;
  for (const e of lista(r.entries)) {
    if (!esObj(e)) continue;
    const m = momentoDeIso(e.timeCreate);
    if (!m) continue;
    const etiquetas: EtiquetaPuestaImport[] = [];
    for (const t of lista(e.tags)) {
      if (!esObj(t)) continue;
      const nombre = nombreDeEtiqueta(t.name);
      if (!nombre) continue;
      if (t.type === "label") etiquetas.push({ nombre, tipo: "etiqueta", valor: null });
      else if (t.type === "tracker" && typeof t.value === "number" && Number.isFinite(t.value)) etiquetas.push({ nombre, tipo: "contador", valor: String(t.value) });
    }
    const adjuntos = lista(e.attachments).filter(esObj);
    // Lane 294: los audios y videos pasan al final del documento; un tipo que no se conoce se cuenta y se avisa
    noImagenes += adjuntos.filter((a) => a.type !== "image" && a.type !== "audio" && a.type !== "video").length;
    const ordenadas = adjuntos.filter((a) => typeof a.path === "string").sort((a, b) => Number(b.rank ?? 0) - Number(a.rank ?? 0));
    const rutas = ordenadas.filter((a) => a.type === "image").map((a) => a.path as string);
    const rutasAparte = ordenadas.filter((a) => a.type === "audio" || a.type === "video").map((a) => a.path as string);
    p.entradas.push(
      entradaBase({
        ...m,
        markdown: limpiarCuerpo(typeof e.text === "string" ? e.text : ""),
        animo: animoValido(e.mood),
        etiquetas,
        fotos: resolverFotos(p, archivos, carpeta, rutas),
        adjuntos: resolverFotos(p, archivos, carpeta, rutasAparte),
      }),
    );
  }
  if (noImagenes) p.avisos.push(`${noImagenes} adjuntos de un tipo desconocido no se importaron`);
  return p;
}

// ── MyBrain, OneShot y Pixels ────────────────────────────────────────────────

const ANIMO_MYBRAIN: Record<string, number> = { TERRIBLE: 1, BAD: 2, OKAY: 3, GOOD: 4, AWESOME: 5 };
const ANIMO_ONESHOT: Record<string, number> = { VERY_SAD: 1, SAD: 2, NEUTRAL: 3, HAPPY: 4, VERY_HAPPY: 5 };

export function leerMyBrain(raiz: unknown): PaqueteImport {
  const r = exigirObjeto(raiz, "No es un respaldo de MyBrain");
  if (!Array.isArray(r.diary)) throw new ImportacionError("No es un respaldo de MyBrain");
  const p = paqueteVacio("mybrain");
  for (const e of r.diary) {
    if (!esObj(e)) continue;
    const m = momentoDeInstante(Number(e.createdDate));
    if (!m) continue;
    p.entradas.push(entradaBase({ ...m, titulo: titulo(e.title), markdown: limpiarCuerpo(typeof e.content === "string" ? e.content : ""), animo: ANIMO_MYBRAIN[String(e.mood)] ?? null }));
  }
  return p;
}

export function leerOneShot(raiz: unknown): PaqueteImport {
  if (!Array.isArray(raiz)) throw new ImportacionError("No es un respaldo de OneShot");
  const p = paqueteVacio("oneshot");
  for (const e of raiz) {
    if (!esObj(e)) continue;
    const m = momentoDeInstante(Number(e.created) * 1000);
    if (!m) continue;
    // La foto de OneShot es una referencia a un archivo del teléfono: no viene en el JSON
    if (typeof e.relativePath === "string" && e.relativePath) p.fotosFaltantes++;
    p.entradas.push(entradaBase({ ...m, markdown: limpiarCuerpo(typeof e.textContent === "string" ? e.textContent : ""), animo: ANIMO_ONESHOT[String(e.happiness)] ?? null }));
  }
  return p;
}

const FECHA_PIXELS = /^(\d{4})-(\d{2})-(\d{2})$/;

export function leerPixels(raiz: unknown): PaqueteImport {
  if (!Array.isArray(raiz)) throw new ImportacionError("No es un respaldo de Pixels");
  const p = paqueteVacio("pixels");
  for (const e of raiz) {
    if (!esObj(e) || e.type !== "Mood") continue;
    const f = typeof e.date === "string" ? FECHA_PIXELS.exec(e.date) : null;
    if (!f || !fechaValida(Number(f[1]), Number(f[2]), Number(f[3]))) continue;
    const puntajes = lista(e.scores).filter((n): n is number => typeof n === "number" && Number.isFinite(n));
    const promedio = puntajes.length ? Math.trunc(puntajes.reduce((a, b) => a + b, 0) / puntajes.length) : null;
    p.entradas.push(entradaBase({ fecha: e.date as string, markdown: limpiarCuerpo(typeof e.notes === "string" ? e.notes : ""), animo: promedio === null ? null : animoDePuntaje(promedio) }));
  }
  return p;
}

/** Lee el texto de un archivo JSON. */
export function jsonDe(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(aTexto(bytes));
  } catch {
    throw new ImportacionError("El archivo no es un JSON válido");
  }
}
