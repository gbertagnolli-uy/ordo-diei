"use client";

// Portado de vendor/roost/src/components/groups/learn/CompactGroupHeader.tsx (msrbuilds/roost@492af47).
// Cambios: materia familiar (ícono y color en vez de avatar/slug), pestañas con los alumnos (elige de quién se ve
// el progreso), sin miembros ni ajustes de grupo, tokens de Ordo.

import { Archive, Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Group } from "@/lib/homeschooling/roost/tipos";

export type AlumnoLite = { id: number; nombre: string; fotoUrl: string | null };

export default function MateriaHeader({
  group,
  alumnos,
  alumnoId,
  onAlumno,
  onEditar,
  onArchivar,
}: {
  group: Group;
  alumnos: AlumnoLite[];
  alumnoId: number | null;
  onAlumno?: (id: number) => void;
  onEditar?: () => void;
  onArchivar?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b bg-card px-6 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
        {group.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-foreground">{group.name}</h1>
        {group.description && <p className="truncate text-sm text-muted-foreground">{group.description}</p>}
      </div>

      {(onEditar || onArchivar) && (
        <div className="flex shrink-0 gap-1">
          {onEditar && (
            <Button variant="ghost" size="icon" aria-label="Editar la materia" onClick={onEditar}>
              <Pencil />
            </Button>
          )}
          {onArchivar && (
            <Button variant="ghost" size="icon" aria-label="Archivar la materia" onClick={onArchivar}>
              <Archive />
            </Button>
          )}
        </div>
      )}

      {onAlumno && alumnos.length > 0 && (
        <div className="flex shrink-0 items-center gap-2" role="tablist" aria-label="Alumno">
          {alumnos.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={a.id === alumnoId}
              onClick={() => onAlumno(a.id)}
              className={`flex items-center gap-2 rounded-full border px-2 py-1 text-sm transition-colors ${
                a.id === alumnoId ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Avatar size="sm">
                {a.fotoUrl && <AvatarImage src={a.fotoUrl} alt="" />}
                <AvatarFallback>{a.nombre.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {a.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
