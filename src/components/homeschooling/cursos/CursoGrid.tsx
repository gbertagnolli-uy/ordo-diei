"use client";

// Portado de vendor/roost/src/components/groups/learn/ModuleGrid.tsx (msrbuilds/roost@492af47).
// Cambios: Button/Empty/Spinner de ui/, rol admin/member (Padre/Madre), textos en español.

import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import type { ModuleWithProgress } from "@/lib/homeschooling/roost/tipos";
import { hasPermission, type GroupRole } from "@/lib/homeschooling/roost/permisos";
import CursoCard from "./CursoCard";

export default function CursoGrid({
  modules,
  isLoading,
  userRole,
  onModuleClick,
  onAddModule,
}: {
  modules: ModuleWithProgress[];
  isLoading: boolean;
  userRole: GroupRole | null;
  onModuleClick: (moduleId: number) => void;
  onAddModule: () => void;
}) {
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
          <Button onClick={onAddModule}>
            <Plus /> Nuevo curso
          </Button>
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
              <Button variant="outline" onClick={onAddModule}>
                <Plus /> Crear el primer curso
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <CursoCard key={module.id} module={module} onClick={onModuleClick} />
          ))}
        </div>
      )}
    </div>
  );
}
