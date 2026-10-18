"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Minimize2, RotateCcw } from "lucide-react";
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
 * Vista en pantalla completa del Santo Rosario (inspirada en ReposoPantalla / salvapantallas):
 * - Imagen de la carta del misterio actual de fondo con transición suave.
 * - Título del misterio en latín en tipografía destacada.
 * - Debajo, la cita y lectura de la Vulgata Clementina en texto más chico.
 * - Botón para avanzar al siguiente misterio (tanto en el modo de 5 misterios del día como en el de 15 misterios completos).
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
  const [indice, setIndice] = useState(() =>
    Math.max(0, Math.min(misterios.length - 1, indiceInicial)),
  );
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

  const salir = useCallback(() => {
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onSalir();
  }, [onSalir]);

  // Solicitar Fullscreen nativo al montar y escuchar salida con Escape
  useEffect(() => {
    if (typeof document === "undefined") return;
    let activo = true;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Si el navegador bloquea requestFullscreen, el overlay fijo cubre igual toda la ventana
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

  // Navegación por teclado (Flechas, Espacio, Escape)
  useEffect(() => {
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        irSiguiente();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        irAnterior();
      } else if (e.key === "Escape") {
        e.preventDefault();
        salir();
      }
    };

    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [irSiguiente, irAnterior, salir]);

  if (!misterioActual) return null;

  const esUltimo = indice === misterios.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Contemplación en pantalla completa: ${misterioActual.latino}`}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-black text-white select-none"
    >
      {/* 1. Fondo con la imagen de la carta del misterio (estilo screensaver) */}
      <div className="absolute inset-0 overflow-hidden bg-black pointer-events-none">
        <AnimatePresence mode="popLayout">
          {urlImagen && !falloImagen ? (
            <motion.div
              key={`${misterioActual.claveCarta}-${indice}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                scale: reduceMotion ? 1 : [1, 1.06],
                transition: {
                  opacity: { duration: reduceMotion ? 0.25 : 1.1, ease: "easeInOut" },
                  scale: { duration: 22, ease: "linear" },
                },
              }}
              exit={{
                opacity: 0,
                transition: { duration: reduceMotion ? 0.2 : 0.8, ease: "easeInOut" },
              }}
              className="absolute inset-0 size-full"
            >
              {/* Capa atmosférica difuminada para cubrir monitores panorámicos */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlImagen}
                alt=""
                role="presentation"
                className="absolute inset-0 size-full object-cover blur-2xl scale-110 opacity-50"
                onError={() =>
                  setImagenesConError((prev) => ({ ...prev, [misterioActual.claveCarta]: true }))
                }
              />

              {/* Ilustración completa de la carta */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlImagen}
                alt={misterioActual.latino}
                className="relative z-10 size-full object-cover sm:object-contain sm:object-right lg:pr-[6%] drop-shadow-[0_12px_40px_rgba(0,0,0,0.9)]"
                onError={() =>
                  setImagenesConError((prev) => ({ ...prev, [misterioActual.claveCarta]: true }))
                }
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Respaldo de partículas doradas si falla la imagen */}
        {(!urlImagen || falloImagen) && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#352216_0%,#1A1410_55%,#0A0604_100%)]">
            <Particles className="absolute inset-0" quantity={90} ease={80} color="#C9A84C" refresh />
          </div>
        )}

        {/* Velos de legibilidad idénticos al salvapantallas */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-black/65 pointer-events-none" />
        <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_24%_50%,rgba(0,0,0,0.78)_0%,transparent_75%)] pointer-events-none" />
      </div>

      {/* 2. Contenido superpuesto (Cabecera, Misterio + Vulgata, Controles) */}
      <div className="relative z-30 flex size-full flex-col justify-between px-6 py-7 sm:px-10 sm:py-9">
        {/* Cabecera: Logo e información de la corona a la izquierda, botón salir a la derecha */}
        <div className="flex w-full shrink-0 items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary font-heading text-sm font-bold text-primary-foreground shadow-md">
              OD
            </span>
            <div className="flex flex-col">
              <span className="font-heading text-sm sm:text-base font-semibold tracking-wide text-white/95 drop-shadow">
                {tituloModo}
              </span>
              <span className="text-xs text-white/70 font-serif italic">
                {misterioActual.grupoLatino} · Mysterium {misterioActual.numeroRomano} ({indice + 1} de {misterios.length})
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={salir}
            aria-label="Salir de pantalla completa"
            className="rounded-full border-white/30 bg-black/45 px-4 text-xs font-medium text-white backdrop-blur-md hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <Minimize2 className="size-3.5 mr-1.5" />
            Salir
          </Button>
        </div>

        {/* Zona central: Título del misterio en latín y debajo la cita de la Vulgata en texto más chico */}
        <div className="my-auto flex min-h-0 flex-1 items-center w-full max-w-4xl py-4 pl-[2%] sm:pl-[6%]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`texto-${misterioActual.claveCarta}-${indice}`}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.25 : 0.6, ease: "easeOut" } }}
              exit={{ opacity: 0, transition: { duration: reduceMotion ? 0.2 : 0.35, ease: "easeIn" } }}
              className="flex flex-col text-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] max-h-full overflow-y-auto pr-2"
            >
              {/* Corona y número romano */}
              <div className="mb-2 flex flex-wrap items-center gap-2 font-sans text-xs sm:text-sm uppercase tracking-[0.2em] text-amber-300/90 font-semibold">
                <span>
                  {misterioActual.grupoLatino} · {misterioActual.numeroRomano}
                </span>
                {misterios.length > 5 && (
                  <span className="text-white/60">
                    ({misterioActual.romanoGlobal} / XV)
                  </span>
                )}
              </div>

              {/* N1: Título del misterio en latín */}
              <h2
                lang="la"
                className="font-serif italic text-white text-balance leading-tight max-w-[38ch] text-[clamp(1.65rem,min(1.15rem+2.3vw,4.4dvh),3.1rem)] font-semibold"
              >
                {misterioActual.numeroRomano}. {misterioActual.latino}
              </h2>

              {/* N2: Debajo, la cita de la Vulgata en texto más chico */}
              <div className="mt-4 sm:mt-5 space-y-2.5 max-w-[60ch]">
                {misterioActual.lecturas.map((lectura) => (
                  <p
                    key={lectura.ref}
                    lang="la"
                    className="font-serif not-italic text-white/90 text-balance leading-relaxed text-[clamp(0.95rem,min(0.8rem+0.85vw,2.2dvh),1.25rem)]"
                  >
                    {lectura.la}
                  </p>
                ))}
              </div>

              {/* N3: Referencia bíblica de la Vulgata */}
              <div
                lang="la"
                className="mt-3 sm:mt-4 font-sans uppercase tracking-[0.18em] text-white/70 text-xs sm:text-sm font-semibold"
              >
                {misterioActual.cita} · {FUENTE_LECTURAS}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Zona inferior: Botones para cambiar de misterio */}
        <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-3 sm:gap-4 mb-1 sm:mb-2">
          {indice > 0 && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={irAnterior}
              aria-label="Misterio anterior"
              className="min-h-[48px] rounded-full border-white/25 bg-black/40 px-6 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-md transition-all hover:bg-white/15 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="size-4 mr-1" />
              Anterior
            </Button>
          )}

          <span className="px-3 font-mono text-xs sm:text-sm text-white/80 tabular-nums">
            {indice + 1} / {misterios.length}
          </span>

          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={irSiguiente}
            aria-label={esUltimo ? "Volver al primer misterio" : "Siguiente misterio"}
            className={cn(
              "min-h-[48px] min-w-[190px] rounded-full border-white/35 bg-black/50 px-8 py-3 text-base font-medium text-white shadow-2xl backdrop-blur-md transition-all hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer",
            )}
          >
            {esUltimo ? (
              <>
                <RotateCcw className="size-4 mr-2" />
                Volver al I misterio
              </>
            ) : (
              <>
                Siguiente misterio
                <ChevronRight className="size-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
