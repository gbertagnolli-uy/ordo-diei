"use client";

// Portado de vendor/roost/src/components/groups/learn/LearnGroupLayout.tsx (msrbuilds/roost@492af47).
// Cambios: modo padre; una sola consulta (getModulesWithRecordings) en vez del bucle de N llamadas (L79-83);
// sin CommentSection ni UploadAssetsModal; confirm()/alert() → Dialog/toast; ids numéricos; la lección anterior/siguiente
// sale de la lista ya cargada; plan de cada alumno y «Asignar a…».

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/homeschooling/roost/auth";
import { useSearchParams } from "@/lib/homeschooling/roost/router";
import { deleteModule, getModulesWithRecordings, reorderModules, updateModule } from "@/lib/homeschooling/roost/services/module";
import { deleteRecording, reorderRecordings, rolDeGrupo, updateGroup } from "@/lib/homeschooling/roost/services/group";
import type { Group, Module, ModuleWithProgress, RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";
import { toast } from "@/lib/toast";
import AsistenteCurso from "@/components/homeschooling/plan/AsistenteCurso";
import EditarPlan, { type PlanEditable } from "@/components/homeschooling/plan/EditarPlan";
import { api } from "@/lib/homeschooling/roost/services/http";
import AgregarVarias from "./AgregarVarias";
import CursoDetalle, { type AccionPlan, type PlanVista } from "./CursoDetalle";
import CursoForm from "./CursoForm";
import EditorPreguntas from "./EditorPreguntas";
import MateriaForm from "./MateriaForm";
import CursoGrid from "./CursoGrid";
import LeccionForm from "./LeccionForm";
import MateriaHeader, { type AlumnoLite } from "./MateriaHeader";
import MateriaSidebar from "./MateriaSidebar";
import Migas from "./Migas";
import VistaLeccion from "./VistaLeccion";

export default function MateriaLayout({
  group,
  alumnos,
  alumnoInicial,
  planesPorCurso,
  onCambio,
}: {
  group: Group;
  alumnos: AlumnoLite[];
  alumnoInicial: number | null;
  planesPorCurso: Record<number, PlanVista[]>;
  /** Para que la página servidor se vuelva a leer (planes) después de un cambio */
  onCambio: () => void;
}) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const rol = rolDeGrupo(profile.rolFamiliar);
  const [searchParams, setSearchParams] = useSearchParams();

  const [alumnoId, setAlumnoId] = useState<number | null>(rol === "member" ? user.id : alumnoInicial);
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeModuleId = Number(searchParams.get("module")) || undefined;
  const activeRecordingId = Number(searchParams.get("lesson")) || undefined;
  const view = activeRecordingId ? "lesson" : activeModuleId ? "module" : "grid";

  const [cursoForm, setCursoForm] = useState<{ open: boolean; editing: Module | null }>({ open: false, editing: null });
  const [leccionForm, setLeccionForm] = useState<{ open: boolean; editing: RecordingWithCompletion | null }>({ open: false, editing: null });
  const [asignar, setAsignar] = useState<Module | null>(null);
  const [preguntasLeccion, setPreguntasLeccion] = useState<{ id: number; title: string } | null>(null);
  const [versionPreguntas, setVersionPreguntas] = useState(0);
  const [agregarVarias, setAgregarVarias] = useState(false);
  const [editarMateria, setEditarMateria] = useState(false);
  const [archivar, setArchivar] = useState(false);
  const [editarPlan, setEditarPlan] = useState<PlanEditable | null>(null);
  const [quitarPlan, setQuitarPlan] = useState<PlanVista | null>(null);
  const [borrar, setBorrar] = useState<{ tipo: "curso" | "leccion"; id: number; nombre: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      setIsLoading(true);
      setModules(await getModulesWithRecordings(group.id, alumnoId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los cursos");
    } finally {
      setIsLoading(false);
    }
  }, [group.id, alumnoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const moduleRecordings = useMemo(() => Object.fromEntries(modules.map((m) => [m.id, m.recordings ?? []])), [modules]);
  const activeModule = modules.find((m) => m.id === activeModuleId) ?? null;
  const activeRecording = activeModule?.recordings?.find((r) => r.id === activeRecordingId) ?? null;
  const indice = activeModule?.recordings?.findIndex((r) => r.id === activeRecordingId) ?? -1;
  const prev = indice > 0 ? activeModule!.recordings![indice - 1] : null;
  const next = indice >= 0 && indice < (activeModule?.recordings?.length ?? 0) - 1 ? activeModule!.recordings![indice + 1] : null;

  const irAlCurso = (moduleId: number) => setSearchParams(new URLSearchParams({ module: String(moduleId) }));
  const irALeccion = (moduleId: number, recordingId: number) => setSearchParams(new URLSearchParams({ module: String(moduleId), lesson: String(recordingId) }));
  const irALaGrilla = () => setSearchParams(new URLSearchParams());

  const refrescar = () => {
    void cargar();
    onCambio();
  };

  // El orden se ve al instante (la base puede tardar un par de segundos) y, si falla, se vuelve a leer del servidor
  const reordenar = async (optimista: () => void, fn: () => Promise<void>) => {
    optimista();
    try {
      await fn();
      refrescar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el orden");
      refrescar();
    }
  };

  const reordenarCursos = (ids: number[]) =>
    reordenar(
      () => setModules((prev) => ids.map((id) => prev.find((m) => m.id === id)).filter((m): m is ModuleWithProgress => !!m)),
      () => reorderModules(group.id, ids)
    );

  const reordenarLecciones = (moduleId: number, ids: number[]) =>
    reordenar(
      () =>
        setModules((prev) =>
          prev.map((m) =>
            m.id !== moduleId || !m.recordings
              ? m
              : { ...m, recordings: ids.map((id, i) => ({ ...m.recordings!.find((r) => r.id === id)!, display_order: i + 1 })) }
          )
        ),
      () => reorderRecordings(moduleId, ids)
    );

  const accionPlan = async (plan: PlanVista, accion: AccionPlan) => {
    if (accion === "editar") return setEditarPlan({ id: plan.id, nombre: plan.nombre, inicio: plan.inicio, fin: plan.fin, diasSemana: plan.diasSemana });
    if (accion === "quitar") return setQuitarPlan(plan);
    const estado = accion === "pausar" ? "pausado" : accion === "terminar" ? "finalizado" : "activo";
    try {
      await api(`/api/homeschooling/planes/${plan.id}`, { method: "PATCH", body: { estado } });
      refrescar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el plan");
    }
  };

  const confirmarQuitarPlan = async () => {
    if (!quitarPlan) return;
    try {
      await api(`/api/homeschooling/planes/${quitarPlan.id}`, { method: "DELETE" });
      setQuitarPlan(null);
      refrescar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo quitar el plan");
      setQuitarPlan(null);
    }
  };

  const confirmarBorrado = async () => {
    if (!borrar) return;
    try {
      if (borrar.tipo === "curso") {
        await deleteModule(borrar.id);
        irALaGrilla();
      } else {
        await deleteRecording(borrar.id);
        if (activeModuleId) irAlCurso(activeModuleId);
      }
      setBorrar(null);
      refrescar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo borrar");
      setBorrar(null);
    }
  };

  if (isLoading && modules.length === 0) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <MateriaSidebar
        modules={modules}
        moduleRecordings={moduleRecordings}
        activeModuleId={activeModuleId}
        activeRecordingId={activeRecordingId}
        onSelectModule={irAlCurso}
        onSelectLesson={irALeccion}
        onBackToModules={irALaGrilla}
        showBackButton={view !== "grid"}
        onEditLesson={rol === "admin" ? (r) => setLeccionForm({ open: true, editing: r }) : undefined}
        onDeleteLesson={rol === "admin" ? (r) => setBorrar({ tipo: "leccion", id: r.id, nombre: r.title }) : undefined}
      />

      <main className="min-w-0 flex-1">
        <Migas
          items={[
            { etiqueta: "Estudio", href: "/dashboard/homeschooling" },
            { etiqueta: "Materias", href: "/dashboard/homeschooling/materias" },
            { etiqueta: group.name, onClick: view !== "grid" ? irALaGrilla : undefined },
            ...(activeModule ? [{ etiqueta: activeModule.title, onClick: view === "lesson" ? () => irAlCurso(activeModule.id) : undefined }] : []),
            ...(view === "lesson" && activeRecording ? [{ etiqueta: `${activeRecording.display_order}. ${activeRecording.title}` }] : []),
          ]}
        />
        <MateriaHeader group={group} alumnos={alumnos} alumnoId={alumnoId} onAlumno={rol === "admin" ? setAlumnoId : undefined} onEditar={rol === "admin" ? () => setEditarMateria(true) : undefined} onArchivar={rol === "admin" ? () => setArchivar(true) : undefined} />

        <div className="p-4 sm:p-6">
          {view === "grid" && (
            <CursoGrid modules={modules} isLoading={isLoading} userRole={rol} onModuleClick={irAlCurso} onAddModule={() => setCursoForm({ open: true, editing: null })} onEditar={(m) => setCursoForm({ open: true, editing: m })} onEliminar={(m) => setBorrar({ tipo: "curso", id: m.id, nombre: m.title })} onReordenar={reordenarCursos} materiaId={group.id} onImportado={(id) => { refrescar(); irAlCurso(id); }} />
          )}

          {view === "module" && activeModule && (
            <CursoDetalle
              module={activeModule}
              userRole={rol}
              planes={planesPorCurso[activeModule.id] ?? []}
              onLessonClick={(id) => irALeccion(activeModule.id, id)}
              onBack={irALaGrilla}
              materiaNombre={group.name}
              onAddRecording={() => setLeccionForm({ open: true, editing: null })}
              onAddVarias={() => setAgregarVarias(true)}
              onEditRecording={rol === "admin" ? (r) => setLeccionForm({ open: true, editing: r }) : undefined}
              onQuizRecording={rol === "admin" ? (r) => setPreguntasLeccion({ id: r.id, title: r.title }) : undefined}
              onDuplicar={async () => {
                try {
                  const r = await api<{ id: number }>(`/api/homeschooling/cursos/${activeModule.id}/duplicar`, { method: "POST", body: {} });
                  toast.success("Curso duplicado");
                  refrescar();
                  irAlCurso(r.id);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo duplicar el curso");
                }
              }}
              onEditModule={() => setCursoForm({ open: true, editing: activeModule })}
              onDeleteModule={() => setBorrar({ tipo: "curso", id: activeModule.id, nombre: activeModule.title })}
              onAsignar={() => setAsignar(activeModule)}
              onPlan={accionPlan}
              onReordenarLecciones={(ids) => reordenarLecciones(activeModule.id, ids)}
              onToggleLibre={async (libre) => {
                try {
                  await updateModule(activeModule.id, { navegacion_libre: libre });
                  refrescar();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo cambiar");
                }
              }}
            />
          )}

          {view === "lesson" && activeRecording && activeModule && (
            <VistaLeccion
              recording={activeRecording}
              prev={prev && { id: prev.id, title: prev.title }}
              next={next && { id: next.id, title: next.title }}
              onNavigate={(id) => irALeccion(activeModule.id, id)}
              cursoTitulo={activeModule.title}
              onBack={() => irAlCurso(activeModule.id)}
              onPreguntas={rol === "admin" ? () => setPreguntasLeccion({ id: activeRecording.id, title: activeRecording.title }) : undefined}
              onEdit={rol === "admin" ? () => setLeccionForm({ open: true, editing: activeRecording }) : undefined}
              onDelete={rol === "admin" ? () => setBorrar({ tipo: "leccion", id: activeRecording.id, nombre: activeRecording.title }) : undefined}
              versionPreguntas={versionPreguntas}
            />
          )}
        </div>
      </main>

      <CursoForm
        open={cursoForm.open}
        materiaId={group.id}
        editing={cursoForm.editing}
        onClose={() => setCursoForm({ open: false, editing: null })}
        onSuccess={(m) => {
          setCursoForm({ open: false, editing: null });
          refrescar();
          if (!cursoForm.editing) irAlCurso(m.id);
        }}
      />

      {activeModuleId && (
        <LeccionForm
          open={leccionForm.open}
          moduleId={activeModuleId}
          editing={leccionForm.editing}
          onClose={() => setLeccionForm({ open: false, editing: null })}
          onSuccess={(rec, abrirQuiz) => {
            const esNueva = !leccionForm.editing;
            setLeccionForm({ open: false, editing: null });
            refrescar();
            if (rec && esNueva && activeModuleId) {
              irALeccion(activeModuleId, rec.id);
            }
            if (rec && abrirQuiz) {
              setPreguntasLeccion({ id: rec.id, title: rec.title });
            }
          }}
        />
      )}

      {activeModuleId && (
        <AgregarVarias
          key={activeModuleId}
          open={agregarVarias}
          recursoId={activeModuleId}
          onClose={() => setAgregarVarias(false)}
          onCreadas={() => {
            setAgregarVarias(false);
            refrescar();
          }}
        />
      )}

      {preguntasLeccion && (
        <EditorPreguntas
          open={!!preguntasLeccion}
          leccionId={preguntasLeccion.id}
          titulo={preguntasLeccion.title}
          onClose={() => setPreguntasLeccion(null)}
          onGuardado={() => {
            setVersionPreguntas((v) => v + 1);
            refrescar();
          }}
        />
      )}

      <EditarPlan
        plan={editarPlan}
        onClose={() => setEditarPlan(null)}
        onGuardado={() => {
          setEditarPlan(null);
          refrescar();
        }}
      />

      <Dialog open={!!quitarPlan} onOpenChange={(o) => !o && setQuitarPlan(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Quitar el plan de {quitarPlan?.nombre}?</DialogTitle>
            <DialogDescription>Se borran sus días pendientes. Si ya tiene días cumplidos no se puede quitar: pausalo o dalo por terminado.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuitarPlan(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarQuitarPlan}>
              Quitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MateriaForm
        open={editarMateria}
        editing={group}
        onClose={() => setEditarMateria(false)}
        onSuccess={() => {
          setEditarMateria(false);
          onCambio();
        }}
      />

      <Dialog open={archivar} onOpenChange={setArchivar}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Archivar «{group.name}»?</DialogTitle>
            <DialogDescription>Deja de aparecer en el panel y en «Hoy aprendo»; los cursos, planes y avances se conservan y se puede restaurar desde Materias.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchivar(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  await updateGroup(group.id, { is_active: false });
                  router.push("/dashboard/homeschooling/materias");
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "No se pudo archivar");
                }
              }}
            >
              Archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AsistenteCurso
        open={!!asignar}
        onClose={() => setAsignar(null)}
        alumnos={alumnos}
        materias={[group]}
        materiaFija={group}
        cursoFijo={asignar}
        onGuardado={() => {
          setAsignar(null);
          refrescar();
        }}
      />

      <Dialog open={!!borrar} onOpenChange={(o) => !o && setBorrar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{borrar?.tipo === "curso" ? "¿Borrar el curso?" : "¿Borrar la lección?"}</DialogTitle>
            <DialogDescription>
              «{borrar?.nombre}»{borrar?.tipo === "curso" ? " se borra con sus lecciones y planes." : " se borra del curso."} No se puede deshacer.
            </DialogDescription>
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
