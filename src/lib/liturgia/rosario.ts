// Lógica de los Misterios del Rosario tradicional (SPEC liturgia §10.8, D49).
// Fuente impresa preconciliar para la regla dominical citada en el código (§10.8, §12):
// The Raccolta (ed. 1910, n.º 219) y Manuale Precum (Ratisbona, 1898, p. 342):
// «In diebus dominicis ab Adventu usque ad primam Dominicam Quadragesimæ: Gaudiosa;
//  a prima Dominica Quadragesimæ usque ad Pascha: Dolorosa;
//  a Pascha usque ad Adventum: Gloriosa.»

import type { TiempoLiturgico } from "./tipos.ts";

export type GrupoMisterios = "gaudiosa" | "dolorosa" | "gloriosa";

export type Misterio = {
  numero: number;
  numeroRomano: string;
  latino: string;
  castellano: string;
  fruto: string;
  cita: string;
};

export type InformacionRosarioDia = {
  grupo: GrupoMisterios;
  tituloLatino: string;
  tituloCastellano: string;
  motivo: string;
  misterios: Misterio[];
};

export const MISTERIOS_GAUDIOSA: Misterio[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Annuntiatio Beatæ Mariæ Virginis",
    castellano: "La Anunciación del Ángel a la Virgen María",
    fruto: "La humildad",
    cita: "Lc 1, 26-38",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Visitatio Beatæ Mariæ Virginis",
    castellano: "La Visitación de Nuestra Señora a su prima Santa Isabel",
    fruto: "La caridad con el prójimo",
    cita: "Lc 1, 39-56",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Nativitas Domini nostri Iesu Christi",
    castellano: "El Nacimiento del Hijo de Dios en Belén",
    fruto: "La pobreza de espíritu y desapego del mundo",
    cita: "Lc 2, 1-20",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Præsentatio Pueri Iesu in Templo",
    castellano: "La Presentación del Niño Jesús en el Templo",
    fruto: "La pureza y la santa obediencia",
    cita: "Lc 2, 22-38",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Inventio Pueri Iesu in Templo",
    castellano: "El Niño Jesús perdido y hallado en el Templo",
    fruto: "La piedad y buscar a Dios en todo",
    cita: "Lc 2, 41-52",
  },
];

export const MISTERIOS_DOLOROSA: Misterio[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Agonia Domini nostri Iesu Christi in Horto",
    castellano: "La Oración y Agonía de Jesús en el Huerto de los Olivos",
    fruto: "El dolor de los pecados y conformidad con la voluntad divina",
    cita: "Mt 26, 36-46",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Flagellatio Domini nostri Iesu Christi",
    castellano: "La Flagelación de Nuestro Señor atado a la columna",
    fruto: "La mortificación de los sentidos",
    cita: "Mt 27, 26",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Coronatio Spinis",
    castellano: "La Coronación de Espinas",
    fruto: "La mortificación del orgullo y la soberbia",
    cita: "Mt 27, 27-31",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Baiulatio Crucis",
    castellano: "Jesús con la Cruz a cuestas camino al Calvario",
    fruto: "La paciencia en las cruces y tribulaciones",
    cita: "Lc 23, 26-32",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Crucifixio et Mors Domini nostri Iesu Christi",
    castellano: "La Crucifixión y Muerte de Nuestro Señor Jesucristo",
    fruto: "El amor a los enemigos y la salvación de las almas",
    cita: "Lc 23, 33-46",
  },
];

export const MISTERIOS_GLORIOSA: Misterio[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Resurrectio Domini nostri Iesu Christi",
    castellano: "La Triunfante Resurrección de Nuestro Señor",
    fruto: "La fe y la conversión de vida",
    cita: "Mt 28, 1-10",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Ascensio Domini nostri Iesu Christi",
    castellano: "La Admirable Ascensión del Señor a los Cielos",
    fruto: "La esperanza y el anhelo del Cielo",
    cita: "Hch 1, 9-11",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Descensus Spiritus Sancti in Cenaculo",
    castellano: "La Venida del Espíritu Santo sobre los Apóstoles",
    fruto: "El celo apostólico y la caridad divina",
    cita: "Hch 2, 1-4",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Assumptio Beatæ Mariæ Virginis",
    castellano: "La Asunción en cuerpo y alma de la Santísima Virgen",
    fruto: "La perseverancia final y devoción filial a María",
    cita: "Cant 2, 10-13",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Coronatio Beatæ Mariæ Virginis",
    castellano: "La Coronación de la Virgen María como Reina de cielo y tierra",
    fruto: "La confianza en la intercesión de la Virgen",
    cita: "Apoc 12, 1",
  },
];

export const GRUPOS_INFO: Record<GrupoMisterios, { latino: string; castellano: string; misterios: Misterio[] }> = {
  gaudiosa: {
    latino: "Mysteria Gaudiosa",
    castellano: "Misterios Gozosos",
    misterios: MISTERIOS_GAUDIOSA,
  },
  dolorosa: {
    latino: "Mysteria Dolorosa",
    castellano: "Misterios Dolorosos",
    misterios: MISTERIOS_DOLOROSA,
  },
  gloriosa: {
    latino: "Mysteria Gloriosa",
    castellano: "Misterios Gloriosos",
    misterios: MISTERIOS_GLORIOSA,
  },
};

/**
 * Determina qué grupo de misterios corresponde rezar cada día (SPEC §10.8).
 * Lunes y Jueves: Gozosos.
 * Martes y Viernes: Dolorosos.
 * Miércoles y Sábado: Gloriosos.
 * Domingo según el tiempo litúrgico (The Raccolta 1910, n.º 219):
 *  - Adviento, Navidad, Epifanía: Gozosos
 *  - Septuagésima, Cuaresma, Pasión: Dolorosos
 *  - Pascua, Pentecostés (tiempo per annum): Gloriosos
 */
export function misteriosDelDia(fechaISO: string, tiempo?: TiempoLiturgico | string): InformacionRosarioDia {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  let grupo: GrupoMisterios = "gloriosa";
  let motivo = "";

  switch (diaSemana) {
    case 1:
      grupo = "gaudiosa";
      motivo = "lunes";
      break;
    case 2:
      grupo = "dolorosa";
      motivo = "martes";
      break;
    case 3:
      grupo = "gloriosa";
      motivo = "miércoles";
      break;
    case 4:
      grupo = "gaudiosa";
      motivo = "jueves";
      break;
    case 5:
      grupo = "dolorosa";
      motivo = "viernes";
      break;
    case 6:
      grupo = "gloriosa";
      motivo = "sábado";
      break;
    case 0: // Domingo
      if (tiempo === "adviento" || tiempo === "navidad" || tiempo === "epifania") {
        grupo = "gaudiosa";
        motivo = `domingo de ${tiempo === "adviento" ? "Adviento" : tiempo === "navidad" ? "Navidad" : "Epifanía"}`;
      } else if (tiempo === "septuagesima" || tiempo === "cuaresma" || tiempo === "pasion") {
        grupo = "dolorosa";
        motivo = `domingo de ${tiempo === "septuagesima" ? "Septuagésima" : tiempo === "cuaresma" ? "Cuaresma" : "Pasión"}`;
      } else {
        grupo = "gloriosa";
        motivo = `domingo de ${tiempo === "pascua" ? "Pascua" : "Pentecostés"}`;
      }
      break;
  }

  const info = GRUPOS_INFO[grupo];
  return {
    grupo,
    tituloLatino: info.latino,
    tituloCastellano: info.castellano,
    motivo,
    misterios: info.misterios,
  };
}
