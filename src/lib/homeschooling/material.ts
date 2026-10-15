// Propio de Ordo (lane 166, M1): detecta qué es lo que el padre pegó — un enlace de YouTube, Vimeo, Google Drive/Docs/Slides/Hojas,
// un PDF, un ePub, una página web o simplemente texto/markdown — y calcula cómo se muestra, se abre y se imprime.
// Función pura (sin red ni base): la usan el servidor, el formulario y los tests. El material vive fuera de la base (Drive,
// YouTube, enlaces); solo el texto y el markdown se guardan en ella. Ver vault/nuevas-features/homeschooling/BLOQUEOS.md (B-1…B-5).

import { parsearEnlaceVideo, urlEmbed, esArchivoVideo, type PlataformaVideo } from "./video.ts";

export const TIPOS_MATERIAL = ["texto", "markdown", "video", "pdf", "documento", "epub", "web", "archivo"] as const;
export type TipoMaterial = (typeof TIPOS_MATERIAL)[number];

export const PROVEEDORES_MATERIAL = ["youtube", "vimeo", "drive", "gdocs", "gslides", "gsheets", "web"] as const;
export type ProveedorMaterial = (typeof PROVEEDORES_MATERIAL)[number];

export const ETIQUETA_TIPO: Record<TipoMaterial, string> = {
  texto: "Texto",
  markdown: "Texto con formato",
  video: "Video",
  pdf: "PDF",
  documento: "Documento",
  epub: "Libro ePub",
  web: "Página web",
  archivo: "Archivo de Drive",
};

export interface MaterialDetectado {
  tipo: TipoMaterial;
  proveedor: ProveedorMaterial | null;
  /** Id del video / documento en su proveedor */
  externoId: string | null;
  /** Enlace limpio que se guarda (null en texto y markdown) */
  url: string | null;
  /** Texto o markdown pegado (null si fue un enlace) */
  contenido: string | null;
  miniaturaUrl: string | null;
  /** Título sugerido (sale de la URL o de la primera línea; el servidor lo mejora con la página si puede) */
  titulo: string;
}

export interface VistaMaterial {
  /** Dirección para incrustar en un iframe o reproductor (null si no se puede incrustar) */
  embedUrl: string | null;
  /** Dirección para abrir en una pestaña */
  abrirUrl: string | null;
  /** Dirección que ya es un PDF imprimible (null si no hay forma segura de imprimirla sin salir de la app) */
  imprimirUrl: string | null;
  /** El navegador reproduce el archivo de video sin iframe */
  videoDirecto: boolean;
  plataformaVideo: PlataformaVideo | null;
}

const REGEX_URL = /^(https?:\/\/|www\.)\S+$/i;

/** ¿Lo pegado es un solo enlace (y nada más)? */
export function esEnlace(entrada: string): boolean {
  const t = (entrada ?? "").trim();
  return !!t && !/\s/.test(t) && (REGEX_URL.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*$/i.test(t));
}

const MARCAS_MARKDOWN = [/^#{1,6}\s+\S/m, /\*\*[^*\n]+\*\*/, /^\s*[-*+]\s+\S/m, /^\s*\d+\.\s+\S/m, /\[[^\]\n]+\]\([^)\n]+\)/, /^```/m, /^>\s+\S/m, /^\|.+\|$/m];

/** ¿Parece markdown? (basta con una marca clara) */
export function pareceMarkdown(texto: string): boolean {
  return MARCAS_MARKDOWN.some((r) => r.test(texto));
}

function aUrl(entrada: string): URL | null {
  const t = entrada.trim();
  try {
    return new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
  } catch {
    return null;
  }
}

const nombreDeRuta = (u: URL): string => {
  const ultimo = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() ?? "");
  const sinExt = ultimo.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_+]+/g, " ").trim();
  return sinExt ? sinExt.charAt(0).toUpperCase() + sinExt.slice(1) : u.hostname.replace(/^www\./, "");
};

const ID_DRIVE = /^[A-Za-z0-9_-]{10,}$/;

/** Lo que se ve en una pestaña de Google: documento, presentación u hoja con su id */
function googleDocs(u: URL): { proveedor: "gdocs" | "gslides" | "gsheets"; id: string } | null {
  if (u.hostname !== "docs.google.com") return null;
  const m = /^\/(document|presentation|spreadsheets)\/d\/([A-Za-z0-9_-]+)/.exec(u.pathname);
  if (!m || !ID_DRIVE.test(m[2])) return null;
  return { proveedor: m[1] === "document" ? "gdocs" : m[1] === "presentation" ? "gslides" : "gsheets", id: m[2] };
}

function archivoDrive(u: URL): string | null {
  if (u.hostname !== "drive.google.com") return null;
  const m = /^\/file\/d\/([A-Za-z0-9_-]+)/.exec(u.pathname);
  const id = m?.[1] ?? (u.pathname === "/open" || u.pathname === "/uc" ? u.searchParams.get("id") : null);
  return id && ID_DRIVE.test(id) ? id : null;
}

