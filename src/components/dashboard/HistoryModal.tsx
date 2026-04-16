"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2, Clock, Star, Gift, Loader2 } from "lucide-react";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"tasks" | "rewards">("tasks");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/users/history")
        .then(res => res.json())
        .then(setData)
        .finally(() => setLoading(false));
    } else {
      setData(null);
      setTab("tasks");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial" width="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : !data ? (
        <div className="text-center py-8 text-[var(--on-surface-variant)] font-body">Error cargando historial.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Stats summary */}
          {data.stats && (
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--warning)_15%,transparent)]">
                <Star className="w-5 h-5 text-[var(--warning)] mx-auto mb-1" />
                <div className="text-lg font-headline font-bold text-[var(--warning)]">{data.stats.stars || 0}</div>
                <div className="text-xs text-[var(--warning)] font-title font-bold uppercase tracking-wider">Estrellas</div>
              </div>
              <div className="bg-[color-mix(in-srgb,var(--success)_10%,transparent)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--success)_15%,transparent)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)] mx-auto mb-1" />
                <div className="text-lg font-headline font-bold text-[var(--success)]">{data.stats.availablePoints || 0}</div>
                <div className="text-xs text-[var(--success)] font-title font-bold uppercase tracking-wider">Pts Disponibles</div>
              </div>
              <div className="bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--primary)_15%,transparent)]">
                <Gift className="w-5 h-5 text-[var(--primary)] mx-auto mb-1" />
                <div className="text-lg font-headline font-bold text-[var(--primary)]">{data.stats.surprises || 0}</div>
                <div className="text-xs text-[var(--primary)] font-title font-bold uppercase tracking-wider">Sorpresas</div>
              </div>
            </div>
          )}

          {/* Tab selector */}
          <div className="flex bg-[var(--surface-container-low)] p-1 rounded-md mb-2">
            <button
              onClick={() => setTab("tasks")}
              className={`flex-1 py-2 rounded-md text-sm font-title font-bold transition-all ${tab === "tasks" ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] elevation-ambient" : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"}`}
            >
              Tareas Completadas ({data.completedTasks?.length || 0})
            </button>
            <button
              onClick={() => setTab("rewards")}
              className={`flex-1 py-2 rounded-md text-sm font-title font-bold transition-all ${tab === "rewards" ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] elevation-ambient" : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"}`}
            >
              Recompensas ({data.historial?.length || 0})
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2">
            {tab === "tasks" && (
              data.completedTasks?.length > 0 ? (
                data.completedTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-[var(--surface-container-lowest)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] rounded-md ghost-border">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${t.estado === "Aprobada" ? "text-[var(--success)]" : "text-[var(--warning)]"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-headline font-bold text-[var(--on-surface)] truncate">{t.titulo}</div>
                      <div className="text-xs text-[var(--on-surface-variant)] font-body">
                        {t.fechaCompletado ? new Date(t.fechaCompletado).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "Sin fecha"}
                        {t.tiempoRealEjecucionSeg != null && ` • ${Math.floor(t.tiempoRealEjecucionSeg / 60)}m ${t.tiempoRealEjecucionSeg % 60}s`}
                      </div>
                    </div>
                    {t.puntosGenerados > 0 && (
                      <span className="text-xs font-title font-bold text-[var(--warning)] bg-[color-mix(in-srgb,var(--warning)_5%,transparent)] border border-[color-mix(in-srgb,var(--warning)_15%,transparent)] px-2 py-1 rounded-md">
                        +{t.puntosGenerados} pts
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[var(--on-surface-variant)] font-body">No hay tareas completadas aún.</div>
              )
            )}

            {tab === "rewards" && (
              data.historial?.length > 0 ? (
                data.historial.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 p-3 bg-[var(--surface-container-lowest)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] rounded-md ghost-border">
                    <Clock className="w-5 h-5 text-[var(--outline)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-headline font-bold text-[var(--on-surface)] truncate">{h.tarea?.titulo || "Tarea"}</div>
                      <div className="text-xs text-[var(--on-surface-variant)] font-body">
                        {h.estadoAnterior || "—"} → <span className="font-title font-bold">{h.estadoNuevo}</span>
                        {h.timestamp && ` • ${new Date(h.timestamp).toLocaleDateString("es-ES")}`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[var(--on-surface-variant)] font-body">No hay historial de recompensas.</div>
              )
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
