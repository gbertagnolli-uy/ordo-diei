"use client";
// Diario (lane 288): qué se muestra en el calendario. Portado de vendor/Daily_You/lib/widgets/calendar_view_options_dialog.dart (Demizo/Daily_You@7cc237d):
// imágenes, ánimo y una etiqueta (común o contador) encima de cada día. La etiqueta se elige de la lista del catálogo.
import { useState } from "react";
import { Image as ImagenIcono, Smile, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { OpcionesCalendario } from "@/lib/diario/calendario";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { Segmentos } from "../estadisticas/controles";
import { ChipEtiqueta } from "../etiquetas/ChipEtiqueta";

type Modo = "ninguna" | "etiqueta" | "contador";

export function OpcionesDelCalendario({ opciones, catalogo, onCambiar, onCerrar }: { opciones: OpcionesCalendario; catalogo: Catalogo | null; onCambiar: (o: OpcionesCalendario) => void; onCerrar: () => void }) {
  const actual = catalogo?.etiquetas.find((e) => e.id === opciones.etiqueta) ?? null;
  const [modo, setModo] = useState<Modo>(actual ? (actual.tipo === "contador" ? "contador" : "etiqueta") : "ninguna");
  const lista = (catalogo?.etiquetas ?? []).filter((e) => (modo === "contador" ? e.tipo === "contador" : e.tipo === "etiqueta"));

  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Vista del calendario</DialogTitle>
          <DialogDescription>Elegí qué se ve en cada día.</DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-3">
          <ImagenIcono aria-hidden className="size-5 text-muted-foreground" />
          <span className="flex-1 text-sm">Imágenes</span>
          <Switch checked={opciones.imagenes} onCheckedChange={(imagenes) => onCambiar({ ...opciones, imagenes })} aria-label="Mostrar imágenes" />
        </label>
        <label className="flex items-center gap-3">
          <Smile aria-hidden className="size-5 text-muted-foreground" />
          <span className="flex-1 text-sm">Ánimo</span>
          <Switch checked={opciones.animo} onCheckedChange={(animo) => onCambiar({ ...opciones, animo })} aria-label="Mostrar el ánimo" />
        </label>
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-3 text-sm">
            <Tag aria-hidden className="size-5 text-muted-foreground" />
            Etiqueta en cada día
          </p>
          <Segmentos
            etiqueta="Tipo de etiqueta"
            valor={modo}
            opciones={[
              { valor: "ninguna", titulo: "Ninguna" },
              { valor: "etiqueta", titulo: "Etiqueta" },
              { valor: "contador", titulo: "Contador" },
            ]}
            onCambio={(m) => {
              setModo(m);
              if (m === "ninguna" || (actual && (m === "contador") !== (actual.tipo === "contador"))) onCambiar({ ...opciones, etiqueta: null });
            }}
          />
          {modo !== "ninguna" &&
            (lista.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay {modo === "contador" ? "contadores" : "etiquetas"} creados.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Etiqueta del calendario">
                {lista.map((e) => (
                  <span key={e.id} className={cn("rounded-2xl", e.id === opciones.etiqueta && "ring-2 ring-primary ring-offset-1")}>
                    <ChipEtiqueta etiqueta={e} pequeno onClick={() => onCambiar({ ...opciones, etiqueta: e.id === opciones.etiqueta ? null : e.id })} />
                  </span>
                ))}
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
