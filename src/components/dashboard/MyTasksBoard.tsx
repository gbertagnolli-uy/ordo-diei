"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Play, Square, Pause, Flame, ListChecks, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useModalStore } from "@/store/modalStore";
import { ChecklistModal } from "./ChecklistModal";

type CoResponsableMap = Record<number, { id: number; nombre: string; fotoUrl: string | null }[]>;

export function MyTasksBoard({ tasks, coResponsables = {} }: { tasks: any[]; coResponsables?: CoResponsableMap }) {
  const pendingTasks = tasks.filter((t) => 
    t.estado !== "Completada" && 
    t.estado !== "Aprobada" && 
    t.estado !== "Esperando_Aprobacion"
  );
  
  const inReviewTasks = tasks.filter((t) => t.estado === "Esperando_Aprobacion");
  const completedTasks = tasks.filter((t) => t.estado === "Completada" || t.estado === "Aprobada");

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-display text-[var(--on-surface)] mb-6 flex items-center gap-3">
        <Flame className="w-8 h-8 text-[var(--secondary)]" />
        MIS TAREAS
      </h2>

      {pendingTasks.length === 0 ? (
        <div className="bg-[var(--surface-container-lowest)] rounded-md elevation-ambient p-10 text-center flex flex-col items-center">
          <img src="/winners-animate.svg" alt="Winners" className="w-64 h-64 mb-6 drop-shadow-lg" />
          <h3 className="text-3xl font-display text-[var(--success)] mb-2">¡Estás al día!</h3>
          <p className="text-lg text-[var(--on-surface-variant)] font-medium">No tenés tareas pendientes. ¡Excelente trabajo!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingTasks.map((task) => (
            <TaskCard key={task.id} task={task} coResponsables={coResponsables[task.id] || []} />
          ))}
        </div>
      )}

      {inReviewTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-display text-[var(--on-surface-variant)] mb-4 px-2">En Revisión (Esperando a Papá/Mamá)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
            {inReviewTasks.map((task) => (
              <div key={task.id} className="bg-[var(--surface-container-lowest)] p-6 rounded-md elevation-ambient flex flex-col justify-between items-center text-center">
                <Clock className="w-10 h-10 text-[var(--secondary)] mb-4 animate-pulse" />
                <h4 className="font-display text-[var(--on-surface)]">{task.titulo}</h4>
                <p className="text-sm text-[var(--on-surface-variant)] mt-2 italic">Los puntos están bloqueados hasta que se apruebe.</p>
                <div className="mt-4 px-4 py-1 bg-[color-mix(in-srgb,var(--secondary)_8%,transparent)] text-[var(--secondary)] text-xs font-black rounded-md uppercase">
                  Saldo Bloqueado: +{task.puntosGenerados || 0} Pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-display text-[var(--on-surface-variant)] mb-4">Completadas Recientemente</h3>
          <div className="opacity-60 grayscale-[50%] flex flex-col gap-3">
             {completedTasks.slice(0, 3).map(task => (
                <div key={task.id} className="bg-[var(--surface-container-lowest)] p-4 rounded-md elevation-ambient flex justify-between items-center">
                   <div className="line-through font-semibold text-[var(--on-surface-variant)]">{task.titulo}</div>
                   <div className="text-sm font-mono bg-[color-mix(in-srgb,var(--success)_10%,transparent)] text-[var(--success)] px-2 py-1 rounded-md">FINALIZADO</div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, coResponsables }: { task: any; coResponsables: { id: number; nombre: string; fotoUrl: string | null }[] }) {
  // Persistent timer: calculate initial elapsed from server state
  const getInitialElapsed = () => {
    if (task.timerStartedAt) {
      const serverElapsed = task.tiempoAcumuladoTimer || 0;
      const liveElapsed = Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000);
      return serverElapsed + liveElapsed;
    }
    return task.tiempoAcumuladoTimer || task.tiempoRealEjecucionSeg || 0;
  };

  const [isPlaying, setIsPlaying] = useState(!!task.timerStartedAt);
  const [elapsed, setElapsed] = useState(getInitialElapsed);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmNotDoneOpen, setIsConfirmNotDoneOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [timerSynced, setTimerSynced] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Checklist progress (from task data)
  const checklistItems = task.checklistItems || [];
  const checklistTotal = checklistItems.length;
  const checklistDone = checklistItems.filter((ci: any) => ci.completado).length;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  // Sync timer on mount if it was running
  useEffect(() => {
    if (task.timerStartedAt && !timerSynced) {
      // Timer was running when user left, continue counting
      setTimerSynced(true);
    }
  }, [task.timerStartedAt, timerSynced]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed((prev: number) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!isPlaying) {
      // Start timer - sync with server
      try {
        await fetch(`/api/tasks/${task.id}/timer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" })
        });
      } catch {}
      setIsPlaying(true);
    } else {
      // Pause timer - sync with server
      try {
        const res = await fetch(`/api/tasks/${task.id}/timer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pause" })
        });
        if (res.ok) {
          const data = await res.json();
          setElapsed(data.tiempoAcumulado);
        }
      } catch {}
      setIsPlaying(false);
    }
  };

  const confirmFinish = () => {
    setIsConfirmOpen(true);
    setIsPlaying(false);
    // Pause timer on server when finishing
    fetch(`/api/tasks/${task.id}/timer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause" })
    }).catch(() => {});
  };

  const confirmNotDone = () => {
    setIsConfirmNotDoneOpen(true);
    setIsPlaying(false);
    fetch(`/api/tasks/${task.id}/timer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause" })
    }).catch(() => {});
  };

  const { openModal } = useModalStore();

  const finishTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: elapsed })
      });

      if (res.ok) {
        const data = await res.json();
        setIsConfirmOpen(false);
        openModal("TASK_SUCCESS", {
          mensaje: data.mensaje,
          puntos: data.puntos
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Error al completar:", res.status, errData);
        alert(errData.error || "Error al completar la tarea. Revisa tu conexión o intenta nuevamente.");
      }
    } catch (e: any) {
      console.error("Error de conexión:", e);
      alert("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsNotDone = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/not-done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: elapsed })
      });

      if (res.ok) {
        const data = await res.json();
        setIsConfirmNotDoneOpen(false);
        openModal("TASK_SUCCESS", {
          mensaje: data.mensaje,
          puntos: 0
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Error:", res.status, errData);
        alert(errData.error || "Error al marcar como no realizada. Intenta nuevamente.");
      }
    } catch (e: any) {
      console.error("Error de conexión:", e);
      alert("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const remaining = task.tiempoEjecucionEstimadoSeg - elapsed;
  const isOvertime = remaining < 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatRemainingTime = () => {
    const abs = Math.abs(remaining);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    const str = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return isOvertime ? `-${str}` : str;
  };

  return (
    <div className="bg-[var(--surface-container-lowest)] rounded-md elevation-ambient hover:shadow-lg transition-shadow p-6 flex flex-col justify-between relative overflow-hidden group">

      {/* Decorative timer visual */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${isPlaying ? 'from-[color-mix(in-srgb,var(--secondary)_30%,transparent)] to-[color-mix(in-srgb,var(--error)_30%,transparent)]' : 'from-[color-mix(in-srgb,var(--primary)_10%,transparent)] to-[color-mix(in-srgb,var(--warning)_20%,transparent)]'} rounded-bl-full opacity-20 transition-colors -z-10`} />

      <div>
        <div className="flex justify-between items-start mb-2">
           <h3 className="text-xl font-display text-[var(--on-surface)] leading-tight">{task.titulo}</h3>
           {task.generaPuntosYRecompensa && <div className="text-xs font-bold text-[var(--secondary)] bg-[color-mix(in-srgb,var(--secondary)_8%,transparent)] px-2 flex items-center rounded-md mt-1">⭐️ Pts</div>}
        </div>

        {task.descripcion && <p className="text-[var(--on-surface-variant)] text-sm mb-4 leading-relaxed">{task.descripcion}</p>}

        {/* CHECKLIST PROGRESS */}
        {task.isChecklist && checklistTotal > 0 && (
          <button onClick={() => setIsChecklistOpen(true)} className="w-full mb-3 p-3 bg-[color-mix(in-srgb,var(--success)_6%,transparent)] rounded-md elevation-ambient hover:shadow-md transition-colors text-left">
            <div className="flex items-center gap-2 mb-1.5">
              <ListChecks className="w-4 h-4 text-[var(--success)]" />
              <span className="text-xs font-bold text-[var(--success)]">Checklist</span>
              <span className="text-xs text-[var(--success)] ml-auto">{checklistDone}/{checklistTotal}</span>
            </div>
            <div className="bg-[color-mix(in-srgb,var(--success)_20%,transparent)] h-2 rounded-md overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${checklistPct >= 100 ? 'bg-[var(--success)]' : 'bg-[color-mix(in-srgb,var(--success)_60%,transparent)]'}`}
                style={{ width: `${checklistPct}%` }}
              />
            </div>
          </button>
        )}

        {/* CO-RESPONSABLES */}
        {coResponsables.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-[var(--on-surface-variant)]">Co-responsables:</span>
            <div className="flex -space-x-2">
              {coResponsables.map(cr => (
                <div key={cr.id} className="w-7 h-7 rounded-full border-2 border-[var(--surface-container-lowest)] overflow-hidden" title={cr.nombre}>
                  {cr.fotoUrl ? (
                    <img src={cr.fotoUrl} alt={cr.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
                      {cr.nombre.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 mb-4 border-l-4 border-[color-mix(in-srgb,var(--secondary)_20%,transparent)] pl-3">
          <div className="text-sm font-semibold text-[var(--primary)] flex items-center gap-2">
            <Clock className="w-4 h-4" /> Esperado: {formatTime(task.tiempoEjecucionEstimadoSeg)}
          </div>
          {task.horaEjecucion && (
            <div className="text-xs text-[var(--error)] font-bold">Límite: {new Date(task.horaEjecucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          )}
          {task.fechaVencimiento && (
            <div className="text-xs text-[var(--on-surface-variant)]">Fecha: {new Date(task.fechaVencimiento).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
        <div className="text-center mb-4">
           <div className={`text-4xl font-mono font-extrabold tracking-widest ${isOvertime ? 'text-[var(--error)]' : (isPlaying ? 'text-[var(--success)]' : 'text-[var(--on-surface-variant)]')}`}>
              {formatRemainingTime()}
           </div>
           <div className="text-xs font-bold text-[var(--on-surface-variant)] mt-1 uppercase tracking-widest">
              {isOvertime ? "¡Tiempo Excedido!" : "Restante"}
           </div>
        </div>

        <div className="flex justify-center gap-3">
           {!isPlaying ? (
             <button onClick={togglePlay} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
               <Play className="fill-[var(--on-primary)] w-5 h-5" /> INICIAR
             </button>
           ) : (
             <button onClick={togglePlay} className="flex-1 bg-[var(--secondary)] hover:bg-[var(--secondary-container)] text-[var(--on-secondary)] font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition-all active:scale-[0.97]">
               <Pause className="fill-[var(--on-secondary)] w-5 h-5" /> PAUSA
             </button>
           )}

           <button onClick={confirmFinish} className="w-16 bg-[var(--primary)] hover:bg-[color-mix(in-srgb,var(--primary)_80%,black)] text-[var(--on-primary)] rounded-md flex items-center justify-center transition-all active:scale-[0.97]" title="Completar Tarea">
             <Square className="fill-[var(--on-primary)] w-6 h-6" />
           </button>

           <button onClick={confirmNotDone} className="w-16 bg-[var(--surface-container-highest)] hover:bg-[color-mix(in-srgb,var(--error)_20%,transparent)] text-[var(--on-surface-variant)] hover:text-[var(--error)] border border-[color-mix(in-srgb,var(--outline-variant)_50%,transparent)] rounded-md flex items-center justify-center transition-all active:scale-[0.97]" title="No Realizada">
             <X className="w-6 h-6" />
           </button>
        </div>
      </div>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="¿Terminaste la tarea?">
        <div className="flex flex-col items-center gap-4 text-center">
           <img src="/time-machine-animate.svg" alt="Time Machine" className="w-48 h-48 drop-shadow-sm mb-2" />
           <p className="text-[var(--on-surface-variant)] font-medium text-lg leading-relaxed">
             Siempre revisa que la tarea fue completada correctamente para no perderte puntos y premios sorpresa!
           </p>
           <div className="flex w-full gap-4 mt-6">
              <button disabled={loading} onClick={() => setIsConfirmOpen(false)} className="flex-1 bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-semibold py-3.5 rounded-md transition-colors">
                Voy a revisar
              </button>
              <button disabled={loading} onClick={finishTask} className="flex-1 btn-primary py-3.5 transition-colors">
                {loading ? "Evaluando..." : "Sí, finalizar"}
              </button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isConfirmNotDoneOpen} onClose={() => setIsConfirmNotDoneOpen(false)} title="¿No la hiciste?">
        <div className="flex flex-col items-center gap-4 text-center">
           <img src="/cross-animate.svg" alt="Cancel" className="w-32 h-32 opacity-80 mb-2" onError={(e) => { e.currentTarget.style.display='none'; }} />
           <p className="text-[var(--on-surface-variant)] font-medium text-lg leading-relaxed">
             Si marcas la tarea como "No Realizada", esta se archivará sin otorgarte puntos. <br/>¿Estás seguro?
           </p>
           <div className="flex w-full gap-4 mt-6">
              <button disabled={loading} onClick={() => setIsConfirmNotDoneOpen(false)} className="flex-1 bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] font-semibold py-3.5 rounded-md transition-colors">
                Mejor la hago
              </button>
              <button disabled={loading} onClick={markAsNotDone} className="flex-1 bg-[var(--error)] text-[var(--on-error)] font-bold py-3.5 rounded-md transition-colors">
                {loading ? "Cargando..." : "Sí, no la hice"}
              </button>
           </div>
        </div>
      </Modal>

      {/* Checklist Modal */}
      {task.isChecklist && (
        <ChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
          taskId={task.id}
          taskTitle={task.titulo}
        />
      )}
    </div>
  );
}
