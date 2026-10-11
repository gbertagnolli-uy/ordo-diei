// Configuración y economía de cartas católicas — única fuente de verdad (D1, D2, D4, D14, D15, D17;
// precios, sobres y regalos según vault/ECONOMIA_CARTAS.md)

export type RarezaCarta = "Comun" | "Buena" | "Perfecta" | "Celestial";
export type CategoriaCarta = "Santo" | "Angel" | "Misterio" | "Tema" | "Persona";
export type OrigenCarta = "Sistema" | "Manual";
export type GradoCarta = 0 | 1 | 2 | 3 | 4;

export interface ConfigRareza {
  pesoBanda: number;
  fragmentosRequeridos: number;
  valorFragmento: number; // Granos de Incienso equivalentes por fragmento
  holoPreset: "glitter" | "gold" | "bursts";
  holoIntensidad: number;
}

export const CONFIG_RAREZAS: Record<RarezaCarta, ConfigRareza> = {
  Comun: {
    pesoBanda: 60,
    fragmentosRequeridos: 10,
    valorFragmento: 1,
    holoPreset: "gold",
    holoIntensidad: 0.5,
  },
  Buena: {
    pesoBanda: 28,
    fragmentosRequeridos: 25,
    valorFragmento: 2,
    holoPreset: "glitter",
    holoIntensidad: 0.5,
  },
  Perfecta: {
    pesoBanda: 10,
    fragmentosRequeridos: 60,
    valorFragmento: 4,
    holoPreset: "gold",
    holoIntensidad: 0.5,
  },
  Celestial: {
    pesoBanda: 2,
    fragmentosRequeridos: 150,
    valorFragmento: 10,
    holoPreset: "bursts",
    holoIntensidad: 0.5,
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

/** Puntos por fragmento comprado directo, según rareza (vault/ECONOMIA_CARTAS.md §8). Una tarea vale
 *  ~20 pts: Común ≈ 6 tareas, Buena ≈ 22, Perfecta ≈ 72. La Celestial NO se compra con puntos
 *  (`RAREZAS_COMPRA_PUNTOS`); el valor es solo la referencia para valuar sobres y simular. */
export const PRECIO_PUNTOS_FRAGMENTO: Record<RarezaCarta, number> = {
  Comun: 12,
  Buena: 18,
  Perfecta: 24,
  Celestial: 40,
};

/** Rarezas cuyos fragmentos se pueden comprar directo con puntos */
export const RAREZAS_COMPRA_PUNTOS: readonly RarezaCarta[] = ["Comun", "Buena", "Perfecta"] as const;

/** XP total mínimo para obtener fragmentos de cada rareza por compra, sobre o fiesta (§8.3) */
export const XP_MINIMO_RAREZA: Record<RarezaCarta, number> = {
  Comun: 0,
  Buena: 0,
  Perfecta: 1000,
  Celestial: 2500,
};

/** Fragmentos Celestiales que se compran con 1 estrella (la compra es en múltiplos de esto) */
export const FRAGMENTOS_POR_ESTRELLA = 5;

/** Cada cuántos días de racha se gana 1 estrella */
export const DIAS_RACHA_POR_ESTRELLA = 7;

/** Descuento en sobres: 1 % por día de racha, hasta 30 % */
export const DESCUENTO_POR_DIA_RACHA = 1;
export const DESCUENTO_MAXIMO = 30;

/** Parte de la carta que regala su fiesta, por rareza (§8.4) */
export const FRACCION_REGALO_FIESTA: Record<RarezaCarta, number> = {
  Comun: 1,
  Buena: 1,
  Perfecta: 0.5,
  Celestial: 0.25,
};

/** Límite diario de fragmentos que un usuario puede comprar con puntos para una misma carta */
export const TOPE_DIARIO_FRAGMENTOS_PUNTOS = 10;

/** Bono multiplicador de fragmentos en tienda el día de la festividad de una carta (D17) */
export const BONO_FIESTA_TIENDA = 1.5;

export interface ConfigSobre {
  nombre: string;
  costoPuntos: number;
  /** Estrellas que cuesta además de los puntos */
  costoEstrellas: number;
  /** XP total mínimo para poder abrirlo */
  xpMinimo: number;
  fragmentosTotal: number;
  cartasMin: number;
  cartasMax: number;
  /** Rarezas de las que sale el sorteo (sin garantía) */
  rarezasPermitidas?: readonly RarezaCarta[];
  /** Con garantía: `garantiaMinFragmentos` de una carta de estas rarezas y el resto del pool completo */
  garantiaRarezas?: readonly RarezaCarta[];
  garantiaMinFragmentos?: number;
}

export type TipoSobre = "meditacion" | "devocion" | "revelacion" | "gloria";

export const SOBRE_MEDITACION = {
  nombre: "Sobre de Meditación",
  costoPuntos: 120,
  costoEstrellas: 0,
  xpMinimo: 0,
  fragmentosTotal: 8,
  cartasMin: 1,
  cartasMax: 3,
  rarezasPermitidas: ["Comun", "Buena"] as const,
} satisfies ConfigSobre;

export const SOBRE_DEVOCION = {
  nombre: "Sobre de Devoción",
  costoPuntos: 200,
  costoEstrellas: 0,
  xpMinimo: 0,
  fragmentosTotal: 10,
  cartasMin: 1,
  cartasMax: 3,
  rarezasPermitidas: ["Buena", "Perfecta"] as const,
} satisfies ConfigSobre;

export const SOBRE_REVELACION = {
  nombre: "Sobre de Revelación",
  costoPuntos: 250,
  costoEstrellas: 1,
  xpMinimo: XP_MINIMO_RAREZA.Perfecta,
  fragmentosTotal: 12,
  cartasMin: 1,
  cartasMax: 3,
  garantiaRarezas: ["Perfecta", "Celestial"] as const,
  garantiaMinFragmentos: 6,
} satisfies ConfigSobre;

export const SOBRE_GLORIA = {
  nombre: "Sobre de Gloria",
  costoPuntos: 700,
  costoEstrellas: 3,
  xpMinimo: XP_MINIMO_RAREZA.Celestial,
  fragmentosTotal: 20,
  cartasMin: 1,
  cartasMax: 1,
  rarezasPermitidas: ["Celestial"] as const,
} satisfies ConfigSobre;

export const SOBRES: Record<TipoSobre, ConfigSobre> = {
  meditacion: SOBRE_MEDITACION,
  devocion: SOBRE_DEVOCION,
  revelacion: SOBRE_REVELACION,
  gloria: SOBRE_GLORIA,
};

export const TIPOS_SOBRE = Object.keys(SOBRES) as TipoSobre[];

/** Costo en puntos de un sobre tras el descuento por racha (porcentaje entero 0–30) */
export function costoConDescuento(costoPuntos: number, descuentoPct: number): number {
  return Math.round(costoPuntos * (1 - descuentoPct / 100));
}

/** Descuento (%) por días de racha efectiva: 1 % por día, máximo 30 % */
export function descuentoPorRacha(rachaDias: number): number {
  const dias = Math.max(0, Math.floor(rachaDias || 0));
  return Math.min(DESCUENTO_MAXIMO, dias * DESCUENTO_POR_DIA_RACHA);
}

/** Precio de compra de 1 fragmento directo de una carta en puntos */
export function precioFragmentoEnPuntos(rareza: RarezaCarta): number {
  return PRECIO_PUNTOS_FRAGMENTO[rareza];
}

/** Precio de compra de 1 fragmento directo de una carta en Granos de Incienso */
export function precioFragmentoEnIncienso(rareza: RarezaCarta): number {
  return CONFIG_RAREZAS[rareza].valorFragmento;
}

/** Cartas Comunes al azar del regalo de bienvenida (D23), una sola vez por usuario */
export const CARTAS_BIENVENIDA = 3;

/** Rarezas que el usuario puede elegir como regalo de cumpleaños (D22) */
export const RAREZAS_CUMPLE: readonly RarezaCarta[] = ["Comun", "Buena", "Perfecta"] as const;
