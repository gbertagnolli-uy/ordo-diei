"use client";
// Diario (lane 286): lista de plantillas para crearlas, editarlas y elegir la predeterminada. Portado de vendor/Daily_You/lib/pages/templates_page.dart
// (Demizo/Daily_You@7cc237d): la estrella marca la que se carga sola al escribir una entrada nueva.
import { useState } from "react";
import { FileText, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AccionesCatalogo } from "../etiquetas/useCatalogo";
import { EditorPlantilla } from "./EditorPlantilla";
import type { AccionesPlantillas } from "./usePlantillas";

export function AdministrarPlantillas({
  plantillas,
  catalogo,
  esPadre,
  onAdministrarEtiquetas,
  onCerrar,
}: {
  plantillas: AccionesPlantillas;
  catalogo: AccionesCatalogo;
  /** En el diario familiar solo un padre puede marcar la predeterminada. */
  esPadre: boolean;
  onAdministrarEtiquetas: () => void;
  onCerrar: () => void;
}) {
  // undefined = lista; null = plantilla nueva; número = id de la que se edita
  const [editando, setEditando] = useState<number | null | undefined>(undefined);
  const lista = plantillas.lista;
  const puedeFijar = plantillas.tipo === "personal" || esPadre;

  return (
    <Sheet open onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Plantillas</SheetTitle>
          <SheetDescription>La estrella marca la plantilla que se carga sola en cada entrada nueva.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <Button type="button" onClick={() => setEditando(null)}>
            <Plus /> Nueva plantilla
          </Button>
          {lista === null && <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>}
          {lista?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Aún no se han creado plantillas…</p>}
          <ul className="flex flex-col">
            {lista?.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-muted disabled:opacity-60" disabled={!p.puedoEditar} onClick={() => setEditando(p.id)}>
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{p.nombre}</span>
                    {p.texto && <span className="block truncate text-xs text-muted-foreground">{p.texto.replace(/\s+/g, " ")}</span>}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!puedeFijar}
                  aria-pressed={p.predeterminada}
                  aria-label={p.predeterminada ? `Quitar «${p.nombre}» como predeterminada` : `Usar «${p.nombre}» como predeterminada`}
                  title={p.predeterminada ? "Predeterminada" : "Marcar como predeterminada"}
                  onClick={() => void plantillas.predeterminada(p.id, !p.predeterminada)}
                >
                  <Star className={cn(p.predeterminada && "fill-current text-warning")} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
        {editando !== undefined && (
          <EditorPlantilla
            key={editando ?? "nueva"}
            plantilla={editando === null ? undefined : lista?.find((p) => p.id === editando)}
            plantillas={plantillas}
            catalogo={catalogo}
            onAdministrarEtiquetas={onAdministrarEtiquetas}
            onCerrar={() => setEditando(undefined)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
