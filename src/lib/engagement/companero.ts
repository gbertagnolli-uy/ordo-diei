// Compañero que evoluciona (vault/ENGAGEMENT_PLAN.md, lane 203): reglas puras.
// Crece con los DÍAS DE USO (cada día distinto en que se entró), no con la racha: faltar nunca lo achica.
export type Etapa = { numero: number; desde: number; nombre: string; emoji: string; frase: string };

export const ETAPAS: Etapa[] = [
  { numero: 1, desde: 0, nombre: "Huevito", emoji: "🥚", frase: "Todavía está dormido, pero ya te siente cerca." },
  { numero: 2, desde: 3, nombre: "Pichón", emoji: "🐣", frase: "¡Rompió el cascarón! Mira todo con curiosidad." },
  { numero: 3, desde: 10, nombre: "Palomita", emoji: "🕊️", frase: "Ya vuela de a ratitos y siempre vuelve con vos." },
  { numero: 4, desde: 30, nombre: "Angelito", emoji: "👼", frase: "Te acompaña y reza por vos todos los días." },
  { numero: 5, desde: 100, nombre: "Ángel guardián", emoji: "😇", frase: "Fiel compañero: ya es parte de la familia." },
];

export const MAX_NOMBRE = 20;
export const NOMBRE_POR_DEFECTO = "Tu compañero";

/** Etapa que le corresponde a quien entró `dias` días distintos */
export function etapaDe(dias: number): Etapa {
  const d = Math.max(0, Math.floor(dias));
  let actual = ETAPAS[0];
  for (const e of ETAPAS) if (d >= e.desde) actual = e;
  return actual;
}

/** Próxima etapa y cuántos días de uso faltan (null en la última) */
export function proximaEtapa(dias: number): { etapa: Etapa; faltan: number } | null {
  const d = Math.max(0, Math.floor(dias));
  const sig = ETAPAS.find((e) => e.desde > d);
  return sig ? { etapa: sig, faltan: sig.desde - d } : null;
}

/** Avance (0–100) dentro de la etapa actual hacia la siguiente; 100 en la última */
export function avanceDeEtapa(dias: number): number {
  const actual = etapaDe(dias);
  const sig = proximaEtapa(dias);
  if (!sig) return 100;
  return Math.floor(((Math.max(0, dias) - actual.desde) / (sig.etapa.desde - actual.desde)) * 100);
}

/** ¿Hay una etapa nueva que el niño todavía no festejó? */
export const hayEtapaNueva = (dias: number, etapaVista: number) => etapaDe(dias).numero > etapaVista;

/**
 * Mensaje de bienvenida cuando se vuelve después de faltar (null si no corresponde).
 * Siempre cálido: no cuenta los días perdidos ni hace sentir culpa.
 */
export function mensajeDeRegreso(nombre: string, diasDesdeLaUltimaVez: number | null): string | null {
  if (diasDesdeLaUltimaVez === null || diasDesdeLaUltimaVez < 2) return null;
  return `¡Qué alegría verte de nuevo! ${nombre} se despertó contento.`;
}

/** Limpia y valida el nombre que elige el niño */
export function validarNombre(entrada: unknown): string {
  const nombre = typeof entrada === "string" ? entrada.replace(/\s+/g, " ").trim() : "";
  if (!nombre) throw new Error("Escribí un nombre para tu compañero");
  if (nombre.length > MAX_NOMBRE) throw new Error(`El nombre no puede superar los ${MAX_NOMBRE} caracteres`);
  return nombre;
}
