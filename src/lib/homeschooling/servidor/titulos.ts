// Propio de Ordo (lane 166, M1): mejora el título de un material consultando su página (oEmbed de YouTube/Vimeo, <title> de
// Google Docs/Drive y de páginas públicas). Sin clave de API. Solo https y hosts públicos; con tope de tiempo y de tamaño.
// Si algo falla devuelve null y el formulario deja el título que ya tenía: nunca bloquea la carga.
import type { MaterialDetectado } from "../material.ts";

type Fetcher = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> }>;

const ESPERA_MS = 3500;
const MAX_CARACTERES = 200_000;

const ENTIDADES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };

/** Texto del <title> de un HTML, sin entidades ni sufijos de Google ("… - Google Docs") */
export function extraerTitulo(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html.slice(0, MAX_CARACTERES));
  if (!m) return null;
  let t = m[1].replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (e) => ENTIDADES[e] ?? e).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, " ").trim();
  t = t.replace(/\s+[-–—]\s+(Documentos|Presentaciones|Hojas) de cálculo de Google$|\s+[-–—]\s+Google (Docs|Slides|Sheets|Drive|Documentos|Presentaciones|Hojas de cálculo)$/i, "").trim();
  if (!t || /^(sign in|iniciar sesión|acceder|google drive|google docs|error|404|not found)\b/i.test(t)) return null;
  return t.length > 150 ? `${t.slice(0, 147)}…` : t;
}

/** Host público por nombre: rechaza IP, localhost y nombres sin punto (red interna) */
export function hostPublico(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":") || h.startsWith("[")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function obtenerTitulo(det: MaterialDetectado, buscar: Fetcher = fetch as unknown as Fetcher): Promise<string | null> {
  if (!det.url || !hostPublico(det.url)) return null;
  const opciones = () => ({ signal: AbortSignal.timeout(ESPERA_MS), headers: { "User-Agent": "Mozilla/5.0 (compatible; OrdoDiei/1.0)", "Accept-Language": "es,en;q=0.8" } });
  try {
    if (det.proveedor === "youtube" || det.proveedor === "vimeo") {
      const base = det.proveedor === "youtube" ? "https://www.youtube.com/oembed?format=json&url=" : "https://vimeo.com/api/oembed.json?url=";
      const r = await buscar(base + encodeURIComponent(det.url), opciones());
      if (!r.ok) return null;
      const j = (await r.json()) as { title?: unknown };
      return typeof j.title === "string" && j.title.trim() ? j.title.trim().slice(0, 150) : null;
    }
    // Un enlace directo a un archivo (pdf, epub, mp4…) no tiene <title>; el nombre del archivo ya está en el título sugerido
    if (det.tipo === "pdf" || det.tipo === "epub" || det.tipo === "markdown" || (det.tipo === "video" && det.proveedor === "web")) return null;
    const r = await buscar(det.url, opciones());
    if (!r.ok) return null;
    return extraerTitulo(await r.text());
  } catch {
    return null;
  }
}
