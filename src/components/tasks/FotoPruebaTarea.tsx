"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMantenerActivo } from "@/hooks/useInactividad";
import { subirFotoPruebaTarea } from "@/lib/subirImagen";
import { toast } from "@/lib/toast";

/**
 * Tarjeta de foto de prueba: saca la foto con la cámara nativa del dispositivo o elige una imagen
 * del almacenamiento. La sube a `/api/tasks/[id]/foto-prueba`, que la comprime y la asocia a la tarea.
 */
export function FotoPruebaTarea({
  tareaId,
  url,
  puedeEditar,
  onSubida,
  onVer,
}: {
  tareaId: number;
  url: string | null;
  puedeEditar: boolean;
  onSubida: (url: string) => void;
  onVer?: () => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  // Subir una foto puede tardar y no queremos que la sesión se bloquee por inactividad
  useMantenerActivo("tarea-foto-prueba", subiendo);

  const subir = async (archivo: File | null | undefined) => {
    if (!archivo || subiendo) return;
    setSubiendo(true);
    try {
      const guardada = await subirFotoPruebaTarea(tareaId, archivo);
      onSubida(guardada.url);
      toast.success(url ? "Foto de prueba reemplazada" : "Foto de prueba subida");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir la foto de prueba");
    } finally {
      setSubiendo(false);
    }
  };

  const elegir = (input: HTMLInputElement | null) => input?.click();

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Camera className="size-4 shrink-0 text-primary" />
        <p className="text-sm font-medium">Foto de prueba</p>
        {url && <span className="ml-auto text-xs font-medium text-[var(--success)]">Cargada</span>}
      </div>

      {url ? (
        <button
          type="button"
          onClick={onVer}
          className="mt-2 block w-full overflow-hidden rounded-lg border bg-background text-left"
          aria-label="Ver la foto de prueba en grande"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Foto de prueba de la tarea" className="max-h-52 w-full object-cover" />
        </button>
      ) : (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {puedeEditar
            ? "Sacá o elegí una foto de lo que hiciste. La vas a necesitar para completar la tarea."
            : "Todavía no hay foto de prueba."}
        </p>
      )}

      {puedeEditar && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={subiendo}
              onClick={() => elegir(camara.current)}
            >
              <Camera /> {url ? "Tomar otra" : "Tomar foto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={subiendo}
              onClick={() => elegir(galeria.current)}
            >
              <ImagePlus /> {url ? "Elegir otra" : "Elegir foto"}
            </Button>
          </div>

          <input
            ref={camara}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void subir(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={galeria}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void subir(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {subiendo && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Spinner className="size-3" /> Subiendo foto…
            </p>
          )}
        </>
      )}
    </div>
  );
}
