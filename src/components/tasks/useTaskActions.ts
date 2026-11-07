"use client";

import { toast } from "@/lib/toast";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/modalStore";
import { useCronometroStore } from "@/store/cronometroStore";
import { completarTarea } from "./completarTarea";

// Timer persistente y acciones de una tarea (antes vivían dentro de TaskCard).
export function useTaskActions(task: any) {
  const { openModal } = useModalStore();
  const router = useRouter();

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
  const [startedInSession, setStartedInSession] = useState(
    Boolean(task.timerStartedAt) ||
      (task.tiempoAcumuladoTimer || 0) > 0 ||
      task.estado === "En_progreso" ||
      task.estado === "Pausada"
  );
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsPlaying(!!task.timerStartedAt);
    setElapsed(getInitialElapsed());
    setStartedInSession(
      Boolean(task.timerStartedAt) ||
        (task.tiempoAcumuladoTimer || 0) > 0 ||
        task.estado === "En_progreso" ||
        task.estado === "Pausada"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, task.timerStartedAt, task.tiempoAcumuladoTimer, task.estado]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => setElapsed((prev: number) => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  const syncTimer = (action: "start" | "pause") =>
    fetch(`/api/tasks/${task.id}/timer`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

  const togglePlay = async () => {
    if (!isPlaying) {
      try { await syncTimer("start"); } catch {}
      setStartedInSession(true);
      setIsPlaying(true);
      // Modal grande con la cuenta regresiva; al salir queda la ventana flotante (lane 264)
      useCronometroStore.getState().abrirGrande(task.id);
    } else {
      try {
        const res = await syncTimer("pause");
        if (res.ok) setElapsed((await res.json()).tiempoAcumulado);
      } catch {}
      setIsPlaying(false);
      useCronometroStore.getState().minimizar();
    }
    // El layout vuelve a leer la tarea en curso (cronómetro flotante)
    router.refresh();
  };

  const fueIniciada = startedInSession || isPlaying || elapsed > 0;

  // Al abrir una confirmación se pausa el timer (en cliente y servidor)
  const pauseForConfirm = () => {
    if (isPlaying) {
      setIsPlaying(false);
      syncTimer("pause").catch(() => {});
      useCronometroStore.getState().minimizar();
    }
  };

  const finishTask = async (modoOverride?: "iniciada_finalizada" | "realizada_directa") => {
    setLoading(true);
    const modoCompletado = modoOverride ?? (fueIniciada ? "iniciada_finalizada" : "realizada_directa");
    const r = await completarTarea(task.id, elapsed, modoCompletado);
    setLoading(false);
    if (r.ok) {
      useCronometroStore.getState().minimizar();
      openModal("TASK_SUCCESS", r.exito);
      return true;
    }
    toast.error(r.error);
    return false;
  };

  const markAsNotDone = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/not-done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: elapsed }),
      });
      if (res.ok) {
        const data = await res.json();
        openModal("TASK_SUCCESS", { mensaje: data.mensaje, puntos: 0 });
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      console.error("Error:", res.status, errData);
      toast.error(errData.error || "Error al marcar como no realizada. Intenta nuevamente.");
    } catch (e: any) {
      console.error("Error de conexión:", e);
      toast.error("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const remaining = (task.tiempoEjecucionEstimadoSeg || 0) - elapsed;

  return {
    isPlaying,
    elapsed,
    remaining,
    isOvertime: remaining < 0,
    fueIniciada,
    loading,
    togglePlay,
    pauseForConfirm,
    finishTask,
    markAsNotDone,
  };
}
