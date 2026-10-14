"use client";

// Portado de vendor/roost/src/components/groups/learn/LearnGroupLayout.tsx (msrbuilds/roost@492af47).
// Cambios: modo padre; una sola consulta (getModulesWithRecordings) en vez del bucle de N llamadas (L79-83);
// sin CommentSection ni UploadAssetsModal; confirm()/alert() → Dialog/toast; ids numéricos; la lección anterior/siguiente
// sale de la lista ya cargada; plan de cada alumno y «Asignar a…».

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/homeschooling/roost/auth";
import { useSearchParams } from "@/lib/homeschooling/roost/router";
import { deleteModule, getModulesWithRecordings } from "@/lib/homeschooling/roost/services/module";
import { deleteRecording, rolDeGrupo } from "@/lib/homeschooling/roost/services/group";
import type { Group, Module, ModuleWithProgress, RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";
import { toast } from "@/lib/toast";
import AsistenteCurso from "@/components/homeschooling/plan/AsistenteCurso";
import CursoDetalle, { type PlanVista } from "./CursoDetalle";
import CursoForm from "./CursoForm";
import CursoGrid from "./CursoGrid";
import LeccionForm from "./LeccionForm";
import MateriaHeader, { type AlumnoLite } from "./MateriaHeader";
import MateriaSidebar from "./MateriaSidebar";
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
      />

      <main className="min-w-0 flex-1">
        <MateriaHeader group={group} alumnos={alumnos} alumnoId={alumnoId} onAlumno={rol === "admin" ? setAlumnoId : undefined} />

        <div className="p-4 sm:p-6">
          {view === "grid" && (
            <CursoGrid modules={modules} isLoading={isLoading} userRole={rol} onModuleClick={irAlCurso} onAddModule={() => setCursoForm({ open: true, editing: null })} />
          )}

          {view === "module" && activeModule && (
            <CursoDetalle
              module={activeModule}
              userRole={rol}
              planes={planesPorCurso[activeModule.id] ?? []}
              onLessonClick={(id) => irALeccion(activeModule.id, id)}
              onBack={irALaGrilla}
              onAddRecording={() => setLeccionForm({ open: true, editing: null })}
              onEditModule={() => setCursoForm({ open: true, editing: activeModule })}
              onDeleteModule={() => setBorrar({ tipo: "curso", id: activeModule.id, nombre: activeModule.title })}
              onAsignar={() => setAsignar(activeModule)}
            />
          )}

          {view === "lesson" && activeRecording && activeModule && (
            <VistaLeccion
              recording={activeRecording}
              prev={prev && { id: prev.id, title: prev.title }}
              next={next && { id: next.id, title: next.title }}
              onNavigate={(id) => irALeccion(activeModule.id, id)}
              onEdit={rol === "admin" ? () => setLeccionForm({ open: true, editing: activeRecording }) : undefined}
              onDelete={rol === "admin" ? () => setBorrar({ tipo: "leccion", id: activeRecording.id, nombre: activeRecording.title }) : undefined}
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
          onSuccess={() => {
            setLeccionForm({ open: false, editing: null });
            refrescar();
          }}
        />
      )}

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
