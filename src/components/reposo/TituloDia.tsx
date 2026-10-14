"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type DiaLiturgicoTitulo = {
  version: string;
  fecha: string;
  titulo: string;
  tituloEs?: string | null;
  rango: string;
  lineas: string[];
  color?: string;
  tiempo?: string;
  dominical?: boolean;
};

interface TituloDiaProps {
  dia: DiaLiturgicoTitulo | null;
  className?: string;
}

/**
 * Esquina superior derecha: Título del oficio del día según Divinum Officium (SPEC §4.1, §4.2).
 * Newsreader, 2-3 líneas, máx 36ch, primera línea en cursiva, ~ Duplex y Tempora con opacidad 0.7.
 */
export function TituloDia({ dia, className }: TituloDiaProps) {
  if (!dia || !dia.titulo) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-end text-right font-serif text-sm sm:text-base max-w-[36ch] leading-snug drop-shadow-md select-none pointer-events-none transition-opacity duration-300",
        className,
      )}
    >
      <span className="italic text-white font-medium">{dia.titulo}</span>
      {dia.rango ? <span className="text-white/70 text-xs sm:text-sm">~ {dia.rango}</span> : null}
      {Array.isArray(dia.lineas) && dia.lineas.length > 0 ? (
        <span className="text-white/70 text-xs sm:text-sm line-clamp-2">
          {dia.lineas.join(" · ")}
        </span>
      ) : null}
    </div>
  );
}
