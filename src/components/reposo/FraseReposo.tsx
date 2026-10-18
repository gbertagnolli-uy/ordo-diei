"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { calcularEscalaFrase, type ItemFrase } from "@/lib/reposo/frases";
import { cn } from "@/lib/utils";

interface FraseReposoProps {
  item: ItemFrase;
  mostrarRefCatecismo?: boolean;
  className?: string;
}

/**
 * Renderiza la frase central del reposo: Cita Bíblica o Pregunta del Catecismo (SPEC §4.1, §4.2).
 * Tipografía Newsreader con clamp adaptado a ancho/alto de pantalla y longitud del texto,
 * alineación a la izquierda (10-12% de margen), jerarquía N1 > N2 > N3 y accesibilidad.
 */
export function FraseReposo({ item, mostrarRefCatecismo = true, className }: FraseReposoProps) {
  const reduceMotion = useReducedMotion();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);

  const key = item.tipo === "biblia" ? `biblia-${item.datos.id}` : `catecismo-${item.datos.n}`;
  const escalaBase = calcularEscalaFrase(item);
  const [ajustePorItem, setAjustePorItem] = useState<{ key: string; factor: number }>({
    key,
    factor: 1,
  });

  const factorAjuste = ajustePorItem.key === key ? ajustePorItem.factor : 1;
  const escalaFinal = Math.max(0.55, Math.round(escalaBase * factorAjuste * 1000) / 1000);

  // Si en pantallas de poca altura el bloque renderizado aún supera el alto disponible,
  // reduce adicionalmente la escala tipográfica para que nunca desborde ni empuje el botón Entrar.
  useEffect(() => {
    const contenedor = contenedorRef.current;
    const contenido = contenidoRef.current;
    if (!contenedor || !contenido) return;

    const verificarAjuste = () => {
      const altoDisponible = contenedor.clientHeight;
      const altoContenido = contenido.scrollHeight;
      if (altoDisponible <= 0 || altoContenido <= 0) return;

      if (altoContenido > altoDisponible) {
        const proporcion = (altoDisponible - 8) / altoContenido;
        setAjustePorItem((prev) => {
          const base = prev.key === key ? prev.factor : 1;
          const nuevoFactor = Math.max(0.6, Math.min(1, Math.round(base * proporcion * 1000) / 1000));
          if (prev.key === key && Math.abs(prev.factor - nuevoFactor) < 0.02) return prev;
          return { key, factor: nuevoFactor };
        });
      }
    };

    verificarAjuste();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(verificarAjuste);
    observer.observe(contenedor);
    return () => observer.disconnect();
  }, [key, escalaFinal]);

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

  return (
    <div
      ref={contenedorRef}
      aria-live="polite"
      style={{ "--escala-frase": escalaFinal } as React.CSSProperties}
      className={cn(
        "flex h-full max-h-full items-center text-left select-none relative z-10 w-full max-w-5xl px-4 sm:px-0",
        className,
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          ref={contenidoRef}
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
                className="font-serif italic text-white text-balance leading-tight max-w-[46ch] text-[calc(var(--escala-frase,1)*clamp(1.25rem,min(0.85rem+1.8vw,3.6dvh),2.35rem))] font-medium"
              >
                {item.datos.la}
              </div>

              {/* N2: Español (Torres Amat) */}
              <div
                lang="es"
                className="mt-3 sm:mt-4 font-serif not-italic text-white/90 text-balance leading-snug sm:leading-normal max-w-[62ch] text-[max(0.875rem,calc(var(--escala-frase,1)*clamp(0.95rem,min(0.75rem+0.9vw,2.3dvh),1.35rem)))]"
              >
                {item.datos.es}
              </div>

              {/* N3: Referencia Bíblica */}
              <div
                lang="es"
                className="mt-2.5 sm:mt-3.5 font-sans uppercase tracking-[0.18em] text-white/70 text-xs sm:text-sm font-semibold"
              >
                {item.datos.ref}
              </div>
            </>
          ) : (
            <>
              {/* N1: Pregunta del Catecismo */}
              <div
                lang="es"
                className="font-serif not-italic text-white text-balance leading-tight max-w-[46ch] text-[calc(var(--escala-frase,1)*clamp(1.25rem,min(0.85rem+1.8vw,3.6dvh),2.35rem))] font-medium"
              >
                {item.datos.pregunta}
              </div>

              {/* N2: Respuesta del Catecismo */}
              <div
                lang="es"
                className="mt-3 sm:mt-4 font-serif not-italic text-white/90 text-balance leading-snug sm:leading-normal max-w-[62ch] text-[max(0.875rem,calc(var(--escala-frase,1)*clamp(0.95rem,min(0.75rem+0.9vw,2.3dvh),1.35rem)))]"
              >
                {item.datos.respuesta}
              </div>

              {/* N3: Referencia opcional */}
              {mostrarRefCatecismo ? (
                <div
                  lang="es"
                  className="mt-2.5 sm:mt-3.5 font-sans uppercase tracking-[0.18em] text-white/70 text-xs sm:text-sm font-semibold"
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

