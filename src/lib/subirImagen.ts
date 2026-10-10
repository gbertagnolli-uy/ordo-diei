// Subida de imágenes desde el navegador. Comprime antes de enviar (browser-image-compression):
// Vercel rechaza pedidos de más de 4,5 MB y las fotos del celular suelen pesar más.
import imageCompression from "browser-image-compression";

/** Achica la imagen a 2048 px y ~1,5 MB como máximo; si no puede, devuelve el archivo original */
export async function comprimirImagen(file: File): Promise<File> {
  if (file.type === "image/gif") return file; // mantener la animación
  try {
    return await imageCompression(file, { maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true });
  } catch {
    return file;
  }
}

/** Comprime y sube una imagen; devuelve la respuesta JSON del endpoint o lanza un error con su mensaje */
export async function subirImagen<T = { url: string }>(file: File, endpoint = "/api/upload"): Promise<T> {
  const fd = new FormData();
  fd.append("file", await comprimirImagen(file), file.name);
  const res = await fetch(endpoint, { method: "POST", body: fd });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? "No se pudo subir la imagen");
  return json as T;
}
