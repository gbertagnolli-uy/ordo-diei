"use client";

// Portado de vendor/roost/src/components/groups/AddRecordingModal.tsx (msrbuilds/roost@492af47; ampliado en lane 230).
// Cambios: constructor de clase multimodal (estilo Circle / Thinkific enfocado en tareas) — permite armar una clase
// con texto/consigna Markdown, imagen/lámina subida, video embebido (YouTube/Vimeo/mp4), documento descargable subido
// o enlace web, o bien de un solo tipo de contenido, y pasar directo a configurar su Quiz/Evaluación.

import { useEffect, useRef, useState } from "react";
import { Bold, ClipboardCheck, FileUp, Heading2, List, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createRecording, updateRecording } from "@/lib/homeschooling/roost/services/group";
import type { RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";
import { esArchivoVideo, parsearEnlaceVideo, urlEmbed } from "@/lib/homeschooling/video";
import { subirArchivoEstudio } from "@/lib/subirImagen";
import MarkdownTexto from "@/components/homeschooling/material/MarkdownTexto";
import { toast } from "@/lib/toast";
import PortadaCampo from "./PortadaCampo";

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
  onSuccess: (rec?: RecordingWithCompletion, abrirQuiz?: boolean) => void;
  editing?: RecordingWithCompletion | null;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [url, setUrl] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [vistaPreviaTexto, setVistaPreviaTexto] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitulo(editing?.title ?? "");
    setDescripcion(editing?.description ?? "");
    setUrl(editing?.video_url ?? "");
    const esMiniaturaYoutube = editing?.thumbnail_url?.includes("ytimg.com") ?? false;
    setImagenUrl(esMiniaturaYoutube ? "" : (editing?.thumbnail_url ?? ""));
    setVistaPreviaTexto(false);
    setNombreArchivo(null);
  }, [open, editing]);

  const video = url.trim() ? parsearEnlaceVideo(url) : null;
  const urlLimpia = url.trim();
  const urlInvalida =
    !!urlLimpia && !/^https?:\/\//i.test(urlLimpia) && !/^\/api\/archivos\/[0-9a-f-]{36}(\?.*)?$/i.test(urlLimpia);

  const insertarMarkdown = (prefijo: string, sufijo = "") => {
    const el = areaRef.current;
    if (!el) {
      setDescripcion((prev) => `${prev}${prefijo}${sufijo}`);
      return;
    }
    const ini = el.selectionStart;
    const fin = el.selectionEnd;
    const sel = descripcion.slice(ini, fin);
    const nuevo = `${descripcion.slice(0, ini)}${prefijo}${sel}${sufijo}${descripcion.slice(fin)}`;
    setDescripcion(nuevo);
    setTimeout(() => {
      el.focus();
      const pos = ini + prefijo.length + sel.length + sufijo.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const alSubirDocumento = async (file: File | undefined) => {
    if (!file) return;
    setSubiendoArchivo(true);
    try {
      const subido = await subirArchivoEstudio(file);
      setUrl(subido.url);
      setNombreArchivo(subido.nombre);
      if (!titulo.trim()) {
        setTitulo(subido.nombre.replace(/\.[^.]+$/, ""));
      }
      toast.success("Documento adjuntado a la clase");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally {
      setSubiendoArchivo(false);
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
    }
  };

  const enviar = async (abrirQuiz: boolean) => {
    if (!titulo.trim() || urlInvalida) return;
    setGuardando(true);
    try {
      const datos = {
        title: titulo.trim(),
        description: descripcion.trim() || null,
        video_url: urlLimpia || null,
        thumbnail_url: imagenUrl.trim() || null,
      };
      const rec = editing ? await updateRecording(editing.id, datos) : await createRecording({ ...datos, module_id: moduleId });
      onSuccess(rec, abrirQuiz);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la clase");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar clase" : "Constructor de clase — Nueva clase"}</DialogTitle>
          <DialogDescription>
            Armá la clase combinando consigna/texto, imagen, video embebido, documento descargable y quiz, o usá un solo tipo de contenido. Una vez creada, también podés sumarle múltiples bloques y archivos dentro de la clase.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(false);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="lec-titulo">Título de la clase o evaluación</Label>
            <Input
              id="lec-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej.: Clase 1 — La Revolución de Mayo / Evaluación Unidad 1"
              maxLength={150}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="lec-desc">Tarea, lectura o descripción de la clase (opcional)</Label>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-xs" title="Subtítulo" onClick={() => insertarMarkdown("\n## ")}>
                  <Heading2 className="size-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" title="Negrita" onClick={() => insertarMarkdown("**", "**")}>
                  <Bold className="size-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" title="Lista" onClick={() => insertarMarkdown("\n- ")}>
                  <List className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant={vistaPreviaTexto ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setVistaPreviaTexto((v) => !v)}
                >
                  {vistaPreviaTexto ? "Editar" : "Vista previa"}
                </Button>
              </div>
            </div>
            {vistaPreviaTexto ? (
              <div className="min-h-28 rounded-lg border bg-card p-3">
                {descripcion.trim() ? (
                  <MarkdownTexto texto={descripcion} markdown />
                ) : (
                  <p className="text-sm text-muted-foreground">Sin texto cargado.</p>
                )}
              </div>
            ) : (
              <Textarea
                ref={areaRef}
                id="lec-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                maxLength={5000}
                placeholder="Escribí la explicación del tema, los pasos de la tarea o las consignas para el cuaderno…"
              />
            )}
            <p className="text-right text-xs text-muted-foreground">{descripcion.length}/5000</p>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/20 p-3.5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <PortadaCampo url={imagenUrl} onChange={setImagenUrl} etiqueta="Imagen o lámina de la clase (opcional)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lec-url">Video embebido, archivo descargable o enlace (opcional)</Label>
              <Input
                id="lec-url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setNombreArchivo(null);
                }}
                placeholder="https://youtube.com/watch?v=… o subí un archivo"
                inputMode="url"
                aria-invalid={urlInvalida}
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".pdf,.epub,.doc,.docx,.odt,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,image/*"
                  className="hidden"
                  onChange={(e) => void alSubirDocumento(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={subiendoArchivo}
                  onClick={() => inputArchivoRef.current?.click()}
                >
                  {subiendoArchivo ? <Spinner /> : <Upload className="size-3.5" />}
                  Subir documento descargable (PDF, libro, guía)
                </Button>
                {nombreArchivo && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    <FileUp className="size-3.5" /> {nombreArchivo}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {urlInvalida
                  ? "Tiene que ser un enlace http(s):// o un archivo subido."
                  : "YouTube, Vimeo y .mp4 se ven con reproductor embebido; un PDF o documento subido queda listo para ver y descargar."}
              </p>
            </div>
          </div>

          {!video && esArchivoVideo(url) && (
            <div className="space-y-1.5">
              <Label>Vista previa del video</Label>
              <video src={urlLimpia} controls className="aspect-video w-full rounded-lg bg-muted" />
            </div>
          )}

          {video && (
            <div className="space-y-1.5">
              <Label>Vista previa del video embebido</Label>
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <iframe src={urlEmbed(video.plataforma, video.videoId)} className="absolute inset-0 size-full" title="Vista previa" allowFullScreen />
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando || subiendoArchivo}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={guardando || subiendoArchivo || !titulo.trim() || urlInvalida}
              onClick={() => void enviar(true)}
            >
              {guardando ? <Spinner /> : <ClipboardCheck className="size-4" />}
              Guardar y configurar Quiz / Evaluación
            </Button>
            <Button type="submit" disabled={guardando || subiendoArchivo || !titulo.trim() || urlInvalida}>
              {guardando && <Spinner />} {editing ? "Guardar cambios" : "Crear clase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
