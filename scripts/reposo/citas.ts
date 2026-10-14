// Referencias bíblicas: «Ps 22,1-2» ↔ { libro, capitulo, desde, hasta } y su forma legible («Salmo 22, 1-2»).
import { NOMBRE_LIBRO } from "./libros.ts";

export type Referencia = { libro: string; capitulo: number; desde: number; hasta: number };

export function parsearReferencia(s: string): Referencia | null {
  const m = /^(\S+)\s+(\d+),(\d+)(?:-(\d+))?$/.exec(s.trim());
  if (!m) return null;
  const desde = Number(m[3]);
  const hasta = Number(m[4] ?? m[3]);
  if (hasta < desde) return null;
  return { libro: m[1], capitulo: Number(m[2]), desde, hasta };
}

export function idDeReferencia(r: Referencia): string {
  return `${r.libro}-${r.capitulo}-${r.desde}${r.hasta !== r.desde ? `-${r.hasta}` : ""}`;
}

/** «Salmo 22, 1-2», «San Juan 14, 6» (nombre en español y numeración de la Vulgata). */
export function referenciaLegible(r: Referencia): string {
  const nombre = NOMBRE_LIBRO.get(r.libro) ?? r.libro;
  return `${nombre} ${r.capitulo}, ${r.desde}${r.hasta !== r.desde ? `-${r.hasta}` : ""}`;
}

/** Lee un archivo «Libro cap,vers[-vers]» (una por línea; «#» comenta). */
export function parsearSeleccion(texto: string): Referencia[] {
  const out: Referencia[] = [];
  const vistas = new Set<string>();
  for (const l of texto.split(/\r?\n/)) {
    const t = l.replace(/#.*$/, "").trim();
    if (!t) continue;
    const r = parsearReferencia(t);
    if (!r) throw new Error(`Referencia inválida: «${t}»`);
    const id = idDeReferencia(r);
    if (vistas.has(id)) continue;
    vistas.add(id);
    out.push(r);
  }
  return out;
}
