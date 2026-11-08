// Asistente del diario (lane 298): citas de entradas. Qué entradas tocó el asistente en un turno, para mostrarlas como fichas que se pueden abrir,
// y la cita que el usuario adjunta a su pregunta («preguntar por esta entrada»). Reglas puras.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/application/diary_citation.dart (ZhuJHua/moodiary@2c552dd).
// Los ids de moodiary son uuid; acá son enteros: `id=123` (el lookbehind deja afuera `categoryId=` y `parentId=`).

import type { LlamadaRegistrada } from "./herramientas.ts";

const PREFIJO = "[diary:";
const ID_ENTRADA = /(?<![A-Za-z])id=(\d{1,12})\b/g;

export type TipoCita = "leida" | "creada" | "editada" | "borrada";
export interface Cita {
  id: number;
  tipo: TipoCita;
}

/** moodiary `_kindByTool`. El orden importa: una entrada leída y luego editada se muestra como editada. */
const TIPO_DE: Record<string, TipoCita> = {
  searchDiaries: "leida",
  getDiary: "leida",
  createDiary: "creada",
  updateDiary: "editada",
  deleteDiary: "borrada",
};
const PESO: Record<TipoCita, number> = { leida: 0, creada: 1, editada: 2, borrada: 3 };

function* idsEn(resultado: string): Generator<number> {
  for (const linea of resultado.split("\n")) {
    if (linea.startsWith("Failed") || linea.startsWith("Not found")) continue;
    for (const m of linea.matchAll(ID_ENTRADA)) yield Number(m[1]);
  }
}

export const tipoDeCita = (herramienta: string): TipoCita | undefined => TIPO_DE[herramienta];

/** ¿Esta llamada tocó entradas? (moodiary `citesDiaries`). */
export const citaEntradas = (l: LlamadaRegistrada): boolean => l.hecha && l.nombre in TIPO_DE && !idsEn(l.resultado).next().done;

/** moodiary `diaryCitationsOf`: una cita por entrada, con el tipo más fuerte que tuvo en el turno. */
export function citasDe(llamadas: Iterable<LlamadaRegistrada>): Cita[] {
  const porId = new Map<number, TipoCita>();
  for (const l of llamadas) {
    const tipo = TIPO_DE[l.nombre];
    if (!tipo || !l.hecha) continue;
    for (const id of idsEn(l.resultado)) {
      const visto = porId.get(id);
      if (visto === undefined || PESO[tipo] > PESO[visto]) porId.set(id, tipo);
    }
  }
  return [...porId].map(([id, tipo]) => ({ id, tipo }));
}

/** moodiary `citeDiary`: el mensaje del usuario lleva delante la entrada por la que pregunta. */
export const citarEntrada = (texto: string, id: number) => `${PREFIJO}${id}]\n${texto}`;

/** moodiary `splitDiaryCitation`. */
export function separarCita(texto: string): { id: number | null; texto: string } {
  if (!texto.startsWith(PREFIJO)) return { id: null, texto };
  const fin = texto.indexOf("]");
  if (fin === -1) return { id: null, texto };
  const crudo = texto.slice(PREFIJO.length, fin);
  if (!/^[1-9]\d{0,11}$/.test(crudo)) return { id: null, texto };
  let resto = texto.slice(fin + 1);
  if (resto.startsWith("\n")) resto = resto.slice(1);
  return { id: Number(crudo), texto: resto };
}

/** moodiary `diaryCitationForModel`: lo que ve el modelo en lugar de la marca. */
export function citaParaElModelo(texto: string): string {
  const { id, texto: cuerpo } = separarCita(texto);
  if (id === null) return texto;
  return `The user is asking about the diary entry with id=${id}. Read it with getDiary before answering.\n\n${cuerpo}`;
}

const LINEA_BUSQUEDA = /^id=(\d+) 【(\d{4}-\d{2}-\d{2})】(.*?)(?: mood=|$)/;
const LINEA_CREADA = /^Created "(.*)" \((\d{4}-\d{2}-\d{2})\), id=(\d+)\./;
const LINEA_OTRA = /^(?:Updated|Deleted) "(.*)" \(id=(\d+)\)/;

/** El nombre con el que se muestra una cita: «fecha · título», sacado de lo que devolvieron las herramientas (búsqueda, lectura o creación). */
export function rotuloDeCita(id: number, llamadas: Iterable<LlamadaRegistrada>): string {
  const clave = String(id);
  for (const l of llamadas) {
    if (!l.hecha || !(l.nombre in TIPO_DE)) continue;
    const lineas = l.resultado.split("\n");
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      const busqueda = LINEA_BUSQUEDA.exec(linea);
      if (busqueda?.[1] === clave) return `${busqueda[2]} · ${busqueda[3].trim() || "Sin título"}`;
      // getDiary: id=12 / date=… / title=…
      if (linea === `id=${clave}` && lineas[i + 1]?.startsWith("date=") && lineas[i + 2]?.startsWith("title=")) return `${lineas[i + 1].slice(5)} · ${lineas[i + 2].slice(6)}`;
      const creada = LINEA_CREADA.exec(linea);
      if (creada?.[3] === clave) return `${creada[2]} · ${creada[1]}`;
      const otra = LINEA_OTRA.exec(linea);
      if (otra?.[2] === clave) return otra[1];
    }
  }
  return `Entrada ${id}`;
}

