// Imágenes subidas por los usuarios, guardadas en la base (Vercel no deja escribir en disco).
// Se normalizan con sharp: orientación EXIF, máximo 1600 px de lado (las cartas se recortan a 63:88) y WebP, para que pesen ~100–300 KB.
import crypto from "crypto";
import sharp from "sharp";
import prisma from "./prisma.ts";

export const PREFIJO_ARCHIVOS = "/api/archivos/";
/** Perfiles de optimización: el cliente elige uno por nombre, nunca números arbitrarios */
export const PERFILES_IMAGEN = {
  general: { maxLado: 1600, maxBytes: null as number | null, proporcion: null as number | null },
  // Arte de cartas (D19 / LEEME): retrato 63:88 que se muestra a ≤ 400 px; ≤ 300 KB. Se recorta a esa proporción
  carta: { maxLado: 1200, maxBytes: 300 * 1024, proporcion: 63 / 88 },
} as const;
export type PerfilImagen = keyof typeof PERFILES_IMAGEN;
/** Límite de lo que llega al servidor: el navegador ya comprime antes (Vercel corta en 4,5 MB) */
export const MAX_BYTES_SUBIDA = 4 * 1024 * 1024;
const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"];

export class ImagenInvalidaError extends Error {
  status = 400;
}

/** URL pública de un archivo guardado */
export const urlArchivo = (clave: string) => `${PREFIJO_ARCHIVOS}${clave}`;

/** Clave de una URL /api/archivos/<uuid>, o null si no es una */
export function claveDeUrl(url: string | null | undefined): string | null {
  const m = /^\/api\/archivos\/([0-9a-f-]{36})$/.exec(url?.trim() ?? "");
  return m ? m[1] : null;
}

/** Comprime y guarda una imagen; devuelve su URL */
export async function guardarImagen(
  entrada: File | Buffer,
  opciones: { subidoPorId?: number | null; nombreOrigen?: string | null; perfil?: PerfilImagen } = {}
): Promise<{ url: string; bytes: number; ancho: number; alto: number }> {
  if (entrada instanceof File) {
    if (!TIPOS_ACEPTADOS.includes(entrada.type)) throw new ImagenInvalidaError("Formato no permitido (JPG, PNG, WebP, GIF, AVIF o HEIC)");
    if (entrada.size > MAX_BYTES_SUBIDA) throw new ImagenInvalidaError("La imagen no puede superar 4 MB");
  }
  const original = entrada instanceof File ? Buffer.from(await entrada.arrayBuffer()) : entrada;

  const { maxLado, maxBytes, proporcion } = PERFILES_IMAGEN[opciones.perfil ?? "general"];
  let datos: Buffer;
  let info: { width: number; height: number };
  try {
    // Aplica la orientación EXIF antes de medir, para recortar sobre las dimensiones reales
    const orientada = await sharp(original).rotate().toBuffer({ resolveWithObject: true });
    let tuberia = sharp(orientada.data);
    if (proporcion) {
      // Recorte centrado a la proporción del perfil (el máximo rectángulo que entra); no agranda nada
      const { width: w, height: h } = orientada.info;
      const ancho = Math.min(w, Math.round(h * proporcion));
      const alto = Math.min(h, Math.round(w / proporcion));
      tuberia = tuberia.extract({
        left: Math.floor((w - ancho) / 2),
        top: Math.floor((h - alto) / 2),
        width: ancho,
        height: alto,
      });
    }
    const base = await tuberia
      .resize({ width: maxLado, height: maxLado, fit: "inside", withoutEnlargement: true })
      .toBuffer();
    // Baja la calidad de a poco hasta entrar en el peso máximo del perfil (si tiene)
    for (const calidad of [82, 72, 62, 52, 42]) {
      ({ data: datos, info } = await sharp(base).webp({ quality: calidad }).toBuffer({ resolveWithObject: true }));
      if (!maxBytes || datos.length <= maxBytes) break;
    }
  } catch {
    throw new ImagenInvalidaError("El archivo no es una imagen válida");
  }

  const clave = crypto.randomUUID();
  await prisma.archivo.create({
    data: {
      clave,
      tipo: "image/webp",
      datos: new Uint8Array(datos!),
      bytes: datos!.length,
      ancho: info!.width,
      alto: info!.height,
      nombreOrigen: (opciones.nombreOrigen ?? (entrada instanceof File ? entrada.name : null))?.slice(0, 200) ?? null,
      subidoPorId: opciones.subidoPorId ?? null,
    },
  });
  return { url: urlArchivo(clave), bytes: datos!.length, ancho: info!.width, alto: info!.height };
}

/** Bytes y tipo de un archivo por su URL /api/archivos/<uuid> */
export async function leerArchivo(url: string): Promise<{ datos: Buffer; tipo: string } | null> {
  const clave = claveDeUrl(url);
  if (!clave) return null;
  const a = await prisma.archivo.findUnique({ where: { clave }, select: { datos: true, tipo: true } });
  return a ? { datos: Buffer.from(a.datos), tipo: a.tipo } : null;
}
