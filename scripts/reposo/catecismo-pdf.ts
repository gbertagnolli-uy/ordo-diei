// Catecismo Mayor de San Pío X a partir del PDF con texto extraíble («Spanish Catechism of St. Pius X», Salve Maria Regina).
// Entrada: la salida de `pdftotext -layout` (poppler). El PDF trae las 994 preguntas de la edición castellana (sin la 338);
// reemplaza al OCR de 1973 (`catecismo.ts` + `catecismo-ocr.ts`), que quedó en 707 preguntas con errores de lectura.
import { parsearCatecismo, type PreguntaCatecismo } from "./catecismo.ts";

/** Deja el texto del PDF listo para `parsearCatecismo`: sin portada, sin índice, sin números de página ni guiones de fin de línea. */
export function prepararTextoPdf(texto: string): string {
  const todas = texto.replace(/\f/g, "\n").split(/\r?\n/);
  const inicio = todas.findIndex((l) => /^\s*LECCIÓN PRELIMINAR\s*$/.test(l));
  if (inicio < 0) throw new Error("No se encontró «LECCIÓN PRELIMINAR»");
  const fin = todas.findIndex((l, i) => i > inicio && /^\s*[IÍ]NDICE\s*$/.test(l));
  const cuerpo = todas.slice(inicio, fin < 0 ? undefined : fin);

  const limpias = cuerpo
    .map((l) => l.trim())
    .filter((l) => l !== "")
    .filter((l) => !/^\d{1,3}$/.test(l)) // número de página
    .filter((l) => !/^\d{1,2}\s*\.?\s*[°º]\s*-\s*\S/.test(l)); // subtítulo «5 °- Del propósito»

  // «doc-\ntrina» → «doctrina» (solo si el guion pega con una letra y sigue minúscula)
  const out: string[] = [];
  for (const l of limpias) {
    const previa = out[out.length - 1];
    if (previa && /[a-záéíóúñü]-$/.test(previa) && /^[a-záéíóúñü]/.test(l)) out[out.length - 1] = previa.slice(0, -1) + l;
    else if (previa && /[a-záéíóúñü]-$/.test(previa) && /^[A-ZÁÉÍÓÚÑ]/.test(l)) out[out.length - 1] = previa + l; // «no-\nCatólicos»: guion de verdad
    else out.push(l);
  }
  return out.join("\n");
}

// El PDF es limpio; lo único sistemático son interrogativos sin tilde al abrir la pregunta («¿Que quiere decir…?»).
const INTERROGATIVOS: [RegExp, string][] = [
  [/^¿Que\b/, "¿Qué"],
  [/^¿Quien\b/, "¿Quién"],
  [/^¿Como\b/, "¿Cómo"],
  [/^¿Cuantas\b/, "¿Cuántas"],
];

export function acentuarInterrogativo(pregunta: string): string {
  return INTERROGATIVOS.reduce((t, [re, por]) => t.replace(re, por), pregunta);
}

export function armarCatecismoPdf(textoPdf: string): PreguntaCatecismo[] {
  return parsearCatecismo(prepararTextoPdf(textoPdf)).map((p) => ({ ...p, pregunta: acentuarInterrogativo(p.pregunta) }));
}
