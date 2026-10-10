"use client";

import React from "react";
import HoloCard from "@/components/HoloCard";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type GradoCarta,
  type RarezaCarta,
} from "@/lib/cartas/economia";
import { imagenDeGrado, type CartaConImagenes } from "@/lib/cartas/fragmentos";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import { urlArte } from "@/lib/cartas/arte";

export interface CartaVistaProps {
  carta: CartaConImagenes & {
    clave: string;
    nombre: string;
    subtitulo?: string | null;
    rareza: RarezaCarta;
    fragmentosRequeridos: number;
  };
  modo?: "holo" | "plana" | "bloqueada";
  grado?: GradoCarta;
  fragmentos?: number;
  ancho?: number; // ancho en px (default 300)
  className?: string;
  onClick?: () => void;
  prioridad?: boolean;
}

// Colores de marco y brillo por rareza
const ESTILOS_RAREZA: Record<
  RarezaCarta,
  {
    borde: string;
    bordeHolo: string;
    fondo: string;
    textoBadge: string;
    badgeBg: string;
    preset: "bursts" | "stars" | "shards" | "cosmos" | "rainbow" | "swirl" | "glitter" | "gold";
    intensidadBase: number;
    foilColor: string;
  }
> = {
  Comun: {
    borde: "border-stone-400/60",
    bordeHolo: "#a8a29e",
    fondo: "from-stone-900/90 via-stone-950 to-stone-900",
    textoBadge: "text-stone-300",
    badgeBg: "bg-stone-800/80 border-stone-600/50",
    preset: "bursts",
    intensidadBase: 0, // D1: Común sin holo
    foilColor: "#d6d3d1",
  },
  Buena: {
    borde: "border-emerald-600/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
    bordeHolo: "#059669",
    fondo: "from-stone-950 via-emerald-950/30 to-stone-950",
    textoBadge: "text-emerald-300",
    badgeBg: "bg-emerald-950/80 border-emerald-700/50",
    preset: "glitter",
    intensidadBase: 0.4,
    foilColor: "#a7f3d0",
  },
  Perfecta: {
    borde: "border-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.3)]",
    bordeHolo: "#d97706",
    fondo: "from-stone-950 via-amber-950/30 to-stone-950",
    textoBadge: "text-amber-200",
    badgeBg: "bg-amber-950/80 border-amber-600/60",
    preset: "gold",
    intensidadBase: 0.85,
    foilColor: "#fef08a",
  },
  Celestial: {
    borde: "border-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.4)]",
    bordeHolo: "#38bdf8",
    fondo: "from-slate-950 via-sky-950/40 to-slate-950",
    textoBadge: "text-sky-200",
    badgeBg: "bg-sky-950/80 border-sky-500/70",
    preset: "cosmos",
    intensidadBase: 1.0,
    foilColor: "#bae6fd",
  },
};

