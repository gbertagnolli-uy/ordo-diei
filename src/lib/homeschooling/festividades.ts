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

/** Fiestas de primera y segunda clase que la base trae sin título en español */
const TITULOS_ES: Record<string, string> = {
  "in epiphania domini": "La Epifanía del Señor",
  "in circumcisione domini": "La Circuncisión del Señor",
  "in purificatione beatae mariae virginis": "La Purificación de la Virgen (la Candelaria)",
  "in annuntiatione beatae mariae virginis": "La Anunciación del Señor",
  "in visitatione beatae mariae virginis": "La Visitación de la Virgen",
  "in assumptione beatae mariae virginis": "La Asunción de la Virgen",
  "in nativitate beatae mariae virginis": "La Natividad de la Virgen",
  "in conceptione immaculata beatae mariae virginis": "La Inmaculada Concepción",
  "in vigilia nativitatis domini": "Vigilia de Navidad",
  "in nativitate domini": "La Natividad del Señor (Navidad)",
  "inventione sanctae crucis": "La Invención de la Santa Cruz",
};

const clave = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/æ/g, "ae").replace(/Æ/g, "ae").toLowerCase().trim();

/** El título en español: el de la base si lo trae, si no el de la lista de arriba, si no el original */
export function tituloEnEspanol(titulo: string, tituloEs: string | null): string {
  return tituloEs?.trim() || TITULOS_ES[clave(titulo)] || titulo;
}

export function aFestividades(dias: DiaLiturgicoBase[]): Festividad[] {
  return dias
    .filter(esFestividadMarcada)
    .map((d) => ({ fecha: d.fecha, titulo: tituloEnEspanol(d.titulo, d.tituloEs), color: d.color, mayor: /\bI\.?\s*classis\b/i.test(d.rango) && !/\bII\./i.test(d.rango) }))
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
