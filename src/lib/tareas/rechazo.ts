// Qué le pasa a una tarea cuando un padre la rechaza (lane 268, Plane #25): vuelve al hijo como pendiente,
// con el cronómetro en cero, sin foto ni puntos y con tiempo real para rehacerla.

/** Marca en `retroalimentacionAlgoritmo` para mostrar «Rehacer» */
export const MARCA_RECHAZO = "Rechazada: rehacer";

/** Margen mínimo para rehacer la tarea antes de que venza */
const MARGEN_MS = 2 * 60 * 60 * 1000;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

export interface TareaARechazar {
  fechaVencimiento: Date | null;
  horaEjecucion: Date | null;
}

export function datosAlRechazar(tarea: TareaARechazar, ahora: Date) {
  const vence = tarea.horaEjecucion ?? tarea.fechaVencimiento;
  const sinTiempo = vence !== null && vence.getTime() - ahora.getTime() < MARGEN_MS;
  return {
    estado: "Pendiente" as const,
    puntosGenerados: 0,
    fechaCompletado: null,
    // Se pide una foto nueva si vuelve a completarse
    fotoPruebaUrl: null,
    fotoPruebaSubidaEn: null,
    // Para el 100 % de los puntos hay que volver a iniciarla
    timerStartedAt: null,
    tiempoAcumuladoTimer: 0,
    retroalimentacionAlgoritmo: MARCA_RECHAZO,
    ...(sinTiempo ? { fechaVencimiento: new Date(ahora.getTime() + UN_DIA_MS), horaEjecucion: null } : {}),
  };
}
