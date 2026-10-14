// Tabulae/Kalendaria de DO: 1570 es el calendario base; 1888 y 1906 solo anotan diferencias
// (data.txt: 1906 → 1888 → 1570). Devuelve el Kalendarium de la versión pedida, ya combinado.
import type { VersionLiturgica } from "../../src/lib/liturgia/tipos.ts";

export type EntradaKalendario = {
  fecha: string; // "MM-DD"
  archivo: string; // "Sancti/10-14"
  nombre: string;
  rango: number;
  conmemoracion?: { archivo: string; nombre: string; rango: number };
};

export const CADENA: Record<VersionLiturgica, VersionLiturgica[]> = {
  "1570": ["1570"],
  "1888": ["1570", "1888"],
  "1906": ["1570", "1888", "1906"],
};

export function parsearKalendario(texto: string): EntradaKalendario[] {
  const out: EntradaKalendario[] = [];
  for (const cruda of texto.split(/\r?\n/)) {
    const l = cruda.trim();
    if (!l || l.startsWith("#") || l.startsWith("*")) continue;
    const p = l.split("=");
    const fecha = p[0];
    if (!/^\d\d-\d\d$/.test(fecha)) continue;
    const [principal, comm] = (p[1] ?? "").split("~");
    const archivo = (principal ?? "").trim();
    if (!archivo) continue;
    const e: EntradaKalendario = {
      fecha,
      archivo: `Sancti/${archivo}`,
      nombre: (p[2] ?? "").trim(),
      rango: Number(p[3]) || 0,
    };
    if (comm && p[4]) e.conmemoracion = { archivo: `Sancti/${comm.trim()}`, nombre: p[4].trim(), rango: Number(p[5]) || 0 };
    out.push(e);
  }
  return out;
}

export function combinarKalendarios(
  porVersion: Partial<Record<VersionLiturgica, EntradaKalendario[]>>,
  version: VersionLiturgica,
): EntradaKalendario[] {
  const mapa = new Map<string, EntradaKalendario>();
  for (const v of CADENA[version]) for (const e of porVersion[v] ?? []) mapa.set(e.fecha, e);
  return [...mapa.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
