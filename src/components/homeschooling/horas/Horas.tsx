"use client";

// Propio de Ordo: lista del mes de actividades fuera de pantalla (la página «Calendar» de Roost sin el calendario: el
// calendario del plan de H1b ya muestra estas actividades).

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Compass, FileBarChart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { deleteEvent } from "@/lib/homeschooling/roost/services/event";
import type { EventWithDetails } from "@/lib/homeschooling/roost/tipos";
import { toast } from "@/lib/toast";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import ActividadCard from "./ActividadCard";
import ActividadDetalle from "./ActividadDetalle";
import ActividadForm from "./ActividadForm";

export default function Horas({
  actividades,
  mes,
  mesAnterior,
  mesSiguiente,
  esPadre,
  materias,
  alumnos,
}: {
  actividades: EventWithDetails[];
  mes: string;
  mesAnterior: string;
  mesSiguiente: string;
  esPadre: boolean;
  materias: { id: number; name: string }[];
  alumnos: AlumnoLite[];
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState<EventWithDetails | null>(null);
  const [form, setForm] = useState<{ open: boolean; editing: EventWithDetails | null }>({ open: false, editing: null });
  const [borrar, setBorrar] = useState<EventWithDetails | null>(null);
  const titulo = new Date(`${mes}-01T12:00:00`).toLocaleDateString("es", { month: "long", year: "numeric" });

  const confirmarBorrado = async () => {
    if (!borrar) return;
    try {
      await deleteEvent(borrar.id);
      setBorrar(null);
      setAbierta(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Actividades</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/homeschooling/reportes">
              <FileBarChart /> Reportes
            </Link>
          </Button>
          {esPadre && (
            <Button onClick={() => setForm({ open: true, editing: null })} disabled={materias.length === 0 || alumnos.length === 0}>
              <Plus /> Nueva actividad
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="icon" aria-label="Mes anterior">
          <Link href={`?mes=${mesAnterior}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <p className="font-semibold capitalize text-foreground">{titulo}</p>
        <Button asChild variant="ghost" size="icon" aria-label="Mes siguiente">
          <Link href={`?mes=${mesSiguiente}`}>
            <ChevronRight />
          </Link>
        </Button>
      </div>

      {actividades.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Compass />
            </EmptyMedia>
            <EmptyTitle>No hay actividades este mes</EmptyTitle>
            <EmptyDescription>Salidas, museos y experimentos suman horas a cada hijo que participó.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {actividades.map((a) => (
            <ActividadCard key={a.id} actividad={a} onClick={setAbierta} />
          ))}
        </div>
      )}

      <ActividadDetalle
        actividad={abierta}
        esPadre={esPadre}
        onClose={() => setAbierta(null)}
        onEdit={(a) => {
          setAbierta(null);
          setForm({ open: true, editing: a });
        }}
        onDelete={setBorrar}
      />
      <ActividadForm
        open={form.open}
        editing={form.editing}
        materias={materias}
        alumnos={alumnos}
        onClose={() => setForm({ open: false, editing: null })}
        onSuccess={() => {
          setForm({ open: false, editing: null });
          router.refresh();
        }}
      />
      <Dialog open={!!borrar} onOpenChange={(o) => !o && setBorrar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Borrar la actividad?</DialogTitle>
            <DialogDescription>«{borrar?.title}» deja de sumar horas a quienes participaron.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarBorrado}>
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
