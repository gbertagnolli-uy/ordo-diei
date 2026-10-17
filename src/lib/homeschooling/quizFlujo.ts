// Propio de Ordo (lane 186, V2): lógica pura del quiz paso a paso. La pantalla la usa para saber a qué pregunta ir y cuándo se puede entregar.

/** Primera pregunta sin responder (o -1 si están todas) */
export function primeraSinResponder(ids: number[], respuestas: Record<number, number>): number {
  return ids.findIndex((id) => respuestas[id] === undefined);
}

export function respondidas(ids: number[], respuestas: Record<number, number>): number {
  return ids.filter((id) => respuestas[id] !== undefined).length;
}

/** Tecla 1–4 (o a–d) → índice de opción; null si no corresponde */
export function opcionPorTecla(tecla: string, cantidad: number): number | null {
  const mapa: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
  const i = mapa[tecla.toLowerCase()];
  return i !== undefined && i < cantidad ? i : null;
}

/** Texto de cierre según la nota */
export function mensajeDeNota(nota: number, umbral: number): string {
  if (nota >= 100) return "¡Perfecto! No te equivocaste en nada.";
  if (nota >= umbral) return "¡Muy bien! Aprobaste.";
  if (nota >= umbral - 20) return "Estuviste cerca. Repasemos un poco y lo intentás de nuevo.";
  return "Todavía no. Volvé a mirar la lección y lo intentás otra vez.";
}
