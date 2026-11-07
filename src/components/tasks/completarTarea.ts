// Completar una tarea (lo usan la ficha y el cronómetro flotante, lane 264): misma llamada y mismos datos del modal de éxito.
export type ModoCompletado = "iniciada_finalizada" | "realizada_directa";

export type ResultadoCompletar =
  | { ok: true; exito: Record<string, unknown> }
  | { ok: false; error: string };

export async function completarTarea(tareaId: number, elapsedSeconds: number, modoCompletado: ModoCompletado): Promise<ResultadoCompletar> {
  try {
    const res = await fetch(`/api/tasks/${tareaId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elapsedSeconds, modoCompletado }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        exito: {
          mensaje: data.mensaje,
          puntos: data.puntos,
          basePoints: data.basePoints,
          streakBonus: data.streakBonus,
          checklistBonus: data.checklistBonus,
          porcentajePuntos: data.porcentajePuntos,
          fueIniciada: data.fueIniciada,
          isNewStreak: data.isNewStreak,
          streakDays: data.streakDays,
          isHappyHour: data.isHappyHour,
        },
      };
    }
    const errData = await res.json().catch(() => ({}));
    console.error("Error al completar:", res.status, errData);
    return { ok: false, error: errData.error || "Error al completar la tarea. Revisa tu conexión o intenta nuevamente." };
  } catch (e) {
    console.error("Error de conexión:", e);
    return { ok: false, error: "Error de conexión: " + (e instanceof Error ? e.message : String(e)) };
  }
}
