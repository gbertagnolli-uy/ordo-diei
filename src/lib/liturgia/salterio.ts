/**
 * Módulo puro de metadatos y búsqueda del Salterio tradicional (SPEC §10.7, D52).
 */

export const NOTA_SALTERIO_VULGATA =
  "Numeración de la Vulgata. Traducción española de Divinum Officium (no Torres Amat).";

export interface EntradaSalmoInfo {
  numero: string; // "1" .. "150", o nombre del cántico ej. "Benedictus", "Magnificat"
  clave: string; // "Psalterium/1"
  incipitLa: string;
  incipitEs?: string;
  tipo: "salmo" | "cantico";
}

/**
 * Cánticos tradicionales del Oficio Divino incluidos en el Salterio de DO.
 */
export const CANTICOS_TRADICIONALES: readonly EntradaSalmoInfo[] = [
  { numero: "Benedictus", clave: "Psalterium/Benedictus", incipitLa: "Benedíctus Dóminus, Deus Israël", incipitEs: "Bendito sea el Señor, Dios de Israel (Cántico de Zacarías, Lc 1)", tipo: "cantico" },
  { numero: "Magnificat", clave: "Psalterium/Magnificat", incipitLa: "Magníficat ánima mea Dóminum", incipitEs: "Proclama mi alma la grandeza del Señor (Cántico de la Virgen María, Lc 1)", tipo: "cantico" },
  { numero: "NuncDimittis", clave: "Psalterium/NuncDimittis", incipitLa: "Nunc dimíttis servum tuum, Dómine", incipitEs: "Ahora, Señor, puedes dejar a tu siervo irse en paz (Cántico de Simeón, Lc 2)", tipo: "cantico" },
  { numero: "TeDeum", clave: "Psalterium/TeDeum", incipitLa: "Te Deum laudámus: te Dóminum confitémur", incipitEs: "A ti, oh Dios, te alabamos; a ti, Señor, te reconocemos (Himno Ambrosiano)", tipo: "cantico" },
  { numero: "Benedicite", clave: "Psalterium/Benedicite", incipitLa: "Benedícite, ómnia ópera Dómini, Dómino", incipitEs: "Obras todas del Señor, bendecid al Señor (Cántico de los Tres Jóvenes, Dn 3)", tipo: "cantico" },
  { numero: "Quicumque", clave: "Psalterium/Quicumque", incipitLa: "Quicúmque vult salvus esse", incipitEs: "Todo el que quiera salvarse (Símbolo Atanasiano)", tipo: "cantico" },
];

/** Incípits seleccionados de salmos frecuentes con numeración Vulgata. */
export const INCIPITS_DESTACADOS: Record<string, { la: string; es: string }> = {
  "1": { la: "Beátus vir qui non ábiit in consílio impiórum", es: "Dichoso el varón que no sigue el consejo de los impíos" },
  "2": { la: "Quare fremuérunt gentes", es: "¿Por qué se amotinan las naciones?" },
  "22": { la: "Dóminus regit me, et nihil mihi déerit", es: "El Señor es mi pastor, nada me falta" },
  "50": { la: "Miserére mei, Deus, secúndum magnam misericórdiam tuam", es: "Misericordia, Dios mío, por tu bondad" },
  "90": { la: "Qui hábitat in adjutório Altíssimi", es: "Tú que habitas al amparo del Altísimo" },
  "92": { la: "Dóminus regnávit, decórem indútus est", es: "El Señor reina, vestido de majestad" },
  "99": { la: "Jubiláte Deo, omnis terra", es: "Aclama al Señor, tierra entera" },
  "109": { la: "Dixit Dóminus Dómino meo", es: "Dijo el Señor a mi Señor: Siéntate a mi derecha" },
  "116": { la: "Laudáte Dóminum, omnes gentes", es: "Alabad al Señor, todas las naciones" },
  "129": { la: "De profúndis clamávi ad te, Dómine", es: "Desde lo hondo a ti grito, Señor" },
  "150": { la: "Laudáte Dóminum in sanctis ejus", es: "Alabad al Señor en su santuario" },
};

/**
 * Genera la lista completa de los 150 salmos de la Vulgata + Cánticos tradicionales.
 */
export function generarIndiceSalterio(): EntradaSalmoInfo[] {
  const lista: EntradaSalmoInfo[] = [];

  for (let i = 1; i <= 150; i++) {
    const num = String(i);
    const dest = INCIPITS_DESTACADOS[num];
    lista.push({
      numero: num,
      clave: `Psalterium/${num}`,
      incipitLa: dest?.la ?? `Psalmus ${num}`,
      incipitEs: dest?.es ?? `Salmo ${num}`,
      tipo: "salmo",
    });
  }

  return [...lista, ...CANTICOS_TRADICIONALES];
}

const limpiar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/**
 * Filtra el salterio por número de salmo o por palabras en su incipit latino o castellano.
 * Ignora acentos y diacríticos (ej. Miserére coincide con miserere).
 */
export function buscarSalterio(
  salmos: readonly EntradaSalmoInfo[],
  termino: string,
): EntradaSalmoInfo[] {
  const crudo = termino.trim();
  if (!crudo) return [...salmos];

  // Si busca por número directo ej "22" o "ps 22" o "salmo 50"
  const soloNumero = crudo.toLowerCase().replace(/^(ps|salmo|psalmus)\s*/i, "");
  if (/^\d+$/.test(soloNumero)) {
    const match = salmos.find((s) => s.numero === soloNumero);
    return match ? [match] : [];
  }

  const q = limpiar(crudo);

  return salmos.filter((s) => {
    return (
      s.numero.toLowerCase().includes(q) ||
      limpiar(s.incipitLa).includes(q) ||
      (s.incipitEs && limpiar(s.incipitEs).includes(q))
    );
  });
}
