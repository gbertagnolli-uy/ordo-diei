"use client";

// Propio de Ordo (usa StatsCard portado de Roost): inicio de Estudio para el padre — qué toca hoy a cada hijo, qué necesita
// atención, el avance de cada hijo y las materias con sus cursos (cada curso lleva directo a su pantalla).

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArchiveRestore, CalendarCheck, CheckCircle2, Circle, ClipboardCheck, GraduationCap, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Group } from "@/lib/homeschooling/roost/tipos";
import type { HoyAlumno, MateriaPanel } from "@/lib/homeschooling/servidor/panel";
import { colorCss } from "@/components/homeschooling/cursos/iconos";
import IconoMateria from "@/components/homeschooling/cursos/IconoMateria";
import MateriaForm from "@/components/homeschooling/cursos/MateriaForm";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import { updateGroup } from "@/lib/homeschooling/roost/services/group";
import { toast } from "@/lib/toast";
import { StatsCard } from "@/components/homeschooling/roost/StatsCard";
import PonerseAlDia from "./PonerseAlDia";
import ResumenSemanal from "./ResumenSemanal";
import type { ResumenSemanal as DatosSemana } from "@/lib/homeschooling/servidor/resumenSemana";
import AsistenteCurso from "./AsistenteCurso";

export type ProgresoAlumno = AlumnoLite & { cursos: number; porcentaje: number };

