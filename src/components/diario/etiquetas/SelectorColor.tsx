"use client";
// Diario (lane 284): elegir el color de una etiqueta. Portado de vendor/Daily_You/lib/widgets/color_picker_dialog.dart (Demizo/Daily_You@7cc237d):
// paleta de 18 colores, «sin color» y un color libre (el navegador trae su selector; reemplaza al anillo de tono de Flutter).
import { useState } from "react";
import { Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PALETA_ETIQUETAS } from "./colores";

const esClaro = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
};

export function SelectorColor({ valor, onElegir, onCerrar }: { valor: string | null; onElegir: (c: string | null) => void; onCerrar: () => void }) {
  const [libre, setLibre] = useState(valor ?? "#2196f3");
  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Color</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={valor && !(PALETA_ETIQUETAS as readonly string[]).includes(valor) ? "libre" : "paleta"}>
          <TabsList>
            <TabsTrigger value="paleta">Paleta</TabsTrigger>
            <TabsTrigger value="libre">Otro color</TabsTrigger>
          </TabsList>
          <TabsContent value="paleta" className="flex flex-col gap-3">
            <Button type="button" variant="outline" onClick={() => onElegir(null)}>
              {valor ? <Ban /> : <Check />} Sin color
            </Button>
            <div className="grid grid-cols-6 gap-2">
              {PALETA_ETIQUETAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={valor === c}
                  onClick={() => onElegir(c)}
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: c, color: esClaro(c) ? "#000" : "#fff" }}
                >
                  {valor === c && <Check className="size-5" />}
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="libre" className="flex flex-col items-center gap-3 py-2">
            <input type="color" value={libre} onChange={(e) => setLibre(e.target.value)} aria-label="Elegir un color" className="h-24 w-24 cursor-pointer rounded-lg border bg-transparent" />
            <code className="text-xs text-muted-foreground">{libre}</code>
            <Button type="button" onClick={() => onElegir(libre)}>
              Usar este color
            </Button>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
