// Configuración y economía de cartas católicas — única fuente de verdad (D1, D2, D4, D14, D15, D17)

export type RarezaCarta = "Comun" | "Buena" | "Perfecta" | "Celestial";
export type CategoriaCarta = "Santo" | "Angel" | "Misterio" | "Tema" | "Persona";
export type OrigenCarta = "Sistema" | "Manual";
export type GradoCarta = 0 | 1 | 2 | 3 | 4;

export interface ConfigRareza {
  pesoBanda: number;
  fragmentosRequeridos: number;
  valorFragmento: number; // Granos de Incienso equivalentes por fragmento
  holoPreset: "glitter" | "gold" | "cosmos" | null;
  holoIntensidad: number;
}

export const CONFIG_RAREZAS: Record<RarezaCarta, ConfigRareza> = {
  Comun: {
    pesoBanda: 60,
    fragmentosRequeridos: 10,
    valorFragmento: 1,
    holoPreset: null,
    holoIntensidad: 0,
  },
  Buena: {
    pesoBanda: 28,
    fragmentosRequeridos: 25,
    valorFragmento: 2,
    holoPreset: "glitter",
    holoIntensidad: 0.4,
  },
  Perfecta: {
    pesoBanda: 10,
    fragmentosRequeridos: 60,
    valorFragmento: 4,
    holoPreset: "gold",
    holoIntensidad: 0.85,
  },
  Celestial: {
    pesoBanda: 2,
    fragmentosRequeridos: 150,
    valorFragmento: 10,
    holoPreset: "cosmos",
    holoIntensidad: 1.0,
  },
} as const;

/** Multiplicador para el tope de fragmentos acumulables de una carta (Grado IV: 300%) */
export const MULTIPLICADOR_TOPE_FRAGMENTOS = 3;

/** Umbrales de progreso (proporción fragmentos / requeridos) para cada Grado de Veneración (D14) */
export const UMBRALES_GRADO = {
  BLOQUEADA: 0,
  I_DESBLOQUEADA: 1.0,  // 100%
  II_VENERADA: 1.5,     // 150%
  III_ILUMINADA: 2.0,   // 200%
  IV_GLORIOSA: 3.0,     // 300% (tope)
} as const;

/** Multiplicador de puntos necesarios para comprar 1 fragmento según su valor */
export const MULTIPLICADOR_PUNTOS_POR_VALOR = 4;

/** Límite diario de fragmentos que un usuario puede comprar con puntos para una misma carta */
export const TOPE_DIARIO_FRAGMENTOS_PUNTOS = 10;

/** Bono multiplicador de fragmentos en tienda el día de la festividad de una carta (D17) */
export const BONO_FIESTA_TIENDA = 1.5;

export interface ConfigSobre {
  nombre: string;
  costoPuntos: number;
  fragmentosTotal: number;
  cartasMin: number;
  cartasMax: number;
}

export const SOBRE_MEDITACION: ConfigSobre & { rarezasPermitidas: readonly RarezaCarta[] } = {
  nombre: "Sobre de Meditación",
  costoPuntos: 40,
  fragmentosTotal: 5,
  cartasMin: 1,
  cartasMax: 3,
  rarezasPermitidas: ["Comun", "Buena"] as const,
};

export const SOBRE_REVELACION: ConfigSobre & {
  garantiaRarezas: readonly RarezaCarta[];
  garantiaMinFragmentos: number;
} = {
  nombre: "Sobre de Revelación",
  costoPuntos: 160,
  fragmentosTotal: 8,
  cartasMin: 1,
  cartasMax: 3,
  garantiaRarezas: ["Perfecta", "Celestial"] as const,
  garantiaMinFragmentos: 4,
};

/** Precio de compra de 1 fragmento directo de una carta en puntos */
export function precioFragmentoEnPuntos(rareza: RarezaCarta): number {
  return CONFIG_RAREZAS[rareza].valorFragmento * MULTIPLICADOR_PUNTOS_POR_VALOR;
}

/** Precio de compra de 1 fragmento directo de una carta en Granos de Incienso */
export function precioFragmentoEnIncienso(rareza: RarezaCarta): number {
  return CONFIG_RAREZAS[rareza].valorFragmento;
}
