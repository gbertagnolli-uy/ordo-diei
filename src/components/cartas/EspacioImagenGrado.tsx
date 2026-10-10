"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { urlArte } from "@/lib/cartas/arte";
import { Upload, X, RefreshCw, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface EspacioImagenGradoProps {
  grado: 1 | 2 | 3 | 4;
  titulo: string;
  obligatoria?: boolean;
  urlActual: string | null | undefined;
  urlFallback?: string | null | undefined;
  onImagenCambiada: (url: string | null) => void;
}

export function EspacioImagenGrado({
  titulo,
  obligatoria = false,
  urlActual,
  urlFallback,
  onImagenCambiada,
}: EspacioImagenGradoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [avisoPeso, setAvisoPeso] = useState<string | null>(null);
  const [avisoRatio, setAvisoRatio] = useState<string | null>(null);
  const [modoUrlManual, setModoUrlManual] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>(urlActual || "");

  const tieneImagenPropia = Boolean(urlActual && urlActual.trim().length > 0);
  const urlAMostrar = urlArte(tieneImagenPropia ? urlActual : urlFallback);

  const manejarSeleccionArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorValidacion(null);
    setAvisoPeso(null);
    setAvisoRatio(null);

    // 1. Validar tipo (.webp, .png, .jpg)
    const extension = file.name.split(".").pop()?.toLowerCase();
    const tiposPermitidos = ["webp", "png", "jpg", "jpeg"];
    if (!extension || !tiposPermitidos.includes(extension)) {
      setErrorValidacion("Formato no admitido. Se requiere .webp, .png o .jpg");
      return;
    }

    // 2. Validar peso (≤ 300 KB con advertencia si excede)
    const pesoKb = Math.round(file.size / 1024);
    if (file.size > 300 * 1024) {
      setAvisoPeso(`El archivo pesa ${pesoKb} KB (supera los 300 KB recomendados).`);
    }

    // 3. Validar proporción retrato 63:88 (~0.716)
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.src = objectUrl;
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = img.width / img.height;
      const ratioEsperado = 63 / 88; // ~0.7159
      if (Math.abs(ratio - ratioEsperado) > 0.08) {
        setAvisoRatio(`Proporción ${img.width}×${img.height} difiere del formato retrato 63:88.`);
      }

      // 4. Subir vía /api/upload
      try {
        setSubiendo(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Error al subir el archivo");
        }

        const data = await res.json();
        if (data.url) {
          onImagenCambiada(data.url);
          setUrlInput(data.url);
        }
      } catch (err) {
        console.error("Error al subir imagen:", err);
        setErrorValidacion("Error al subir la imagen al servidor.");
      } finally {
        setSubiendo(false);
      }
    };
  };

  const aplicarUrlManual = () => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      onImagenCambiada(trimmed);
      setModoUrlManual(false);
    }
  };

  const quitarImagen = () => {
    onImagenCambiada(null);
    setUrlInput("");
    setErrorValidacion(null);
    setAvisoPeso(null);
    setAvisoRatio(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{titulo}</span>
          {obligatoria ? (
            <Badge variant="destructive" className="text-[10px] uppercase font-bold py-0 h-4">
              Obligatoria
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground py-0 h-4">
              Opcional
            </Badge>
          )}
        </div>

        {tieneImagenPropia ? (
          <Badge variant="secondary" className="text-[10px] text-emerald-600 dark:text-emerald-400 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Propia
          </Badge>
        ) : urlFallback ? (
          <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 gap-1">
            <Info className="h-3 w-3" /> Heredada
          </Badge>
        ) : null}
      </div>

      <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-3 items-center">
        {/* Vista previa en miniatura con ratio retrato 63:88 */}
        <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg border border-border/80 bg-background/50 shadow-inner flex items-center justify-center">
          {urlAMostrar ? (
            <Image
              src={urlAMostrar}
              alt={titulo}
              fill
              sizes="100px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-2 text-center text-[10px]">
              <Upload className="h-5 w-5 mb-1 opacity-50" />
              <span>Sin imagen</span>
            </div>
          )}
        </div>

        {/* Acciones e información */}
        <div className="flex flex-col gap-2 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".webp,.png,.jpg,.jpeg,image/webp,image/png,image/jpeg"
            className="hidden"
            onChange={manejarSeleccionArchivo}
          />

          {!modoUrlManual ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={subiendo}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs h-8"
              >
                {subiendo ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {tieneImagenPropia ? "Reemplazar archivo" : "Subir archivo"}
              </Button>

              {tieneImagenPropia && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={quitarImagen}
                  className="gap-1 text-xs h-8 text-destructive hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                  Quitar
                </Button>
              )}

              <button
                type="button"
                onClick={() => setModoUrlManual(true)}
                className="text-[11px] text-muted-foreground underline hover:text-foreground"
              >
                o ingresar URL
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="/cartas/nombre/1.webp"
                className="h-8 text-xs font-mono"
              />
              <Button type="button" size="sm" onClick={aplicarUrlManual} className="h-8 text-xs">
                OK
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModoUrlManual(false)}
                className="h-8 text-xs px-2"
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Avisos informativos */}
          {!tieneImagenPropia && !obligatoria && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0 text-amber-500" />
              Si no se sube una imagen propia, se usará automáticamente la del grado anterior.
            </p>
          )}

          {urlActual && (
            <p className="text-[10px] font-mono text-muted-foreground truncate" title={urlActual}>
              {urlActual}
            </p>
          )}

          {/* Alertas de validación */}
          {errorValidacion && (
            <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {errorValidacion}
            </p>
          )}

          {avisoPeso && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {avisoPeso}
            </p>
          )}

          {avisoRatio && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {avisoRatio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
