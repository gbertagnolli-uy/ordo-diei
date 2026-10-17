"use client";

// Portado de vendor/roost/src/components/groups/learn/LessonPlayer.tsx (msrbuilds/roost@492af47; ampliado en lane 230).
// Cambios: constructor y vista completa de la clase — integra video embebido o documento descargable, imagen de la clase,
// consigna con formato Markdown, bloques de contenido y materiales descargables (ListaMaterial expandida), y sección
// de Quiz / Evaluación (Assessment) con impresión en A4 para el alumno, clave de respuestas para padres y hoja de clase.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  KeyRound,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ComentariosEstudio from "@/components/homeschooling/comunidad/ComentariosEstudio";
import ListaMaterial from "@/components/homeschooling/material/ListaMaterial";
import MarkdownTexto from "@/components/homeschooling/material/MarkdownTexto";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";
import { esArchivoVideo, urlEmbed } from "@/lib/homeschooling/video";

type Vecina = { id: number; title: string } | null;

type PreguntaResumen = {
  id: number;
  orden: number;
  enunciado: string;
  opciones: string[];
  correcta?: number;
  explicacion?: string | null;
  segundoVideo: number | null;
};

const LETRAS = ["A", "B", "C", "D"];

export default function VistaLeccion({
  recording,
  prev,
  next,
  onNavigate,
  onEdit,
  onDelete,
  onPreguntas,
  cursoTitulo,
  onBack,
  versionPreguntas = 0,
}: {
  recording: RecordingWithCompletion;
  prev: Vecina;
  next: Vecina;
  onNavigate: (recordingId: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPreguntas?: () => void;
  cursoTitulo: string;
  onBack: () => void;
  versionPreguntas?: number;
}) {
  const esAdmin = !!onEdit || !!onPreguntas;
  const embed = recording.video_platform && recording.video_id ? urlEmbed(recording.video_platform, recording.video_id) : null;
  const esMiniaturaYoutube = recording.thumbnail_url?.includes("ytimg.com") ?? false;
  const imagenPropia = !esMiniaturaYoutube ? recording.thumbnail_url : null;
  const esArchivoSubido = recording.video_url?.startsWith("/api/archivos/") ?? false;

  const [preguntas, setPreguntas] = useState<PreguntaResumen[]>([]);

  useEffect(() => {
    let vigente = true;
    const endpoint = esAdmin
      ? `/api/homeschooling/lecciones/${recording.id}/preguntas?completas=1`
      : `/api/homeschooling/lecciones/${recording.id}/preguntas`;
    api<PreguntaResumen[]>(endpoint)
      .then((filas) => {
        if (vigente) setPreguntas(filas);
      })
      .catch(() => {
        if (vigente) setPreguntas([]);
      });
    return () => {
      vigente = false;
    };
  }, [recording.id, esAdmin, versionPreguntas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft /> <span className="max-w-48 truncate">{cursoTitulo}</span>
        </Button>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/homeschooling/imprimir/quiz/${recording.id}?modo=clase`} target="_blank">
              <Printer className="size-4" /> Imprimir clase
            </Link>
          </Button>
          {onPreguntas && (
            <Button variant="outline" size="sm" onClick={onPreguntas}>
              <ClipboardCheck className="size-4" /> {preguntas.length > 0 ? `Quiz / Evaluación (${preguntas.length})` : "Crear Quiz / Evaluación"}
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} aria-label="Editar lección">
              <Pencil className="size-4" /> Editar clase
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Borrar lección" className="text-destructive">
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <div>
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">Clase {recording.display_order}</span>
          <h2 className="mt-0.5 text-2xl font-bold text-foreground">
            {recording.display_order}. {recording.title}
          </h2>
        </div>

        {!embed && esArchivoVideo(recording.video_url) ? (
          <video src={recording.video_url ?? undefined} controls className="aspect-video w-full rounded-lg bg-muted" />
        ) : embed ? (
          <div className="overflow-hidden rounded-lg bg-muted">
            <div className="relative aspect-video">
              <iframe
                src={embed}
                className="absolute inset-0 size-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={recording.title}
              />
            </div>
          </div>
        ) : (
          recording.video_url && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3.5">
              <div className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-foreground">
                <FileText className="size-5 shrink-0 text-primary" />
                <span className="truncate">{esArchivoSubido ? "Documento descargable de la clase" : recording.video_url}</span>
              </div>
              <div className="flex items-center gap-2">
                {esArchivoSubido ? (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <a href={recording.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" /> Abrir
                      </a>
                    </Button>
                    <Button asChild size="sm">
                      <a href={`${recording.video_url}${recording.video_url.includes("?") ? "&" : "?"}descargar=1`} download>
                        <Download className="size-4" /> Descargar
                      </a>
                    </Button>
                  </>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <a href={recording.video_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" /> Abrir el material
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )
        )}

        {imagenPropia && (
          <figure className="overflow-hidden rounded-lg border bg-muted/20 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagenPropia} alt={recording.title} className="mx-auto max-h-96 w-auto rounded object-contain" />
          </figure>
        )}

        {recording.description ? (
          <div className="rounded-lg bg-muted/20 p-4">
            <MarkdownTexto texto={recording.description} markdown className="text-sm leading-6" />
          </div>
        ) : (
          esAdmin && (
            <p className="text-sm text-muted-foreground italic">
              Sin consigna escrita en la cabecera de la clase. Podés agregarla con «Editar clase» o sumar bloques de contenido acá abajo.
            </p>
          )
        )}
      </div>

      {esAdmin && (
        <section aria-label="Bloques de contenido y materiales de la clase" className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Paperclip className="size-4 text-primary" /> Bloques de contenido y materiales descargables de la clase
            </h3>
            <p className="text-xs text-muted-foreground">
              Sumá textos, imágenes, videos embebidos, archivos descargables (PDF, libros, guías) o enlaces en el orden en que quieras armar la clase.
            </p>
          </div>
          <ListaMaterial
            key={recording.id}
            destino={{ leccionId: recording.id }}
            contexto={`la clase «${recording.title}»`}
            expandido
          />
        </section>
      )}

      {(esAdmin || preguntas.length > 0) && (
        <section aria-label="Quiz y Evaluación de la clase" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <ClipboardCheck className="size-5 text-primary" /> Quiz y Evaluación (Assessment)
              </h3>
              <p className="text-xs text-muted-foreground">
                {preguntas.length === 0
                  ? "Agregá preguntas de opción múltiple para evaluar esta clase de forma interactiva o imprimilas en hoja A4."
                  : `${preguntas.length} ${preguntas.length === 1 ? "pregunta configurada" : "preguntas configuradas"} · Lista para responder online o imprimir en A4.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {preguntas.length > 0 && (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/homeschooling/imprimir/quiz/${recording.id}?modo=alumno`} target="_blank">
                      <Printer className="size-3.5" /> Imprimir evaluación (Alumno)
                    </Link>
                  </Button>
                  {esAdmin && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/homeschooling/imprimir/quiz/${recording.id}?modo=clave`} target="_blank">
                        <KeyRound className="size-3.5" /> Imprimir clave (Padre)
                      </Link>
                    </Button>
                  )}
                </>
              )}
              {onPreguntas && (
                <Button size="sm" onClick={onPreguntas}>
                  <Plus className="size-3.5" /> {preguntas.length > 0 ? "Editar preguntas" : "Crear Quiz / Evaluación"}
                </Button>
              )}
            </div>
          </div>

          {preguntas.length > 0 && (
            <ol className="space-y-3 border-t pt-3">
              {preguntas.map((p, idx) => (
                <li key={p.id ?? idx} className="space-y-1.5 rounded-lg border bg-muted/20 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {idx + 1}. {p.enunciado}
                    </p>
                    {p.segundoVideo !== null && (
                      <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Checkpoint {p.segundoVideo}s
                      </span>
                    )}
                  </div>
                  <ul className="grid grid-cols-1 gap-1 pl-2 sm:grid-cols-2">
                    {p.opciones.map((op, k) => {
                      const esCorrecta = esAdmin && p.correcta === k;
                      return (
                        <li
                          key={k}
                          className={`flex items-center gap-1.5 text-xs ${
                            esCorrecta ? "font-semibold text-success" : "text-muted-foreground"
                          }`}
                        >
                          {esCorrecta ? <CheckCircle2 className="size-3.5 shrink-0" /> : <span className="size-3.5 shrink-0 text-center">•</span>}
                          <span>
                            {LETRAS[k] ?? k + 1}) {op}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <ComentariosEstudio key={recording.id} destino={{ leccionId: recording.id }} titulo="Comentarios de la familia" />

      <div className="flex items-center justify-between gap-2 border-t pt-4">
        <Button variant="outline" disabled={!prev} onClick={() => prev && onNavigate(prev.id)}>
          <ArrowLeft /> <span className="max-w-40 truncate">{prev ? prev.title : "Anterior"}</span>
        </Button>
        <Button variant="outline" disabled={!next} onClick={() => next && onNavigate(next.id)}>
          <span className="max-w-40 truncate">{next ? next.title : "Siguiente"}</span> <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
