"use client";

// Propio de Ordo (lane 171, R1): «Ponerse al día». Muestra, por cada plan atrasado de un hijo, cuánto se atrasó, cómo queda el
// reparto de lo que falta y —si no entra antes del fin— con qué fecha de fin sí entra. Un clic reparte todo desde hoy.
import { AyudaIcono } from "@/components/AyudaIcono";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { PlanAtrasado } from "@/lib/homeschooling/servidor/planes";
import { toast } from "@/lib/toast";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const f = (clave: string) => FECHA.format(new Date(`${clave}T00:00:00Z`));

export default function PonerseAlDia({ open, alumno, onClose }: { open: boolean; alumno: { id: number; nombre: string } | null; onClose: () => void }) {
  const router = useRouter();
  const [planes, setPlanes] = useState<PlanAtrasado[] | null>(null);
  const [extender, setExtender] = useState<Record<number, boolean>>({});
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!open || !alumno) return;
    let vigente = true;
    api<PlanAtrasado[]>(`/api/homeschooling/alumnos/${alumno.id}/al-dia`)
      .then((r) => {
        if (!vigente) return;
        setPlanes(r);
        setExtender(Object.fromEntries(r.filter((p) => p.finSugerido).map((p) => [p.planId, true])));
      })
      .catch((e) => {
        if (!vigente) return;
        setPlanes([]);
        toast.error(e instanceof Error ? e.message : "No se pudo calcular");
      });
    return () => {
      vigente = false;
      setPlanes(null);
    };
  }, [open, alumno]);

  const confirmar = async () => {
    if (!alumno || !planes) return;
    setOcupado(true);
    try {
      const alargar = Object.fromEntries(planes.filter((p) => p.finSugerido && extender[p.planId]).map((p) => [p.planId, p.finSugerido as string]));
      const r = await api<{ planes: number; dias: number }>(`/api/homeschooling/alumnos/${alumno.id}/al-dia`, { method: "POST", body: { extender: alargar } });
      toast.success(r.planes === 0 ? "No había nada atrasado" : `${alumno.nombre} está al día: ${r.planes} ${r.planes === 1 ? "plan repartido" : "planes repartidos"}`);
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reprogramar");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !ocupado && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">Ponerse al día{alumno ? `: ${alumno.nombre}` : ""} <AyudaIcono titulo="Ponerse al día"><p>Si se atrasó, lo que quedó sin hacer se reparte entre los días que quedan hasta la fecha de fin. Lo ya hecho no se toca.</p></AyudaIcono></DialogTitle>
          <DialogDescription>Lo que quedó sin hacer se vuelve a repartir entre los días que quedan. Lo ya hecho no se toca.</DialogDescription>
        </DialogHeader>

        {planes === null ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : planes.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            <CheckCircle2 className="size-5 text-success" /> No hay nada atrasado.
          </p>
        ) : (
          <ul className="space-y-3">
            {planes.map((p) => (
              <li key={p.planId} className="space-y-1.5 rounded-xl border bg-card p-3 text-sm">
                <p className="font-medium text-foreground">
                  {p.curso} <span className="font-normal text-muted-foreground">· {p.materia}</span>
                </p>
                <p className="text-muted-foreground">
                  {p.atrasadas} {p.atrasadas === 1 ? "clase atrasada" : "clases atrasadas"}. Quedan {p.despues.dias} {p.despues.dias === 1 ? "día" : "días"}
                  {p.despues.ultimoDia ? ` hasta el ${f(p.despues.ultimoDia)}` : ""} (plan hasta el {f(p.fin)}), unas {p.despues.promedio.toLocaleString("es", { maximumFractionDigits: 1 })} unidades por día.
                </p>
                {p.despues.aviso && (
                  <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-2 text-foreground">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div className="space-y-1">
                      <p>{p.despues.aviso === "sin_dias" ? "Ya no quedan días lectivos antes del fin." : "Antes del fin queda demasiado cargado."}</p>
                      {p.finSugerido ? (
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={!!extender[p.planId]} onChange={(e) => setExtender((x) => ({ ...x, [p.planId]: e.target.checked }))} className="size-4 accent-primary" />
                          Extender el fin hasta el {f(p.finSugerido)}
                        </label>
                      ) : (
                        <p className="text-muted-foreground">Ni alargando 8 semanas alcanza: sumá días de la semana desde el plan.</p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={ocupado}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={ocupado || !planes || planes.length === 0}>
            {ocupado && <Spinner />} Repartir desde hoy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
