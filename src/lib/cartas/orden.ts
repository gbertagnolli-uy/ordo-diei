// Orden canónico teológico y litúrgico de cartas católicas
// Reglas:
// 1. Dios y misterios de Nuestro Señor van al principio.
// 2. Después de Dios le sigue la Santísima Virgen María.
// 3. Los Santos se ordenan por su jerarquía y dignidad según las Letanías de los Santos (Litaniae Sanctorum).
// 4. Los Santos Ángeles y Coros celestiales.
// 5. Los 15 misterios tradicionales del Rosario (Gozosos, Dolorosos, Gloriosos).

export const ORDEN_CANONICO_CARTAS: readonly string[] = [
  // --- 1. DIOS Y NUESTRO SEÑOR ---
  "sagrada-eucaristia",
  "sagrado-corazon-de-jesus",
  "santa-cruz",

  // --- 2. LA SANTÍSIMA VIRGEN MARÍA Y SUS FIESTAS LITÚRGICAS (SAN PÍO V) ---
  // (Después de Dios le sigue la Santísima Virgen María)
  "santa-maria-madre-de-dios",
  "fiesta-purificacion-de-maria",
  "fiesta-anunciacion-de-maria",
  "fiesta-visitacion-de-maria",
  "fiesta-santa-maria-de-las-nieves",
  "fiesta-asuncion-de-maria",
  "fiesta-natividad-de-maria",
  "fiesta-dolores-de-maria",
  "santo-rosario",
  "fiesta-presentacion-de-maria",
  "fiesta-inmaculada-concepcion",

  // --- 3. SANTOS DEL LETANIAE SANCTORUM (los primeros son los más importantes) ---
  // Precursor y Patriarcas
  "san-jose",
  "san-juan-bautista",

  // Apóstoles y Evangelistas
  "san-pedro-apostol",
  "san-pablo-apostol",
  "san-andres-apostol",
  "santiago-el-mayor",
  "san-juan-evangelista",
  "santo-tomas-apostol",
  "santiago-el-menor",
  "san-felipe-apostol",
  "san-bartolome-apostol",
  "san-mateo-apostol",
  "san-simon-apostol",
  "san-judas-tadeo",
  "san-matias-apostol",
  "san-bernabe-apostol",
  "san-lucas-evangelista",
  "san-marcos-evangelista",

  // Mártires
  "san-esteban-protomartir",
  "san-lorenzo-martir",
  "san-vicente-martir",
  "san-sebastian-martir",
  "santos-cosme-y-damian",

  // Pontífices, Obispos y Doctores
  "san-silvestre-papa",
  "san-gregorio-magno",
  "san-ambrosio-de-milan",
  "san-agustin-de-hipona",
  "san-jeronimo",
  "san-martin-de-tours",
  "san-nicolas-de-bari",

  // Monjes, Religiosos y Fundadores
  "san-antonio-abad",
  "san-benito-de-nursia",
  "san-bernardo-de-claraval",
  "santo-domingo-de-guzman",
  "san-francisco-de-asis",

  // Vírgenes y Santas Mujeres
  "santa-maria-magdalena",
  "santa-agueda-martir",
  "santa-lucia-martir",
  "santa-ines-virgen-y-martir",
  "santa-cecilia-martir",
  "santa-catalina-de-alejandria",

  // --- 4. SANTOS ÁNGELES Y COROS CELESTIALES ---
  "arcangel-san-miguel",
  "arcangel-san-gabriel",
  "arcangel-san-rafael",
  "angeles-custodios",
  "coro-serafines",
  "coro-querubines",
  "coro-tronos",
  "coro-dominaciones",
  "coro-potestades",

  // --- 5. MISTERIOS TRADICIONALES DEL ROSARIO (15 misterios) ---
  // Gozosos
  "misterio-anunciacion",
  "misterio-visitacion",
  "misterio-nacimiento",
  "misterio-presentacion",
  "misterio-nino-perdido",
  // Dolorosos
  "misterio-oracion-huerto",
  "misterio-flagelacion",
  "misterio-coronacion-espinas",
  "misterio-cruz-a-cuestas",
  "misterio-crucifixion",
  // Gloriosos
  "misterio-resurreccion",
  "misterio-ascension",
  "misterio-pentecostes",
  "misterio-asuncion",
  "misterio-coronacion-maria",
];

const INDICE_ORDEN = new Map<string, number>(
  ORDEN_CANONICO_CARTAS.map((clave, idx) => [clave, idx])
);

/**
 * Retorna la posición canónica de una carta.
 * Para cartas no registradas (ej. creadas manualmente en panel admin),
 * se asigna un orden de reserva según su categoría y rareza.
 */
export function pesoCarta(clave: string, categoria?: string): number {
  const p = INDICE_ORDEN.get(clave);
  if (p !== undefined) return p;

  if (categoria === "Tema") return 1000;
  if (categoria === "Santo") return 2000;
  if (categoria === "Angel") return 3000;
  if (categoria === "Misterio") return 4000;
  return 5000;
}

/**
 * Ordena un arreglo de cartas siguiendo el orden teológico/litúrgico.
 */
export function ordenarCartas<T extends { clave: string; categoria?: string }>(
  cartas: T[]
): T[] {
  return [...cartas].sort((a, b) => {
    const pa = pesoCarta(a.clave, a.categoria);
    const pb = pesoCarta(b.clave, b.categoria);
    if (pa !== pb) return pa - pb;
    return a.clave.localeCompare(b.clave);
  });
}
