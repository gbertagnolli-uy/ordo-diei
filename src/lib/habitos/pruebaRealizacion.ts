// Prueba de realización de hábitos (lane 257, Plane #5): al marcar «hecho» una lectura,
// quien no es padre escribe un resumen de lo leído que ven los padres al aprobar.

export const CLAVES_CON_RESUMEN: readonly string[] = ["lectura", "libro"];
export const MIN_RESUMEN = 80;

export function requiereResumen(clave: string | null | undefined): boolean {
  return clave != null && CLAVES_CON_RESUMEN.includes(clave);
}

/** Mensaje de error si falta el resumen; null si está bien o no hace falta. */
export function errorResumen(p: { clave: string | null; marca: string | null; esPadre: boolean; nota?: string | null }): string | null {
  if (p.esPadre || p.marca !== "hecho" || !requiereResumen(p.clave)) return null;
  const largo = (p.nota ?? "").trim().length;
  if (largo < MIN_RESUMEN) {
    return `Escribí un resumen de lo que leíste (mínimo ${MIN_RESUMEN} caracteres; llevás ${largo})`;
  }
  return null;
}
