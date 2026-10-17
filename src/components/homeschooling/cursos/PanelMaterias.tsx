"use client";

// Propio de Ordo: panel «Materias» — centro de gestión de materias, cursos, constructor de clases/lecciones,
// materiales de estudio (textos, imágenes, videos embebidos, archivos, libros, enlaces) y quizzes/evaluaciones.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  BookOpen,
  CalendarPlus,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  Paperclip,
  Plus,
  Sparkles,
} from "lucide-react";
import { AdminItem } from "@/components/AdminItem";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Group } from "@/lib/homeschooling/roost/tipos";
import type { MateriaPanel } from "@/lib/homeschooling/servidor/panel";
import { colorCss } from "@/components/homeschooling/cursos/iconos";
import IconoMateria from "@/components/homeschooling/cursos/IconoMateria";
import MateriaForm from "@/components/homeschooling/cursos/MateriaForm";
import CursoForm from "@/components/homeschooling/cursos/CursoForm";
import BibliotecaCatolica from "@/components/homeschooling/cursos/BibliotecaCatolica";
import ImportarCurso from "@/components/homeschooling/cursos/ImportarCurso";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";
import { updateGroup } from "@/lib/homeschooling/roost/services/group";
import { toast } from "@/lib/toast";
import AsistenteCurso from "@/components/homeschooling/plan/AsistenteCurso";
import ListaMaterial from "@/components/homeschooling/material/ListaMaterial";

