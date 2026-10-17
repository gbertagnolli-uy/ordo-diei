// Lógica de los Misterios del Rosario tradicional (SPEC liturgia §10.8, D49).
// Regla dominical (D49, SPEC §10.8). Fuente: texto aportado por el usuario el 2026-10-14, «Mysteries for Rosary Meditation /
// Meditationes Rosarii» (devoción tradicional): Lun y Jue Gozosos; Mar y Vie Dolorosos; Mié y Sáb Gloriosos; Domingo
// Gloriosos, salvo en el tiempo de Adviento/Navidad (Gozosos) y en Cuaresma (Dolorosos). La Septuagésima NO cuenta como
// Cuaresma. El usuario dio esta fuente por buena como criterio de L9 (no es una edición impresa preconciliar).

import type { TiempoLiturgico } from "./tipos.ts";
import rosariumJson from "../../data/liturgia/rosarium.json" with { type: "json" };
import lecturasJson from "../../data/liturgia/rosarium-lecturas.json" with { type: "json" };

export type OracionRosario = {
  tituloLa: string;
  tituloEs: string;
  textoLa: string;
  textoEs: string;
  fuente: string;
  etiqueta?: string;
  versiculoLa?: string;
  versiculoEs?: string;
};

export type InvocacionLetania = {
  la: string;
  es: string;
};

export type LitaniaeRosario = {
  tituloLa: string;
  tituloEs: string;
  fuente: string;
  invocaciones: InvocacionLetania[];
};

export type DevocionarioRosario = {
  oraciones: Record<string, OracionRosario>;
  litaniaeLauretanae: LitaniaeRosario;
};

export const DEVOCIONARIO_ROSARIO: DevocionarioRosario = rosariumJson as DevocionarioRosario;

export type GrupoMisterios = "gaudiosa" | "dolorosa" | "gloriosa";

export type Misterio = {
  numero: number;
  numeroRomano: string;
  latino: string;
  castellano: string;
  fruto: string;
  /** Referencias de las lecturas, para mostrar en la tarjeta (derivadas de `lecturas`). */
  cita: string;
  /** Pasajes de la Vulgata Clementina, en latín (scripts/liturgia/rosarium-lecturas.ts). */
  lecturas: LecturaMisterio[];
};

export type LecturaMisterio = { ref: string; libro: string; capitulo: number; desde: number; hasta: number; la: string };

export type InformacionRosarioDia = {
  grupo: GrupoMisterios;
  tituloLatino: string;
  tituloCastellano: string;
  motivo: string;
  misterios: Misterio[];
};

const BASE_GAUDIOSA: Omit<Misterio, "cita" | "lecturas">[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Annuntiatio Beatæ Mariæ Virginis",
    castellano: "La Anunciación del Ángel a la Virgen María",
    fruto: "La humildad",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Visitatio Beatæ Mariæ Virginis",
    castellano: "La Visitación de Nuestra Señora a su prima Santa Isabel",
    fruto: "La caridad con el prójimo",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Nativitas Domini nostri Iesu Christi",
    castellano: "El Nacimiento del Hijo de Dios en Belén",
    fruto: "La pobreza de espíritu y desapego del mundo",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Præsentatio Pueri Iesu in Templo",
    castellano: "La Presentación del Niño Jesús en el Templo",
    fruto: "La pureza y la santa obediencia",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Inventio Pueri Iesu in Templo",
    castellano: "El Niño Jesús perdido y hallado en el Templo",
    fruto: "La piedad y buscar a Dios en todo",
  },
];

const BASE_DOLOROSA: Omit<Misterio, "cita" | "lecturas">[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Agonia Domini nostri Iesu Christi in Horto",
    castellano: "La Oración y Agonía de Jesús en el Huerto de los Olivos",
    fruto: "El dolor de los pecados y conformidad con la voluntad divina",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Flagellatio Domini nostri Iesu Christi",
    castellano: "La Flagelación de Nuestro Señor atado a la columna",
    fruto: "La mortificación de los sentidos",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Coronatio Spinis",
    castellano: "La Coronación de Espinas",
    fruto: "La mortificación del orgullo y la soberbia",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Baiulatio Crucis",
    castellano: "Jesús con la Cruz a cuestas camino al Calvario",
    fruto: "La paciencia en las cruces y tribulaciones",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Crucifixio et Mors Domini nostri Iesu Christi",
    castellano: "La Crucifixión y Muerte de Nuestro Señor Jesucristo",
    fruto: "El amor a los enemigos y la salvación de las almas",
  },
];

const BASE_GLORIOSA: Omit<Misterio, "cita" | "lecturas">[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Resurrectio Domini nostri Iesu Christi",
    castellano: "La Triunfante Resurrección de Nuestro Señor",
    fruto: "La fe y la conversión de vida",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Ascensio Domini nostri Iesu Christi",
    castellano: "La Admirable Ascensión del Señor a los Cielos",
    fruto: "La esperanza y el anhelo del Cielo",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Descensus Spiritus Sancti in Cenaculo",
    castellano: "La Venida del Espíritu Santo sobre los Apóstoles",
    fruto: "El celo apostólico y la caridad divina",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Assumptio Beatæ Mariæ Virginis",
    castellano: "La Asunción en cuerpo y alma de la Santísima Virgen",
    fruto: "La perseverancia final y devoción filial a María",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Coronatio Beatæ Mariæ Virginis",
    castellano: "La Coronación de la Virgen María como Reina de cielo y tierra",
    fruto: "La confianza en la intercesión de la Virgen",
  },
];

/** Une cada misterio con sus lecturas de la Vulgata; sin lectura cargada para algún misterio, falla al importar. */
function conLecturas(grupo: GrupoMisterios, base: Omit<Misterio, "cita" | "lecturas">[]): Misterio[] {
  const filas = (lecturasJson as unknown as Record<GrupoMisterios, { numero: number; lecturas: LecturaMisterio[] }[]>)[grupo];
  return base.map((m) => {
    const lecturas = filas.find((f) => f.numero === m.numero)?.lecturas ?? [];
    if (lecturas.length === 0) throw new Error(`Falta la lectura de la Vulgata del misterio ${grupo} ${m.numero}`);
    return { ...m, lecturas, cita: lecturas.map((l) => l.ref).join("; ") };
  });
}

export const MISTERIOS_GAUDIOSA: Misterio[] = conLecturas("gaudiosa", BASE_GAUDIOSA);
export const MISTERIOS_DOLOROSA: Misterio[] = conLecturas("dolorosa", BASE_DOLOROSA);
export const MISTERIOS_GLORIOSA: Misterio[] = conLecturas("gloriosa", BASE_GLORIOSA);

export const FUENTE_LECTURAS: string = (lecturasJson as { fuente: string }).fuente;

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
 * Domingo según el tiempo litúrgico (fuente: ver el encabezado del archivo):
 *  - Adviento, Navidad, Epifanía: Gozosos
 *  - Cuaresma y Pasión: Dolorosos
 *  - el resto (Septuagésima, Pascua, Pentecostés, per annum): Gloriosos
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
      } else if (tiempo === "cuaresma" || tiempo === "pasion") {
        grupo = "dolorosa";
        motivo = `domingo de ${tiempo === "cuaresma" ? "Cuaresma" : "Pasión"}`;
      } else {
        grupo = "gloriosa";
        motivo = `domingo de ${tiempo === "pascua" ? "Pascua" : tiempo === "septuagesima" ? "Septuagésima" : "Pentecostés"}`;
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
