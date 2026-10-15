"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { FotoPublica } from "@/lib/reposo/unsplash";
import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";

interface FondoUnsplashProps {
  foto: FotoPublica | null;
  duracionMs?: number;
  className?: string;
  onFotoCargada?: () => void;
}

/**
 * Fondo fotográfico de Unsplash con doble capa para fundido cruzado (1.5 s), efecto Ken Burns
 * (escala 1 -> 1.08), velos de legibilidad (≥ 4.5:1), atribución con enlaces UTM y respaldo
 * automático de partículas doradas si no hay foto o falla la red (SPEC §4.2, §4.4, §4.6, §5.1).
 */
export function FondoUnsplash({
  foto,
  duracionMs = 15000,
  className,
  onFotoCargada,
}: FondoUnsplashProps) {
  const reduceMotion = useReducedMotion();
  const [fotosConError, setFotosConError] = useState<Record<string, boolean>>({});

  const errorCarga = foto ? Boolean(fotosConError[foto.id]) : false;
  const mostrarParticulas = !foto || errorCarga;

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black select-none pointer-events-none", className)}>
      {/* 1. Capa de foto o fallback */}
      <AnimatePresence mode="popLayout">
        {foto && !errorCarga ? (
          <motion.div
            key={foto.id}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              scale: reduceMotion ? 1 : [1, 1.08],
              transition: {
                opacity: { duration: reduceMotion ? 0.3 : 1.5, ease: "easeInOut" },
                scale: { duration: duracionMs / 1000, ease: "linear" },
              },
            }}
            exit={{
              opacity: 0,
              transition: { duration: reduceMotion ? 0.3 : 1.5, ease: "easeInOut" },
            }}
            className="absolute inset-0 size-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.url}
              alt=""
              role="presentation"
              className="size-full object-cover"
              style={{ backgroundColor: foto.color ?? "#0A0604" }}
              onLoad={() => onFotoCargada?.()}
              onError={() => {
                if (foto) setFotosConError((prev) => ({ ...prev, [foto.id]: true }));
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 2. Respaldo de partículas doradas si no hay foto o falló la carga */}
      {mostrarParticulas ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#352216_0%,#1A1410_55%,#0A0604_100%)]">
          <Particles className="absolute inset-0" quantity={90} ease={80} color="#C9A84C" refresh />
        </div>
      ) : null}

      {/* 3. Velo oscuro degradé de legibilidad (D54, SPEC §4.2) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/60 pointer-events-none" />

      {/* 4. Velo radial sutil sobre el cuadrante izquierdo detrás del texto */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(0,0,0,0.65)_0%,transparent_75%)] pointer-events-none" />

      {/* 5. Atribución obligatoria de Unsplash (SPEC §4.2, §5.1.3) */}
      {foto && !errorCarga ? (
        <div className="absolute bottom-4 left-6 z-20 font-sans text-xs text-white/70 drop-shadow select-auto pointer-events-auto transition-opacity hover:opacity-100">
          Foto de{" "}
          <a
            href={foto.urlAutor}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white transition-colors"
          >
            {foto.autor}
          </a>{" "}
          en{" "}
          <a
            href={foto.urlUnsplash}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white transition-colors"
          >
            Unsplash
          </a>
        </div>
      ) : null}
    </div>
  );
}
