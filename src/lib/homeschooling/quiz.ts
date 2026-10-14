// Reglas puras de los quizzes y los checkpoints de video (H4). La corrección real es siempre en el servidor (HD9):
// esto es lo que comparten servidor, tests y componentes.

export type PreguntaCorregible = { id: number; correcta: number };
export type Respuestas = Record<number, number>;

/** Aciertos sobre el total, 0-100 redondeado; sin preguntas → 100 */
export function calcularNota(preguntas: PreguntaCorregible[], respuestas: Respuestas): number {
  if (preguntas.length === 0) return 100;
  const aciertos = preguntas.filter((p) => respuestas[p.id] === p.correcta).length;
  return Math.round((aciertos / preguntas.length) * 100);
}

/**
 * Checkpoint que toca mostrar: el primero sin responder con `segundoVideo <= t`. Se compara con `>=` (nunca `===`: el
 * reproductor no avisa en cada segundo exacto) y, si el niño adelantó, sale el de menor segundo, así no se saltea ninguno.
 */
export function proximoCheckpoint(t: number, checkpoints: number[], respondidos: ReadonlySet<number>): number | null {
  const pendientes = checkpoints.filter((s) => t >= s && !respondidos.has(s)).sort((a, b) => a - b);
  return pendientes.length > 0 ? pendientes[0] : null;
}

/** Intentos no aprobados desde el último aprobado (los intentos vienen del más viejo al más nuevo) */
export function fallosSeguidosDe(intentos: { aprobado: boolean }[]): number {
  let fallos = 0;
  for (let i = intentos.length - 1; i >= 0 && !intentos[i].aprobado; i--) fallos++;
  return fallos;
}

export type PreguntaEditable = {
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion?: string | null;
  segundoVideo?: number | null;
};

/** Errores del editor del padre (vacío = válido): 2–4 opciones, índice correcto dentro del rango, enunciado obligatorio */
export function validarPreguntas(preguntas: PreguntaEditable[]): string[] {
  const errores: string[] = [];
  preguntas.forEach((p, i) => {
    const n = i + 1;
    if (!p.enunciado.trim()) errores.push(`Pregunta ${n}: falta el enunciado`);
    if (p.opciones.length < 2 || p.opciones.length > 4) errores.push(`Pregunta ${n}: tiene que tener entre 2 y 4 opciones`);
    if (p.opciones.some((o) => !o.trim())) errores.push(`Pregunta ${n}: hay una opción vacía`);
    if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta >= p.opciones.length) errores.push(`Pregunta ${n}: marcá cuál es la correcta`);
    if (p.segundoVideo != null && (!Number.isInteger(p.segundoVideo) || p.segundoVideo < 0)) errores.push(`Pregunta ${n}: el segundo del video no es válido`);
  });
  const segundos = preguntas.map((p) => p.segundoVideo).filter((s): s is number => s != null);
  if (new Set(segundos).size !== segundos.length) errores.push("Dos checkpoints no pueden estar en el mismo segundo");
  return errores;
}
