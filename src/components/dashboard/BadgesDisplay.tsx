import { evaluarLogros } from "@/lib/logros";
import { LogroIcon } from "@/components/perfil/LogroIcon";
import type { EstadoHabito } from "@/lib/habitos/server";

interface BadgesDisplayProps {
  totalTasksCompleted?: number;
  streakDays?: number;
  stars?: number;
  completionPercentage?: number;
  puntosAcumulados?: number;
  experienciaHabitos?: number;
  habitos?: EstadoHabito[];
}

export function BadgesDisplay({
  totalTasksCompleted = 0,
  streakDays = 0,
  stars = 0,
  completionPercentage = 0,
  puntosAcumulados = 0,
  experienciaHabitos = 0,
  habitos = [],
}: BadgesDisplayProps) {
  const logros = evaluarLogros({
    usuario: {
      totalTasksCompleted,
      streakDays,
      stars,
      completionPercentage,
      puntosAcumulados,
      experienciaHabitos,
    },
    habitos,
  });

  const obtenidos = logros.filter((l) => l.obtenido);

  if (obtenidos.length === 0) {
    return (
      <div className="text-center py-4 text-xs font-title tracking-wider uppercase text-[var(--on-surface-variant)] border border-dashed border-[color-mix(in_srgb,var(--outline-variant)_30%,transparent)] rounded-md opacity-70">
        Completa más tareas para desbloquear medallas
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mb-[-4px]">
        Medallas Desbloqueadas ({obtenidos.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {obtenidos.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
          >
            <span className="text-primary">
              <LogroIcon name={b.icono} className="size-4" />
            </span>
            <span className="text-xs font-bold text-foreground">{b.titulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
