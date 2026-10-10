// Catálogo del Camino de oración: datos sin dependencias, seguros para el cliente.
import { getDay, parseISO } from "date-fns";

export type HabitoId = "completorium" | "rosario" | "matutinum";
export type Marca = "hecho" | "justificado";
/** Resultado de un día ya cerrado: sin registro = falta */
export type Dia = Marca | "falta";
export type Etapa = "inicio" | "construccion" | "consolidacion" | "firme" | "retomando";
export type Evento = "ascenso" | "completo" | "recaida" | "regreso";

// ---------- Catálogo ----------

export const HABITOS: Record<HabitoId, { nombre: string; momento: string; ancla: string }> = {
  completorium: { nombre: "Completorium", momento: "Noche", ancla: "Antes de dormir, en familia" },
  rosario: { nombre: "Santo Rosario", momento: "Durante el día", ancla: "En el momento que elijas cada día" },
  matutinum: { nombre: "Matutinum", momento: "Mañana", ancla: "Antes del desayuno" },
};

export const ETAPAS: Record<Etapa, string> = {
  inicio: "Inicio",
  construccion: "Construcción",
  consolidacion: "Consolidación",
  firme: "Hábito firme",
  retomando: "Retomando",
};

// Distribución tradicional de los misterios (domingo = 0)
const MISTERIOS = {
  Gozosos: ["La Anunciación", "La Visitación", "El Nacimiento del Niño Jesús", "La Presentación en el Templo", "El Niño perdido y hallado en el Templo"],
  Dolorosos: ["La Oración en el Huerto", "La Flagelación", "La Coronación de espinas", "Jesús con la Cruz a cuestas", "La Crucifixión y muerte de Nuestro Señor"],
  Gloriosos: ["La Resurrección", "La Ascensión", "La venida del Espíritu Santo", "La Asunción de la Virgen", "La Coronación de la Virgen"],
} as const;
const SERIE_POR_DIA: (keyof typeof MISTERIOS)[] = ["Gloriosos", "Gozosos", "Dolorosos", "Gloriosos", "Gozosos", "Dolorosos", "Gloriosos"];

export function misteriosDelDia(fecha: string) {
  const serie = SERIE_POR_DIA[getDay(parseISO(fecha))];
  return { serie, misterios: MISTERIOS[serie] };
}

// ---------- Escaleras ----------

export interface Paso {
  titulo: string;
  /** Días seguidos para subir al siguiente (o para completar el hábito, en el último) */
  diasParaSubir: number | null;
  /** Misterios que se meditan en este paso */
  misterios: number;
}

const AVEMARIAS = [3, 6, 10];

function pasoRosario(i: number): Paso {
  const completos = Math.floor(i / 3);
  const sub = i % 3;
  const misterios = completos + (sub === 2 ? 1 : 0);
  const partes: string[] = [];
  if (sub === 2) partes.push(misterios === 5 ? "Rosario completo: 5 misterios" : `${misterios} ${misterios === 1 ? "misterio" : "misterios"}`);
  else {
    if (completos > 0) partes.push(`${completos} ${completos === 1 ? "misterio" : "misterios"}`);
    partes.push(`${AVEMARIAS[sub]} avemarías`);
  }
  return { titulo: partes.join(" + "), diasParaSubir: sub === 2 ? 14 : 7, misterios };
}

export const ESCALERAS: Record<HabitoId, Paso[]> = {
  completorium: [{ titulo: "Oraciones de la noche", diasParaSubir: null, misterios: 0 }],
  matutinum: [{ titulo: "Oraciones de la mañana", diasParaSubir: null, misterios: 0 }],
  rosario: Array.from({ length: 15 }, (_, i) => pasoRosario(i)),
};
