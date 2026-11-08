"use client";
// Diario (lane 295): la tarjeta del nodo elegido: título, fecha, cuántos enlaces salen y cuántos llegan, y acciones para abrirlo y centrar el grafo en él.
// Portado de `GraphInfoCard` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/graph_info_card.dart, ZhuJHua/moodiary@2c552dd).
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Crosshair, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colorCss, type Rgba } from "@/lib/diario/grafo-color";
import type { NodoGrafo } from "@/lib/diario/grafo";
import { fechaLarga } from "../estadisticas/controles";

function Contador({ icono: Icono, cantidad, titulo }: { icono: typeof ArrowUpRight; cantidad: number; titulo: string }) {
  if (cantidad <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground" title={titulo}>
      <Icono className="size-3 text-primary" aria-hidden />
      {cantidad}
      <span className="sr-only">{titulo}</span>
    </span>
  );
}

export function TarjetaNodo({
  nodo,
  color,
  salientes,
  entrantes,
  onAbrir,
  onCentrar,
  onCerrar,
}: {
  nodo: NodoGrafo;
  color: Rgba;
  salientes: number;
  entrantes: number;
  onAbrir: () => void;
  /** Ausente en el nodo que ya es el centro. */
  onCentrar?: () => void;
  onCerrar?: () => void;
}) {
  const titulo = nodo.titulo.trim() || fechaLarga(nodo.fecha);
  return (
    <div className="flex items-center gap-1 rounded-2xl border bg-card/90 py-1 pr-1 pl-3 shadow-md backdrop-blur animate-in fade-in slide-in-from-bottom-2">
      <button type="button" onClick={onAbrir} aria-label={`Abrir la entrada ${titulo}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1.5 text-left hover:bg-muted/60">
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: colorCss(color) }} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{titulo}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-xs text-muted-foreground">{fechaLarga(nodo.fecha)}</span>
            <Contador icono={ArrowUpRight} cantidad={salientes} titulo="Enlaces que salen" />
            <Contador icono={ArrowDownLeft} cantidad={entrantes} titulo="Enlaces que llegan" />
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      {onCentrar && (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Centrar el grafo en esta entrada" title="Centrar el grafo en esta entrada" onClick={onCentrar}>
          <Crosshair />
        </Button>
      )}
      {onCerrar && (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={onCerrar}>
          <X />
        </Button>
      )}
    </div>
  );
}
