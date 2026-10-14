"use client";

// Portado de vendor/roost/src/pages/Calendar.tsx (msrbuilds/roost@492af47).
// Cambios: la página de eventos pasa a ser el plan del alumno — los eventos son sus DiaLectivo (color de la materia;
// movida/omitida atenuados), los días sin clase van rayados, arrastrar un día pendiente → PATCH dias/[id] mover,
// clic → Sheet con unidades y estado (Omitir / Mover). Sin el N+1 de eventos (L42-55): todo llega en una consulta.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import CalendarView, { type EventoCalendario } from "@/components/homeschooling/roost/CalendarView";
import { colorCss } from "@/components/homeschooling/cursos/iconos";
import MateriaHeader from "@/components/homeschooling/cursos/MateriaHeader";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import HoyNoHayClase from "./HoyNoHayClase";

export type DiaDelPlan = {
  id: number;
  fecha: string; // YYYY-MM-DD
  unidadDesde: number;
  unidadHasta: number;
  estado: "pendiente" | "hecha" | "movida" | "omitida";
  tareaEstado: string | null;
  curso: string;
  materia: string;
  materiaColor: string | null;
  unidadTipo: string;
};
export type NoLectivoVista = { id: number; fecha: string; motivo: string };

type Recurso = { tipo: "dia"; dia: DiaDelPlan } | { tipo: "sin_clase"; motivo: string };

const aFechaLocal = (clave: string) => {
  const [y, m, d] = clave.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const aClaveLocal = (f: Date) => f.toLocaleDateString("sv-SE");
const ETIQUETA_UNIDAD: Record<string, string> = { pagina: "páginas", capitulo: "capítulos", leccion: "lecciones", unidad: "unidades" };
const ESTADO: Record<DiaDelPlan["estado"], string> = { pendiente: "Pendiente", hecha: "Hecho", movida: "Se corrió", omitida: "Omitido" };

const editable = (d: DiaDelPlan) => d.estado === "pendiente" && (!d.tareaEstado || d.tareaEstado === "Pendiente");

export default function PlanCalendario({
  dias,
  noLectivos,
  alumnos,
  alumnoId,
}: {
  dias: DiaDelPlan[];
  noLectivos: NoLectivoVista[];
  alumnos: AlumnoLite[];
  alumnoId: number;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<DiaDelPlan | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [sinClase, setSinClase] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const eventos = useMemo<EventoCalendario<Recurso>[]>(
    () => [
      ...dias.map((d) => ({
        id: `d${d.id}`,
        title: `${d.curso}: ${d.unidadDesde === d.unidadHasta ? d.unidadDesde : `${d.unidadDesde}–${d.unidadHasta}`}`,
        start: aFechaLocal(d.fecha),
        end: aFechaLocal(d.fecha),
        allDay: true,
        resource: { tipo: "dia" as const, dia: d },
      })),
      ...noLectivos.map((n) => ({
        id: `n${n.id}`,
        title: `Sin clase: ${n.motivo}`,
        start: aFechaLocal(n.fecha),
        end: aFechaLocal(n.fecha),
        allDay: true,
        resource: { tipo: "sin_clase" as const, motivo: n.motivo },
      })),
    ],
    [dias, noLectivos]
  );

  const cambiar = async (diaId: number, cuerpo: { accion: "mover"; fecha: string } | { accion: "omitir" }) => {
    setOcupado(true);
    try {
      await api(`/api/homeschooling/dias/${diaId}`, { method: "PATCH", body: cuerpo });
      setSel(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el día");
    } finally {
      setOcupado(false);
    }
  };

  const quien = alumnos.find((a) => a.id === alumnoId);

  return (
    <div className="space-y-4">
      <MateriaHeader
        group={{ id: 0, name: "Plan de estudio", description: quien ? `Calendario de ${quien.nombre}` : null, cover_url: null, icon: null, color: null, dificultad: "Media", display_order: 0, is_active: true, created_by: 0 }}
        alumnos={alumnos}
        alumnoId={alumnoId}
        onAlumno={(id) => router.push(`/dashboard/homeschooling/plan?alumno=${id}`)}
      />
      <div className="flex justify-end px-1">
        <Button variant="outline" onClick={() => setSinClase(true)}>
          <CalendarOff /> Hoy no hay clase
        </Button>
      </div>

      <CalendarView<Recurso>
        className="h-[70svh]"
        events={eventos}
        draggableAccessor={(e) => e.resource.tipo === "dia" && editable(e.resource.dia)}
        eventPropGetter={(e) => {
          if (e.resource.tipo === "sin_clase") {
            return {
              style: {
                backgroundColor: "var(--muted)",
                color: "var(--muted-foreground)",
                backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, color-mix(in srgb, var(--foreground) 12%, transparent) 6px 8px)",
              },
            };
          }
          const d = e.resource.dia;
          return { style: { backgroundColor: colorCss(d.materiaColor), opacity: d.estado === "movida" || d.estado === "omitida" ? 0.45 : 1 } };
        }}
        onSelectEvent={(e) => {
          if (e.resource.tipo === "dia") {
            setSel(e.resource.dia);
            setNuevaFecha(e.resource.dia.fecha);
          }
        }}
        onEventDrop={({ event, start }) => {
          if (event.resource.tipo !== "dia") return;
          const fecha = aClaveLocal(new Date(start));
          if (fecha !== event.resource.dia.fecha) void cambiar(event.resource.dia.id, { accion: "mover", fecha });
        }}
      />

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.curso}</SheetTitle>
                <SheetDescription>
                  {sel.materia} · {sel.fecha}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 text-sm">
                <p className="text-foreground">
                  {sel.unidadDesde === sel.unidadHasta ? `${ETIQUETA_UNIDAD[sel.unidadTipo] ?? "unidades"} ${sel.unidadDesde}` : `${ETIQUETA_UNIDAD[sel.unidadTipo] ?? "unidades"} ${sel.unidadDesde} a ${sel.unidadHasta}`}
                </p>
                <p className="text-muted-foreground">Estado: {ESTADO[sel.estado]}</p>
                {editable(sel) ? (
                  <>
                    <div className="flex gap-2">
                      <Input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
                      <Button disabled={ocupado || !nuevaFecha || nuevaFecha === sel.fecha} onClick={() => cambiar(sel.id, { accion: "mover", fecha: nuevaFecha })}>
                        Mover
                      </Button>
                    </div>
                    <Button variant="outline" disabled={ocupado} onClick={() => cambiar(sel.id, { accion: "omitir" })}>
                      Omitir este día
                    </Button>
                    <p className="text-xs text-muted-foreground">Un día solo se puede mover entre el anterior y el siguiente del plan.</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Este día ya empezó o está cerrado; no se puede mover ni omitir.</p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <HoyNoHayClase open={sinClase} onClose={() => setSinClase(false)} alumnos={alumnos} />
    </div>
  );
}
