// Propio de Ordo (lane 188, E7): qué días del año litúrgico se marcan en el calendario del plan. Puro.
// Se marcan los domingos y las fiestas de primera y segunda clase; el resto de los días no se llena de etiquetas.

export interface DiaLiturgicoBase {
  fecha: string;
  titulo: string;
  tituloEs: string | null;
  rango: string;
  color: string;
  dominical: boolean;
}

export interface Festividad {
  fecha: string;
  titulo: string;
  color: string;
  mayor: boolean;
}

/** ¿Es un día para marcar? Domingo o fiesta de 1.ª/2.ª clase */
export function esFestividadMarcada(d: Pick<DiaLiturgicoBase, "rango" | "dominical">): boolean {
  return d.dominical || /\bI{1,2}\.?\s*classis\b/i.test(d.rango);
}

export function aFestividades(dias: DiaLiturgicoBase[]): Festividad[] {
  return dias
    .filter(esFestividadMarcada)
    .map((d) => ({ fecha: d.fecha, titulo: d.tituloEs?.trim() || d.titulo, color: d.color, mayor: /\bI\.?\s*classis\b/i.test(d.rango) && !/\bII\./i.test(d.rango) }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}

/** Color CSS (fondo y texto) de cada color litúrgico, legible en claro y oscuro */
export const COLOR_LITURGICO: Record<string, { fondo: string; texto: string }> = {
  blanco: { fondo: "#f5f1e6", texto: "#3a3326" },
  rojo: { fondo: "#b3261e", texto: "#ffffff" },
  verde: { fondo: "#2e7d32", texto: "#ffffff" },
  morado: { fondo: "#5b3a8c", texto: "#ffffff" },
  negro: { fondo: "#2b2b2b", texto: "#ffffff" },
  rosa: { fondo: "#d98aa7", texto: "#2b1a22" },
};
