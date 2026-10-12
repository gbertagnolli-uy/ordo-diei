"use client";

import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { RarezaCarta } from "@/lib/cartas/economia";

interface ReversoCartaProps {
  clave: string;
  nombre: string;
  subtitulo?: string | null;
  rareza: RarezaCarta;
  desbloqueada: boolean;
  grado: 0 | 1 | 2 | 3 | 4;
  fragmentos: number;
  fragmentosRequeridos: number;
}

const COLOR_RAREZA: Record<RarezaCarta, string> = {
  Comun: "text-stone-300 border-stone-500/60",
  Buena: "text-emerald-300 border-emerald-600/60",
  Perfecta: "text-amber-200 border-amber-500/70",
  Celestial: "text-sky-200 border-sky-400/70",
};

// Dorso de la carta: solo muestra lo que el usuario ya puede ver (nombre, rareza, grado, progreso)
export function ReversoCarta({
  clave,
  nombre,
  subtitulo,
  rareza,
  desbloqueada,
  grado,
  fragmentos,
  fragmentosRequeridos,
}: ReversoCartaProps) {
  const pct = fragmentosRequeridos > 0 ? Math.min(100, Math.floor((fragmentos / fragmentosRequeridos) * 100)) : 0;

  return (
    <div className="flex size-full flex-col items-center justify-between bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 p-4 text-center text-stone-100">
      <div className="pointer-events-none absolute inset-2 rounded-[10px] border border-amber-500/40" aria-hidden="true" />

      <span
        className={cn(
          "relative mt-3 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
          COLOR_RAREZA[rareza]
        )}
      >
        {TEXTOS_CARTAS.rarezas[rareza]}
      </span>

      <div className="relative flex flex-col items-center gap-2 px-2">
        {desbloqueada ? (
          <BookOpen className="size-8 text-amber-400" aria-hidden="true" />
        ) : (
          <Lock className="size-8 text-stone-400" aria-hidden="true" />
        )}
        <h3 className="font-serif text-xl font-bold leading-tight tracking-wide text-balance">{nombre}</h3>
        {subtitulo ? <p className="font-serif text-sm italic text-stone-400 text-balance">{subtitulo}</p> : null}
        <p className={cn("font-serif text-xs italic", grado === 4 ? "font-semibold text-amber-300" : "text-stone-400")}>
          {TEXTOS_CARTAS.grados[grado]}
        </p>
        {!desbloqueada && (
          <p className="font-mono text-xs tabular-nums text-stone-300">
            {fragmentos} / {fragmentosRequeridos} · {pct}%
          </p>
        )}
      </div>

      <Link
        href={`/dashboard/cartas/${clave}`}
        className="relative mb-3 inline-flex h-9 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-amber-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
      >
        Abrir carta
      </Link>
    </div>
  );
}
