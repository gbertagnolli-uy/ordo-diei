"use client";

import { useState } from "react";
import { ArrowLeft, Check, Clock, ListChecks, Pause, Play, Repeat, Star, X, CalendarClock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ChecklistModal } from "@/components/dashboard/ChecklistModal";
import { cn } from "@/lib/utils";
import { useTaskActions } from "./useTaskActions";
import {
  CoResponsable,
  checklistProgress,
  formatClock,
  formatDue,
  formatDuration,
  isActionable,
  pointsLabel,
  statusInfo,
} from "./taskUtils";
import { StatusBadge, Avatar } from "./primitives";

const RECURRENCIA: Record<string, string> = {
  Unica: "Única",
  Diaria: "Diaria",
  Semanal: "Semanal",
  Mensual_Fecha: "Mensual",
  Mensual_Ordinal: "Mensual",
};

// Ficha de la tarea seleccionada: se muestra en el panel de contexto del App Shell y del Kanban.
export function TaskDetailPanel({
  task,
  coResponsables = [],
  onBack,
  backLabel = "Agenda",
}: {
  task: any;
  coResponsables?: CoResponsable[];
  onBack: () => void;
  backLabel?: string;
}) {
  const actions = useTaskActions(task);
  const [confirm, setConfirm] = useState<null | "finish" | "notDone">(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const canAct = isActionable(task);
  const checklist = checklistProgress(task);
  const status = statusInfo(task);

  const openConfirm = (kind: "finish" | "notDone") => {
    actions.pauseForConfirm();
    setConfirm(kind);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-5 h-14 border-b border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </button>
        <StatusBadge label={status.label} color={status.color} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <div>
          <h2 className="font-display text-xl leading-snug text-[var(--on-surface)]">{task.titulo}</h2>
          {task.descripcion && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--on-surface-variant)]">{task.descripcion}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Meta icon={<Clock className="w-3.5 h-3.5" />} label="Estimado" value={formatDuration(task.tiempoEjecucionEstimadoSeg || 0)} />
          <Meta icon={<CalendarClock className="w-3.5 h-3.5" />} label="Vence" value={formatDue(task, true) ?? "Sin fecha"} />
          <Meta icon={<Star className="w-3.5 h-3.5" />} label="Puntos" value={task.generaPuntosYRecompensa ? pointsLabel(task) : "No suma"} />
          <Meta icon={<Repeat className="w-3.5 h-3.5" />} label="Repite" value={RECURRENCIA[task.tipoRecurrencia] ?? "Única"} />
        </dl>

        {coResponsables.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)] mb-2">Co-responsables</p>
            <div className="flex flex-wrap gap-2">
              {coResponsables.map((cr) => (
                <span key={cr.id} className="flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full bg-[var(--surface-container)] text-xs font-medium text-[var(--on-surface)]">
                  <Avatar user={cr} size="xs" /> {cr.nombre}
                </span>
              ))}
            </div>
          </div>
        )}

        {task.isChecklist && checklist.total > 0 && (
          <button
            type="button"
            onClick={() => setChecklistOpen(true)}
            className="w-full text-left rounded-xl border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-3.5 hover:border-[var(--success)] transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--on-surface)]">
              <ListChecks className="w-4 h-4 text-[var(--success)]" /> Checklist
              <span className="ml-auto tabular-nums text-[var(--on-surface-variant)]">{checklist.done}/{checklist.total}</span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
              <div className="h-full bg-[var(--success)] transition-all duration-500" style={{ width: `${checklist.pct}%` }} />
            </div>
          </button>
        )}

        {canAct && (
          <div className="rounded-xl bg-[var(--surface-container-low)] border border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
                  {actions.isOvertime ? "Tiempo excedido" : "Restante"}
                </p>
                <p
                  className={cn(
                    "font-mono text-3xl font-bold tabular-nums",
                    actions.isOvertime ? "text-[var(--error)]" : actions.isPlaying ? "text-[var(--success)]" : "text-[var(--on-surface)]"
                  )}
                >
                  {formatClock(actions.remaining)}
                </p>
              </div>
              <button
                type="button"
                onClick={actions.togglePlay}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.97]",
                  actions.isPlaying
                    ? "bg-[var(--secondary)] text-[var(--on-secondary)] hover:bg-[var(--secondary-container)]"
                    : "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-container)]"
                )}
              >
                {actions.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {actions.isPlaying ? "Pausar" : "Iniciar"}
              </button>
            </div>
          </div>
        )}

        {task.estado === "Esperando_Aprobacion" && (
          <p className="text-sm text-[var(--on-surface-variant)] italic">
            Esperando que Papá o Mamá la aprueben. Los puntos quedan bloqueados hasta entonces.
          </p>
        )}
      </div>

      {canAct && (
        <div className="flex gap-2 p-4 border-t border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] shrink-0">
          <button
            type="button"
            onClick={() => openConfirm("finish")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[var(--success)] text-[var(--on-success)] text-sm font-semibold hover:bg-[var(--success-container)] transition-all active:scale-[0.97]"
          >
            <Check className="w-4 h-4" /> Terminé
          </button>
          <button
            type="button"
            onClick={() => openConfirm("notDone")}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-[color-mix(in-srgb,var(--outline-variant)_60%,transparent)] text-sm font-semibold text-[var(--on-surface-variant)] hover:text-[var(--error)] hover:border-[var(--error)] transition-colors"
          >
            <X className="w-4 h-4" /> No la hice
          </button>
        </div>
      )}

      <Modal isOpen={confirm === "finish"} onClose={() => setConfirm(null)} title="¿Terminaste la tarea?">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/time-machine-animate.svg" alt="" className="w-40 h-40 drop-shadow-sm" />
          <p className="text-[var(--on-surface-variant)] font-medium text-lg leading-relaxed">
            Siempre revisa que la tarea fue completada correctamente para no perderte puntos y premios sorpresa!
          </p>
          <div className="flex w-full gap-4 mt-4">
            <button disabled={actions.loading} onClick={() => setConfirm(null)} className="flex-1 bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-semibold py-3.5 rounded-md transition-colors">
              Voy a revisar
            </button>
            <button disabled={actions.loading} onClick={async () => { if (await actions.finishTask()) setConfirm(null); }} className="flex-1 btn-primary py-3.5 transition-colors">
              {actions.loading ? "Evaluando..." : "Sí, finalizar"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirm === "notDone"} onClose={() => setConfirm(null)} title="¿No la hiciste?">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[var(--on-surface-variant)] font-medium text-lg leading-relaxed">
            Si marcas la tarea como &quot;No Realizada&quot;, esta se archivará sin otorgarte puntos. <br />¿Estás seguro?
          </p>
          <div className="flex w-full gap-4 mt-4">
            <button disabled={actions.loading} onClick={() => setConfirm(null)} className="flex-1 bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-semibold py-3.5 rounded-md transition-colors">
              Mejor la hago
            </button>
            <button disabled={actions.loading} onClick={async () => { if (await actions.markAsNotDone()) setConfirm(null); }} className="flex-1 bg-[var(--error)] text-[var(--on-error)] font-bold py-3.5 rounded-md transition-colors">
              {actions.loading ? "Cargando..." : "Sí, no la hice"}
            </button>
          </div>
        </div>
      </Modal>

      {task.isChecklist && (
        <ChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} taskId={task.id} taskTitle={task.titulo} />
      )}
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 font-medium text-[var(--on-surface)]">{value}</dd>
    </div>
  );
}
