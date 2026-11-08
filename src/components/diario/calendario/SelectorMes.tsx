"use client";
// Diario (lane 288): selector de año y mes. Portado de vendor/Daily_You/lib/widgets/year_month_picker.dart (Demizo/Daily_You@7cc237d):
// arriba el año (que se abre como grilla de años), abajo los doce meses; los meses fuera del rango del diario quedan apagados.
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { acotarAnioMes, acotarMes, aniosDelRango, claveDeMes, mesHabilitado, type RangoMeses } from "@/lib/diario/calendario";
import { cn } from "@/lib/utils";
import { MESES } from "../estadisticas/controles";

export function SelectorMes({
  rango,
  inicial,
  conEntradas,
  hoy,
  onElegir,
  onCerrar,
}: {
  rango: RangoMeses;
  /** Mes abierto ("YYYY-MM"). */
  inicial: string;
  /** Meses con entradas ("YYYY-MM"), para marcarlos. */
  conEntradas?: ReadonlySet<string>;
  hoy: string;
  onElegir: (mes: string) => void;
  onCerrar: () => void;
}) {
  const [elegido, setElegido] = useState(() => acotarAnioMes(rango, inicial));
  const [eligiendoAnio, setEligiendoAnio] = useState(false);

  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Ir a un mes</DialogTitle>
        </DialogHeader>
        <Button type="button" variant="ghost" className="mx-auto text-lg" aria-expanded={eligiendoAnio} onClick={() => setEligiendoAnio(!eligiendoAnio)}>
          {elegido.anio}
          {eligiendoAnio ? <ChevronUp /> : <ChevronDown />}
        </Button>
        {eligiendoAnio ? (
          <div className="grid max-h-60 grid-cols-3 gap-1 overflow-y-auto" role="group" aria-label="Año">
            {aniosDelRango(rango).map((anio) => (
              <button
                key={anio}
                type="button"
                aria-pressed={anio === elegido.anio}
                onClick={() => {
                  setElegido({ anio, mes: acotarMes(rango, anio, elegido.mes) });
                  setEligiendoAnio(false);
                }}
                className={cn(
                  "h-11 rounded-full text-base transition",
                  anio === elegido.anio ? "bg-primary font-semibold text-primary-foreground" : anio === rango.ultimo.anio ? "border border-primary text-primary" : "hover:bg-muted",
                )}
              >
                {anio}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1" role="group" aria-label="Mes">
            {MESES.map((nombre, i) => {
              const mes = i + 1;
              const habilitado = mesHabilitado(rango, elegido.anio, mes);
              const clave = claveDeMes({ anio: elegido.anio, mes });
              return (
                <button
                  key={nombre}
                  type="button"
                  disabled={!habilitado}
                  aria-pressed={mes === elegido.mes}
                  onClick={() => setElegido({ ...elegido, mes })}
                  className={cn(
                    "relative h-11 rounded-full text-sm capitalize transition disabled:cursor-not-allowed disabled:opacity-35",
                    mes === elegido.mes ? "bg-primary font-semibold text-primary-foreground" : clave === hoy.slice(0, 7) ? "border border-primary text-primary" : "hover:bg-muted",
                  )}
                >
                  {nombre.slice(0, 3)}
                  {conEntradas?.has(clave) && <span aria-label="con entradas" className={cn("absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full", mes === elegido.mes ? "bg-primary-foreground" : "bg-primary")} />}
                </button>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => onElegir(claveDeMes(elegido))}>
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
