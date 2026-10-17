"use client";

// Propio de Ordo: «Hoy no hay clase» / alta de un día sin clase, con el antes/después de cada plan afectado.

import { AyudaIcono } from "@/components/AyudaIcono";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";

type Resumen = { dias: number; promedio: number; ultimoDia: string | null; aviso: string | null };
type Vista = { planId: number; alumno: string; curso: string; fin: string; antes: Resumen; despues: Resumen }[];

const hoyLocal = () => new Date().toLocaleDateString("sv-SE");

export default function HoyNoHayClase({ open, onClose, alumnos, fechaInicial }: { open: boolean; onClose: () => void; alumnos: AlumnoLite[]; fechaInicial?: string }) {
  const router = useRouter();
  const [fecha, setFecha] = useState(fechaInicial ?? hoyLocal());
  const [quien, setQuien] = useState("todos");
  const [motivo, setMotivo] = useState("");
  const [vista, setVista] = useState<Vista | null>(null);
  const [guardando, setGuardando] = useState(false);

  const ids = quien === "todos" ? alumnos.map((a) => a.id) : [Number(quien)];

  useEffect(() => {
    if (open) {
      setFecha(fechaInicial ?? hoyLocal());
      setQuien("todos");
      setMotivo("");
    }
  }, [open, fechaInicial]);

  // Antes/después de cada plan afectado
  useEffect(() => {
    if (!open || !fecha || ids.length === 0) return;
    let vigente = true;
    setVista(null);
    api<Vista>("/api/homeschooling/no-lectivos/vista-previa", { method: "POST", body: { alumnoIds: ids, fecha } })
      .then((v) => vigente && setVista(v))
      .catch(() => vigente && setVista([]));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ids se deriva de quien y alumnos
  }, [open, fecha, quien, alumnos]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api("/api/homeschooling/no-lectivos", { method: "POST", body: { alumnoIds: ids, fecha, motivo } });
      toast.success("Día sin clase guardado");
      router.refresh();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">Día sin clase <AyudaIcono titulo="Día sin clase"><p>Marcá un feriado, una enfermedad o una salida. Las lecciones de ese día se corren al siguiente día de clase y la fecha de fin del curso no cambia.</p></AyudaIcono></DialogTitle>
          <DialogDescription>Las lecciones de ese día se corren y la fecha de fin del curso no cambia.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-fecha">Fecha</Label>
              <Input id="nc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-quien">Quién</Label>
              <NativeSelect id="nc-quien" className="w-full" value={quien} onChange={(e) => setQuien(e.target.value)}>
                <option value="todos">Toda la familia</option>
                {alumnos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-motivo">Motivo</Label>
            <Input id="nc-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Médico, feriado, salida…" maxLength={200} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Antes y después</p>
            {!vista ? (
              <Spinner className="size-5 text-primary" />
            ) : vista.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay planes activos afectados.</p>
            ) : (
              vista.map((v) => (
                <div key={v.planId} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium text-foreground">
                    {v.alumno} · {v.curso}
                  </p>
                  <p className="text-muted-foreground">
                    Antes: {v.antes.dias} días, {v.antes.promedio.toFixed(1)} por día · Después: {v.despues.dias} días, {v.despues.promedio.toFixed(1)} por día
                  </p>
                  <p className="text-xs text-muted-foreground">Termina el {v.fin} (no cambia)</p>
                  {v.despues.aviso === "sobrecarga" && <p className="text-xs text-warning">Con este cambio el ritmo queda alto.</p>}
                  {v.despues.aviso === "sin_dias" && <p className="text-xs text-destructive">Ya no quedan días para terminar a tiempo.</p>}
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando || !fecha || ids.length === 0}>
            {guardando && <Spinner />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
