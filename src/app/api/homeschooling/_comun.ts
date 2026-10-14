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

export const estadoEvidencia = z.enum(["pendiente", "aprobada", "ajustar"]);

export const datosEvidencia = z.object({
  alumnoId: idPositivo.optional(),
  titulo: z.string().trim().max(150).nullable().optional(),
  nota: z.string().trim().max(1000).nullable().optional(),
  diaLectivoId: idPositivo.nullable().optional(),
  imagenes: z.array(z.string().trim().max(200)).min(1, "Falta la foto").max(6),
});

export const accionEvidencia = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("aprobar"), estrellas: z.number().int().min(1).max(5).nullable().optional() }),
  z.object({ accion: z.literal("ajustar"), comentario: z.string().trim().min(1, "Escribí qué hay que ajustar").max(500) }),
  z.object({ accion: z.literal("destacar") }),
  z.object({ accion: z.literal("quitar_destacada") }),
  z.object({ accion: z.literal("reenviar"), titulo: z.string().trim().max(150).nullable().optional(), nota: z.string().trim().max(1000).nullable().optional() }),
]);

export const respuestaElegida = z.number().int().min(0).max(3);

export const preguntasEditables = z.object({
  preguntas: z
    .array(
      z.object({
        enunciado: z.string().trim().min(1, "Falta el enunciado").max(300),
        opciones: z.array(z.string().trim().min(1).max(200)).min(2).max(4),
        correcta: z.number().int().min(0).max(3),
        explicacion: z.string().trim().max(500).nullable().optional(),
        segundoVideo: z.number().int().min(0).max(86400).nullable().optional(),
      })
    )
    .max(20),
});

export const datosActividad = z
  .object({
    materiaId: idPositivo,
    titulo: z.string().trim().min(1, "Falta el título de la actividad").max(150),
    descripcion: z.string().trim().max(1000).nullable().optional(),
    inicio: z.coerce.date(),
    fin: z.coerce.date(),
    lugar: z.string().trim().max(150).nullable().optional(),
    alumnoIds: z.array(idPositivo).min(1, "Elegí al menos un alumno"),
  })
  .refine((d) => d.fin > d.inicio, { message: "El fin tiene que ser posterior al inicio", path: ["fin"] });
