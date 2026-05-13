"use client";

import { useState } from "react";
import { Check, X, Clock, User, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

export function ParentReviewPanel({ tasks }: { tasks: any[] }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const waitingTasks = tasks.filter(t => t.estado === "Esperando_Aprobacion");

  if (waitingTasks.length === 0) return null;

  const handleAction = async (taskId: number, action: "approve" | "reject") => {
    setLoadingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/${action}`, {
        method: "POST",
      });

      if (res.ok) {
        if (action === "approve") {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 }
          });
          // Wait for confetti to show before reloading
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          window.location.reload();
        }
      } else {
        alert(`Error al ${action === "approve" ? "aprobar" : "rechazar"} la tarea`);
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-[var(--surface-container-lowest)] rounded-md elevation-ambient border border-[color-mix(in-srgb,var(--primary)_30%,transparent)] overflow-hidden mb-8 ghost-border">
      <div className="bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] px-6 py-4 flex items-center justify-between border-b border-[color-mix(in-srgb,var(--primary)_15%,transparent)]">
        <h3 className="text-[var(--primary)] font-headline font-bold text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" /> Tareas Pendientes de Revisión ({waitingTasks.length})
        </h3>
        <span className="bg-[var(--primary)] text-[var(--on-primary)] text-xs font-title font-bold px-2 py-1 rounded-md uppercase tracking-widest">
          Action Required
        </span>
      </div>
      
      <div className="divide-y divide-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
        {waitingTasks.map((task) => (
          <div key={task.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--surface-container-low)] transition-colors">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-md bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] flex items-center justify-center flex-shrink-0">
                {task.asignado?.fotoUrl ? (
                  <img src={task.asignado.fotoUrl} alt={task.asignado.nombre} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <User className="w-6 h-6 text-[var(--primary)]" />
                )}
              </div>
              <div>
                <h4 className="font-headline font-bold text-[var(--on-surface)] text-lg leading-tight">
                  {task.titulo}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="font-title font-bold text-[var(--primary)]">
                    {task.asignado?.nombre}
                  </span>
                  <span className="text-[var(--on-surface-variant)]">•</span>
                  <span className="flex items-center gap-1 text-[var(--warning)] font-title font-bold">
                    💰 {task.puntosGenerados} Pts
                  </span>
                </div>
                {task.retroalimentacionAlgoritmo && (
                  <p className="text-xs text-[var(--on-surface-variant)] mt-2 italic flex items-center gap-1 font-body">
                    <AlertCircle className="w-3 h-3" /> {task.retroalimentacionAlgoritmo}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                disabled={loadingId !== null}
                onClick={() => handleAction(task.id, "reject")}
                className="flex items-center gap-2 px-4 py-2 bg-[color-mix(in-srgb,var(--error)_5%,transparent)] text-[var(--error)] hover:bg-[color-mix(in-srgb,var(--error)_10%,transparent)] font-title font-bold rounded-md transition-all active:scale-95 disabled:opacity-50"
              >
                <X className="w-5 h-5" /> {loadingId === task.id ? "..." : "Rechazar"}
              </button>
              <button
                disabled={loadingId !== null}
                onClick={() => handleAction(task.id, "approve")}
                className="flex items-center gap-2 px-6 py-2 bg-[var(--success)] text-[var(--on-primary)] font-title font-bold rounded-md transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Check className="w-5 h-5" /> {loadingId === task.id ? "..." : "Aprobar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
