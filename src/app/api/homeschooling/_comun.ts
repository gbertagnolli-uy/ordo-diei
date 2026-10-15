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

export const datosPreferencia = z.object({
  alumnoId: idPositivo.optional(),
  modoRelajado: z.boolean().optional(),
  primeroDespues: z.boolean().optional(),
  recompensaDespues: z.string().trim().max(120).nullable().optional(),
});

export const datosHistoria = z.object({
  titulo: z.string().trim().min(1, "Falta el título de la historia").max(100),
  pasos: z.array(z.object({ texto: z.string().max(300), icono: z.string().max(30) })).max(8),
});

// ── Material de estudio (lane 166, M1) ──
const tipoMaterial = z.enum(["texto", "markdown", "video", "pdf", "documento", "epub", "web", "archivo"]);
const destinoMaterial = z.union([
  z.object({ diaLectivoId: idPositivo }),
  z.object({ leccionId: idPositivo }),
  z.object({ alumnoId: idPositivo, fecha: claveFecha }),
]);

export const datosMaterial = z.object({
  destino: destinoMaterial,
  entrada: z.string().trim().min(1, "Pegá un enlace o escribí el texto").max(60000),
  titulo: z.string().trim().max(150).nullable().optional(),
  tipo: tipoMaterial.nullable().optional(),
  limiteImpresiones: z.number().int().min(0).max(10).nullable().optional(),
  soloPadres: z.boolean().optional(),
});

export const cambiosMaterial = z.object({
  titulo: z.string().trim().min(1, "Falta el título").max(150).optional(),
  tipo: tipoMaterial.optional(),
  limiteImpresiones: z.number().int().min(0).max(10).optional(),
  contenido: z.string().max(60000).nullable().optional(),
  orden: z.number().int().min(0).optional(),
  soloPadres: z.boolean().optional(),
});

