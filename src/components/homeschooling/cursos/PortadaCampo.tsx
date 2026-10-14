"use client";

// Propio de Ordo: campo de portada compartido (Roost repite el bloque en cada modal). Sube con subirImagen.

import { useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { subirImagen } from "@/lib/subirImagen";
import { toast } from "@/lib/toast";

export default function PortadaCampo({ url, onChange, etiqueta = "Portada" }: { url: string; onChange: (url: string) => void; etiqueta?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const alElegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    try {
      onChange((await subirImagen(file)).url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">{etiqueta}</span>
      {url ? (
        <div className="relative h-36 w-full overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Quitar portada"
            className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1 text-background transition-colors hover:bg-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={subiendo}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:border-primary"
        >
          {subiendo ? (
            <Spinner className="size-6 text-primary" />
          ) : (
            <>
              <ImageIcon className="size-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tocá para subir una imagen</span>
            </>
          )}
        </button>
      )}
      <input ref={input} type="file" accept="image/*" onChange={alElegir} className="hidden" />
    </div>
  );
}
