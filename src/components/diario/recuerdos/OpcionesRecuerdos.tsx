"use client";
// Diario (lane 289): qué recuerdos se muestran. Portado de vendor/Daily_You/lib/pages/settings/flashback_settings.dart (Demizo/Daily_You@7cc237d):
// mostrar los recuerdos, excluir los días malos, ocultar las imágenes y prender o apagar cada grupo.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CLAVES_RECUERDO, TITULOS_RECUERDO, type OpcionesRecuerdos } from "@/lib/diario/recuerdos";

function Fila({ titulo, detalle, valor, onCambio, deshabilitado }: { titulo: string; detalle?: string; valor: boolean; onCambio: (v: boolean) => void; deshabilitado?: boolean }) {
  return (
    <label className="flex items-center gap-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm">{titulo}</span>
        {detalle && <span className="text-xs text-muted-foreground">{detalle}</span>}
      </span>
      <Switch checked={valor} disabled={deshabilitado} onCheckedChange={onCambio} aria-label={titulo} />
    </label>
  );
}

export function OpcionesDeRecuerdos({ opciones, onCambiar, onCerrar }: { opciones: OpcionesRecuerdos; onCambiar: (o: OpcionesRecuerdos) => void; onCerrar: () => void }) {
  const apagado = !opciones.mostrar;
  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Recuerdos</DialogTitle>
          <DialogDescription>Entradas de otros días que aparecen arriba de la lista.</DialogDescription>
        </DialogHeader>
        <Fila titulo="Mostrar recuerdos" valor={opciones.mostrar} onCambio={(mostrar) => onCambiar({ ...opciones, mostrar })} />
        <Fila titulo="Excluir los días malos" detalle="No muestra las entradas con ánimo 1 o 2." valor={opciones.sinMalos} deshabilitado={apagado} onCambio={(sinMalos) => onCambiar({ ...opciones, sinMalos })} />
        <Fila titulo="Ocultar imágenes" valor={opciones.ocultarImagenes} deshabilitado={apagado} onCambio={(ocultarImagenes) => onCambiar({ ...opciones, ocultarImagenes })} />
        <div className="flex flex-col gap-3 border-t pt-3">
          <p className="text-sm font-medium">Qué recuerdos</p>
          {CLAVES_RECUERDO.map((c) => (
            <Fila key={c} titulo={TITULOS_RECUERDO[c]} valor={opciones.activos[c]} deshabilitado={apagado} onCambio={(v) => onCambiar({ ...opciones, activos: { ...opciones.activos, [c]: v } })} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
