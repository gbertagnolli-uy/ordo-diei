// Propio de Ordo (lane 170, M3): carga masiva. El padre pega una lista —un enlace por línea, o «Título | enlace»— y salen N
// lecciones de una vez. Función pura: la usan el servidor (vista previa) y los tests.
import { esEnlace } from "./material.ts";

export const MAX_LECCIONES_POR_LOTE = 100;

export interface LineaLeccion {
  titulo: string;
  url: string | null;
}

const VIÑETA = /^\s*(?:[-*•·]|\d{1,3}[.)])\s+/;
const ENLACE_MD = /^\[([^\]]+)\]\(([^)\s]+)\)\s*$/;
const URL_AL_FINAL = /^(.*\S)\s+((?:https?:\/\/|www\.)\S+)$/i;

/** Una línea puede ser: enlace · título · «título | enlace» · «enlace | título» · [título](enlace) · «título enlace» */
export function parsearLinea(bruta: string): LineaLeccion | null {
  let t = bruta.replace(VIÑETA, "").trim();
  if (!t) return null;

  const md = ENLACE_MD.exec(t);
  if (md) return { titulo: md[1].trim(), url: md[2] };

  const separador = t.includes("|") ? "|" : t.includes("\t") ? "\t" : null;
  if (separador) {
    const [a, ...resto] = t.split(separador).map((x) => x.trim());
    const b = resto.join(` ${separador} `).trim();
    if (esEnlace(a) && !esEnlace(b)) return { titulo: b, url: a };
    if (esEnlace(b)) return { titulo: a, url: b };
    t = [a, b].filter(Boolean).join(" ");
  }

  if (esEnlace(t)) return { titulo: "", url: t };
  const final = URL_AL_FINAL.exec(t);
  if (final && esEnlace(final[2])) return { titulo: final[1].replace(/[-–—:]\s*$/, "").trim(), url: final[2] };
  return { titulo: t, url: null };
}

export function parsearLista(texto: string): LineaLeccion[] {
  const salida: LineaLeccion[] = [];
  for (const linea of (texto ?? "").split(/\r?\n/)) {
    const l = parsearLinea(linea);
    if (l) salida.push(l);
    if (salida.length >= MAX_LECCIONES_POR_LOTE) break;
  }
  return salida;
}
