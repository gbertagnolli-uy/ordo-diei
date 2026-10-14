"use client";

// Portado de vendor/roost/src/components/groups/learn/LearnSidebar.tsx (msrbuilds/roost@492af47).
// Cambios: solo las lecciones del día, con check y candado en las bloqueadas; el cajón móvil con overlay propio
// desaparece (la lista va dentro del visor); tokens de Ordo.

import { CheckCircle2, Circle, Lock } from "lucide-react";
import type { LeccionHoy } from "@/lib/homeschooling/servidor/hoy";

export default function LeccionesDelDia({
  lecciones,
  completadas,
  activaId,
  onSelect,
}: {
  lecciones: LeccionHoy[];
  completadas: Set<number>;
  activaId?: number;
  onSelect: (leccion: LeccionHoy) => void;
}) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {lecciones.map((l) => {
        const hecha = l.completada || completadas.has(l.id);
        // La lección anterior del mismo día puede haberse terminado recién (sin volver al servidor)
        const previa = lecciones.find((x) => x.orden === l.orden - 1);
        const previaHecha = !!previa && (previa.completada || completadas.has(previa.id));
        const bloqueada = l.bloqueada && !hecha && !previaHecha;
        return (
          <li key={l.id}>
            <button
              type="button"
              disabled={bloqueada}
              onClick={() => onSelect(l)}
              className={`flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                l.id === activaId ? "bg-primary/10 text-primary" : "hover:bg-muted"
              } ${bloqueada ? "cursor-not-allowed text-muted-foreground" : ""}`}
            >
              {hecha ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" />
              ) : bloqueada ? (
                <Lock className="size-5 shrink-0 text-muted-foreground" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/60" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {l.orden}. {l.titulo}
                </span>
                {bloqueada && l.motivo && <span className="block truncate text-xs text-muted-foreground">{l.motivo}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