export function CartaVista({
  carta,
  modo = "plana",
  grado = 1,
  ancho = 280,
  className,
  onClick,
}: CartaVistaProps) {
  const estilo = ESTILOS_RAREZA[carta.rareza];
  const imagenActual = urlArte(imagenDeGrado(carta, modo === "bloqueada" ? 0 : grado));
  const esGloriosa = grado === 4;
  const esVenerada = grado >= 2;

  // Multiplicador de intensidad de holo según Grado (D14: grado III más intensa)
  const factorGrado = grado === 3 ? 1.3 : grado === 4 ? 1.4 : grado === 2 ? 1.15 : 1.0;
  const intensidadHolo = Math.min(1.0, estilo.intensidadBase * factorGrado);

  // Modo BLOQUEADA: solo el arte en blanco y negro con el candado encima.
  // Llena el contenedor (que ya fija la proporción 63:88); nombre y progreso
  // los muestra cada vista afuera de la carta.
  if (modo === "bloqueada") {
    return (
      <div
        role="img"
        aria-label={`${carta.nombre} (Bloqueada)`}
        onClick={onClick}
        className={cn(
          "relative aspect-[63/88] w-full overflow-hidden rounded-xl bg-stone-900 select-none",
          onClick && "cursor-pointer",
          className
        )}
        style={{ maxWidth: `${ancho}px` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urlArte(carta.imagenUrl)}
          alt=""
          className="size-full object-cover grayscale"
          draggable={false}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-black/50 p-3 text-stone-100 shadow-lg">
            <Lock className="size-6" />
          </div>
        </div>
      </div>
    );
  }

  // Modo HOLO (React Bits HoloCard)
  if (modo === "holo") {
    return (
      <div
        role="img"
        aria-label={`${carta.nombre} · ${TEXTOS_CARTAS.grados[grado]}`}
        onClick={onClick}
        className={cn(
          "relative flex flex-col items-center transition-all select-none",
          esGloriosa && "p-2 rounded-2xl",
          className
        )}
      >
        {/* Halo sagrado animado para Grado IV (Gloriosa) */}
        {esGloriosa && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2 rounded-2xl bg-gradient-to-r from-amber-400/40 via-sky-400/30 to-amber-400/40 opacity-75 blur-md animate-pulse motion-reduce:animate-none"
          />
        )}

        {/* Componente HoloCard oficial */}
        <div className="relative">
          <HoloCard
            image={imagenActual}
            alt={carta.nombre}
            preset={estilo.preset}
            intensity={intensidadHolo}
            width={ancho}
            foilColor={estilo.foilColor}
            frame={4}
            radius={12}
            className="shadow-2xl"
          />

          {/* Insignia de Grado */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-serif font-bold tracking-wider backdrop-blur-md shadow-md border",
                grado === 4
                  ? "bg-amber-500/90 text-stone-950 border-amber-300 font-extrabold"
                  : grado >= 2
                  ? "bg-stone-900/90 text-amber-300 border-amber-500/70"
                  : "bg-stone-900/80 text-stone-200 border-stone-600/60"
              )}
            >
              {grado === 4 && <Sparkles className="size-3 text-stone-950" />}
              {TEXTOS_CARTAS.gradosRomanos[grado]}
            </span>
          </div>

          <div className="absolute top-3 right-3 pointer-events-none">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider backdrop-blur-md shadow-md border",
                estilo.badgeBg,
                estilo.textoBadge
              )}
            >
              {TEXTOS_CARTAS.rarezas[carta.rareza]}
            </span>
          </div>
        </div>

        {/* Título y etiqueta de Grado */}
        <div className="mt-3 text-center">
          <h3 className="font-serif text-base font-bold text-stone-100 tracking-wide">
            {carta.nombre}
          </h3>
          <p
            className={cn(
              "text-xs font-serif italic mt-0.5",
              grado === 4
                ? "text-amber-300 font-semibold"
                : "text-stone-400"
            )}
          >
            {TEXTOS_CARTAS.grados[grado]}
          </p>
        </div>
      </div>
    );
  }

  // Modo PLANA (para grillas con inclinación CSS liviana, D8)
  return (
    <div
      role="group"
      aria-label={`${carta.nombre} (${TEXTOS_CARTAS.grados[grado]})`}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center overflow-hidden rounded-xl border p-2.5 shadow-md select-none transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl",
        "motion-reduce:hover:translate-y-0",
        estilo.borde,
        esVenerada && "ring-1 ring-amber-400/50",
        esGloriosa && "ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
        className
      )}
      style={{ width: `${ancho}px` }}
    >
      {/* Halo sutil para Grado IV */}
      {esGloriosa && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 rounded-xl bg-gradient-to-tr from-amber-400/20 via-sky-300/20 to-amber-300/20 blur-sm"
        />
      )}

      {/* Imagen de la carta con ratio 63:88 */}
      <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg bg-stone-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagenActual}
          alt={carta.nombre}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
          draggable={false}
        />

        {/* Sello de Grado en número romano */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-serif font-bold tracking-wider backdrop-blur-md shadow border",
              grado === 4
                ? "bg-amber-400 text-stone-950 border-amber-200 font-extrabold"
                : grado >= 2
                ? "bg-stone-900/90 text-amber-300 border-amber-400/80"
                : "bg-stone-900/80 text-stone-200 border-stone-600/70"
            )}
          >
            {grado === 4 && <Sparkles className="size-2.5 text-stone-950" />}
            {TEXTOS_CARTAS.gradosRomanos[grado]}
          </span>
        </div>

        {/* Etiqueta de Rareza */}
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md shadow border",
              estilo.badgeBg,
              estilo.textoBadge
            )}
          >
            {TEXTOS_CARTAS.rarezas[carta.rareza]}
          </span>
        </div>
      </div>

      {/* Pie con nombre */}
      <div className="mt-2 w-full text-center">
        <h4 className="font-serif text-sm font-semibold text-stone-200 line-clamp-1 group-hover:text-stone-100">
          {carta.nombre}
        </h4>
        <p className="text-[11px] font-serif italic text-stone-400 line-clamp-1">
          {TEXTOS_CARTAS.gradosCortos[grado]}
        </p>
      </div>
    </div>
  );
}