export default function PanelMaterias({
  materias,
  panel,
  archivadas,
  alumnos,
  hoy,
}: {
  materias: (Group & { course_count: number })[];
  panel: MateriaPanel[];
  archivadas: { id: number; nombre: string }[];
  alumnos: AlumnoLite[];
  hoy: string;
}) {
  const router = useRouter();
  const [materiaForm, setMateriaForm] = useState(false);
  const [materiaEditando, setMateriaEditando] = useState<Group | null>(null);
  const [cursoMateriaId, setCursoMateriaId] = useState<number | null>(null);
  const [asistente, setAsistente] = useState(false);
  const [materialDia, setMaterialDia] = useState(false);
  const [alumnoSuelto, setAlumnoSuelto] = useState<number>(alumnos[0]?.id ?? 0);
  const [fechaSuelto, setFechaSuelto] = useState<string>(hoy);

  const totalCursos = panel.reduce((n, m) => n + m.cursos.length, 0);
  const totalClases = panel.reduce((n, m) => n + m.cursos.reduce((c, x) => c + (x.lecciones ?? 0), 0), 0);
  const totalMateriales = panel.reduce((n, m) => n + m.cursos.reduce((c, x) => c + (x.materiales ?? 0), 0), 0);
  const totalQuizzes = panel.reduce((n, m) => n + m.cursos.reduce((c, x) => c + (x.quizzes ?? 0), 0), 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpen className="size-6" /> Materias y Cursos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestioná materias, cursos, constructor de clases paso a paso, materiales de estudio y evaluaciones imprimibles.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {alumnos.length > 0 && (
            <Button variant="outline" onClick={() => setMaterialDia(true)}>
              <Paperclip /> Cargar material al plan diario
            </Button>
          )}
          <Button variant="outline" onClick={() => setAsistente(true)} disabled={alumnos.length === 0 || materias.length === 0}>
            <CalendarPlus /> Asignar curso al plan
          </Button>
          <Button variant="outline" onClick={() => setMateriaForm(true)}>
            <Plus /> Nueva materia
          </Button>
          {materias.length > 0 && (
            <Button onClick={() => setCursoMateriaId(materias[0].id)}>
              <Plus /> Nuevo curso
            </Button>
          )}
        </div>
      </div>

      <section aria-label="Totales de contenido" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Materias activas</p>
          <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{panel.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Cursos</p>
          <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{totalCursos}</p>
        </div>
        <div className="rounded-xl border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Clases y materiales</p>
          <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
            {totalClases} <span className="text-sm font-normal text-muted-foreground">clases · {totalMateriales} mat.</span>
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3.5">
          <p className="text-xs text-muted-foreground">Quizzes / Evaluaciones</p>
          <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{totalQuizzes}</p>
        </div>
      </section>

      <section aria-label="Materias" className="space-y-4">
        {panel.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GraduationCap />
              </EmptyMedia>
              <EmptyTitle>Todavía no hay materias</EmptyTitle>
              <EmptyDescription>
                Empezá creando una materia y después sus cursos; dentro de cada curso podés armar las clases con textos, imágenes, videos, archivos descargables y evaluaciones imprimibles.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setMateriaForm(true)}>
                <Plus /> Crear la primera materia
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {panel.map((m) => (
              <AdminItem
                key={m.id}
                enabled
                forma="tarjeta"
                nombre={`la materia «${m.nombre}»`}
                className="rounded-xl border"
                aviso="Se borra la materia con sus cursos, lecciones y planes. No se puede deshacer."
                onEdit={() => {
                  const g = materias.find((x) => x.id === m.id);
                  if (g) setMateriaEditando(g);
                }}
                onDelete={async () => {
                  const res = await fetch(`/api/homeschooling/materias/${m.id}`, { method: "DELETE" });
                  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo eliminar la materia");
                  toast.success("Materia eliminada");
                  router.refresh();
                }}
              >
                <div className="overflow-hidden bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <Link href={`/dashboard/homeschooling/materias/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary-foreground"
                        style={{ backgroundColor: colorCss(m.color) }}
                      >
                        <IconoMateria nombre={m.icono} className="size-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold text-foreground hover:underline">{m.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.cursos.length} {m.cursos.length === 1 ? "curso" : "cursos"}
                        </span>
                      </span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <BibliotecaCatolica
                        materiaId={m.id}
                        onImportado={(cursoId) => {
                          router.refresh();
                          router.push(`/dashboard/homeschooling/materias/${m.id}?module=${cursoId}`);
                        }}
                      />
                      <ImportarCurso
                        materiaId={m.id}
                        onImportado={(cursoId) => {
                          router.refresh();
                          router.push(`/dashboard/homeschooling/materias/${m.id}?module=${cursoId}`);
                        }}
                      />
                      <Button size="sm" variant="outline" onClick={() => setCursoMateriaId(m.id)}>
                        <Plus className="size-4" /> Nuevo curso
                      </Button>
                    </div>
                  </div>

                  {m.cursos.length === 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-muted-foreground">
                      <span>Sin cursos todavía. Creá un curso para empezar a armar sus clases y materiales.</span>
                      <Button size="sm" variant="ghost" onClick={() => setCursoMateriaId(m.id)}>
                        <Plus className="size-4" /> Crear curso
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {m.cursos.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                          <Link
                            href={`/dashboard/homeschooling/materias/${m.id}?module=${c.id}`}
                            className="min-w-0 flex-1 space-y-1"
                          >
                            <p className="truncate font-medium text-foreground">{c.titulo}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Layers className="size-3.5" /> {c.lecciones ?? 0} {(c.lecciones ?? 0) === 1 ? "clase" : "clases"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <FileText className="size-3.5" /> {c.materiales ?? 0} {(c.materiales ?? 0) === 1 ? "material" : "materiales"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <ClipboardCheck className="size-3.5" /> {c.quizzes ?? 0} {(c.quizzes ?? 0) === 1 ? "quiz / eval." : "quizzes / eval."}
                              </span>
                            </div>
                          </Link>

                          <div className="flex items-center gap-3">
                            {c.alumnos > 0 ? (
                              <span className="flex w-28 shrink-0 items-center gap-2">
                                <Progress value={c.porcentaje} aria-label={`Avance de ${c.titulo}`} />
                                <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{c.porcentaje}%</span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">sin asignar</span>
                            )}
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/dashboard/homeschooling/materias/${m.id}?module=${c.id}`}>
                                <Sparkles className="size-3.5" /> Constructor de clases
                              </Link>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </AdminItem>
            ))}
          </div>
        )}
      </section>

      {archivadas.length > 0 && (
        <section aria-label="Materias archivadas" className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Materias archivadas</h2>
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
        open={!!materiaEditando}
        editing={materiaEditando}
        onClose={() => setMateriaEditando(null)}
        onSuccess={() => {
          setMateriaEditando(null);
          router.refresh();
        }}
      />
      <MateriaForm
        open={materiaForm}
        onClose={() => setMateriaForm(false)}
        onSuccess={() => {
          setMateriaForm(false);
          router.refresh();
        }}
      />

      {cursoMateriaId !== null && (
        <CursoForm
          open
          materiaId={cursoMateriaId}
          editing={null}
          onClose={() => setCursoMateriaId(null)}
          onSuccess={(curso) => {
            const mId = cursoMateriaId;
            setCursoMateriaId(null);
            router.refresh();
            router.push(`/dashboard/homeschooling/materias/${mId}?module=${curso.id}`);
          }}
        />
      )}

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

      <Sheet open={materialDia} onOpenChange={setMaterialDia}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Material de estudio para el plan diario</SheetTitle>
            <SheetDescription>
              Cargá textos, imágenes, archivos descargables (PDF, libros), videos embebidos o enlaces para un alumno y fecha determinada.
            </SheetDescription>
          </SheetHeader>
          {alumnos.length > 0 && (
            <div className="space-y-4 px-4 pb-6 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Alumno</span>
                  <NativeSelect className="w-full" aria-label="Alumno" value={String(alumnoSuelto)} onChange={(e) => setAlumnoSuelto(Number(e.target.value))}>
                    {alumnos.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.nombre}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Fecha</span>
                  <Input type="date" aria-label="Fecha" value={fechaSuelto} onChange={(e) => e.target.value && setFechaSuelto(e.target.value)} />
                </div>
              </div>
              {alumnoSuelto > 0 && fechaSuelto && (
                <ListaMaterial
                  key={`${alumnoSuelto}-${fechaSuelto}`}
                  destino={{ alumnoId: alumnoSuelto, fecha: fechaSuelto }}
                  contexto={`${alumnos.find((a) => a.id === alumnoSuelto)?.nombre ?? "Alumno"}, ${fechaSuelto}`}
                  expandido
                />
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
