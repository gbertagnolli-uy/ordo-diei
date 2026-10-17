"use client";

// Propio de Ordo (usa StatsCard portado de Roost): panel principal de Estudio para el padre — resumen del día,
// notificaciones y avisos de repaso, resumen semanal y avance de hoy por cada hijo. La gestión de materias,
// cursos, lecciones, materiales y quizzes vive en el panel «Materias» (/dashboard/homeschooling/materias).

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Bell, BookOpen, CalendarCheck, CalendarDays, CheckCheck, CheckCircle2, Circle, ClipboardCheck, GraduationCap, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Group } from "@/lib/homeschooling/roost/tipos";
import type { HoyAlumno, MateriaPanel } from "@/lib/homeschooling/servidor/panel";
import type { AvisoVista } from "@/lib/homeschooling/servidor/avisos";
import { colorCss } from "@/components/homeschooling/cursos/iconos";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import { haceCuanto } from "@/lib/homeschooling/comentarios";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import { StatsCard } from "@/components/homeschooling/roost/StatsCard";
import PonerseAlDia from "./PonerseAlDia";
import ResumenSemanal from "./ResumenSemanal";
import type { ResumenSemanal as DatosSemana } from "@/lib/homeschooling/servidor/resumenSemana";

export type ProgresoAlumno = AlumnoLite & { cursos: number; porcentaje: number };

export default function PanelHomeschooling({
  materias,
  panel,
  hoy,
  alumnos,
  progresos,
  pendientes,
  avisos,
  notificaciones = [],
  sinLeerInicial = 0,
  semana,
}: {
  materias: (Group & { course_count: number })[];
  panel: MateriaPanel[];
  hoy: HoyAlumno[];
  archivadas?: { id: number; nombre: string }[];
  alumnos: AlumnoLite[];
  progresos: ProgresoAlumno[];
  pendientes: number;
  avisos: { tarjetaId: number; texto: string }[];
  notificaciones?: AvisoVista[];
  sinLeerInicial?: number;
  semana?: DatosSemana;
}) {
  const router = useRouter();
  const [alDia, setAlDia] = useState<{ id: number; nombre: string } | null>(null);
  const [listaAvisos, setListaAvisos] = useState<AvisoVista[]>(notificaciones);
  const [sinLeer, setSinLeer] = useState(sinLeerInicial);
  const [marcando, setMarcando] = useState(false);

  const clasesHoy = hoy.flatMap((h) => h.clases);
  const hechasHoy = clasesHoy.filter((c) => c.estado === "hecha").length;
  const atrasadas = hoy.reduce((n, h) => n + h.atrasadas, 0);
  const totalCursos = panel.reduce((n, m) => n + m.cursos.length, 0);
  const totalAlertas = sinLeer + avisos.length + pendientes;

  const marcarTodoLeido = async () => {
    setMarcando(true);
    try {
      await api("/api/homeschooling/notificaciones", { method: "POST", body: {} });
      setSinLeer(0);
      setListaAvisos((prev) => prev.map((a) => ({ ...a, leido: true })));
      toast.success("Notificaciones marcadas como leídas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron marcar");
    } finally {
      setMarcando(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <GraduationCap className="size-6" /> Estudio
          </h1>
          <p className="text-sm text-muted-foreground">Resumen del día, notificaciones y seguimiento familiar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/homeschooling/plan">
              <CalendarDays /> Plan de estudio
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/homeschooling/materias">
              <BookOpen /> Gestionar materias y cursos
            </Link>
          </Button>
        </div>
      </div>

      <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard title="Clases de hoy" value={clasesHoy.length === 0 ? "—" : `${hechasHoy} de ${clasesHoy.length}`} icon={CalendarCheck} color="primary" />
        <Link href="/dashboard/homeschooling/revision" className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
          <StatsCard title="Para revisar" value={pendientes} icon={ClipboardCheck} color={pendientes > 0 ? "warning" : "success"} />
        </Link>
        <StatsCard title="Clases atrasadas" value={atrasadas} icon={History} color={atrasadas > 0 ? "error" : "success"} />
        <StatsCard title="Notificaciones" value={totalAlertas} icon={Bell} color={totalAlertas > 0 ? "warning" : "success"} />
      </section>

      <section aria-label="Notificaciones y avisos" className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Notificaciones y atención requerida</h2>
            {totalAlertas > 0 && (
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-foreground tabular-nums">
                {totalAlertas}
              </span>
            )}
          </div>
          {sinLeer > 0 && (
            <Button size="sm" variant="ghost" disabled={marcando} onClick={marcarTodoLeido}>
              <CheckCheck className="size-4" /> Marcar avisos como leídos
            </Button>
          )}
        </div>

        {pendientes > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <ClipboardCheck className="size-4 shrink-0 text-warning" />
              Tenés {pendientes} {pendientes === 1 ? "entrega o evidencia pendiente" : "entregas o evidencias pendientes"} de revisión.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/homeschooling/revision">Ir a Revisión</Link>
            </Button>
          </div>
        )}

        {avisos.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-warning/40 bg-warning/10 p-3.5 text-sm">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Alertas de repaso y evaluaciones</p>
            {avisos.map((a) => (
              <p key={a.tarjetaId} className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="size-4 shrink-0 text-warning" /> {a.texto}
              </p>
            ))}
          </div>
        )}

        {listaAvisos.length === 0 && avisos.length === 0 && pendientes === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Todo al día. No hay notificaciones ni revisiones pendientes.
          </p>
        ) : (
          listaAvisos.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {listaAvisos.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => a.href && router.push(a.href)}
                    className={`flex w-full items-start justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                      a.leido ? "bg-card" : "bg-primary/5"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium text-foreground">
                        {!a.leido && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                        <span className="truncate">{a.titulo}</span>
                      </p>
                      {a.cuerpo && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.cuerpo}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{haceCuanto(a.creadoEn)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      {semana && <ResumenSemanal semana={semana} />}

      {alumnos.length > 0 && (
        <section aria-label="Hoy" className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Hoy por alumno</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {hoy
              .filter((h) => h.clases.length > 0 || h.atrasadas > 0 || (progresos.find((p) => p.id === h.alumnoId)?.cursos ?? 0) > 0)
              .map((h) => {
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
                            {c.estado === "hecha" ? (
                              <CheckCircle2 className="size-4 shrink-0 text-success" />
                            ) : (
                              <Circle className="size-4 shrink-0 text-muted-foreground/60" />
                            )}
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

      <section aria-label="Acceso rápido a Materias" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <BookOpen className="size-5 text-primary" /> Materias, cursos, clases y evaluaciones
          </h2>
          <p className="text-sm text-muted-foreground">
            {materias.length === 0
              ? "Todavía no creaste materias. Armá materias, cursos, lecciones con materiales y quizzes en el panel Materias."
              : `${materias.length} ${materias.length === 1 ? "materia activa" : "materias activas"} · ${totalCursos} ${totalCursos === 1 ? "curso" : "cursos"} configurados.`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/homeschooling/materias">
            Abrir panel Materias <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      <PonerseAlDia open={!!alDia} alumno={alDia} onClose={() => setAlDia(null)} />
    </div>
  );
}
