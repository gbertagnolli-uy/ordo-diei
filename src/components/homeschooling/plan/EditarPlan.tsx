"use client";

// Propio de Ordo: cambia la fecha de fin y los días de la semana de un plan ya creado. Lo que falta se vuelve a repartir
// desde hoy; lo ya hecho no se toca.

import { AyudaIcono } from "@/components/AyudaIcono";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import { DIAS_SEMANA } from "./dias";

export type PlanEditable = { id: number; nombre: string; inicio: string; fin: string; diasSemana: number[] };

export default function EditarPlan({ plan, onClose, onGuardado }: { plan: PlanEditable | null; onClose: () => void; onGuardado: () => void }) {
  const [fin, setFin] = useState("");
  const [dias, setDias] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setFin(plan.fin);
    setDias(plan.diasSemana);
  }, [plan]);

  const guardar = async () => {
    if (!plan) return;
    if (fin < plan.inicio) return toast.error("La fecha de fin es anterior al inicio");
    if (dias.length === 0) return toast.error("Elegí al menos un día de la semana");
    setGuardando(true);
    try {
      await api(`/api/homeschooling/planes/${plan.id}`, { method: "PATCH", body: { fin, diasSemana: dias } });
      toast.success("Plan actualizado");
      onGuardado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el plan");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={!!plan} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">Plan de {plan?.nombre} <AyudaIcono titulo="Editar el plan"><p>Cambiá la fecha de fin o los días de clase. Lo que falta se reparte de nuevo desde hoy; lo ya hecho no cambia.</p></AyudaIcono></DialogTitle>
          <DialogDescription>Lo que falta se reparte de nuevo desde hoy hasta la fecha de fin. Lo ya hecho no cambia.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ep-fin">Termina el</Label>
            <Input id="ep-fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Días de clase</Label>
            <div className="flex gap-1.5">
              {DIAS_SEMANA.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  aria-label={d.largo}
                  aria-pressed={dias.includes(d.iso)}
                  onClick={() => setDias((x) => (x.includes(d.iso) ? x.filter((n) => n !== d.iso) : [...x, d.iso].sort()))}
                  className={`size-9 rounded-lg border text-sm font-medium transition-colors ${dias.includes(d.iso) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {d.corto}
                </button>
              ))}
            </div>
          </div>
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
