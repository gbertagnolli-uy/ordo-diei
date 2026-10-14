"use client";

// Portado de vendor/roost/src/components/groups/AddRecordingModal.tsx (msrbuilds/roost@492af47).
// Cambios: Dialog de ui/; parseo con parsearEnlaceVideo (HS0, formatos ampliados); vista previa con urlEmbed
// (youtube-nocookie); el enlace es opcional (lección de texto o PDF por enlace); textos en español.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createRecording, updateRecording } from "@/lib/homeschooling/roost/services/group";
import type { RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";
import { parsearEnlaceVideo, urlEmbed } from "@/lib/homeschooling/video";
import { toast } from "@/lib/toast";

export default function LeccionForm({
  open,
  moduleId,
  onClose,
  onSuccess,
  editing,
}: {
  open: boolean;
  moduleId: number;
  onClose: () => void;
  onSuccess: () => void;
  editing?: RecordingWithCompletion | null;
}) {
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUrl(editing?.video_url ?? "");
    setTitulo(editing?.title ?? "");
    setDescripcion(editing?.description ?? "");
  }, [open, editing]);

  const video = url.trim() ? parsearEnlaceVideo(url) : null;
  const urlInvalida = !!url.trim() && !/^https?:\/\//i.test(url.trim());

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || urlInvalida) return;
    setGuardando(true);
    try {
      const datos = { title: titulo.trim(), description: descripcion.trim() || null, video_url: url.trim() || null };
      if (editing) await updateRecording(editing.id, datos);
      else await createRecording({ ...datos, module_id: moduleId });
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la lección");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar lección" : "Agregar lección"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lec-url">Enlace (opcional)</Label>
            <Input id="lec-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=… o https://vimeo.com/…" inputMode="url" aria-invalid={urlInvalida} />
            <p className="text-xs text-muted-foreground">
              {urlInvalida ? "Tiene que empezar con http:// o https://" : "YouTube y Vimeo se reproducen en la lección; cualquier otro enlace queda como vínculo."}
            </p>
          </div>

          {video && (
            <div className="space-y-1.5">
              <Label>Vista previa</Label>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <iframe src={urlEmbed(video.plataforma, video.videoId)} className="absolute inset-0 size-full" title="Vista previa" allowFullScreen />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="lec-titulo">Título</Label>
            <Input id="lec-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Introducción" maxLength={150} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lec-desc">Instrucciones (opcional)</Label>
            <Textarea id="lec-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} maxLength={1000} placeholder="Qué tiene que hacer el alumno" />
            <p className="text-right text-xs text-muted-foreground">{descripcion.length}/1000</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || !titulo.trim() || urlInvalida}>
              {guardando && <Spinner />} {editing ? "Guardar cambios" : "Agregar lección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
