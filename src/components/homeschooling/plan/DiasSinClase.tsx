"use client";

// Propio de Ordo: lista de días sin clase con alta manual y baja (recalcula los planes del alumno).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Plus } from "lucide-react";
import { AdminItem } from "@/components/AdminItem";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import HoyNoHayClase from "./HoyNoHayClase";

export type DiaSinClase = { id: number; alumnoId: number; alumno: string; fecha: string; motivo: string };

export default function DiasSinClase({ dias, alumnos }: { dias: DiaSinClase[]; alumnos: AlumnoLite[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  const [editando, setEditando] = useState<DiaSinClase | null>(null);
  const [motivo, setMotivo] = useState("");

  const quitar = async (id: number) => {
    await api(`/api/homeschooling/no-lectivos/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const guardarMotivo = async () => {
    if (!editando) return;
    try {
      await api(`/api/homeschooling/no-lectivos/${editando.id}`, { method: "PATCH", body: { motivo } });
      toast.success("Motivo actualizado");
      setEditando(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Días sin clase</h2>
        <Button onClick={() => setAbierto(true)}>
          <Plus /> Agregar
        </Button>
      </div>

      {dias.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarOff />
            </EmptyMedia>
            <EmptyTitle>No hay días sin clase</EmptyTitle>
            <EmptyDescription>Marcá feriados, enfermedades o salidas para que el plan se corra solo.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {dias.map((d) => (
            <li key={d.id}>
              <AdminItem
                enabled
                nombre={`el día sin clase del ${d.fecha} (${d.alumno})`}
                aviso="Se recalculan los planes activos del alumno."
                onEdit={() => {
                  setEditando(d);
                  setMotivo(d.motivo);
                }}
                onDelete={() => quitar(d.id)}
              >
                <div className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-24 font-medium text-foreground">{d.fecha}</span>
                  <span className="w-28 truncate text-muted-foreground">{d.alumno}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.motivo}</span>
                </div>
              </AdminItem>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar día sin clase</DialogTitle>
            <DialogDescription>
              {editando?.alumno} · {editando?.fecha}. Cambiá el motivo; para mover la fecha, quitá el día y agregá otro.
            </DialogDescription>
          </DialogHeader>
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} aria-label="Motivo" placeholder="Feriado, enfermedad, salida…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={guardarMotivo}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <HoyNoHayClase open={abierto} onClose={() => setAbierto(false)} alumnos={alumnos} />
    </div>
  );
}
