"use client";

// Portado de vendor/roost/src/pages/ShowcaseSubmit.tsx, solo el bloque de imágenes (useDropzone L229-260, vista previa)
// y el borrador en localStorage (L33, L80-156) (msrbuilds/roost@492af47).
// Cambios: Sheet de ui/; solo fotos (subirImagen → /api/upload); título y nota opcionales; botón «Cámara» con
// capture="environment" por si el navegador de la tablet no reenvía `capture` desde react-dropzone; textos en español.

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createShowcase } from "@/lib/homeschooling/roost/services/showcase";
import { subirImagen } from "@/lib/subirImagen";
import { toast } from "@/lib/toast";

const CLAVE_BORRADOR = "hs_evidencia_borrador";
const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000;
const MAX_FOTOS = 6;

type Borrador = { titulo: string; nota: string; imagenes: string[]; guardadoEn: number };

export default function EnviarEvidencia({
  open,
  onClose,
  diaLectivoId,
  titulo: tituloSugerido,
  onEnviada,
}: {
  open: boolean;
  onClose: () => void;
  diaLectivoId?: number | null;
  titulo?: string;
  onEnviada?: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [nota, setNota] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const cargado = useRef(false);
  const camara = useRef<HTMLInputElement>(null);

  // Recupera el borrador (si es de hace menos de 7 días) al abrir
  useEffect(() => {
    if (!open) {
      cargado.current = false;
      return;
    }
    try {
      const guardado = localStorage.getItem(CLAVE_BORRADOR);
      const b: Borrador | null = guardado ? JSON.parse(guardado) : null;
      if (b && Date.now() - b.guardadoEn < SIETE_DIAS) {
        setTitulo(b.titulo);
        setNota(b.nota);
        setImagenes(b.imagenes);
      } else {
        localStorage.removeItem(CLAVE_BORRADOR);
        setTitulo(tituloSugerido ?? "");
        setNota("");
        setImagenes([]);
      }
    } catch {
      setTitulo(tituloSugerido ?? "");
      setNota("");
      setImagenes([]);
    }
    cargado.current = true;
  }, [open, tituloSugerido]);

  // Guarda el borrador cuando hay algo
  useEffect(() => {
    if (!open || !cargado.current) return;
    try {
      if (titulo || nota || imagenes.length) {
        localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ titulo, nota, imagenes, guardadoEn: Date.now() } satisfies Borrador));
      }
    } catch {
      /* sin almacenamiento: el borrador es solo una comodidad */
    }
  }, [open, titulo, nota, imagenes]);

  const alSoltar = useCallback(async (archivos: File[]) => {
    if (archivos.length === 0) return;
    setSubiendo(true);
    try {
      for (const archivo of archivos) {
        const { url } = await subirImagen(archivo);
        setImagenes((prev) => (prev.length >= MAX_FOTOS ? prev : [...prev, url]));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: alSoltar,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".heic"] },
    multiple: true,
    maxSize: 15 * 1024 * 1024,
    disabled: imagenes.length >= MAX_FOTOS,
    onDropRejected: () => toast.error("Esa foto no se puede usar (tiene que ser una imagen de hasta 15 MB)"),
  });

  const enviar = async () => {
    if (imagenes.length === 0) {
      toast.error("Agregá al menos una foto");
      return;
    }
    setEnviando(true);
    try {
      await createShowcase({ titulo: titulo.trim() || null, nota: nota.trim() || null, diaLectivoId: diaLectivoId ?? null, imagenes });
      localStorage.removeItem(CLAVE_BORRADOR);
      toast.success("¡Enviado!", "Tu mamá o tu papá lo va a revisar");
      onEnviada?.();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !enviando && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Mostrar mi trabajo</SheetTitle>
          <SheetDescription>Sacale una foto a lo que hiciste. Tus padres la van a ver.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div
            {...getRootProps()}
            className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/60"
            }`}
          >
            <input {...getInputProps({ capture: "environment" } as React.InputHTMLAttributes<HTMLInputElement>)} />
            {subiendo ? <Spinner className="size-6 text-primary" /> : <ImagePlus className="size-8 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{isDragActive ? "Soltá las fotos acá" : "Tocá para sacar o elegir una foto"}</span>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => camara.current?.click()} disabled={subiendo || imagenes.length >= MAX_FOTOS}>
            <Camera /> Cámara
          </Button>
          <input
            ref={camara}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void alSoltar(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />

          {imagenes.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imagenes.map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label="Quitar foto"
                    onClick={() => setImagenes((prev) => prev.filter((u) => u !== url))}
                    className="absolute top-1 right-1 rounded-full bg-foreground/70 p-1 text-background hover:bg-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ev-titulo">Título (opcional)</Label>
            <Input id="ev-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150} placeholder="Mi maqueta del volcán" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-nota">Contanos (opcional)</Label>
            <Textarea id="ev-nota" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={1000} rows={3} />
          </div>

          <Button className="w-full" size="lg" onClick={enviar} disabled={enviando || subiendo || imagenes.length === 0}>
            {enviando && <Spinner />} Enviar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
