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
  /** Clave de la carta correspondiente en el catálogo de Cartas Católicas (`misterios.json`). */
  claveCarta: string;
  /** Ruta lógica de la imagen de la carta (`/cartas/<clave>/1.webp`). */
  imagen: string;
  /** URL servida para mostrar la imagen de la carta en el navegador (`/api/cartas/arte?ruta=...`). */
  imagenUrl: string;
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

export type ModoRezoRosario = "dia" | "completo";

export type MisterioEnSecuencia = Misterio & {
  grupo: GrupoMisterios;
  grupoLatino: string;
  grupoCastellano: string;
  indiceGlobal: number;
  totalGlobal: number;
  romanoGlobal: string;
  textoVulgata: string;
};

export type PasoOracionOrdenada = {
  id: string;
  orden: number;
  repeticiones?: number;
  indicacion: string;
  oracion: OracionRosario;
};

const ROMANOS_15 = [
  "I", "II", "III", "IV", "V",
  "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV",
] as const;

type BaseMisterio = Omit<Misterio, "cita" | "lecturas" | "imagenUrl">;

const BASE_GAUDIOSA: BaseMisterio[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Annuntiatio Beatæ Mariæ Virginis",
    castellano: "La Anunciación del Ángel a la Virgen María",
    fruto: "La humildad",
    claveCarta: "misterio-anunciacion",
    imagen: "/cartas/misterio-anunciacion/1.webp",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Visitatio Beatæ Mariæ Virginis",
    castellano: "La Visitación de Nuestra Señora a su prima Santa Isabel",
    fruto: "La caridad con el prójimo",
    claveCarta: "misterio-visitacion",
    imagen: "/cartas/misterio-visitacion/1.webp",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Nativitas Domini nostri Iesu Christi",
    castellano: "El Nacimiento del Hijo de Dios en Belén",
    fruto: "La pobreza de espíritu y desapego del mundo",
    claveCarta: "misterio-nacimiento",
    imagen: "/cartas/misterio-nacimiento/1.webp",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Præsentatio Pueri Iesu in Templo",
    castellano: "La Presentación del Niño Jesús en el Templo",
    fruto: "La pureza y la santa obediencia",
    claveCarta: "misterio-presentacion",
    imagen: "/cartas/misterio-presentacion/1.webp",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Inventio Pueri Iesu in Templo",
    castellano: "El Niño Jesús perdido y hallado en el Templo",
    fruto: "La piedad y buscar a Dios en todo",
    claveCarta: "misterio-nino-perdido",
    imagen: "/cartas/misterio-nino-perdido/1.webp",
  },
];

const BASE_DOLOROSA: BaseMisterio[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Agonia Domini nostri Iesu Christi in Horto",
    castellano: "La Oración y Agonía de Jesús en el Huerto de los Olivos",
    fruto: "El dolor de los pecados y conformidad con la voluntad divina",
    claveCarta: "misterio-oracion-huerto",
    imagen: "/cartas/misterio-oracion-huerto/1.webp",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Flagellatio Domini nostri Iesu Christi",
    castellano: "La Flagelación de Nuestro Señor atado a la columna",
    fruto: "La mortificación de los sentidos",
    claveCarta: "misterio-flagelacion",
    imagen: "/cartas/misterio-flagelacion/1.webp",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Coronatio Spinis",
    castellano: "La Coronación de Espinas",
    fruto: "La mortificación del orgullo y la soberbia",
    claveCarta: "misterio-coronacion-espinas",
    imagen: "/cartas/misterio-coronacion-espinas/1.webp",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Baiulatio Crucis",
    castellano: "Jesús con la Cruz a cuestas camino al Calvario",
    fruto: "La paciencia en las cruces y tribulaciones",
    claveCarta: "misterio-cruz-a-cuestas",
    imagen: "/cartas/misterio-cruz-a-cuestas/1.webp",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Crucifixio et Mors Domini nostri Iesu Christi",
    castellano: "La Crucifixión y Muerte de Nuestro Señor Jesucristo",
    fruto: "El amor a los enemigos y la salvación de las almas",
    claveCarta: "misterio-crucifixion",
    imagen: "/cartas/misterio-crucifixion/1.webp",
  },
];

