"use client";
// Diario (lane 296): elegir el clima de la entrada. Portado de vendor/moodiary/.../moodiary_editor/lib/src/application/edit_controller.dart (`fetchWeather`,
// `_onChangeWeather`) y de moodiary_models/lib/src/manual_weather.dart (ZhuJHua/moodiary@2c552dd): el clima de ahora en la ubicación, o uno de los 16 manuales
// (que guardan solo código y texto, sin temperatura).
import { useState } from "react";
import { Check, CloudOff, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLIMAS_MANUALES, climaManual, textoClima, type Clima } from "@/lib/diario/clima";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { IconoClima } from "./iconos";
import { obtenerClima, obtenerUbicacion } from "./ubicacion";

export function SelectorClima({ valor, onElegir, onCerrar }: { valor: Clima | null; onElegir: (c: Clima | null) => void; onCerrar: () => void }) {
  const [buscando, setBuscando] = useState(false);

  async function deAhora() {
    setBuscando(true);
    try {
      const clima = await obtenerClima(await obtenerUbicacion(true));
      onElegir(clima);
      onCerrar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo obtener el clima");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Clima</DialogTitle>
        </DialogHeader>
        {valor && <p className="text-sm text-muted-foreground">Ahora: {textoClima(valor)}</p>}
        <Button type="button" disabled={buscando} onClick={() => void deAhora()}>
          <LocateFixed /> {buscando ? "Consultando…" : "Clima de ahora en mi ubicación"}
        </Button>
        <ul className="grid grid-cols-2 gap-2">
          {CLIMAS_MANUALES.map((c) => (
            <li key={c.codigo}>
              <button
                type="button"
                aria-pressed={valor?.codigo === c.codigo}
                className={cn("flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted", valor?.codigo === c.codigo && "border-primary bg-primary/10")}
                onClick={() => {
                  const manual = climaManual(c.codigo);
                  if (manual) onElegir(manual);
                  onCerrar();
                }}
              >
                <IconoClima codigo={c.codigo} tamano={20} />
                <span className="min-w-0 flex-1 truncate">{c.texto}</span>
                {valor?.codigo === c.codigo && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
        <DialogFooter>
          {valor && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onElegir(null);
                onCerrar();
              }}
            >
              <CloudOff /> Quitar clima
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
