// Monedas de la Tienda (vault/nuevas-features/marketplace/SPEC.md §2). Única fuente de verdad: para
// sumar una moneda nueva alcanza con una fila acá y su columna en `Usuario`. Los cofres no son moneda
// (D13), pero lo que dan (puntos, incienso) se acredita en estos mismos campos gastables (D14).

export const MONEDAS = {
  puntos: { campo: "availablePoints", nombre: "Puntos", unidad: "pts", singular: "punto" },
  estrellas: { campo: "stars", nombre: "Estrellas", unidad: "★", singular: "estrella" },
  incienso: { campo: "incienso", nombre: "Granos de incienso", unidad: "granos", singular: "grano de incienso" },
} as const;

export type Moneda = keyof typeof MONEDAS;
export const CLAVES_MONEDA = Object.keys(MONEDAS) as Moneda[];

export interface Costo {
  moneda: Moneda;
  monto: number;
}

/** Una forma de pagar: todas sus monedas se pagan juntas */
export interface OpcionPrecio {
  costos: Costo[];
}

export type Saldos = Record<Moneda, number>;

export const esMoneda = (x: unknown): x is Moneda => typeof x === "string" && x in MONEDAS;

/** «250 pts + 1 ★» */
export function textoCostos(costos: Costo[]): string {
  return costos.map((c) => `${c.monto} ${MONEDAS[c.moneda].unidad}`).join(" + ");
}
