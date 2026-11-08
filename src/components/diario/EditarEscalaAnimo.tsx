"use client";
// Diario (lane 286): editar la escala de ánimo. Portado de vendor/Daily_You/lib/widgets/{edit_mood_scale,mood_scale_setting}.dart (Demizo/Daily_You@7cc237d):
// tres presets arriba (emoji, íconos, colores) y cinco filas, del mejor ánimo al peor, cada una con ícono, color y un nombre opcional
// (el predeterminado se ve de ayuda). El ícono y el color usan los mismos selectores que las etiquetas.
import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MAX_NOMBRE_NIVEL, PRESETS_ESCALA, aplicarPreset, nombrePredeterminado, type EscalaAnimo, type PresetEscala } from "@/lib/diario/escala";
import { GlifoAnimo, type AccionesEscala } from "./EscalaAnimo";
import { SelectorColor } from "./etiquetas/SelectorColor";
import { SelectorIcono } from "./etiquetas/SelectorIcono";

export function EditarEscalaAnimo({ acciones, onCerrar }: { acciones: AccionesEscala; onCerrar: () => void }) {
  const [niveles, setNiveles] = useState<EscalaAnimo>(() => acciones.escala.map((n) => ({ ...n })));
  const [eligiendo, setEligiendo] = useState<{ valor: number; que: "icono" | "color" } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const cambiar = (valor: number, cambios: Partial<EscalaAnimo[number]>) => setNiveles((l) => l.map((n) => (n.valor === valor ? { ...n, ...cambios } : n)));
  const nivelElegido = eligiendo ? niveles.find((n) => n.valor === eligiendo.valor) : undefined;

  async function terminar(hacer: () => Promise<boolean>) {
    setTrabajando(true);
    const ok = await hacer();
    setTrabajando(false);
    if (ok) onCerrar();
  }

  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escala de ánimo</DialogTitle>
          <DialogDescription>Elegí cómo se ve cada nivel. Si no ponés un nombre, se usa el que aparece de ayuda.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PRESETS_ESCALA) as PresetEscala[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-label={`Usar el estilo ${PRESETS_ESCALA[p].titulo}`}
              className="flex items-center justify-center gap-0.5 rounded-lg border bg-card px-1.5 py-3 hover:bg-muted"
              onClick={() => setNiveles((l) => aplicarPreset(l, p))}
            >
              {PRESETS_ESCALA[p].niveles.map((n, i) => (
                <GlifoAnimo key={i} nivel={{ valor: i + 1, etiqueta: null, ...n }} tamano={16} />
              ))}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {[...niveles].reverse().map((n) => (
            <div key={n.valor} className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon-lg" aria-label={`Elegir ícono del nivel ${n.valor}`} onClick={() => setEligiendo({ valor: n.valor, que: "icono" })}>
                <GlifoAnimo nivel={n} tamano={22} />
              </Button>
              <Button type="button" variant="outline" size="icon-lg" aria-label={`Elegir color del nivel ${n.valor}`} onClick={() => setEligiendo({ valor: n.valor, que: "color" })}>
                {n.color ? <span className="size-5 rounded-full" style={{ backgroundColor: n.color }} /> : <Palette />}
              </Button>
              <Input
                value={n.etiqueta ?? ""}
                maxLength={MAX_NOMBRE_NIVEL}
                placeholder={nombrePredeterminado(n.valor)}
                aria-label={`Nombre del nivel ${n.valor}`}
                onChange={(e) => cambiar(n.valor, { etiqueta: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" className="sm:mr-auto" disabled={trabajando} onClick={() => void terminar(acciones.restablecer)}>
            <RotateCcw /> Restablecer
          </Button>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" disabled={trabajando} onClick={() => void terminar(() => acciones.guardar(niveles))}>
            Guardar
          </Button>
        </DialogFooter>
        {eligiendo?.que === "icono" && nivelElegido && (
          <SelectorIcono
            valor={{ icono: nivelElegido.icono, tipoIcono: nivelElegido.tipoIcono }}
            color={nivelElegido.color}
            onElegir={(v) => {
              cambiar(nivelElegido.valor, v);
              setEligiendo(null);
            }}
            onCerrar={() => setEligiendo(null)}
          />
        )}
        {eligiendo?.que === "color" && nivelElegido && (
          <SelectorColor
            valor={nivelElegido.color}
            onElegir={(c) => {
              cambiar(nivelElegido.valor, { color: c });
              setEligiendo(null);
            }}
            onCerrar={() => setEligiendo(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
