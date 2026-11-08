// Diario (lane 290): enlaces entre entradas. Reglas puras: sin base, sin red, sin ProseMirror.
// Portado de vendor/moodiary/editor/src/core/editor/nodes/diary-link.ts y de `_applyLinks` / `getBacklinks` / `getForwardLinks`
// de vendor/moodiary/packages/feature_base/moodiary_data/lib/src/diary_repository.dart (ZhuJHua/moodiary@2c552dd).
import type { NodoDoc } from "./contenido.ts";

/** Entradas distintas que puede enlazar una sola entrada (la tabla de enlaces no crece sin límite). */
export const MAX_ENLACES_POR_ENTRADA = 100;
/** Candidatas que ofrece la lista al escribir `[[`. */
export const MAX_CANDIDATAS_ENLACE = 8;
/** Enlaces salientes y entrantes que muestra el panel. */
export const MAX_ENLACES_PANEL = 50;

const LARGO_ROTULO = 40;

/** Un resultado de la lista de `[[`: el `id` y el `label` son lo que queda en el documento. */
export interface CandidatoEnlace {
  id: string;
  label: string;
  /** Fecha de la entrada ("YYYY-MM-DD"), para distinguir entradas con el mismo título. */
  detalle: string;
}

/** Una entrada vista desde el panel de enlaces. */
export interface ResumenEnlace {
  id: number;
  fecha: string;
  rotulo: string;
}

/** El rótulo del enlace: el título o, si no tiene, la primera línea con texto (cortada). */
export function rotuloDeEntrada(titulo: string | null | undefined, texto: string): string {
  const t = titulo?.replace(/\s+/g, " ").trim();
  if (t) return t.length > LARGO_ROTULO ? `${t.slice(0, LARGO_ROTULO).trimEnd()}…` : t;
  const linea = texto
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .find(Boolean);
  if (!linea) return "Entrada sin texto";
  return linea.length > LARGO_ROTULO ? `${linea.slice(0, LARGO_ROTULO).trimEnd()}…` : linea;
}

/** moodiary `DiaryContent.links`: los ids enlazados en el documento, sin repetir y en orden de aparición. Sin el de la propia entrada. */
export function idsDeEnlaces(doc: NodoDoc, propio: number | null = null): number[] {
  const vistos = new Set<number>();
  const recorrer = (n: NodoDoc) => {
    if (n.type === "diaryLink") {
      const id = Number(n.attrs?.id);
      if (Number.isSafeInteger(id) && id > 0 && id !== propio) vistos.add(id);
    }
    n.content?.forEach(recorrer);
  };
  recorrer(doc);
  return [...vistos].slice(0, MAX_ENLACES_POR_ENTRADA);
}
