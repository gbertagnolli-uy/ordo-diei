// Catálogo de hábitos: datos sin dependencias de base de datos ni XState, seguros para el cliente.
import { getDay, parseISO } from "date-fns";

export type Categoria = "oracion" | "orden" | "cuidado";
export type Franja = "manana" | "tarde" | "noche";
export type Marca = "hecho" | "justificado" | "no";
/** Resultado de un día: libre = no programado; no y falta cuentan igual en el motor */
export type Dia = Marca | "falta" | "libre";
export type Etapa = "inicio" | "construccion" | "consolidacion" | "firme" | "retomando";
export type Evento = "ascenso" | "completo" | "recaida" | "regreso";

export interface Paso {
  titulo: string;
  /** Días seguidos para subir al siguiente (o para completar el hábito, en el último) */
  diasParaSubir: number | null;
  /** Misterios que se meditan en este paso (Rosario) */
  misterios: number;
}

export type ClaveSistema =
  | "matutinum"
  | "angelus"
  | "rosario"
  | "lectura"
  | "completorium"
  | "cama"
  | "aseo"
  | "bano"
  | "ropero";

export interface DefinicionSistema {
  clave: ClaveSistema;
  nombre: string;
  descripcion: string;
  categoria: Categoria;
  franja: Franja;
  ancla: string;
  icono: string;
  pasos: Paso[];
  identidad: string;
  recomendado: boolean;
}

// ---------- Misterios del Rosario ----------

const MISTERIOS = {
  Gozosos: [
    "La Anunciación",
    "La Visitación",
    "El Nacimiento del Niño Jesús",
    "La Presentación en el Templo",
    "El Niño perdido y hallado en el Templo",
  ],
  Dolorosos: [
    "La Oración en el Huerto",
    "La Flagelación",
    "La Coronación de espinas",
    "Jesús con la Cruz a cuestas",
    "La Crucifixión y muerte de Nuestro Señor",
  ],
  Gloriosos: [
    "La Resurrección",
    "La Ascensión",
    "La venida del Espíritu Santo",
    "La Asunción de la Virgen",
    "La Coronación de la Virgen",
  ],
} as const;

const SERIE_POR_DIA: (keyof typeof MISTERIOS)[] = [
  "Gloriosos",
  "Gozosos",
  "Dolorosos",
  "Gloriosos",
  "Gozosos",
  "Dolorosos",
  "Gloriosos",
];

export function misteriosDelDia(fecha: string) {
  const serie = SERIE_POR_DIA[getDay(parseISO(fecha))];
  return { serie, misterios: MISTERIOS[serie] };
}

// ---------- Escalera del Rosario (15 pasos) ----------

const AVEMARIAS = [3, 6, 10];

function pasoRosario(i: number): Paso {
  const completos = Math.floor(i / 3);
  const sub = i % 3;
  const misterios = completos + (sub === 2 ? 1 : 0);
  const partes: string[] = [];
  if (sub === 2) {
    partes.push(misterios === 5 ? "Rosario completo: 5 misterios" : `${misterios} ${misterios === 1 ? "misterio" : "misterios"}`);
  } else {
    if (completos > 0) partes.push(`${completos} ${completos === 1 ? "misterio" : "misterios"}`);
    partes.push(`${AVEMARIAS[sub]} avemarías`);
  }
  return { titulo: partes.join(" + "), diasParaSubir: sub === 2 ? 14 : 7, misterios };
}

const ESCALERA_ROSARIO: Paso[] = Array.from({ length: 15 }, (_, i) => pasoRosario(i));

// ---------- Catálogo del sistema (9 hábitos) ----------