const BASE_GLORIOSA: BaseMisterio[] = [
  {
    numero: 1,
    numeroRomano: "I",
    latino: "Resurrectio Domini nostri Iesu Christi",
    castellano: "La Triunfante Resurrección de Nuestro Señor",
    fruto: "La fe y la conversión de vida",
    claveCarta: "misterio-resurreccion",
    imagen: "/cartas/misterio-resurreccion/1.webp",
  },
  {
    numero: 2,
    numeroRomano: "II",
    latino: "Ascensio Domini nostri Iesu Christi",
    castellano: "La Admirable Ascensión del Señor a los Cielos",
    fruto: "La esperanza y el anhelo del Cielo",
    claveCarta: "misterio-ascension",
    imagen: "/cartas/misterio-ascension/1.webp",
  },
  {
    numero: 3,
    numeroRomano: "III",
    latino: "Descensus Spiritus Sancti in Cenaculo",
    castellano: "La Venida del Espíritu Santo sobre los Apóstoles",
    fruto: "El celo apostólico y la caridad divina",
    claveCarta: "misterio-pentecostes",
    imagen: "/cartas/misterio-pentecostes/1.webp",
  },
  {
    numero: 4,
    numeroRomano: "IV",
    latino: "Assumptio Beatæ Mariæ Virginis",
    castellano: "La Asunción en cuerpo y alma de la Santísima Virgen",
    fruto: "La perseverancia final y devoción filial a María",
    claveCarta: "misterio-asuncion",
    imagen: "/cartas/misterio-asuncion/1.webp",
  },
  {
    numero: 5,
    numeroRomano: "V",
    latino: "Coronatio Beatæ Mariæ Virginis",
    castellano: "La Coronación de la Virgen María como Reina de cielo y tierra",
    fruto: "La confianza en la intercesión de la Virgen",
    claveCarta: "misterio-coronacion-maria",
    imagen: "/cartas/misterio-coronacion-maria/1.webp",
  },
];

