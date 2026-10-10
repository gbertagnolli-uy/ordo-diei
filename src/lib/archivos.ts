// Imágenes subidas por los usuarios, guardadas en la base (Vercel no deja escribir en disco).
// Se normalizan con sharp: orientación EXIF, máximo 1600 px de lado y WebP, para que pesen ~100–300 KB.
import crypto from "crypto";
import sharp from "sharp";
import prisma from "./prisma.ts";

export const PREFIJO_ARCHIVOS = "/api/archivos/";
const MAX_LADO = 1600;
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
  opciones: { subidoPorId?: number | null; nombreOrigen?: string | null } = {}
): Promise<string> {
  if (entrada instanceof File) {
    if (!TIPOS_ACEPTADOS.includes(entrada.type)) throw new ImagenInvalidaError("Formato no permitido (JPG, PNG, WebP, GIF, AVIF o HEIC)");
    if (entrada.size > MAX_BYTES_SUBIDA) throw new ImagenInvalidaError("La imagen no puede superar 4 MB");
  }
  const original = entrada instanceof File ? Buffer.from(await entrada.arrayBuffer()) : entrada;

  let datos: Buffer;
  let info: { width: number; height: number };
  try {
    ({ data: datos, info } = await sharp(original)
      .rotate()
      .resize({ width: MAX_LADO, height: MAX_LADO, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true }));
  } catch {
    throw new ImagenInvalidaError("El archivo no es una imagen válida");
  }

  const clave = crypto.randomUUID();
  await prisma.archivo.create({
    data: {
      clave,
      tipo: "image/webp",
      datos: new Uint8Array(datos),
      bytes: datos.length,
      ancho: info.width,
      alto: info.height,
      nombreOrigen: (opciones.nombreOrigen ?? (entrada instanceof File ? entrada.name : null))?.slice(0, 200) ?? null,
      subidoPorId: opciones.subidoPorId ?? null,
    },
  });
  return urlArchivo(clave);
}

/** Bytes y tipo de un archivo por su URL /api/archivos/<uuid> */
export async function leerArchivo(url: string): Promise<{ datos: Buffer; tipo: string } | null> {
  const clave = claveDeUrl(url);
  if (!clave) return null;
  const a = await prisma.archivo.findUnique({ where: { clave }, select: { datos: true, tipo: true } });
  return a ? { datos: Buffer.from(a.datos), tipo: a.tipo } : null;
}
