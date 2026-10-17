"use client";

// Portado de vendor/roost/src/components/events/EventDetails.tsx (msrbuilds/roost@492af47).
// Cambios: detalle en un Sheet de ui/ con duración y participantes; sin RSVP ni enlace de reunión; editar y borrar se hacen deslizando la tarjeta en la lista (AdminItem).

import { Clock, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatoDuracion } from "@/lib/homeschooling/horas";
import type { EventWithDetails } from "@/lib/homeschooling/roost/tipos";
import ParticipantesList from "./ParticipantesList";

export default function ActividadDetalle({
  actividad,
  onClose,
}: {
  actividad: EventWithDetails | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!actividad} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {actividad && (
          <>
            <SheetHeader>
              <SheetTitle>{actividad.title}</SheetTitle>
              <SheetDescription>{actividad.materia_name}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 text-sm">
              <p className="flex items-center gap-2 text-foreground">
                <Clock className="size-4 text-muted-foreground" />
                {new Date(actividad.start_time).toLocaleString("es", { dateStyle: "full", timeStyle: "short" })} · {formatoDuracion(actividad.duracion_min)}
              </p>
              {actividad.location && (
                <p className="flex items-center gap-2 text-foreground">
                  <MapPin className="size-4 text-muted-foreground" /> {actividad.location}
                </p>
              )}
              {actividad.description && <p className="whitespace-pre-wrap text-muted-foreground">{actividad.description}</p>}
              <div className="space-y-2">
                <p className="font-medium text-foreground">Participaron</p>
                <ParticipantesList participantes={actividad.participantes} conNombres />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
