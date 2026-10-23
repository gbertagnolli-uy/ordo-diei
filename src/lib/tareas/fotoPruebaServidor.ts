import prisma from "../prisma.ts";
import { claveDeUrl } from "../archivos.ts";

/**
 * Borra el `Archivo` de una foto de prueba que ya no referencia ninguna tarea.
 * Se usa al reemplazar una foto o al rechazar la tarea, para no acumular imágenes huérfanas.
 * Si la URL no es interna o todavía está en uso, no hace nada.
 */
export async function limpiarFotoPruebaHuerfana(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;
  const clave = claveDeUrl(url);
  if (!clave) return false;
  if ((await prisma.tarea.count({ where: { fotoPruebaUrl: url } })) > 0) return false;
  const borrados = await prisma.archivo.deleteMany({ where: { clave } });
  return borrados.count > 0;
}
