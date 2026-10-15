"use client";

// Portado de vendor/roost/src/components/groups/learn/ModuleCard.tsx (msrbuilds/roost@492af47).
// Cambios: ids numéricos, tokens de Ordo, Progress de ui/ (no se porta ProgressBar), textos en español, miniatura con <img> simple.

import { Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ModuleWithProgress } from "@/lib/homeschooling/roost/tipos";

export default function CursoCard({ module, onClick }: { module: ModuleWithProgress; onClick: (moduleId: number) => void }) {
  return (
    <button
      onClick={() => onClick(module.id)}
      className="w-full overflow-hidden rounded-xl border bg-card text-left transition-colors hover:border-primary/50"
    >
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        {module.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={module.thumbnail_url}
            alt={module.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Video className="size-10 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">{module.title}</h3>
        {module.description && <p className="line-clamp-2 text-sm text-muted-foreground">{module.description}</p>}

        <div className="space-y-1.5">
          <Progress value={module.progress_percentage} aria-label={`Avance de ${module.title}`} />
          <p className="text-xs text-muted-foreground">
            {module.progress_percentage}%
            {module.total_unidades > 0 && (
              <span className="ml-1">
                · {module.completed_count}/{module.total_unidades} {module.unidad_tipo === "pagina" ? "páginas" : "unidades"}
              </span>
            )}
          </p>
        </div>
      </div>
    </button>
  );
}
