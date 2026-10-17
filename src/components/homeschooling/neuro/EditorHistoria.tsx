"use client";

// Propio de Ordo: editor de una historia social — título y de 3 a 5 pasos con texto corto e ícono.

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { errorDePasos, ICONOS_HISTORIA, MAX_PASOS, MAX_TEXTO_PASO, type PasoHistoria } from "@/lib/homeschooling/neuro";
import { toast } from "@/lib/toast";

export type BorradorHistoria = { id?: number; titulo: string; pasos: PasoHistoria[] };

const vacio = (): BorradorHistoria => ({ titulo: "", pasos: [1, 2, 3].map(() => ({ texto: "", icono: "Check" })) });

export default function EditorHistoria({ open, inicial, onClose, onGuardada }: { open: boolean; inicial: BorradorHistoria | null; onClose: () => void; onGuardada: () => void }) {
  const [h, setH] = useState<BorradorHistoria>(vacio());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) setH(inicial ?? vacio());
  }, [open, inicial]);

  const cambiarPaso = (i: number, parche: Partial<PasoHistoria>) => setH((x) => ({ ...x, pasos: x.pasos.map((p, n) => (n === i ? { ...p, ...parche } : p)) }));

  const guardar = async () => {
    if (!h.titulo.trim()) {
      toast.error("Falta el título");
      return;
    }
    const error = errorDePasos(h.pasos);
    if (error) {
      toast.error(error);
      return;
    }
    setGuardando(true);
    try {
      await api(h.id ? `/api/homeschooling/historias/${h.id}` : "/api/homeschooling/historias", { method: h.id ? "PATCH" : "POST", body: { titulo: h.titulo, pasos: h.pasos } });
      toast.success("Historia guardada");
      onGuardada();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{h.id ? "Editar historia" : "Nueva historia social"}</DialogTitle>
          <DialogDescription>De 3 a 5 pasos cortos, en primera persona y con palabras simples.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hs-titulo">Título</Label>
            <Input id="hs-titulo" value={h.titulo} onChange={(e) => setH((x) => ({ ...x, titulo: e.target.value }))} maxLength={100} />
          </div>
          {h.pasos.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`hs-p-${i}`}>Paso {i + 1}</Label>
                <Input id={`hs-p-${i}`} value={p.texto} onChange={(e) => cambiarPaso(i, { texto: e.target.value })} maxLength={MAX_TEXTO_PASO} />
              </div>
              <NativeSelect aria-label={`Ícono del paso ${i + 1}`} className="mt-6" value={p.icono} onChange={(e) => cambiarPaso(i, { icono: e.target.value })}>
                {ICONOS_HISTORIA.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </NativeSelect>
              {h.pasos.length > 3 && (
                <Button type="button" variant="ghost" size="icon" aria-label="Quitar paso" className="mt-6 text-destructive" onClick={() => setH((x) => ({ ...x, pasos: x.pasos.filter((_, n) => n !== i) }))}>
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
          {h.pasos.length < MAX_PASOS && (
            <Button type="button" variant="outline" size="sm" onClick={() => setH((x) => ({ ...x, pasos: [...x.pasos, { texto: "", icono: "Check" }] }))}>
              <Plus /> Paso
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando && <Spinner />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
