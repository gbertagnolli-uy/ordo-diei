// Propio de Ordo (lane 170, M3): exportar, importar y duplicar un curso. Todo es contenido: nunca se copian planes, avances,
// impresiones ni ids. Solo padres. La importación valida el archivo antes de tocar la base y crea todo en una transacción.
import prisma from "../../prisma.ts";
import { NoAutorizadoError, NoEncontradoError } from "../../habitos/server.ts";
import { esPadre } from "../../habitos/permisos.ts";
import { detectarMaterial } from "../material.ts";
import { FORMATO_PAQUETE, leerPaquete, VERSION_PAQUETE, type PaqueteCurso } from "../paquete.ts";
import { datosDeVideo, TIPOS_CON_LECCIONES, type Actor } from "./cursos.ts";
import { DatoInvalidoError } from "./planes.ts";

const exigirPadre = (a: Actor) => {
  if (!esPadre(a.rol)) throw new NoAutorizadoError("Solo un padre o una madre pueden hacer esto");
};

export async function exportarCurso(a: Actor, recursoId: number): Promise<PaqueteCurso> {
  exigirPadre(a);
  const r = await prisma.recursoCurso.findUnique({
    where: { id: recursoId },
    include: { lecciones: { orderBy: { orden: "asc" }, include: { preguntas: { orderBy: { orden: "asc" } }, materiales: { orderBy: [{ orden: "asc" }, { id: "asc" }] } } } },
  });
  if (!r) throw new NoEncontradoError("Curso no encontrado");
  return {
    formato: FORMATO_PAQUETE,
    version: VERSION_PAQUETE,
    curso: {
      titulo: r.titulo,
      descripcion: r.descripcion,
      tipo: r.tipo,
      unidadTipo: r.unidadTipo,
      totalUnidades: r.totalUnidades,
      url: r.url,
      minutosPorUnidad: r.minutosPorUnidad,
      umbralAprobacion: r.umbralAprobacion,
      navegacionLibre: r.navegacionLibre,
    },
    lecciones: r.lecciones.map((l) => ({
      titulo: l.titulo,
      instrucciones: l.instrucciones,
      url: l.url,
      preguntas: l.preguntas.map((p) => ({ enunciado: p.enunciado, opciones: p.opciones as string[], correcta: p.correcta, explicacion: p.explicacion, segundoVideo: p.segundoVideo })),
      materiales: l.materiales.map((m) => ({ titulo: m.titulo, tipo: m.tipo, url: m.url, contenido: m.contenido, limiteImpresiones: m.limiteImpresiones })),
    })),
  };
}

/** Crea el curso del paquete dentro de una materia; devuelve el id nuevo */
export async function importarPaquete(a: Actor, materiaId: number, paquete: PaqueteCurso, opciones: { titulo?: string } = {}): Promise<{ id: number; lecciones: number }> {
  exigirPadre(a);
  if (!(await prisma.materia.findUnique({ where: { id: materiaId }, select: { id: true } }))) throw new NoEncontradoError("Materia no encontrada");
  const c = paquete.curso;
  const conLecciones = TIPOS_CON_LECCIONES.includes(c.tipo);
  if (!conLecciones && (c.totalUnidades ?? 0) < 1) throw new DatoInvalidoError("Este curso no dice cuántas unidades tiene");

  return prisma.$transaction(
    async (tx) => {
      const orden = ((await tx.recursoCurso.aggregate({ where: { materiaId }, _max: { orden: true } }))._max.orden ?? -1) + 1;
      const recurso = await tx.recursoCurso.create({
        data: {
          materiaId,
          creadorId: a.id,
          orden,
          titulo: (opciones.titulo ?? c.titulo).slice(0, 150),
          descripcion: c.descripcion ?? null,
          tipo: c.tipo,
          unidadTipo: c.unidadTipo,
          totalUnidades: conLecciones ? paquete.lecciones.length : (c.totalUnidades ?? 1),
          url: c.url ?? null,
          minutosPorUnidad: c.minutosPorUnidad ?? 20,
          umbralAprobacion: c.umbralAprobacion ?? 70,
          navegacionLibre: c.navegacionLibre ?? false,
        },
      });
      if (conLecciones) {
        for (const [i, l] of paquete.lecciones.entries()) {
          const creada = await tx.leccionCurso.create({
            data: { recursoId: recurso.id, orden: i + 1, titulo: l.titulo, instrucciones: l.instrucciones ?? null, creadorId: a.id, ...datosDeVideo(l.url) },
          });
          if (l.preguntas?.length) {
            await tx.preguntaLeccion.createMany({
              data: l.preguntas.map((p, k) => ({ leccionId: creada.id, orden: k + 1, segundoVideo: p.segundoVideo ?? null, enunciado: p.enunciado, opciones: p.opciones, correcta: Math.min(p.correcta, p.opciones.length - 1), explicacion: p.explicacion ?? null })),
            });
          }
          if (l.materiales?.length) {
            await tx.materialEstudio.createMany({
              data: l.materiales.map((m, k) => {
                const det = detectarMaterial(m.contenido ?? m.url ?? "");
                return {
                  leccionId: creada.id,
                  creadorId: a.id,
                  orden: k,
                  titulo: m.titulo,
                  tipo: m.tipo ?? det.tipo,
                  proveedor: det.proveedor,
                  externoId: det.externoId,
                  url: det.url,
                  contenido: det.contenido,
                  miniaturaUrl: det.miniaturaUrl,
                  limiteImpresiones: m.limiteImpresiones ?? 2,
                };
              }),
            });
          }
        }
      }
      return { id: recurso.id, lecciones: conLecciones ? paquete.lecciones.length : 0 };
    },
    { timeout: 60_000 }
  );
}

/** Lo que llega de un archivo subido: texto JSON o ya objeto */
export async function importarCurso(a: Actor, materiaId: number, crudo: unknown) {
  exigirPadre(a);
  const r = leerPaquete(crudo);
  if (!r.ok) throw new DatoInvalidoError(r.error);
  return importarPaquete(a, materiaId, r.paquete);
}

/** Copia un curso (con lecciones, preguntas y material) en la misma materia, o en otra */
export async function duplicarCurso(a: Actor, recursoId: number, materiaDestinoId?: number) {
  exigirPadre(a);
  const origen = await prisma.recursoCurso.findUnique({ where: { id: recursoId }, select: { materiaId: true, titulo: true } });
  if (!origen) throw new NoEncontradoError("Curso no encontrado");
  const paquete = await exportarCurso(a, recursoId);
  return importarPaquete(a, materiaDestinoId ?? origen.materiaId, paquete, { titulo: `Copia de ${origen.titulo}` });
}
