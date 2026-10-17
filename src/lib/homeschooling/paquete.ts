// Propio de Ordo (lane 170, M3): formato de intercambio de un curso — un archivo JSON con el curso, sus lecciones, preguntas y
// material. Sirve para duplicar, guardar plantillas, pasar un curso a otro hijo/materia y traer planes precargados (p. ej. los
// católicos de dominio público, lane L3). Sin ids ni datos de la familia: solo contenido.
import { z } from "zod";

export const FORMATO_PAQUETE = "ordo-curso";
export const VERSION_PAQUETE = 1;

const texto = (max: number) => z.string().trim().max(max);

const pregunta = z.object({
  enunciado: texto(300).min(1),
  opciones: z.array(texto(200).min(1)).min(2).max(4),
  correcta: z.number().int().min(0).max(3),
  explicacion: texto(500).nullable().optional(),
  segundoVideo: z.number().int().min(0).max(86400).nullable().optional(),
});

const material = z.object({
  titulo: texto(150).min(1),
  tipo: z.enum(["texto", "markdown", "video", "pdf", "documento", "epub", "web", "archivo"]).optional(),
  url: texto(500).nullable().optional(),
  contenido: z.string().max(50000).nullable().optional(),
  limiteImpresiones: z.number().int().min(0).max(10).optional(),
  soloPadres: z.boolean().optional(),
});

const leccion = z.object({
  titulo: texto(150).min(1),
  instrucciones: texto(5000).nullable().optional(),
  url: texto(500).nullable().optional(),
  preguntas: z.array(pregunta).max(20).optional(),
  materiales: z.array(material).max(20).optional(),
});

export const paqueteSchema = z.object({
  formato: z.literal(FORMATO_PAQUETE, { message: "Este archivo no es un curso de Ordo Diei" }),
  version: z.number().int().min(1).max(VERSION_PAQUETE, { message: "Este archivo es de una versión más nueva de la app" }),
  curso: z.object({
    titulo: texto(150).min(1, "El curso no tiene título"),
    descripcion: texto(500).nullable().optional(),
    tipo: z.enum(["libro", "curso_videos", "pdf", "enlaces", "libre"]),
    unidadTipo: z.enum(["pagina", "capitulo", "leccion", "unidad"]),
    totalUnidades: z.number().int().min(0).max(5000).optional(),
    url: texto(500).nullable().optional(),
    minutosPorUnidad: z.number().int().min(1).max(600).optional(),
    umbralAprobacion: z.number().int().min(0).max(100).optional(),
    navegacionLibre: z.boolean().optional(),
  }),
  lecciones: z.array(leccion).max(500),
});

export type PaqueteCurso = z.infer<typeof paqueteSchema>;

/** Valida un archivo subido; devuelve el mensaje del primer problema, en español */
export function leerPaquete(crudo: unknown): { ok: true; paquete: PaqueteCurso } | { ok: false; error: string } {
  const r = paqueteSchema.safeParse(crudo);
  if (r.success) return { ok: true, paquete: r.data };
  const i = r.error.issues[0];
  const donde = i.path.length ? ` (${i.path.join(".")})` : "";
  return { ok: false, error: `${i.message}${donde}` };
}

/** Nombre de archivo seguro a partir del título del curso */
export function nombreArchivoPaquete(titulo: string): string {
  const base = titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return `${base || "curso"}.ordo-curso.json`;
}
