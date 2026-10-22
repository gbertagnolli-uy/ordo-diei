// Subida de imágenes desde el navegador. Comprime antes de enviar (browser-image-compression):
// Vercel rechaza pedidos de más de 4,5 MB y las fotos del celular suelen pesar más.
import imageCompression from "browser-image-compression";

/** Perfil de optimización que aplica el servidor (lib/archivos.ts): "carta" = 1200 px y ≤ 300 KB */
export type PerfilImagen = "general" | "carta";

const COMPRESION: Record<PerfilImagen, { maxSizeMB: number; maxWidthOrHeight: number }> = {
  general: { maxSizeMB: 1.5, maxWidthOrHeight: 2048 },
  carta: { maxSizeMB: 0.6, maxWidthOrHeight: 1200 },
};

/** Achica la imagen antes de enviarla; si no puede, devuelve el archivo original */
export async function comprimirImagen(file: File, perfil: PerfilImagen = "general"): Promise<File> {
  if (file.type === "image/gif") return file; // mantener la animación
  try {
    return await imageCompression(file, { ...COMPRESION[perfil], useWebWorker: true });
  } catch {
    return file;
  }
}

export type ImagenSubida = { url: string; bytes: number; ancho: number; alto: number };
export type ArchivoEstudioSubido = {
  url: string;
  bytes: number;
  ancho: number | null;
  alto: number | null;
  categoria: "imagen" | "pdf" | "epub" | "documento";
  nombre: string;
};

/** Comprime y sube una imagen; devuelve la respuesta JSON del endpoint o lanza un error con su mensaje */
export async function subirImagen<T = ImagenSubida>(
  file: File,
  endpoint = "/api/upload",
  perfil: PerfilImagen = "general"
): Promise<T> {
  const fd = new FormData();
  fd.append("file", await comprimirImagen(file, perfil), file.name);
  fd.append("perfil", perfil);
  const res = await fetch(endpoint, { method: "POST", body: fd });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? "No se pudo subir la imagen");
  return json as T;
}

/** Sube una imagen o un documento de estudio (PDF, ePub, Word, etc.) al servidor */
export async function subirArchivoEstudio(file: File): Promise<ArchivoEstudioSubido> {
  const fd = new FormData();
  const procesado = file.type.startsWith("image/") ? await comprimirImagen(file, "general") : file;
  fd.append("file", procesado, file.name);
  fd.append("modo", "estudio");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? "No se pudo subir el archivo");
  return json as ArchivoEstudioSubido;
}

/** Sube la foto de prueba de una tarea: la comprime, la guarda en la app y la asocia a la tarea */
export async function subirFotoPruebaTarea(tareaId: number, file: File): Promise<ImagenSubida> {
  const fd = new FormData();
  fd.append("file", await comprimirImagen(file, "general"), file.name);
  const res = await fetch(`/api/tasks/${tareaId}/foto-prueba`, { method: "POST", body: fd });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? "No se pudo subir la foto de prueba");
  return json as ImagenSubida;
}
