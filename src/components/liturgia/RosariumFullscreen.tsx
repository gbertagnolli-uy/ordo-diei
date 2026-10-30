"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Minimize2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { FUENTE_LECTURAS, type MisterioEnSecuencia } from "@/lib/liturgia/rosario";
import { cn } from "@/lib/utils";

interface RosariumFullscreenProps {
  misterios: MisterioEnSecuencia[];
  indiceInicial?: number;
  tituloModo: string;
  obtenerImagen: (misterio: MisterioEnSecuencia) => string;
  onCambiarIndice?: (nuevoIndice: number) => void;
  onSalir: () => void;
}

/**
 * Vista en pantalla completa del Santo Rosario:
 * - Se monta en `document.body` con `z-[9999]` y pide Fullscreen nativo sobre su propio nodo para cubrir el Dock y toda la interfaz.
 * - La imagen de la carta del misterio se muestra destacada, con 100% de opacidad, sin ningún velo,
 *   gradiente oscuro ni superposición que le quite brillo o presencia a la obra de arte.
 * - En pantallas panorámicas/escritorio, se organiza en dos columnas (imagen destacada + textos de contemplación).
 * - En móviles/verticales, se organiza en una columna con la imagen arriba y las lecturas debajo sin taparla.
 * - Incluye toggle para contemplar "Solo arte" maximizado o "Con lecturas" (atajo tecla I).
 */
