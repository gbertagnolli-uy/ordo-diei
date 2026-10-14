import type { ColorLiturgico } from "./tipos";
import type { EntradaKalendarium } from "./lecturas";

export type TiempoTempore =
  | "Adventus"
  | "Nativitas"
  | "Epiphania"
  | "Septuagesima"
  | "Quadragesima"
  | "Passio"
  | "Pascha"
  | "Pentecostes";

export interface InfoTiempoTempore {
  id: TiempoTempore;
  latino: string;
  castellano: string;
}

export const LISTA_TIEMPOS_TEMPORE: readonly InfoTiempoTempore[] = [
  { id: "Adventus", latino: "Adventus", castellano: "Adviento" },
  { id: "Nativitas", latino: "Nativitas", castellano: "Navidad" },
  { id: "Epiphania", latino: "Epiphania", castellano: "Epifanía" },
  { id: "Septuagesima", latino: "Septuagesima", castellano: "Septuagésima" },
  { id: "Quadragesima", latino: "Quadragesima", castellano: "Cuaresma" },
  { id: "Passio", latino: "Passio", castellano: "Pasión" },
  { id: "Pascha", latino: "Pascha", castellano: "Pascua" },
  { id: "Pentecostes", latino: "Pentecostes", castellano: "Pentecostés" },
];

/**
 * Clasifica una clave de Tempora (ej. Tempora/Adv1-0, Missa/Tempora/Pent04-2) en uno de los 8 tiempos litúrgicos tradicionales (SPEC §10.4).
 */
export function clasificarClaveTempora(clave: string, titulo = ""): TiempoTempore {
  const c = clave.toLowerCase();
  const t = titulo.toLowerCase();

  // 1. Adventus
  if (c.includes("adv") || t.includes("advent")) return "Adventus";

  // 2. Nativitas
  if (c.includes("nat") || t.includes("nativit") || t.includes("navidad")) return "Nativitas";

  // 3. Epiphania
  if (c.includes("epi") || t.includes("epiphan") || t.includes("epifanía")) return "Epiphania";

  // 4. Septuagesima (Septuagesima, Sexagesima, Quinquagesima - en DO Quadp*)
  if (c.includes("quadp") || c.includes("septuag") || c.includes("sexag") || c.includes("quinq") ||
      t.includes("septuagésima") || t.includes("sexagésima") || t.includes("quincuagésima")) {
    return "Septuagesima";
  }

  // 5. Passio (Semana de Pasión y Semana Santa: Quad5, Quad6, HebdMaior)
  if (c.includes("quad5") || c.includes("quad6") || c.includes("passio") || c.includes("palmis") || c.includes("hebdmaior") ||
      t.includes("passione") || t.includes("pasión") || t.includes("palmas") || t.includes("sancta")) {
    return "Passio";
  }

  // 6. Quadragesima (Cuaresma I-IV: Quad1..Quad4, Cinerum)
  if (c.includes("quad") || c.includes("ciner") || t.includes("quadragesima") || t.includes("cuaresma") || t.includes("ceniza")) {
    return "Quadragesima";
  }

  // 7. Pascha (Pascua y tiempo pascual: Pasc*, Ascensio)
  if (c.includes("pasc") || c.includes("ascens") || t.includes("pasch") || t.includes("pascua") || t.includes("ascensión")) {
    return "Pascha";
  }

  // 8. Pentecostes (Pentecostés y post Pentecosten: Pent*)
  if (c.includes("pent") || t.includes("pentecost")) return "Pentecostes";

  return "Pentecostes";
}

export const MESES_SANCTORUM = [
  { num: "01", latino: "Ianuarius", castellano: "Enero" },
  { num: "02", latino: "Februarius", castellano: "Febrero" },
  { num: "03", latino: "Martius", castellano: "Marzo" },
  { num: "04", latino: "Aprilis", castellano: "Abril" },
  { num: "05", latino: "Maius", castellano: "Mayo" },
  { num: "06", latino: "Iunius", castellano: "Junio" },
  { num: "07", latino: "Iulius", castellano: "Julio" },
  { num: "08", latino: "Augustus", castellano: "Agosto" },
  { num: "09", latino: "September", castellano: "Septiembre" },
  { num: "10", latino: "October", castellano: "Octubre" },
  { num: "11", latino: "November", castellano: "Noviembre" },
  { num: "12", latino: "December", castellano: "Diciembre" },
] as const;

/**
 * Traduce el número de rango de DO (escala de los archivos Sancti/Tempora) a su nombre latino.
 * Es un respaldo: para el Kalendarium la carga guarda además `rangoTexto` ya calculado según la versión.
 */
export function textoRango(r: number): string {
  switch (r) {
    case 1:
      return "Simplex";
    case 2:
      return "Semiduplex";
    case 3:
      return "Duplex";
    case 4:
      return "Duplex majus";
    case 5:
      return "Duplex II. classis";
    case 6:
      return "Duplex I. classis";
    default:
      return r > 6 ? "Dies privilegiatus" : "Commemoratio";
  }
}

/**
 * Deduce el color litúrgico tradicional de un santo o festividad según su título.
 */
export function deducirColorSanto(nombre: string): ColorLiturgico {
  const n = nombre.toLowerCase();
  if (
    /\b(martyr|martyris|martyrum|mártir|mártires|mart|mm|m)\b/i.test(nombre) ||
    n.includes("martyr") ||
    n.includes("mártir")
  ) {
    return "rojo";
  }
  if (n.includes("vigil") || n.includes("defunctorum") || n.includes("ánimas")) {
    return "morado";
  }
  return "blanco";
}

/**
 * Filtra la lista del Kalendarium por mes (formato "01".."12").
 */
export function filtrarSantosPorMes(santos: readonly EntradaKalendarium[], mes: string): EntradaKalendarium[] {
  return santos.filter((s) => s.fecha.startsWith(`${mes}-`));
}

/**
 * Búsqueda de santos por nombre o fecha.
 */
export function buscarSantos(santos: readonly EntradaKalendarium[], busqueda: string): EntradaKalendarium[] {
  const q = busqueda.trim().toLowerCase();
  if (!q) return [...santos];
  return santos.filter((s) => s.nombre.toLowerCase().includes(q) || s.fecha.includes(q));
}
