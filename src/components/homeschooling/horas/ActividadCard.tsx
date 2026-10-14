"use client";

// Portado de vendor/roost/src/components/events/EventCard.tsx (msrbuilds/roost@492af47).
// Cambios: tarjeta de actividad con duración, materia y participantes; sin RSVP, sin enlace virtual; tokens de Ordo.

import { Clock, MapPin } from "lucide-react";
import { formatoDuracion } from "@/lib/homeschooling/horas";
import type { EventWithDetails } from "@/lib/homeschooling/roost/tipos";
import ParticipantesList from "./ParticipantesList";

export default function ActividadCard({ actividad, onClick }: { actividad: EventWithDetails; onClick: (a: EventWithDetails) => void }) {
  const inicio = new Date(actividad.start_time);
  return (
    <button type="button" onClick={() => onClick(actividad)} className="flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50">
      <div className="w-14 shrink-0 rounded-lg bg-primary/10 py-2 text-center text-primary">
        <p className="text-xs font-medium uppercase">{inicio.toLocaleDateString("es", { month: "short" })}</p>
        <p className="text-xl font-bold leading-none">{inicio.getDate()}</p>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="truncate font-semibold text-foreground">{actividad.title}</h3>
        <p className="text-xs text-muted-foreground">{actividad.materia_name}</p>
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {inicio.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} · {formatoDuracion(actividad.duracion_min)}
          </span>
          {actividad.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {actividad.location}
            </span>
          )}
        </p>
      </div>
      <ParticipantesList participantes={actividad.participantes} />
    </button>
  );
}
