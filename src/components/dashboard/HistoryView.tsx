"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Star, Gift, Loader2, ArrowLeft, History } from "lucide-react";
import Link from "next/link";

export function HistoryView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "rewards">("tasks");

  useEffect(() => {
    setLoading(true);
    fetch("/api/users/history")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-[var(--surface-container-lowest)] rounded-md elevation-ambient ghost-border">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-4" />
        <p className="text-[var(--on-surface-variant)] font-body">Cargando tu historial...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[color-mix(in-srgb,var(--error)_5%,transparent)] rounded-md border border-[color-mix(in-srgb,var(--error)_15%,transparent)] p-12 text-center elevation-ambient">
        <p className="text-[var(--error)] font-headline font-bold text-lg">Error cargando el historial.</p>
        <Link href="/dashboard" className="text-[var(--primary)] underline mt-4 inline-block font-body">Volver al Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-[var(--on-surface)] flex items-center gap-3">
             <History className="w-8 h-8 text-[var(--primary)]" />
             HISTORIAL DE MISIONES
          </h2>
          <p className="text-[var(--on-surface-variant)] mt-1 font-body">Revisa tus logros y recompensas obtenidas.</p>
        </div>
        
        <Link 
          href="/dashboard"
          className="btn-secondary flex items-center gap-2 w-fit px-6"
        >
          <ArrowLeft className="w-5 h-5" />
          VOLVER AL PANEL
        </Link>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[color-mix(in-srgb,var(--warning)_5%,transparent)] rounded-md p-6 text-center border border-[color-mix(in-srgb,var(--warning)_15%,transparent)] elevation-ambient transition-transform hover:scale-[1.02]">
          <Star className="w-8 h-8 text-[var(--warning)] mx-auto mb-2" />
          <div className="text-4xl font-headline font-bold text-[var(--warning)]">{data.stats?.stars || 0}</div>
          <div className="text-sm font-title font-bold text-[var(--warning)] uppercase tracking-wider mt-1">Estrellas Totales</div>
        </div>
        
        <div className="bg-[color-mix(in-srgb,var(--success)_5%,transparent)] rounded-md p-6 text-center border border-[color-mix(in-srgb,var(--success)_15%,transparent)] elevation-ambient transition-transform hover:scale-[1.02]">
          <CheckCircle2 className="w-8 h-8 text-[var(--success)] mx-auto mb-2" />
          <div className="text-4xl font-headline font-bold text-[var(--success)]">{data.stats?.availablePoints || 0}</div>
          <div className="text-sm font-title font-bold text-[var(--success)] uppercase tracking-wider mt-1">Pts Disponibles</div>
        </div>

        <div className="bg-[color-mix(in-srgb,var(--primary)_5%,transparent)] rounded-md p-6 text-center border border-[color-mix(in-srgb,var(--primary)_15%,transparent)] elevation-ambient transition-transform hover:scale-[1.02]">
          <Gift className="w-8 h-8 text-[var(--primary)] mx-auto mb-2" />
          <div className="text-4xl font-headline font-bold text-[var(--primary)]">{data.stats?.surprises || 0}</div>
          <div className="text-sm font-title font-bold text-[var(--primary)] uppercase tracking-wider mt-1">Cofres Sorpresa</div>
        </div>
      </div>

      <div className="bg-[var(--surface-container-lowest)] rounded-md elevation-ambient ghost-border overflow-hidden transition-colors">
        {/* Tab selector */}
        <div className="flex border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
          <button
            onClick={() => setTab("tasks")}
            className={`flex-1 py-5 text-sm font-title font-bold transition-all border-b-4 ${tab === "tasks" ? "border-[var(--primary)] text-[var(--primary)] bg-[color-mix(in-srgb,var(--primary)_5%,transparent)]" : "border-transparent text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] bg-[var(--surface-container-low)]"}`}
          >
            MISIONES COMPLETADAS ({data.completedTasks?.length || 0})
          </button>
          <button
            onClick={() => setTab("rewards")}
            className={`flex-1 py-5 text-sm font-title font-bold transition-all border-b-4 ${tab === "rewards" ? "border-[var(--primary)] text-[var(--primary)] bg-[color-mix(in-srgb,var(--primary)_5%,transparent)]" : "border-transparent text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] bg-[var(--surface-container-low)]"}`}
          >
            LOGROS Y RECOMPENSAS ({data.historial?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
          {tab === "tasks" && (
            data.completedTasks?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.completedTasks.map((t: any) => (
                  <div key={t.id} className="group flex items-center gap-4 p-4 bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-lowest)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] rounded-md transition-all hover:elevation-ambient">
                    <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${t.estado === "Aprobada" ? "bg-[color-mix(in-srgb,var(--success)_10%,transparent)] text-[var(--success)]" : "bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] text-[var(--warning)]"}`}>
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-headline font-bold text-[var(--on-surface)] text-lg truncate">{t.titulo}</div>
                      <div className="flex items-center gap-3 text-xs font-body text-[var(--on-surface-variant)] mt-1">
                        <span className="bg-[var(--surface-container)] text-[var(--on-surface)] px-2 py-0.5 rounded font-title">{t.estado}</span>
                        <span>•</span>
                        <span>{t.fechaCompletado ? new Date(t.fechaCompletado).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}</span>
                        {t.tiempoRealEjecucionSeg != null && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(t.tiempoRealEjecucionSeg / 60)}m {t.tiempoRealEjecucionSeg % 60}s</span>
                          </>
                        )}
                      </div>
                    </div>
                    {t.puntosGenerados > 0 && (
                      <div className="text-right">
                        <span className="text-lg font-headline font-bold text-[var(--warning)] bg-[color-mix(in-srgb,var(--warning)_5%,transparent)] px-4 py-2 rounded-md border border-[color-mix(in-srgb,var(--warning)_15%,transparent)]">
                          +{t.puntosGenerados} <span className="text-xs uppercase font-title">Pts</span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[var(--surface-container-low)] rounded-md flex items-center justify-center mx-auto mb-4 border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
                  <History className="w-10 h-10 text-[var(--outline)]" />
                </div>
                <h3 className="text-lg font-headline font-bold text-[var(--on-surface)]">No hay misiones completadas</h3>
                <p className="text-[var(--on-surface-variant)] mt-1 font-body">¡Comienza tu primera misión hoy mismo!</p>
              </div>
            )
          )}

          {tab === "rewards" && (
            data.historial?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.historial.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-4 p-4 bg-[var(--surface-container-low)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] rounded-md">
                    <div className="w-12 h-12 bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] text-[var(--primary)] rounded-md flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-headline font-bold text-[var(--on-surface)] text-lg truncate">{h.tarea?.titulo || "Cambio de Estado"}</div>
                      <div className="text-sm font-body text-[var(--on-surface-variant)] mt-1">
                        Estado: <span className="text-[var(--on-surface)] font-title font-bold">{h.estadoAnterior || "—"}</span> → <span className="text-[var(--primary)] font-title font-bold">{h.estadoNuevo}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">
                      {h.timestamp && new Date(h.timestamp).toLocaleDateString("es-ES")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[var(--surface-container-low)] rounded-md flex items-center justify-center mx-auto mb-4 border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
                  <Gift className="w-10 h-10 text-[var(--outline)]" />
                </div>
                <h3 className="text-lg font-headline font-bold text-[var(--on-surface)]">Sin historial de recompensas</h3>
                <p className="text-[var(--on-surface-variant)] mt-1 font-body">Sigue cumpliendo misiones para ganar premios.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
