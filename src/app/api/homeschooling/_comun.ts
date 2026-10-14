import { z } from "zod";

export const claveFecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");
export const idPositivo = z.number().int().positive();
export const diasSemana = z.array(z.number().int().min(1).max(7)).min(1, "Elegí al menos un día");

export const datosPlan = z.object({
  recursoId: idPositivo,
  alumnoId: idPositivo,
  inicio: claveFecha,
  fin: claveFecha,
  diasSemana,
});

export const dificultad = z.enum(["Trivial", "MuyFacil", "Facil", "Media", "Exigente", "Dificil", "MuyDificil", "Ardua"]);
const textoOpc = z.string().trim().max(500).nullable().optional();

export const datosMateria = z.object({
  nombre: z.string().trim().min(1, "Falta el nombre de la materia").max(100),
  descripcion: textoOpc,
  portadaUrl: textoOpc,
  icono: z.string().trim().max(60).nullable().optional(),
  color: z.string().trim().max(60).nullable().optional(),
  dificultad: dificultad.optional(),
});

export const datosRecurso = z.object({
  materiaId: idPositivo,
  titulo: z.string().trim().min(1, "Falta el título del curso").max(150),
  descripcion: textoOpc,
  portadaUrl: textoOpc,
  tipo: z.enum(["libro", "curso_videos", "pdf", "enlaces", "libre"]),
  unidadTipo: z.enum(["pagina", "capitulo", "leccion", "unidad"]),
  totalUnidades: z.number().int().min(0).max(5000).optional(),
  url: textoOpc,
  libroId: idPositivo.nullable().optional(),
  minutosPorUnidad: z.number().int().min(1).max(600).optional(),
  umbralAprobacion: z.number().int().min(0).max(100).optional(),
  navegacionLibre: z.boolean().optional(),
});

export const datosLeccion = z.object({
  recursoId: idPositivo,
  titulo: z.string().trim().min(1, "Falta el título de la lección").max(150),
  instrucciones: z.string().trim().max(5000).nullable().optional(),
  url: z.string().trim().max(500).nullable().optional(),
});

export const listaIds = z.object({ ids: z.array(idPositivo).min(1) });

/** `params` es una Promise en Next 16 */
export async function idDe(params: Promise<{ id: string }>): Promise<number> {
  const n = Number((await params).id);
  if (!Number.isInteger(n) || n <= 0) throw new Error("Id no válido");
  return n;
}

export const alumnoDe = (req: Request): number | null => {
  const n = Number(new URL(req.url).searchParams.get("alumnoId"));
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const leerJson = (req: Request) => req.json().catch(() => ({}));
