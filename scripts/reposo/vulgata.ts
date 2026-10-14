// Vulgata Clementina (Clementine Text Project / VulSearch, copia BibleGet-I-O/Clementine-Vulgate, src/utf8).
// Formato: «cap:vers texto», con «[ ]» (poesía), «/» (corte de línea) y etiquetas «<Sponsa>» (personajes).
// El texto de VulSearch no lleva acentos y usa los espacios tipográficos del latín antes de «: ; ?»: se normalizan.
// Numeración: la de la Vulgata/Torres Amat; los salmos con título cuentan el título en el v. 1 (22,1 = «Psalmus David. Dominus regit me…»).
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LibroVulgata = Map<number, Map<number, string>>; // capítulo → versículo → texto

// En los archivos utf8 de VulSearch la ligadura «œ» quedó como el carácter de control U+009C («pnitentiam» = poenitentiam).
const RE_OE = /\u009c/g;
const RE_OE_MAYUS = /\u008c/g;

export function limpiarLatin(s: string): string {
  return s
    .replace(RE_OE, "œ")
    .replace(RE_OE_MAYUS, "Œ")
    .replace(/\\/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[[\]]/g, "")
    .replace(/\s*\/\s*/g, " ")
    .replace(/\s+([:;?!,.])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsearLibro(texto: string): LibroVulgata {
  const libro: LibroVulgata = new Map();
  let ultimo: { c: number; v: number } | null = null;
  for (const l of texto.split(/\r?\n/)) {
    const m = /^(\d+):(\d+)\s+(.*)$/.exec(l);
    if (m) {
      const c = Number(m[1]);
      const v = Number(m[2]);
      if (!libro.has(c)) libro.set(c, new Map());
      libro.get(c)!.set(v, m[3]);
      ultimo = { c, v };
    } else if (ultimo && l.trim()) {
      // continuación del versículo anterior
      const mapa = libro.get(ultimo.c)!;
      mapa.set(ultimo.v, `${mapa.get(ultimo.v)} ${l.trim()}`);
    }
  }
  return libro;
}

export function cargarLibro(dir: string, codigo: string): LibroVulgata {
  return parsearLibro(readFileSync(join(dir, `${codigo}.lat`), "utf8"));
}

/**
 * Versículos `desde`…`hasta` del capítulo, unidos y limpios; `null` si falta alguno.
 * En los salmos el versículo 1 trae el título antes del «[» («Psalmus David. [Dominus regit me…»): se quita.
 * Si el versículo 1 es solo el título, devuelve `null` (no es una cita).
 */
export function textoLatin(libro: LibroVulgata, capitulo: number, desde: number, hasta: number): string | null {
  const cap = libro.get(capitulo);
  if (!cap) return null;
  const partes: string[] = [];
  for (let v = desde; v <= hasta; v++) {
    let t = cap.get(v);
    if (t === undefined) return null;
    if (v === 1 && /^[^[]*\[/.test(t) && /[A-Za-z]/.test(t.slice(0, t.indexOf("[")))) t = t.slice(t.indexOf("[") + 1);
    const limpio = limpiarLatin(t);
    if (!limpio) return null;
    partes.push(limpio);
  }
  return partes.join(" ").replace(/\s+/g, " ").trim();
}
