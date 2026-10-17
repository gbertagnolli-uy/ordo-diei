"use client";

// Portado de vendor/roost/src/components/groups/learn/LearnSidebar.tsx (msrbuilds/roost@492af47).
// Cambios: ids numéricos, tokens de Ordo, Progress de ui/, cajón móvil con Sheet de ui/, textos en español.

import { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Circle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AdminItem } from "@/components/AdminItem";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { ModuleWithProgress, RecordingWithCompletion } from "@/lib/homeschooling/roost/tipos";

interface Props {
  modules: ModuleWithProgress[];
  moduleRecordings: Record<number, RecordingWithCompletion[]>;
  activeModuleId?: number;
  activeRecordingId?: number;
  onSelectModule: (moduleId: number) => void;
  onSelectLesson: (moduleId: number, recordingId: number) => void;
  onBackToModules: () => void;
  showBackButton: boolean;
  /** Solo administradores: editar y eliminar lecciones desde la lista. */
  onEditLesson?: (recording: RecordingWithCompletion) => void;
  onDeleteLesson?: (recording: RecordingWithCompletion) => void;
}

export default function MateriaSidebar({
  modules,
  moduleRecordings,
  activeModuleId,
  activeRecordingId,
  onSelectModule,
  onSelectLesson,
  onBackToModules,
  showBackButton,
  onEditLesson,
  onDeleteLesson,
}: Props) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set(activeModuleId ? [activeModuleId] : []));
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleModule = (moduleId: number) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  const contenido = (
    <div className="flex h-full flex-col">
      {showBackButton && (
        <button
          onClick={() => {
            onBackToModules();
            setIsMobileOpen(false);
          }}
          className="flex items-center gap-2 border-b px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          Volver a los cursos
        </button>
      )}

      <div className="flex-1 overflow-y-auto">
        {modules.map((module) => {
          const isExpanded = expandedModules.has(module.id);
          const recordings = moduleRecordings[module.id] || [];
          const isActive = module.id === activeModuleId;

          return (
            <div key={module.id} className="border-b">
              <button
                onClick={() => {
                  toggleModule(module.id);
                  onSelectModule(module.id);
                  setIsMobileOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted ${isActive ? "bg-muted" : ""}`}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium text-foreground">{module.title}</h3>
                  <div className="mt-1">
                    <Progress value={module.progress_percentage} aria-label={`Avance de ${module.title}`} />
                  </div>
                </div>
              </button>

              {isExpanded && recordings.length > 0 && (
                <div className="pb-2">
                  {recordings.map((recording) => (
                    <AdminItem
                      key={recording.id}
                      enabled={!!(onEditLesson || onDeleteLesson)}
                      nombre={`la lección «${recording.title}»`}
                      confirmar={false}
                      onEdit={onEditLesson && module.id === activeModuleId ? () => onEditLesson(recording) : undefined}
                      onDelete={onDeleteLesson ? () => onDeleteLesson(recording) : undefined}
                    >
                    <button
                      onClick={() => {
                        onSelectLesson(module.id, recording.id);
                        setIsMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-2.5 py-2 pr-4 pl-10 text-left transition-colors ${
                        recording.id === activeRecordingId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {recording.is_completed ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground/60" />
                      )}
                      <span className="truncate text-sm">{recording.title}</span>
                    </button>
                    </AdminItem>
                  ))}
                </div>
              )}

              {isExpanded && recordings.length === 0 && <p className="pr-4 pb-3 pl-10 text-xs text-muted-foreground">Sin lecciones todavía</p>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Button variant="outline" size="sm" className="mb-3 lg:hidden" onClick={() => setIsMobileOpen(true)}>
        <Menu /> Cursos y lecciones
      </Button>
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <SheetTitle className="sr-only">Cursos y lecciones</SheetTitle>
          {contenido}
        </SheetContent>
      </Sheet>
      <aside className="sticky top-[5.5rem] hidden h-[calc(100svh-5.5rem)] w-72 shrink-0 overflow-hidden border-r bg-card lg:block">{contenido}</aside>
    </>
  );
}
