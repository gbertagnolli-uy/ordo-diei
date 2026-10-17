"use client";

// Portado de vendor/roost/src/components/events/AttendeeList.tsx (msrbuilds/roost@492af47).
// Cambios: avatares de los hijos que participaron (sin estados de asistencia ni RSVP), Avatar de ui/, tokens de Ordo.

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EventWithDetails } from "@/lib/homeschooling/roost/tipos";

export default function ParticipantesList({ participantes, conNombres = false }: { participantes: EventWithDetails["participantes"]; conNombres?: boolean }) {
  if (participantes.length === 0) return <p className="text-sm text-muted-foreground">Sin participantes</p>;
  return (
    <ul className={conNombres ? "space-y-2" : "flex -space-x-2"}>
      {participantes.map((p) => (
        <li key={p.id} className="flex items-center gap-2">
          <Avatar size="sm" title={p.nombre}>
            {p.fotoUrl && <AvatarImage src={p.fotoUrl} alt={p.nombre} />}
            <AvatarFallback>{p.nombre.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {conNombres && <span className="text-sm text-foreground">{p.nombre}</span>}
        </li>
      ))}
    </ul>
  );
}
