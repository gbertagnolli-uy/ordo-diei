"use client";

// Portado de vendor/roost/src/components/groups/learn/LessonPlayer.tsx (msrbuilds/roost@492af47).
// Cambios: vista previa del padre — sin «marcar completada» (el reproductor del alumno es VisorLeccion, lane H2),
// embed con urlEmbed (youtube-nocookie), lección sin video (texto o enlace), anterior/siguiente, textos en español.

import { ArrowLeft, ArrowRight, CircleHelp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";
import { urlEmbed } from "@/lib/homeschooling/video";

type Vecina = { id: number; title: string } | null;

export default function VistaLeccion({
  recording,
  prev,
  next,
  onNavigate,
  onEdit,
  onDelete,
  onPreguntas,
}: {
  recording: RecordingWithCompletion;
  prev: Vecina;
  next: Vecina;
  onNavigate: (recordingId: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPreguntas?: () => void;
}) {
  const embed = recording.video_platform && recording.video_id ? urlEmbed(recording.video_platform, recording.video_id) : null;

  return (
    <div className="space-y-6">
      {embed ? (
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
          <a
            href={recording.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm font-medium text-primary hover:bg-muted"
          >
            <ExternalLink className="size-4" /> Abrir el material
          </a>
        )
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground">
            {recording.display_order}. {recording.title}
          </h2>
          {recording.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{recording.description}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          {onPreguntas && (
            <Button variant="ghost" size="icon" onClick={onPreguntas} aria-label="Preguntas de la lección">
              <CircleHelp />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar lección">
              <Pencil />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Borrar lección" className="text-destructive">
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

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
