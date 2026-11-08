"use client";
// Diario (lane 284): pedir el valor de un contador. Portado de vendor/Daily_You/lib/widgets/tracker_value_dialog.dart (Demizo/Daily_You@7cc237d):
// campo numérico y, debajo, los 10 valores que más se usaron en esa etiqueta (el servidor los ordena por frecuencia y, a igual frecuencia, de menor a mayor).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { validarValor } from "@/lib/diario/etiquetas";

const esValido = (v: string) => {
  try {
    validarValor(v);
    return true;
  } catch {
    return false;
  }
};

export function ValorContador({
  nombre,
  inicial,
  sugeridos,
  onElegir,
  onCerrar,
}: {
  nombre: string;
  inicial?: string | null;
  /** Los valores más usados en esta etiqueta, del más frecuente al menos. */
  sugeridos: string[];
  onElegir: (valor: string) => void;
  onCerrar: () => void;
}) {
  const [texto, setTexto] = useState(inicial ?? "");
  const top = sugeridos.slice(0, 10);
  const valido = esValido(texto);
  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{nombre}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (valido) onElegir(texto.trim());
          }}
        >
          <Input autoFocus inputMode="decimal" value={texto} onChange={(e) => setTexto(e.target.value.replace(/[^\d.-]/g, ""))} aria-label="Valor" placeholder="0" />
          {top.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {top.map((v) => (
                <Button key={v} type="button" size="sm" variant="secondary" onClick={() => setTexto(v)}>
                  {v}
                </Button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!valido}>
              Aceptar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
