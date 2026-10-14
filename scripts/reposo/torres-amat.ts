// Torres Amat (edición «nueva edición ilustrada por Gustavo Doré», Montaner y Simón, 1883-84; dominio público).
// Fuente: OCR de Internet Archive (AI156…AI159). El texto sigue la Vulgata y su numeración; cada versículo es un
// párrafo «N. texto» con llamadas de nota intercaladas («Bienaventurados los pobres 11 : porque…») y las notas
// como párrafos aparte. Se extrae por párrafos y se valida contra el número de versículos de la Vulgata.
import { readFileSync } from "node:fs";

export type VersiculosCapitulo = Map<number, string>;

/** Separa título y cuerpo del versículo 1 de un salmo dentro del mapa de versículos. */
export const SEP_CUERPO = "\u0001";

const RE_VERSO = /^(\d{1,3})\.\s+(\S[\s\S]*)$/;

/** Llamadas de nota («… 11 :», «… 14 * :») y guiones de fin de renglón fuera. */
export function limpiarVersiculo(s: string): string {
  return s
    .replace(/¬\s*/g, "")
    .replace(/\s+/g, " ")
    // llamada de nota: número (1–3 cifras, a veces con asterisco) pegado a una palabra o signo
    .replace(/(?<=[A-Za-zÁÉÍÓÚáéíóúñÑüÜ,;:.!?»)])\s+\d{1,3}(?:\s?\*)*(?=\s*[:;,.!?»)]|\s+[a-záéíóúñ¿¡«(A-ZÁÉÍÓÚ])/g, "")
    // restos de las llamadas de nota: comilla suelta, dígito pegado, letra de nota al final
    .replace(/^['’‘_*]+\s*/, "")
    .replace(/(?<=[,;:.])['’‘](?=\s)/g, "")
    .replace(/(?<=[a-záéíóúñ])\d{1,2}(?=\s*[;:,.!?])/g, "")
    .replace(/\s+[uij](?=[.;:,!?]*$)/, "")
    .replace(/[\u2018\u2019]/g, "")
    .replace(/\s+([:;,.!?»)])/g, "$1")
    .replace(/([«(¿¡])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export type ParrafoVerso = {
  n: number;
  texto: string;
  /** Salmos: el título va como versículo 1 y el cuerpo del versículo en el párrafo siguiente, sin número. */
  cuerpo?: string;
};

const RE_TITULO_SALMO = /^(Para el fin|Salmo|Cántico|Cantico|Himno|Oración|Oracion|Instrucción|Instruccion|Aleluya|Alleluia|Alabanza)\b/;

export function parrafosDeVersiculos(lineas: string[]): ParrafoVerso[] {
  const parrafos: string[] = [];
  let actual: string[] = [];
  const cerrar = () => {
    if (actual.length) parrafos.push(actual.join(" ").replace(/\s+/g, " ").trim());
    actual = [];
  };
  for (const l of lineas) {
    if (l.trim() === "") cerrar();
    else actual.push(l.trim().replace(/^[_'’‘]\s*(?=\d)/, ""));
  }
  cerrar();
  const out: ParrafoVerso[] = [];
  for (let i = 0; i < parrafos.length; i++) {
    const m = RE_VERSO.exec(parrafos[i]);
    if (!m) continue;
    const v: ParrafoVerso = { n: Number(m[1]), texto: m[2] };
    const sig = parrafos[i + 1];
    if (v.n === 1 && RE_TITULO_SALMO.test(m[2]) && sig && !RE_VERSO.test(sig) && !/^\d{1,3}\s/.test(sig) && sig.length < 400) {
      v.cuerpo = sig;
    }
    out.push(v);
  }
  return out;
}

/** Corta la secuencia de versículos en capítulos: uno nuevo cada vez que la numeración deja de crecer. */
export function cortarCapitulos(versos: ParrafoVerso[]): VersiculosCapitulo[] {
  const caps: VersiculosCapitulo[] = [];
  let cur: VersiculosCapitulo | null = null;
  let ult = 0;
  for (const v of versos) {
    if (!cur || v.n <= ult) {
      cur = new Map();
      caps.push(cur);
      ult = 0;
    }
    if (v.n > ult) {
      cur.set(v.n, v.cuerpo ? `${v.texto}${SEP_CUERPO}${v.cuerpo}` : v.texto);
      ult = v.n;
    }
  }
  return caps;
}

const ultimoVerso = (c: VersiculosCapitulo) => Math.max(0, ...c.keys());

const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Raíces (4 letras) de las palabras largas: latín y español comparten muchas (Jerusalem, templ-, Davi-, Hosan-…). */
function raices(texto: string): Set<string> {
  const out = new Set<string>();
  for (const w of sinTildes(texto).replace(/æ/g, "ae").replace(/œ/g, "oe").match(/[a-z]{5,}/g) ?? []) out.add(w.slice(0, 4));
  return out;
}

/** Parecido (0–1) entre un capítulo en español y el mismo capítulo en latín, por raíces compartidas. */
export function afinidad(es: string, la: string): number {
  const a = raices(es);
  const b = raices(la);
  if (a.size === 0 || b.size === 0) return 0;
  let comunes = 0;
  for (const r of a) if (b.has(r)) comunes++;
  return comunes / Math.min(a.size, b.size);
}

/**
 * Asigna cada capítulo detectado al capítulo real del libro: alineación de peso máximo entre el último versículo de
 * cada capítulo detectado y el de la Vulgata (coincidencia exacta = 2, uno menos = 1: el OCR suele perder el último
 * versículo). Cuando varios capítulos tienen la misma cantidad de versículos (Mt 21 y 22, 46 y 46) desempata la
 * afinidad léxica con el texto latino. Sobran segmentos (notas numeradas) y faltan otros; solo se devuelven los alineados.
 */
export function alinearCapitulos(
  detectados: VersiculosCapitulo[],
  esperado: number[],
  latin: string[] = [],
): Map<number, VersiculosCapitulo> {
  const n = detectados.length;
  const m = esperado.length;
  const d = detectados.map(ultimoVerso);
  const textos = detectados.map((c) => [...c.values()].join(" "));
  const peso = (i: number, j: number) => {
    const base = d[i] === esperado[j] ? 2 : d[i] === esperado[j] - 1 && d[i] >= 2 ? 1 : 0;
    return base === 0 ? 0 : base + (latin[j] ? 0.001 * afinidad(textos[i], latin[j]) : 0);
  };
  const tabla: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const w = peso(i, j);
      tabla[i][j] = Math.max(tabla[i + 1][j], tabla[i][j + 1], w > 0 ? w + tabla[i + 1][j + 1] : 0);
    }
  }
  const out = new Map<number, VersiculosCapitulo>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const w = peso(i, j);
    if (w > 0 && Math.abs(tabla[i][j] - (w + tabla[i + 1][j + 1])) < 1e-12) {
      out.set(j + 1, detectados[i]);
      i++;
      j++;
    } else if (tabla[i + 1][j] >= tabla[i][j + 1]) i++;
    else j++;
  }
  return out;
}

export function leerLineas(ruta: string, desde = 0, hasta = Infinity): string[] {
  return readFileSync(ruta, "utf8").split(/\r?\n/).slice(desde, hasta);
}
