// Subida de imágenes del diario por /api/upload (la misma que usan las fotos de la entrada, lane 272 D4).
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
