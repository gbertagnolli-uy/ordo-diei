"use client";

// Propio de Ordo: lista de días sin clase con alta manual y baja (recalcula los planes del alumno).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
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

  const quitar = async (id: number) => {
    try {
      await api(`/api/homeschooling/no-lectivos/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo quitar");
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
            <li key={d.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="w-24 font-medium text-foreground">{d.fecha}</span>
              <span className="w-28 truncate text-muted-foreground">{d.alumno}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.motivo}</span>
              <Button variant="ghost" size="icon" onClick={() => quitar(d.id)} aria-label="Quitar día sin clase">
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <HoyNoHayClase open={abierto} onClose={() => setAbierto(false)} alumnos={alumnos} />
    </div>
  );
}
