"use client";

// Propio de Ordo: inicio de Homeschooling para el padre — materias, «Nuevo curso», plan y días sin clase.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarOff, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import type { Group } from "@/lib/homeschooling/roost/tipos";
import { colorCss, iconoDe } from "@/components/homeschooling/cursos/iconos";
import MateriaForm from "@/components/homeschooling/cursos/MateriaForm";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import AsistenteCurso from "./AsistenteCurso";

export type ProgresoAlumno = AlumnoLite & { cursos: number; porcentaje: number };

export default function PanelHomeschooling({ materias, alumnos, progresos }: { materias: (Group & { course_count: number })[]; alumnos: AlumnoLite[]; progresos: ProgresoAlumno[] }) {
  const router = useRouter();
  const [materiaForm, setMateriaForm] = useState(false);
  const [asistente, setAsistente] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <GraduationCap className="size-6" /> Estudio
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/homeschooling/plan">
              <CalendarDays /> Plan
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/homeschooling/dias-sin-clase">
              <CalendarOff /> Días sin clase
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setMateriaForm(true)}>
            <Plus /> Nueva materia
          </Button>
          <Button onClick={() => setAsistente(true)} disabled={alumnos.length === 0}>
            <Plus /> Nuevo curso
          </Button>
        </div>
      </div>

      {progresos.some((p) => p.cursos > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {progresos.filter((p) => p.cursos > 0).map((p) => (
            <div key={p.id} className="space-y-2 rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{p.nombre}</span>
                <span className="text-muted-foreground">
                  {p.porcentaje}% · {p.cursos} {p.cursos === 1 ? "curso" : "cursos"}
                </span>
              </div>
              <Progress value={p.porcentaje} />
            </div>
          ))}
        </div>
      )}

      {materias.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCap />
            </EmptyMedia>
            <EmptyTitle>Todavía no hay materias</EmptyTitle>
            <EmptyDescription>Empezá creando una materia y después sus cursos; el plan diario se arma solo.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setMateriaForm(true)}>
              <Plus /> Crear la primera materia
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materias.map((m) => {
            const Icono = iconoDe(m.icon);
            return (
              <Link key={m.id} href={`/dashboard/homeschooling/materias/${m.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary-foreground" style={{ backgroundColor: colorCss(m.color) }}>
                  <Icono className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {m.course_count} {m.course_count === 1 ? "curso" : "cursos"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <MateriaForm
        open={materiaForm}
        onClose={() => setMateriaForm(false)}
        onSuccess={() => {
          setMateriaForm(false);
          router.refresh();
        }}
      />
      <AsistenteCurso
        open={asistente}
        onClose={() => setAsistente(false)}
        alumnos={alumnos}
        materias={materias}
        onGuardado={() => {
          setAsistente(false);
          router.refresh();
        }}
      />
    </div>
  );
}