export function RosariumFullscreen({
  misterios,
  indiceInicial = 0,
  tituloModo,
  obtenerImagen,
  onCambiarIndice,
  onSalir,
}: RosariumFullscreenProps) {
  const reduceMotion = useReducedMotion();
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [indice, setIndice] = useState(() =>
    Math.max(0, Math.min(misterios.length - 1, indiceInicial)),
  );
  const [soloArte, setSoloArte] = useState(false);
  const [imagenesConError, setImagenesConError] = useState<Record<string, boolean>>({});

  const misterioActual = misterios[indice] ?? misterios[0];
  const urlImagen = misterioActual ? obtenerImagen(misterioActual) : "";
  const falloImagen = misterioActual ? Boolean(imagenesConError[misterioActual.claveCarta]) : true;

  const irA = useCallback(
    (nuevoIndice: number) => {
      const normalizado = ((nuevoIndice % misterios.length) + misterios.length) % misterios.length;
      setIndice(normalizado);
      onCambiarIndice?.(normalizado);
    },
    [misterios.length, onCambiarIndice],
  );

  const irSiguiente = useCallback(() => {
    irA(indice + 1);
  }, [indice, irA]);

  const irAnterior = useCallback(() => {
    irA(indice - 1);
  }, [indice, irA]);

  const alternarSoloArte = useCallback(() => {
    setSoloArte((prev) => !prev);
  }, []);

  const salir = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onSalir();
  }, [onSalir]);

  // Solicitar Fullscreen nativo sobre el propio contenedor (oculta el Dock incluso a nivel navegador) y escuchar salida con Escape
  useEffect(() => {
    if (typeof document === "undefined") return;
    let activo = true;

    const nodo = contenedorRef.current ?? document.documentElement;
    if (!document.fullscreenElement) {
      nodo.requestFullscreen?.().catch(() => {
        // Si el navegador bloquea requestFullscreen, el portal z-[9999] cubre igual toda la ventana y el Dock
      });
    }

    const alCambiarFullscreen = () => {
      if (activo && !document.fullscreenElement) {
        onSalir();
      }
    };

    document.addEventListener("fullscreenchange", alCambiarFullscreen);
    return () => {
      activo = false;
      document.removeEventListener("fullscreenchange", alCambiarFullscreen);
    };
  }, [onSalir]);

  // Navegación por teclado (Flechas, Espacio, Escape, I para alternar solo imagen)
  useEffect(() => {
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        irSiguiente();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        irAnterior();
      } else if (e.key === "Escape") {
        e.preventDefault();
        salir();
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        alternarSoloArte();
      }
    };

    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [irSiguiente, irAnterior, salir, alternarSoloArte]);

  if (!misterioActual || typeof document === "undefined") return null;

  const esUltimo = indice === misterios.length - 1;

  const contenido = (
    <div
      ref={contenedorRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Contemplación en pantalla completa: ${misterioActual.latino}`}
      className="fixed inset-0 z-[9999] flex flex-col justify-between overflow-hidden bg-black text-white select-none"
    >
      {/* 1. Cabecera fija superior: información y acciones */}
      <header className="relative z-30 flex w-full shrink-0 items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-xs sm:text-sm font-bold text-primary-foreground shadow-md">
            OD
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-heading text-xs sm:text-sm md:text-base font-semibold tracking-wide text-white/95 truncate">
              {tituloModo}
            </span>
            <span className="text-[11px] sm:text-xs text-amber-300/80 font-serif italic truncate">
              {misterioActual.grupoLatino} · Mysterium {misterioActual.numeroRomano} ({indice + 1} de {misterios.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={alternarSoloArte}
            aria-label={soloArte ? "Mostrar lecturas del misterio" : "Ver solo la imagen del misterio"}
            title="Atajo: tecla I"
            className="rounded-full border-white/20 bg-white/5 px-3 sm:px-4 text-xs font-medium text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            {soloArte ? (
              <>
                <BookOpen className="size-3.5 mr-1.5 text-amber-300" />
                <span className="hidden sm:inline">Con lecturas</span>
                <span className="sm:hidden">Lecturas</span>
              </>
            ) : (
              <>
                <ImageIcon className="size-3.5 mr-1.5 text-amber-300" />
                <span className="hidden sm:inline">Solo imagen</span>
                <span className="sm:hidden">Imagen</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={salir}
            aria-label="Salir de pantalla completa"
            title="Atajo: Escape"
            className="rounded-full border-white/20 bg-white/5 px-3.5 sm:px-4 text-xs font-medium text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <Minimize2 className="size-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      {/* 2. Zona central de contemplación */}
      <main className="relative z-20 flex min-h-0 flex-1 w-full items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${misterioActual.claveCarta}-${indice}-${soloArte ? "solo" : "completo"}`}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: reduceMotion ? 0.2 : 0.45, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              scale: reduceMotion ? 1 : 1.01,
              transition: { duration: reduceMotion ? 0.15 : 0.3, ease: "easeIn" },
            }}
            className={cn(
              "size-full flex items-center justify-center min-h-0",
              soloArte
                ? "flex-col"
                : "flex-col md:flex-row gap-6 md:gap-10 lg:gap-14 max-w-7xl mx-auto",
            )}
          >
            {/* Panel de la Imagen de la Carta: 100% de brillo, sin velos ni superposiciones */}
            <div
              className={cn(
                "relative flex items-center justify-center shrink-0 min-h-0",
                soloArte
                  ? "h-full max-h-[82vh] w-auto max-w-full"
                  : "h-auto max-h-[44vh] md:max-h-[75vh] lg:max-h-[80vh] w-auto max-w-full md:max-w-[48%]",
              )}
            >
              {urlImagen && !falloImagen ? (
                <div
                  className={cn(
                    "relative flex items-center justify-center h-full aspect-[63/88] max-h-full",
                  )}
                >
                  {/* Resplandor cálido detrás de la carta (nunca encima) para resaltar su presencia */}
                  <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-amber-500/15 blur-2xl pointer-events-none" />

                  {/* Ilustración de la carta: 100% opacidad, brillo pleno, sin velos ni máscaras oscuras */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlImagen}
                    alt={`${misterioActual.latino} - ${misterioActual.castellano}`}
                    className="relative z-10 size-full object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] ring-1 ring-amber-400/30 select-none"
                    onError={() =>
                      setImagenesConError((prev) => ({
                        ...prev,
                        [misterioActual.claveCarta]: true,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-amber-500/30 rounded-2xl bg-amber-950/20 max-w-sm aspect-[63/88]">
                  <Sparkles className="size-12 text-amber-400/60 mb-3" />
                  <p className="text-amber-200/80 font-serif italic text-sm">
                    {misterioActual.latino}
                  </p>
                  <Particles className="absolute inset-0" quantity={40} color="#C9A84C" />
                </div>
              )}
            </div>

            {/* Panel de Textos Contemplativos (se oculta en modo soloArte) */}
            {!soloArte && (
              <div className="flex-1 min-w-0 max-w-2xl flex flex-col justify-center min-h-0 max-h-full overflow-y-auto pr-1 sm:pr-3 text-left">
                {/* Corona y número romano */}
                <div className="mb-2 flex flex-wrap items-center gap-2 font-sans text-xs sm:text-sm uppercase tracking-[0.2em] text-amber-300 font-semibold">
                  <span>
                    {misterioActual.grupoLatino} · Mysterium {misterioActual.numeroRomano}
                  </span>
                  {misterios.length > 5 && (
                    <span className="text-white/60">
                      ({misterioActual.romanoGlobal} / XV)
                    </span>
                  )}
                </div>

                {/* Título en latín */}
                <h2
                  lang="la"
                  className="font-serif italic text-white font-semibold leading-tight text-balance text-2xl sm:text-3xl lg:text-4xl drop-shadow-md"
                >
                  {misterioActual.numeroRomano}. {misterioActual.latino}
                </h2>

                {/* Título en castellano y fruto espiritual */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm sm:text-base font-sans font-medium text-amber-100/90">
                    {misterioActual.castellano}
                  </p>
                  <p className="text-xs sm:text-sm font-serif italic text-amber-300/85">
                    Fructus mysterii: {misterioActual.fruto}
                  </p>
                </div>

                {/* Lecturas de la Vulgata Clementina */}
                <div className="mt-4 sm:mt-5 space-y-2.5">
                  {misterioActual.lecturas.map((lectura) => (
                    <p
                      key={lectura.ref}
                      lang="la"
                      className="font-serif not-italic text-white/95 leading-relaxed text-sm sm:text-base lg:text-lg text-balance drop-shadow-xs"
                    >
                      {lectura.la}
                    </p>
                  ))}
                </div>

                {/* Referencia bíblica de la Vulgata */}
                <div
                  lang="la"
                  className="mt-3 sm:mt-4 font-sans uppercase tracking-[0.18em] text-white/60 text-xs sm:text-sm font-semibold"
                >
                  {misterioActual.cita} · {FUENTE_LECTURAS}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Barra inferior de navegación */}
      <footer className="relative z-30 flex w-full shrink-0 flex-wrap items-center justify-center gap-3 sm:gap-4 px-4 py-3 sm:py-4 border-t border-white/10 bg-black/80 backdrop-blur-md">
        {indice > 0 && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={irAnterior}
            aria-label="Misterio anterior"
            className="min-h-[44px] rounded-full border-white/20 bg-white/5 px-5 py-2.5 text-xs sm:text-sm font-medium text-white shadow-xl backdrop-blur-md transition-all hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <ChevronLeft className="size-4 mr-1 text-amber-300" />
            Anterior
          </Button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-mono text-white/90 tabular-nums">
          <span className="text-amber-300 font-semibold font-serif">
            {misterioActual.numeroRomano}
          </span>
          <span className="text-white/40">·</span>
          <span>
            {indice + 1} / {misterios.length}
          </span>
        </div>

        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={irSiguiente}
          aria-label={esUltimo ? "Volver al primer misterio" : "Siguiente misterio"}
          className={cn(
            "min-h-[44px] min-w-[170px] sm:min-w-[190px] rounded-full border-amber-400/40 bg-amber-500/10 px-6 sm:px-8 py-2.5 text-xs sm:text-sm font-medium text-white shadow-2xl backdrop-blur-md transition-all hover:bg-amber-500/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer",
          )}
        >
          {esUltimo ? (
            <>
              <RotateCcw className="size-4 mr-2 text-amber-300" />
              Volver al I misterio
            </>
          ) : (
            <>
              Siguiente misterio
              <ChevronRight className="size-4 ml-1.5 text-amber-300" />
            </>
          )}
        </Button>
      </footer>
    </div>
  );

  return createPortal(contenido, document.body);
}

