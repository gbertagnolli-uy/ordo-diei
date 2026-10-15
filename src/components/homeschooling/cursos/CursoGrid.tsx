"use client";

// Portado de vendor/roost/src/components/groups/learn/ModuleGrid.tsx (msrbuilds/roost@492af47).
// Cambios: Button/Empty/Spinner de ui/, rol admin/member (Padre/Madre), textos en español.

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ListOrdered, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import type { ModuleWithProgress } from "@/lib/homeschooling/roost/tipos";
import ImportarCurso from "./ImportarCurso";
import { hasPermission, type GroupRole } from "@/lib/homeschooling/roost/permisos";
import CursoCard from "./CursoCard";
import { mover } from "./CursoDetalle";

export default function CursoGrid({
  modules,
  isLoading,
  userRole,
  onModuleClick,
  onAddModule,
  onReordenar,
  materiaId,
  onImportado,
}: {
  modules: ModuleWithProgress[];
  isLoading: boolean;
  userRole: GroupRole | null;
  onModuleClick: (moduleId: number) => void;
  onAddModule: () => void;
  onReordenar: (idsEnOrden: number[]) => void;
  materiaId: number;
  onImportado: (cursoId: number) => void;
}) {
  const [ordenando, setOrdenando] = useState(false);
  const canManage = hasPermission(userRole, "crear_curso");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Cursos</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {modules.length} {modules.length === 1 ? "curso" : "cursos"}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {modules.length > 1 && (
              <Button variant={ordenando ? "default" : "outline"} onClick={() => setOrdenando((o) => !o)} aria-pressed={ordenando}>
                <ListOrdered /> {ordenando ? "Listo" : "Ordenar"}
              </Button>
            )}
            <ImportarCurso materiaId={materiaId} onImportado={onImportado} />
            <Button onClick={onAddModule}>
              <Plus /> Nuevo curso
            </Button>
          </div>
        )}
      </div>

      {modules.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>Todavía no hay cursos</EmptyTitle>
            <EmptyDescription>
              {canManage ? "Creá un curso para organizar el contenido de la materia." : "Los cursos aparecerán acá cuando tus padres te los asignen."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={onAddModule}>
                  <Plus /> Crear el primer curso
                </Button>
                <ImportarCurso materiaId={materiaId} onImportado={onImportado} />
              </div>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, i) => (
            <div key={module.id} className="relative">
              <CursoCard module={module} onClick={ordenando ? () => {} : onModuleClick} />
              {ordenando && (
                <div className="absolute top-2 right-2 flex gap-1 rounded-lg border bg-card p-1">
                  <Button variant="ghost" size="icon-sm" aria-label={`Mover «${module.title}» antes`} disabled={i === 0} onClick={() => onReordenar(mover(modules.map((m) => m.id), i, i - 1))}>
                    <ArrowLeft />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Mover «${module.title}» después`} disabled={i === modules.length - 1} onClick={() => onReordenar(mover(modules.map((m) => m.id), i, i + 1))}>
                    <ArrowRight />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
