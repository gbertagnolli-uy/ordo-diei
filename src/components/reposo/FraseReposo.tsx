"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import type { ItemFrase } from "@/lib/reposo/frases";
import { cn } from "@/lib/utils";

interface FraseReposoProps {
  item: ItemFrase;
  mostrarRefCatecismo?: boolean;
  className?: string;
}

/**
 * Renderiza la frase central del reposo: Cita Bíblica o Pregunta del Catecismo (SPEC §4.1, §4.2).
 * Tipografía Newsreader con clamp, alineación a la izquierda (10-12% de margen),
 * jerarquía N1 > N2 > N3 y accesibilidad con lang y aria-live="polite".
 */
export function FraseReposo({ item, mostrarRefCatecismo = true, className }: FraseReposoProps) {
  const reduceMotion = useReducedMotion();

  const animationVariants: Variants = {
    initial: {
      opacity: 0,
      y: reduceMotion ? 0 : 8,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.3 : 0.7,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: reduceMotion ? 0.3 : 0.5,
        ease: "easeIn",
      },
    },
  };

  const key = item.tipo === "biblia" ? `biblia-${item.datos.id}` : `catecismo-${item.datos.n}`;

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex flex-col text-left select-none relative z-10 w-full max-w-4xl px-4 sm:px-0",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          variants={animationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex flex-col text-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
        >
          {item.tipo === "biblia" ? (
            <>
              {/* N1: Latín (Vulgata Clementina) */}
              <div
                lang="la"
                className="font-serif italic text-white text-balance leading-tight max-w-[36ch] text-[clamp(1.75rem,1rem+3vw,3.5rem)] font-medium"
              >
                {item.datos.la}
              </div>

              {/* N2: Español (Torres Amat) */}
              <div
                lang="es"
                className="mt-6 font-serif not-italic text-white/90 text-balance leading-relaxed max-w-[52ch] text-[clamp(1.05rem,0.8rem+1.2vw,1.75rem)]"
              >
                {item.datos.es}
              </div>

              {/* N3: Referencia Bíblica */}
              <div
                lang="es"
                className="mt-4 font-sans uppercase tracking-[0.18em] text-white/70 text-xs sm:text-sm font-semibold"
              >
                {item.datos.ref}
              </div>
            </>
          ) : (
            <>
              {/* N1: Pregunta del Catecismo */}
              <div
                lang="es"
                className="font-serif not-italic text-white text-balance leading-tight max-w-[36ch] text-[clamp(1.75rem,1rem+3vw,3.5rem)] font-medium"
              >
                {item.datos.pregunta}
              </div>

              {/* N2: Respuesta del Catecismo */}
              <div
                lang="es"
                className="mt-6 font-serif not-italic text-white/90 text-balance leading-relaxed max-w-[52ch] text-[clamp(1.05rem,0.8rem+1.2vw,1.75rem)]"
              >
                {item.datos.respuesta}
              </div>

              {/* N3: Referencia opcional */}
              {mostrarRefCatecismo ? (
                <div
                  lang="es"
                  className="mt-4 font-sans uppercase tracking-[0.18em] text-white/70 text-xs sm:text-sm font-semibold"
                >
                  CATECISMO MAYOR DE SAN PÍO X · {item.datos.n}
                </div>
              ) : null}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
