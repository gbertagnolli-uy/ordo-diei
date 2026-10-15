// Propio de Ordo (lane 189, M2b): cómo se baja un archivo externo (PDF o ePub) para mostrarlo dentro de la app. Puro: arma la
// dirección de descarga de un material y decide qué respuestas del origen se aceptan. El servidor (ruta del material) hace la
// descarga; acá no hay red. Importa SEGURIDAD: la dirección sale siempre de un material guardado, nunca de lo que mande el cliente.
import type { MaterialBase } from "./material.ts";

export const MAX_BYTES_ARCHIVO = 30 * 1024 * 1024;
export const TIPOS_ACEPTADOS = ["application/pdf", "application/epub+zip", "application/octet-stream", "binary/octet-stream", "application/x-pdf", "application/x-epub+zip"];

/** Dirección para bajar el archivo de un material PDF o ePub; null si no se puede (otro tipo o sin enlace) */
export function urlDeDescarga(m: MaterialBase): string | null {
  if (m.tipo !== "pdf" && m.tipo !== "epub") return null;
  if (m.proveedor === "drive" && m.externoId) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(m.externoId)}`;
  if (m.url && /^https:\/\//i.test(m.url)) return m.url;
  return null;
}

/** ¿Una IPv4/IPv6 es de la red interna, loopback o link-local? (no se descarga de ahí) */
export function esIpPrivada(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (v.includes(":")) {
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true; // fe80::/10
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // fc00::/7
    const mapeada = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    return mapeada ? esIpPrivada(mapeada[1]) : false;
  }
  const p = v.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true; // no es una IP válida: no se confía
  const [a, b] = p;
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

/** ¿La respuesta del origen sirve? (tipo aceptado y tamaño dentro del tope) */
export function respuestaAceptable(tipo: string | null, bytes: number | null): { ok: true } | { ok: false; motivo: string } {
  const t = (tipo ?? "").split(";")[0].trim().toLowerCase();
  if (!TIPOS_ACEPTADOS.includes(t)) return { ok: false, motivo: t.startsWith("text/html") ? "El enlace abre una página, no un archivo. Compartí el archivo con «cualquiera con el enlace» y usá el enlace directo." : "Ese archivo no es un PDF ni un ePub" };
  if (bytes !== null && bytes > MAX_BYTES_ARCHIVO) return { ok: false, motivo: `El archivo es demasiado grande (máximo ${MAX_BYTES_ARCHIVO / 1024 / 1024} MB)` };
  return { ok: true };
}

/** Tipo de contenido con el que se entrega al navegador, según lo que el padre dijo que es */
export const contentTypeDe = (m: Pick<MaterialBase, "tipo">) => (m.tipo === "epub" ? "application/epub+zip" : "application/pdf");
