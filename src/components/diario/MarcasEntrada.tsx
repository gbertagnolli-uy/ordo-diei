"use client";
// Diario (lane 285): estrella (favorita) y chincheta (fijada) de una entrada. Portado de la idea de vendor/storypad/lib/core/objects/search_filter_object.dart
// (`starred`, `pinned`) (theachoem/storypad@a76825e); los botones son de esta app.
import { Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Marcas } from "@/lib/diario/reglas";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Cambia las marcas en el servidor. Devuelve si salió bien (si no, ya avisó con un toast). */
export async function cambiarMarcasRemoto(id: number, marcas: Marcas): Promise<boolean> {
  try {
    const r = await fetch(`/api/diario/${id}/marcas`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(marcas) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error ?? "No se pudo marcar");
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "No se pudo marcar");
    return false;
  }
}

export function MarcasEntrada({
  favorita,
  fijada,
  editable,
  onCambiar,
}: {
  favorita: boolean;
  fijada: boolean;
  /** Quien la escribió puede cambiarlas; el resto solo las ve. */
  editable: boolean;
  onCambiar: (marcas: Marcas) => void;
}) {
  if (!editable) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        {favorita && <Star className="size-4 fill-current text-warning" aria-label="Favorita" />}
        {fijada && <Pin className="size-4 fill-current text-primary" aria-label="Fijada" />}
      </span>
    );
  }
  return (
    <span className="flex items-center">
      <Button variant="ghost" size="icon-sm" aria-label={favorita ? "Quitar de favoritas" : "Marcar como favorita"} aria-pressed={favorita} title="Favorita" onClick={() => onCambiar({ favorita: !favorita })}>
        <Star className={cn(favorita && "fill-current text-warning")} />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={fijada ? "Desfijar" : "Fijar arriba"} aria-pressed={fijada} title="Fijar arriba" onClick={() => onCambiar({ fijada: !fijada })}>
        <Pin className={cn(fijada && "fill-current text-primary")} />
      </Button>
    </span>
  );
}