export const CATALOGO: Record<ClaveSistema, DefinicionSistema> = {
  matutinum: {
    clave: "matutinum",
    nombre: "Oraciones de la mañana (Matutinum)",
    descripcion: "Comenzar el día ofreciendo las obras a Dios",
    categoria: "oracion",
    franja: "manana",
    ancla: "Antes del desayuno",
    icono: "Sun",
    pasos: [{ titulo: "Oraciones de la mañana", diasParaSubir: null, misterios: 0 }],
    identidad: "Sos de los que consagran su primer momento a Dios.",
    recomendado: false,
  },
  angelus: {
    clave: "angelus",
    nombre: "Ángelus",
    descripcion: "Pausa mariana al mediodía",
    categoria: "oracion",
    franja: "tarde",
    ancla: "Al mediodía",
    icono: "Bell",
    pasos: [{ titulo: "Ángelus", diasParaSubir: null, misterios: 0 }],
    identidad: "Sos de los que recuerdan la Encarnación al mediodía.",
    recomendado: false,
  },
  rosario: {
    clave: "rosario",
    nombre: "Santo Rosario",
    descripcion: "Contemplar los misterios de la vida de Jesús y María",
    categoria: "oracion",
    franja: "tarde",
    ancla: "En el momento que elijas cada día",
    icono: "Sparkles",
    pasos: ESCALERA_ROSARIO,
    identidad: "Sos de los que rezan el Rosario cada día.",
    recomendado: true,
  },
  lectura: {
    clave: "lectura",
    nombre: "Lectura espiritual",
    descripcion: "Alimentar el alma con libros santos o vidas de santos",
    categoria: "oracion",
    franja: "tarde",
    ancla: "Después del almuerzo",
    icono: "BookOpen",
    pasos: [
      { titulo: "1 párrafo", diasParaSubir: 7, misterios: 0 },
      { titulo: "5 minutos", diasParaSubir: 7, misterios: 0 },
      { titulo: "15 minutos", diasParaSubir: 14, misterios: 0 },
    ],
    identidad: "Sos de los que nutren su espíritu cada día.",
    recomendado: false,
  },
  completorium: {
    clave: "completorium",
    nombre: "Oraciones de la noche (Completorium)",
    descripcion: "Cerrar el día con examen de conciencia y gratitud en familia",
    categoria: "oracion",
    franja: "noche",
    ancla: "Antes de dormir, en familia",
    icono: "Moon",
    pasos: [{ titulo: "Oraciones de la noche", diasParaSubir: null, misterios: 0 }],
    identidad: "Sos de los que cierran su día en paz con Dios.",
    recomendado: true,
  },
  cama: {
    clave: "cama",
    nombre: "Tender la cama",
    descripcion: "Primer acto de orden del día",
    categoria: "orden",
    franja: "manana",
    ancla: "Al levantarme",
    icono: "Bed",
    pasos: [
      { titulo: "Estirar el acolchado", diasParaSubir: 7, misterios: 0 },
      { titulo: "Tender la cama completa", diasParaSubir: 14, misterios: 0 },
    ],
    identidad: "Sos de los que cuidan el orden de su cuarto desde temprano.",
    recomendado: false,
  },
  aseo: {
    clave: "aseo",
    nombre: "Lavarse la cara, peinarse y cepillarse los dientes",
    descripcion: "Higiene y presentación personal cada mañana",
    categoria: "cuidado",
    franja: "manana",
    ancla: "Después de levantarme",
    icono: "Smile",
    pasos: [
      { titulo: "Cepillarse los dientes", diasParaSubir: 7, misterios: 0 },
      { titulo: "Dientes y cara", diasParaSubir: 7, misterios: 0 },
      { titulo: "Dientes, cara y peinarse", diasParaSubir: 14, misterios: 0 },
    ],
    identidad: "Sos de los que se cuidan y presentan con dignidad cada día.",
    recomendado: false,
  },
  bano: {
    clave: "bano",
    nombre: "Bañarse",
    descripcion: "Higiene personal al final de la jornada",
    categoria: "cuidado",
    franja: "noche",
    ancla: "Antes de cenar",
    icono: "Droplets",
    pasos: [{ titulo: "Bañarse", diasParaSubir: null, misterios: 0 }],
    identidad: "Sos de los que cuidan la higiene y el descanso del cuerpo.",
    recomendado: false,
  },
  ropero: {
    clave: "ropero",
    nombre: "Ordenar el ropero",
    descripcion: "Ropa doblada y guardada en su lugar",
    categoria: "orden",
    franja: "tarde",
    ancla: "Al volver a casa",
    icono: "Shirt",
    pasos: [
      { titulo: "Guardar la ropa del día", diasParaSubir: 7, misterios: 0 },
      { titulo: "Ordenar un estante", diasParaSubir: 7, misterios: 0 },
      { titulo: "Ropero ordenado", diasParaSubir: 14, misterios: 0 },
    ],
    identidad: "Sos de los que mantienen sus cosas ordenadas y en su lugar.",
    recomendado: false,
  },
};

// ---------- Etiquetas y constantes ----------

export const CATEGORIAS: Record<Categoria, string> = {
  oracion: "Oración",
  orden: "Orden",
  cuidado: "Cuidado personal",
};

export const FRANJAS: Record<Franja, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
};

export const ETAPAS: Record<Etapa, string> = {
  inicio: "Inicio",
  construccion: "Construcción",
  consolidacion: "Consolidación",
  firme: "Hábito firme",
  retomando: "Retomando",
};

export const RECOMPENSA = {
  xpDia: 10,
  xpAscenso: 25,
  xpCompleto: 100,
  puntosDia: 5,
};

/** Bit 0 = domingo ... bit 6 = sábado */
export const DIAS_TODOS = 127;
/** Lunes a viernes (bits 1 al 5) */
export const DIAS_LUN_VIE = 62;

// ---------- Funciones puras ----------

/** Indica si una fecha está programada según la máscara de bits (bit 0 = domingo ... bit 6 = sábado) */
export function programado(dias: number, fecha: string | Date): boolean {
  const d = typeof fecha === "string" ? parseISO(fecha) : fecha;
  return (dias & (1 << getDay(d))) !== 0;
}

/** Devuelve la escalera de pasos para un hábito */
export function pasosDe(h: { clave: string | null; nombre: string; minimo?: string | null }): Paso[] {
  if (h.clave && h.clave in CATALOGO) {
    return CATALOGO[h.clave as ClaveSistema].pasos;
  }
  if (h.minimo && h.minimo.trim().length > 0) {
    return [
      { titulo: h.minimo.trim(), diasParaSubir: 14, misterios: 0 },
      { titulo: h.nombre.trim(), diasParaSubir: null, misterios: 0 },
    ];
  }
  return [{ titulo: h.nombre.trim(), diasParaSubir: null, misterios: 0 }];
}

/** Devuelve la frase de identidad para Consolidación y Hábito firme */
export function identidadDe(h: { clave: string | null }): string {
  if (h.clave && h.clave in CATALOGO) {
    return CATALOGO[h.clave as ClaveSistema].identidad;
  }
  return "Esto ya es parte de tu día.";
}

/** Determina si un hábito entrega puntos canjeables (solo orden y cuidado, no oración) */
export function daPuntos(categoria: Categoria): boolean {
  return categoria !== "oracion";
}