/** Detecta qué es lo que pegó el padre. Nunca falla: lo que no reconoce es «texto» o «web». */
export function detectarMaterial(entrada: string): MaterialDetectado {
  const bruto = (entrada ?? "").trim();
  if (!bruto) return { tipo: "texto", proveedor: null, externoId: null, url: null, contenido: "", miniaturaUrl: null, titulo: "" };

  if (!esEnlace(bruto)) {
    const primera = bruto.split("\n").find((l) => l.trim())?.replace(/^#{1,6}\s+/, "").replace(/[*_`>]/g, "").trim() ?? "";
    return {
      tipo: pareceMarkdown(bruto) ? "markdown" : "texto",
      proveedor: null,
      externoId: null,
      url: null,
      contenido: bruto,
      miniaturaUrl: null,
      titulo: primera.length > 80 ? `${primera.slice(0, 77)}…` : primera,
    };
  }

  const u = aUrl(bruto);
  if (!u) return { tipo: "texto", proveedor: null, externoId: null, url: null, contenido: bruto, miniaturaUrl: null, titulo: bruto.slice(0, 80) };
  const url = u.toString();

  const video = parsearEnlaceVideo(bruto);
  if (video) {
    return { tipo: "video", proveedor: video.plataforma, externoId: video.videoId, url, contenido: null, miniaturaUrl: video.miniaturaUrl, titulo: "" };
  }

  const g = googleDocs(u);
  if (g) {
    return { tipo: "documento", proveedor: g.proveedor, externoId: g.id, url, contenido: null, miniaturaUrl: null, titulo: "" };
  }

  const drive = archivoDrive(u);
  if (drive) {
    // Un archivo de Drive puede ser PDF, ePub, imagen… no se sabe sin pedirlo: «archivo» (el padre lo puede cambiar a PDF)
    return { tipo: "archivo", proveedor: "drive", externoId: drive, url, contenido: null, miniaturaUrl: null, titulo: "" };
  }

  const ruta = u.pathname.toLowerCase();
  if (esArchivoVideo(url)) return { tipo: "video", proveedor: "web", externoId: null, url, contenido: null, miniaturaUrl: null, titulo: nombreDeRuta(u) };
  if (ruta.endsWith(".pdf")) return { tipo: "pdf", proveedor: "web", externoId: null, url, contenido: null, miniaturaUrl: null, titulo: nombreDeRuta(u) };
  if (ruta.endsWith(".epub")) return { tipo: "epub", proveedor: "web", externoId: null, url, contenido: null, miniaturaUrl: null, titulo: nombreDeRuta(u) };
  if (/\.(docx?|odt|pptx?|xlsx?)$/.test(ruta)) return { tipo: "documento", proveedor: "web", externoId: null, url, contenido: null, miniaturaUrl: null, titulo: nombreDeRuta(u) };
  if (ruta.endsWith(".md") || ruta.endsWith(".markdown")) return { tipo: "markdown", proveedor: "web", externoId: null, url, contenido: null, miniaturaUrl: null, titulo: nombreDeRuta(u) };

  return { tipo: "web", proveedor: "web", externoId: null, url, contenido: null, miniaturaUrl: null, titulo: nombreDeRuta(u) };
}

/** Datos mínimos de un material guardado para calcular su vista */
export type MaterialBase = {
  tipo: TipoMaterial;
  proveedor: ProveedorMaterial | null;
  externoId: string | null;
  url: string | null;
};

/** Cómo se muestra, se abre y se imprime un material ya guardado. */
export function vistaMaterial(m: MaterialBase): VistaMaterial {
  const vacia: VistaMaterial = { embedUrl: null, abrirUrl: m.url, imprimirUrl: null, videoDirecto: false, plataformaVideo: null };

  if (m.tipo === "video") {
    if ((m.proveedor === "youtube" || m.proveedor === "vimeo") && m.externoId) {
      return { ...vacia, embedUrl: urlEmbed(m.proveedor, m.externoId), plataformaVideo: m.proveedor };
    }
    return { ...vacia, embedUrl: m.url, videoDirecto: true };
  }

  const id = m.externoId;
  if (m.proveedor === "gdocs" && id) {
    return { ...vacia, embedUrl: `https://docs.google.com/document/d/${id}/preview`, imprimirUrl: `https://docs.google.com/document/d/${id}/export?format=pdf` };
  }
  if (m.proveedor === "gslides" && id) {
    return { ...vacia, embedUrl: `https://docs.google.com/presentation/d/${id}/embed`, imprimirUrl: `https://docs.google.com/presentation/d/${id}/export/pdf` };
  }
  if (m.proveedor === "gsheets" && id) {
    return { ...vacia, embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`, imprimirUrl: `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf` };
  }
  if (m.proveedor === "drive" && id) {
    // Un PDF de Drive se imprime desde su propio visor; el «preview» es el que admite iframe
    return { ...vacia, embedUrl: `https://drive.google.com/file/d/${id}/preview`, imprimirUrl: m.tipo === "pdf" ? `https://drive.google.com/file/d/${id}/view` : null };
  }
  if (m.tipo === "pdf" && m.url) return { ...vacia, embedUrl: m.url, imprimirUrl: m.url };
  return vacia;
}

/** ¿Se puede imprimir desde la app? Texto y markdown siempre (hoja propia); el resto, si tiene una dirección imprimible. */
export function esImprimible(m: MaterialBase): boolean {
  return m.tipo === "texto" || m.tipo === "markdown" || vistaMaterial(m).imprimirUrl !== null;
}

/** Impresiones que le quedan a un alumno de un material: el límite del padre, más las que le dio de más, menos las usadas. */
export function impresionesRestantes(limite: number, usadas: number, extras: number): number {
  return Math.max(0, limite + extras - usadas);
}

/** Cuánto vale una hoja impresa antes de caducar su enlace (minutos): alcanza para volver a mandarla si la impresora falla */
export const MINUTOS_HOJA_IMPRESA = 15;

/** Veces que un alumno puede imprimir la hoja de un día (más las que le dé un padre) */
export const IMPRESIONES_HOJA_DIA = 2;