export const destinoDe = (req: Request) => {
  const q = new URL(req.url).searchParams;
  const n = (k: string) => {
    const v = Number(q.get(k));
    return Number.isInteger(v) && v > 0 ? v : null;
  };
  const dia = n("diaId");
  const leccion = n("leccionId");
  const alumno = n("alumnoId");
  const fecha = q.get("fecha");
  if (dia) return { diaLectivoId: dia };
  if (leccion) return { leccionId: leccion };
  if (alumno && fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { alumnoId: alumno, fecha };
  throw new Error("Falta el día, la lección o el alumno con su fecha");
};

// ── Libreta de calificaciones (lane 172, K1) ──
const tipoNota = z.enum(["tarea", "examen", "proyecto", "lectura", "oral"]);
const puntajeNota = z.number().int().min(0, "La nota va de 0 a 100").max(100, "La nota va de 0 a 100");

export const datosNota = z.object({
  alumnoId: idPositivo,
  materiaId: idPositivo,
  titulo: z.string().trim().min(1, "Falta el título").max(150),
  tipo: tipoNota.optional(),
  puntaje: puntajeNota,
  comentario: z.string().trim().max(1000).nullable().optional(),
  fecha: claveFecha,
});

export const cambiosNota = z.object({
  titulo: z.string().trim().min(1, "Falta el título").max(150).optional(),
  tipo: tipoNota.optional(),
  puntaje: puntajeNota.optional(),
  comentario: z.string().trim().max(1000).nullable().optional(),
  fecha: claveFecha.optional(),
});

export const notaDeDia = z.object({ puntaje: puntajeNota, comentario: z.string().trim().max(1000).nullable().optional() });

// ── Comentarios, reacciones y avisos de la familia (lane 174, Q1/Q3) ──
export const destinoComentario = z.union([z.object({ leccionId: idPositivo }), z.object({ materialId: idPositivo }), z.object({ evidenciaId: idPositivo }), z.object({ publicacionId: idPositivo })]);

export const destinoComentarioDe = (req: Request) => {
  const q = new URL(req.url).searchParams;
  for (const k of ["leccionId", "materialId", "evidenciaId", "publicacionId"] as const) {
    const v = Number(q.get(k));
    if (Number.isInteger(v) && v > 0) return { [k]: v } as { leccionId: number } | { materialId: number } | { evidenciaId: number } | { publicacionId: number };
  }
  throw new Error("Falta la lección, el material o la evidencia");
};

export const datosComentario = z.object({ destino: destinoComentario, texto: z.string().max(5000) });
export const datosReaccion = z.object({ objetivo: z.union([z.object({ comentarioId: idPositivo }), z.object({ evidenciaId: idPositivo }), z.object({ publicacionId: idPositivo })]), emoji: z.string().max(10) });
export const datosLeidos = z.object({ ids: z.array(idPositivo).max(200).optional() });

// ── Lectura real (lane 175, L1) ──
const estadoLectura = z.enum(["por_leer", "leyendo", "leido"]);
const paginas = z.number().int().min(1, "Las páginas van de 1 a 5000").max(5000, "Las páginas van de 1 a 5000");
const estrellasLibro = z.number().int().min(1, "La valoración va de 1 a 5").max(5, "La valoración va de 1 a 5");

export const datosLibro = z.object({
  alumnoId: idPositivo,
  titulo: z.string().trim().min(1, "Falta el título del libro").max(150),
  autor: z.string().trim().max(100).nullable().optional(),
  paginasTotal: paginas.nullable().optional(),
  portadaUrl: z.string().trim().max(500).nullable().optional(),
  estado: estadoLectura.optional(),
});

export const cambiosLibro = z.object({
  titulo: z.string().trim().min(1, "Falta el título del libro").max(150).optional(),
  autor: z.string().trim().max(100).nullable().optional(),
  paginasTotal: paginas.nullable().optional(),
  portadaUrl: z.string().trim().max(500).nullable().optional(),
  estado: estadoLectura.optional(),
  narracion: z.string().max(3000).nullable().optional(),
  estrellas: estrellasLibro.nullable().optional(),
});

export const datosSesionLectura = z.object({
  hastaPagina: z.number().int().min(0).max(5000),
  minutos: z.number().int().min(0).max(600).nullable().optional(),
  fecha: claveFecha.optional(),
});

export const datosCierreLibro = z.object({ estrellas: estrellasLibro.nullable().optional(), narracion: z.string().max(3000).nullable().optional(), fecha: claveFecha.optional() });

// ── Memoria (lane 176, L2) ──
export const datosCatalogoMemoria = z.object({ alumnoIds: z.array(idPositivo).min(1, "Elegí al menos un hijo").max(10), claves: z.array(z.string().max(60)).min(1, "Elegí al menos una oración").max(40) });
export const datosMemoriaPropia = z.object({ alumnoId: idPositivo, titulo: z.string().trim().min(1, "Falta el título").max(150), texto: z.string().max(5000) });
export const datosRecitado = z.object({ nivel: z.enum(["otra_vez", "dificil", "bien", "facil"]) });

// ── Boletín (lane 182, K2) ──
export const datosPeriodo = z.object({ nombre: z.string().trim().min(1, "Falta el nombre del período").max(80), inicio: claveFecha, fin: claveFecha });
export const datosTrimestres = z.object({ anio: z.number().int().min(2000).max(2100) });
export const datosComentarioBoletin = z.object({ comentario: z.string().max(2000).nullable() });

// ── Muro de la familia (lane 184, Q2) ──
export const datosAviso = z.object({ titulo: z.string().max(500), cuerpo: z.string().max(5000).nullable().optional(), fijada: z.boolean().optional() });
export const datosFijar = z.object({ fijada: z.boolean() });

// ── Mensajes de la familia (lane 191, G7) ──
export const datosMensaje = z.object({ paraId: idPositivo, texto: z.string().max(5000) });

// ── Cargar la semana (lane 192) ──
export const datosCargaSemana = z.object({
  alumnoId: idPositivo,
  dias: z.array(z.object({ fecha: claveFecha, lineas: z.array(z.string().max(2000)).max(20) })).min(1).max(7),
});

// ── Configurar el año (lane 197) ──
export const datosAnio = z.object({
  alumnoIds: z.array(idPositivo).min(1, "Elegí al menos un hijo").max(10),
  vacaciones: z.array(z.object({ motivo: z.string().trim().min(1, "Falta el nombre de las vacaciones").max(80), desde: claveFecha, hasta: claveFecha })).max(10),
  fiestas: z.array(z.object({ fecha: claveFecha, motivo: z.string().trim().max(80) })).max(60),
});
