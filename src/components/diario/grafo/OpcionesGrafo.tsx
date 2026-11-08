"use client";
// Diario (lane 295): la hoja «Vista» del grafo: período, densidad, color y etiquetas.
// Portado de `_openViewSheet` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/diary_graph_page.dart, ZhuJHua/moodiary@2c552dd).
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { DENSIDADES_GRAFO, MODOS_COLOR_GRAFO, PERIODOS_GRAFO, type OpcionesGrafo } from "@/lib/diario/grafo";
import { Segmentos } from "../estadisticas/controles";

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function OpcionesDelGrafo({ opciones, onCambiar, onCerrar }: { opciones: OpcionesGrafo; onCambiar: (o: OpcionesGrafo) => void; onCerrar: () => void }) {
  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Vista del grafo</DialogTitle>
          <DialogDescription>Cómo se ve el grafo de enlaces. Se recuerda en este navegador.</DialogDescription>
        </DialogHeader>
        <Grupo titulo="Período">
          <Segmentos etiqueta="Período" opciones={PERIODOS_GRAFO} valor={opciones.periodo} onCambio={(periodo) => onCambiar({ ...opciones, periodo })} />
        </Grupo>
        <Grupo titulo="Densidad">
          <Segmentos etiqueta="Densidad" opciones={DENSIDADES_GRAFO} valor={opciones.densidad} onCambio={(densidad) => onCambiar({ ...opciones, densidad })} />
        </Grupo>
        <Grupo titulo="Color por">
          <Segmentos etiqueta="Color por" opciones={MODOS_COLOR_GRAFO} valor={opciones.color} onCambio={(color) => onCambiar({ ...opciones, color })} />
        </Grupo>
        <label className="flex items-center gap-3">
          <span className="flex-1 text-sm">Mostrar etiquetas</span>
          <Switch checked={opciones.etiquetas} onCheckedChange={(etiquetas) => onCambiar({ ...opciones, etiquetas })} aria-label="Mostrar etiquetas" />
        </label>
      </DialogContent>
    </Dialog>
  );
}
