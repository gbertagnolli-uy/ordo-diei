export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import prisma from "@/lib/prisma";
import HojaQuizImprimible from "@/components/homeschooling/quiz/HojaQuizImprimible";

// Página imprimible A4 de Quiz / Evaluación (Assessment) o Clase completa (?modo=alumno|clave|clase)
export default async function ImprimirQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const actor = { id: Number(session.user.id), rol: String(session.user.rolFamiliar ?? "") };
  const padre = esPadre(actor.rol);

  const leccion = await prisma.leccionCurso.findUnique({
    where: { id },
    include: {
      recurso: {
        include: {
          materia: { select: { id: true, nombre: true } },
        },
      },
      preguntas: { orderBy: { orden: "asc" } },
      materiales: {
        where: padre ? {} : { soloPadres: false },
        orderBy: [{ orden: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!leccion) notFound();

  if (!padre) {
    const tienePlan = await prisma.planCurso.findFirst({
      where: { alumnoId: actor.id, recursoId: leccion.recursoId },
      select: { id: true },
    });
    if (!tienePlan) notFound();
  }

  const qModo = (await searchParams).modo;
  const modoInicial = qModo === "clave" && padre ? "clave" : qModo === "clase" ? "clase" : "alumno";

  // Solo mostramos la imagen de la lección si fue subida o elegida explícitamente (no la miniatura automática de YouTube)
  const esMiniaturaYoutube = leccion.miniaturaUrl?.includes("ytimg.com") ?? false;
  const imagenUrl = esMiniaturaYoutube ? null : leccion.miniaturaUrl;

  return (
    <HojaQuizImprimible
      datos={{
        leccionId: leccion.id,
        orden: leccion.orden,
        titulo: leccion.titulo,
        instrucciones: leccion.instrucciones,
        imagenUrl,
        cursoId: leccion.recurso.id,
        cursoTitulo: leccion.recurso.titulo,
        umbralAprobacion: leccion.recurso.umbralAprobacion,
        materiaId: leccion.recurso.materia.id,
        materiaNombre: leccion.recurso.materia.nombre,
        esPadre: padre,
        modoInicial,
        preguntas: leccion.preguntas.map((p) => ({
          id: p.id,
          orden: p.orden,
          enunciado: p.enunciado,
          opciones: Array.isArray(p.opciones) ? p.opciones.map(String) : [],
          ...(padre ? { correcta: p.correcta, explicacion: p.explicacion } : {}),
          segundoVideo: p.segundoVideo,
        })),
        materiales: leccion.materiales.map((m) => ({
          id: m.id,
          titulo: m.titulo,
          tipo: m.tipo,
          proveedor: m.proveedor,
          url: m.url,
          contenido: m.contenido,
        })),
      }}
    />
  );
}
