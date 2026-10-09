"use client";

import { useEffect, useRef, useState } from "react";
import { useModalStore } from "@/store/modalStore";

// Timer persistente y acciones de una tarea (antes vivían dentro de TaskCard).
export function useTaskActions(task: any) {
  const { openModal } = useModalStore();

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      setIsPlaying(true);
    } else {
      try {
        const res = await syncTimer("pause");
        if (res.ok) setElapsed((await res.json()).tiempoAcumulado);
      } catch {}
      setIsPlaying(false);
    }
  };

  // Al abrir una confirmación se pausa el timer (en cliente y servidor)
  const pauseForConfirm = () => {
    setIsPlaying(false);
    syncTimer("pause").catch(() => {});
  };

  const finishTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: elapsed }),
      });
      if (res.ok) {
        const data = await res.json();
        openModal("TASK_SUCCESS", {
          mensaje: data.mensaje,
          puntos: data.puntos,
          basePoints: data.basePoints,
          streakBonus: data.streakBonus,
          isNewStreak: data.isNewStreak,
          streakDays: data.streakDays,
          isHappyHour: data.isHappyHour,
        });
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      console.error("Error al completar:", res.status, errData);
      alert(errData.error || "Error al completar la tarea. Revisa tu conexión o intenta nuevamente.");
    } catch (e: any) {
      console.error("Error de conexión:", e);
      alert("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
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
      alert(errData.error || "Error al marcar como no realizada. Intenta nuevamente.");
    } catch (e: any) {
      console.error("Error de conexión:", e);
      alert("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
    return false;
  };

  const remaining = (task.tiempoEjecucionEstimadoSeg || 0) - elapsed;

  return { isPlaying, elapsed, remaining, isOvertime: remaining < 0, loading, togglePlay, pauseForConfirm, finishTask, markAsNotDone };
}
