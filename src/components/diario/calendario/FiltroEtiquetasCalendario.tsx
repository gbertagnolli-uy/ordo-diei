"use client";
// Diario (lane 288): filtro por etiqueta sobre el calendario y la lista. Portado de vendor/storypad/lib/views/calendar/mood/mood_calendar_content.dart
// (theachoem/storypad@a76825e, `SpScrollableChoiceChips`): «Todas» y una pastilla por etiqueta; la elegida muestra cuántas entradas hay.
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { IconoEtiqueta } from "../etiquetas/iconos";

export function FiltroEtiquetasCalendario({ catalogo, elegida, cantidad, onElegir }: { catalogo: Catalogo | null; elegida: number | null; cantidad: number; onElegir: (id: number | null) => void }) {
  const etiquetas = (catalogo?.etiquetas ?? []).filter((e) => e.usos > 0 || e.id === elegida);
  if (etiquetas.length === 0) return null;
  const pastilla = (activa: boolean) => cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-sm transition", activa ? "border-primary bg-primary/10 font-medium text-primary" : "bg-card hover:bg-muted");
  return (
    <div role="group" aria-label="Filtrar por etiqueta" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      <button type="button" aria-pressed={elegida === null} className={pastilla(elegida === null)} onClick={() => onElegir(null)}>
        Todas
      </button>
      {etiquetas.map((e) => (
        <button key={e.id} type="button" aria-pressed={e.id === elegida} className={pastilla(e.id === elegida)} onClick={() => onElegir(e.id === elegida ? null : e.id)}>
          <IconoEtiqueta icono={e.icono} tipoIcono={e.tipoIcono} color={e.color} tamano={13} />
          {e.nombre}
          {e.id === elegida && <span className="text-xs tabular-nums opacity-70">{cantidad}</span>}
        </button>
      ))}
    </div>
  );
}