export default function PanelHomeschooling({
  materias,
  panel,
  hoy,
  archivadas,
  alumnos,
  progresos,
  pendientes,
  avisos,
  semana,
}: {
  materias: (Group & { course_count: number })[];
  panel: MateriaPanel[];
  hoy: HoyAlumno[];
  archivadas: { id: number; nombre: string }[];
  alumnos: AlumnoLite[];
  progresos: ProgresoAlumno[];
  pendientes: number;
  avisos: { tarjetaId: number; texto: string }[];
  semana?: DatosSemana;
}) {
  const router = useRouter();
  const [materiaForm, setMateriaForm] = useState(false);
  const [asistente, setAsistente] = useState(false);
  const [alDia, setAlDia] = useState<{ id: number; nombre: string } | null>(null);

  const clasesHoy = hoy.flatMap((h) => h.clases);
  const hechasHoy = clasesHoy.filter((c) => c.estado === "hecha").length;
  const atrasadas = hoy.reduce((n, h) => n + h.atrasadas, 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <GraduationCap className="size-6" /> Estudio
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setMateriaForm(true)}>
            <Plus /> Nueva materia
          </Button>
          <Button onClick={() => setAsistente(true)} disabled={alumnos.length === 0 || materias.length === 0}>
            <Plus /> Nuevo curso
          </Button>
        </div>
      </div>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard title="Clases de hoy" value={clasesHoy.length === 0 ? "—" : `${hechasHoy} de ${clasesHoy.length}`} icon={CalendarCheck} color="primary" />
        <Link href="/dashboard/homeschooling/revision" className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
          <StatsCard title="Para revisar" value={pendientes} icon={ClipboardCheck} color={pendientes > 0 ? "warning" : "success"} />
        </Link>
        <StatsCard title="Clases atrasadas" value={atrasadas} icon={History} color={atrasadas > 0 ? "error" : "success"} />
        <StatsCard title="Avisos de repaso" value={avisos.length} icon={AlertTriangle} color={avisos.length > 0 ? "warning" : "success"} />
      </section>

      {avisos.length > 0 && (
        <div className="space-y-1 rounded-xl border border-warning/50 bg-warning/10 p-4 text-sm">
          {avisos.map((a) => (
            <p key={a.tarjetaId} className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="size-4 shrink-0 text-warning" /> {a.texto}
            </p>
          ))}
        </div>
      )}

      {semana && <ResumenSemanal semana={semana} />}

      {alumnos.length > 0 && (
        <section aria-label="Hoy" className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Hoy</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {hoy.filter((h) => h.clases.length > 0 || h.atrasadas > 0 || (progresos.find((p) => p.id === h.alumnoId)?.cursos ?? 0) > 0).map((h) => {
              const prog = progresos.find((p) => p.id === h.alumnoId);
              return (
                <div key={h.alumnoId} className="space-y-3 rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {h.fotoUrl && <AvatarImage src={h.fotoUrl} alt="" />}
                      <AvatarFallback>{h.nombre.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{h.nombre}</p>
                      {prog && prog.cursos > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {prog.cursos} {prog.cursos === 1 ? "curso" : "cursos"} · {prog.porcentaje}% completado
                        </p>
                      )}
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/dashboard/homeschooling/plan?alumno=${h.alumnoId}`}>Ver plan</Link>
                    </Button>
                  </div>
                  {prog && prog.cursos > 0 && <Progress value={prog.porcentaje} aria-label={`Avance de ${h.nombre}`} />}
                  {h.clases.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Hoy no tiene clases.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {h.clases.map((c, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {c.estado === "hecha" ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0 text-muted-foreground/60" />}
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorCss(c.color) }} />
                          <span className="min-w-0 truncate text-foreground">
                            {c.curso} <span className="text-muted-foreground">· {c.materia}</span>
                          </span>
                          {c.estado === "omitida" && <span className="text-xs text-muted-foreground">omitida</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {h.atrasadas > 0 && (
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 text-xs text-destructive">
                        {h.atrasadas} {h.atrasadas === 1 ? "clase atrasada" : "clases atrasadas"}
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setAlDia({ id: h.alumnoId, nombre: h.nombre })}>
                        <History /> Ponerse al día
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hoy.some((h) => h.clases.length === 0 && h.atrasadas === 0 && (progresos.find((p) => p.id === h.alumnoId)?.cursos ?? 0) === 0) && (
        <p className="text-sm text-muted-foreground">
          Sin cursos asignados:{" "}
          {hoy
            .filter((h) => h.clases.length === 0 && h.atrasadas === 0 && (progresos.find((p) => p.id === h.alumnoId)?.cursos ?? 0) === 0)
            .map((h) => h.nombre)
            .join(", ")}
          .
        </p>
      )}

      <section aria-label="Materias" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Materias</h2>
        {panel.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {panel.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-xl border bg-card">
                <Link href={`/dashboard/homeschooling/materias/${m.id}`} className="flex items-center gap-3 border-b p-4 transition-colors hover:bg-muted">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary-foreground" style={{ backgroundColor: colorCss(m.color) }}>
                    <IconoMateria nombre={m.icono} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{m.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.cursos.length} {m.cursos.length === 1 ? "curso" : "cursos"}
                    </span>
                  </span>
                </Link>
                {m.cursos.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Sin cursos todavía.</p>
                ) : (
                  <ul className="divide-y">
                    {m.cursos.map((c) => (
                      <li key={c.id}>
                        <Link href={`/dashboard/homeschooling/materias/${m.id}?module=${c.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted">
                          <span className="min-w-0 flex-1 truncate text-foreground">{c.titulo}</span>
                          {c.alumnos > 0 ? (
                            <span className="flex w-28 shrink-0 items-center gap-2">
                              <Progress value={c.porcentaje} aria-label={`Avance de ${c.titulo}`} />
                              <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{c.porcentaje}%</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">sin asignar</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {archivadas.length > 0 && (
        <section aria-label="Materias archivadas" className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Archivadas</h2>
          <ul className="divide-y rounded-xl border bg-card">
            {archivadas.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span className="truncate text-foreground">{m.nombre}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await updateGroup(m.id, { is_active: true });
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "No se pudo restaurar");
                    }
                  }}
                >
                  <ArchiveRestore /> Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </section>
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
      <PonerseAlDia open={!!alDia} alumno={alDia} onClose={() => setAlDia(null)} />
    </div>
  );
}