/** Une cada misterio con sus lecturas de la Vulgata e imagen de carta; sin lectura cargada para algún misterio, falla al importar. */
function conLecturas(grupo: GrupoMisterios, base: BaseMisterio[]): Misterio[] {
  const filas = (lecturasJson as unknown as Record<GrupoMisterios, { numero: number; lecturas: LecturaMisterio[] }[]>)[grupo];
  return base.map((m) => {
    const lecturas = filas.find((f) => f.numero === m.numero)?.lecturas ?? [];
    if (lecturas.length === 0) throw new Error(`Falta la lectura de la Vulgata del misterio ${grupo} ${m.numero}`);
    return {
      ...m,
      imagenUrl: `/api/cartas/arte?ruta=${encodeURIComponent(m.imagen)}`,
      lecturas,
      cita: lecturas.map((l) => l.ref).join("; "),
    };
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

/**
 * Devuelve la secuencia ordenada de misterios para rezar según el modo elegido:
 * - `"dia"`: los 5 misterios correspondientes al día seleccionado.
 * - `"completo"`: los 15 misterios completos (Gaudiosa I–V, Dolorosa I–V, Gloriosa I–V).
 */
export function obtenerMisteriosParaRezar(
  modo: ModoRezoRosario,
  fechaISO: string,
  tiempo?: TiempoLiturgico | string,
): {
  modo: ModoRezoRosario;
  tituloLatino: string;
  tituloCastellano: string;
  subtitulo: string;
  misterios: MisterioEnSecuencia[];
} {
  if (modo === "completo") {
    const gruposOrden: GrupoMisterios[] = ["gaudiosa", "dolorosa", "gloriosa"];
    const lista: MisterioEnSecuencia[] = [];
    let idx = 0;
    for (const g of gruposOrden) {
      const info = GRUPOS_INFO[g];
      for (const m of info.misterios) {
        idx += 1;
        lista.push({
          ...m,
          grupo: g,
          grupoLatino: info.latino,
          grupoCastellano: info.castellano,
          indiceGlobal: idx,
          totalGlobal: 15,
          romanoGlobal: ROMANOS_15[idx - 1] ?? String(idx),
          textoVulgata: m.lecturas.map((l) => l.la).join(" "),
        });
      }
    }
    return {
      modo: "completo",
      tituloLatino: "Rosarium Integrum Beatæ Mariæ Virginis",
      tituloCastellano: "Los 15 Misterios Completos del Santo Rosario",
      subtitulo: "Mysteria Gaudiosa (I–V) · Mysteria Dolorosa (VI–X) · Mysteria Gloriosa (XI–XV)",
      misterios: lista,
    };
  }

  const hoy = misteriosDelDia(fechaISO, tiempo);
  const lista: MisterioEnSecuencia[] = hoy.misterios.map((m, i) => ({
    ...m,
    grupo: hoy.grupo,
    grupoLatino: hoy.tituloLatino,
    grupoCastellano: hoy.tituloCastellano,
    indiceGlobal: i + 1,
    totalGlobal: 5,
    romanoGlobal: m.numeroRomano,
    textoVulgata: m.lecturas.map((l) => l.la).join(" "),
  }));

  return {
    modo: "dia",
    tituloLatino: hoy.tituloLatino,
    tituloCastellano: hoy.tituloCastellano,
    subtitulo: `5 misterios del día (${hoy.motivo})`,
    misterios: lista,
  };
}

/**
 * Devuelve las oraciones en su orden tradicional de rezo:
 * 1. Iniciales (Signum Crucis, Credo, Pater Noster, 3 Ave Maria, Gloria Patri)
 * 2. Por cada decena (1 Pater Noster, 10 Ave Maria, 1 Gloria Patri, Oratio Fatimæ)
 * 3. Finales (Salve Regina, Oremus, Litaniæ Lauretanæ, Signum Crucis)
 */
export function obtenerOrdenOracionesRosario(): {
  iniciales: PasoOracionOrdenada[];
  decena: PasoOracionOrdenada[];
  finales: PasoOracionOrdenada[];
} {
  const { oraciones } = DEVOCIONARIO_ROSARIO;
  return {
    iniciales: [
      {
        id: "inicio-signum-crucis",
        orden: 1,
        indicacion: "En la cruz del Rosario",
        oracion: oraciones.signumCrucis,
      },
      {
        id: "inicio-credo",
        orden: 2,
        indicacion: "Sobre el crucifijo",
        oracion: oraciones.credo,
      },
      {
        id: "inicio-pater",
        orden: 3,
        repeticiones: 1,
        indicacion: "Primera cuenta gruesa (por las intenciones de la Iglesia)",
        oracion: oraciones.paterNoster,
      },
      {
        id: "inicio-tres-aves",
        orden: 4,
        repeticiones: 3,
        indicacion: "Tres cuentas pequeñas (por el aumento de la Fe, la Esperanza y la Caridad)",
        oracion: oraciones.aveMaria,
      },
      {
        id: "inicio-gloria",
        orden: 5,
        repeticiones: 1,
        indicacion: "Al concluir las tres Avemarías iniciales",
        oracion: oraciones.gloriaPatri,
      },
    ],
    decena: [
      {
        id: "decena-pater",
        orden: 1,
        repeticiones: 1,
        indicacion: "1× Padre Nuestro al anunciar y meditar el misterio",
        oracion: oraciones.paterNoster,
      },
      {
        id: "decena-aves",
        orden: 2,
        repeticiones: 10,
        indicacion: "10× Avemarías meditando el misterio",
        oracion: oraciones.aveMaria,
      },
      {
        id: "decena-gloria",
        orden: 3,
        repeticiones: 1,
        indicacion: "1× Gloria al Padre al finalizar las diez Avemarías",
        oracion: oraciones.gloriaPatri,
      },
      {
        id: "decena-fatima",
        orden: 4,
        repeticiones: 1,
        indicacion: "Jaculatoria de Fátima tras el Gloria",
        oracion: oraciones.fatima,
      },
    ],
    finales: [
      {
        id: "final-salve",
        orden: 1,
        indicacion: "Al concluir todas las decenas del Rosario",
        oracion: oraciones.salveRegina,
      },
      {
        id: "final-oremus",
        orden: 2,
        indicacion: "Oración colecta final del Santo Rosario",
        oracion: oraciones.oremusFinal,
      },
      {
        id: "final-signum-crucis",
        orden: 3,
        indicacion: "Conclusión (tras las Letanías Lauretanas)",
        oracion: oraciones.signumCrucis,
      },
    ],
  };
}

