// Subida de imágenes y archivos del diario por /api/upload (la misma que usan las fotos de la entrada, lane 272 D4).
import { nombreSeguro, validarAdjunto, type CategoriaAdjunto } from "@/lib/diario/adjuntos";

export const MAX_BYTES_IMAGEN = 4 * 1024 * 1024;

/** Devuelve la URL `/api/archivos/<uuid>` de la imagen subida. Lanza `Error` con un mensaje para el usuario. */
export async function subirImagen(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Solo se pueden subir imágenes");
  const form = new FormData();
  form.append("file", file);
  const r = await fetch("/api/upload", { method: "POST", body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || typeof d.url !== "string") throw new Error(d.error ?? "No se pudo subir la imagen");
  return d.url;
}

export interface AdjuntoSubido {
  url: string;
  bytes: number;
  mime: string;
  categoria: CategoriaAdjunto;
  /** Nombre limpio, tal como queda guardado. */
  nombre: string;
}

/** Lane 294: sube un audio, un video corto o un documento (≤ 4 MB). Se revisa antes de subir, con la misma regla que el servidor. */
export async function subirAdjunto(file: File): Promise<AdjuntoSubido> {
  const nombre = nombreSeguro(file.name);
  const valido = validarAdjunto(nombre, file.type, file.size);
  if (!valido.ok) throw new Error(valido.error);
  const form = new FormData();
  form.append("file", file, nombre);
  form.append("modo", "diario");
  const r = await fetch("/api/upload", { method: "POST", body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || typeof d.url !== "string") throw new Error(d.error ?? "No se pudo subir el archivo");
  return d as AdjuntoSubido;
}
