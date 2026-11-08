"use client";
// Diario (lane 286): elegir una plantilla para insertar en la entrada. Portado de vendor/Daily_You/lib/widgets/{template_select,template_select_popup}.dart
// (Demizo/Daily_You@7cc237d): lista por nombre, «Aún no se han creado plantillas…» y el acceso a «Administrar plantillas».
import { FilePlus2, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PlantillaVista } from "@/lib/diario/servidor-plantillas";
import type { AccionesPlantillas } from "./usePlantillas";

export function SelectorPlantilla({
  plantillas,
  onElegir,
  onAdministrar,
  onCerrar,
}: {
  plantillas: AccionesPlantillas;
  onElegir: (p: PlantillaVista) => void;
  onAdministrar: () => void;
  onCerrar: () => void;
}) {
  const lista = plantillas.lista;
  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar una plantilla</DialogTitle>
        </DialogHeader>
        {lista === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : lista.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aún no se han creado plantillas…</p>
        ) : (
          <ul className="flex flex-col">
            {lista.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-muted"
                  onClick={() => {
                    onElegir(p);
                    onCerrar();
                  }}
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{p.nombre}</span>
                    {p.texto && <span className="block truncate text-xs text-muted-foreground">{p.texto.replace(/\s+/g, " ")}</span>}
                  </span>
                  {p.predeterminada && <Star className="size-4 shrink-0 fill-current text-warning" aria-label="Predeterminada" />}
                </button>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            className="sm:mr-auto"
            onClick={() => {
              onCerrar();
              onAdministrar();
            }}
          >
            <FilePlus2 /> Administrar plantillas
          </Button>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
