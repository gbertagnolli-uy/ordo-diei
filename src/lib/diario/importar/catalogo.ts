// Diario (lane 292): el catálogo (categorías de etiquetas, etiquetas y categorías de entrada) que pide un paquete.
// Es la parte de `ImportWriter._categoryId` / `_tagId` de vendor/Daily_You/lib/utils/imports/import_writer.dart (Demizo/Daily_You@7cc237d) que no toca la base.
import { MAX_PROFUNDIDAD_CATEGORIA } from "../etiquetas.ts";
import type { CategoriaImport, EtiquetaDefImport, GrupoImport, PaqueteImport } from "./tipos.ts";

export interface CatalogoImport {
  grupos: GrupoImport[];
  etiquetas: EtiquetaDefImport[];
  categorias: CategoriaImport[];
}

/** Las etiquetas y los contadores se distinguen: «Agua» puede ser las dos cosas. Sin mayúsculas, como `_tagKey` de Daily You. */
export const claveEtiqueta = (tipo: "etiqueta" | "contador", nombre: string) => `${tipo}:${nombre.trim().toLowerCase()}`;
export const claveNombre = (nombre: string) => nombre.trim().toLowerCase();

/** «Fe › Misa» → ["Fe", "Misa"]. Más de `MAX_PROFUNDIDAD_CATEGORIA` niveles se juntan en el último. */
export function partesDeCamino(camino: string): string[] {
  const partes = camino
    .split("›")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (partes.length <= MAX_PROFUNDIDAD_CATEGORIA) return partes;
  return [...partes.slice(0, MAX_PROFUNDIDAD_CATEGORIA - 1), partes.slice(MAX_PROFUNDIDAD_CATEGORIA - 1).join(" - ")];
}

/** Lo definido por el archivo más lo que usan las entradas sin haberlo definido (Markdown, Daylio…), sin repetir. */
export function catalogoDelPaquete(p: PaqueteImport): CatalogoImport {
  const grupos = new Map<string, GrupoImport>();
  for (const g of p.grupos) if (!grupos.has(claveNombre(g.nombre))) grupos.set(claveNombre(g.nombre), g);
  const etiquetas = new Map<string, EtiquetaDefImport>();
  for (const t of p.etiquetas) {
    const k = claveEtiqueta(t.tipo, t.nombre);
    if (!etiquetas.has(k)) etiquetas.set(k, t);
    if (t.grupo && !grupos.has(claveNombre(t.grupo))) grupos.set(claveNombre(t.grupo), { nombre: t.grupo, icono: null, tipoIcono: "emoji", color: null, seleccionUnica: false });
  }
  const categorias = new Map<string, CategoriaImport>();
  for (const c of p.categorias) {
    const camino = partesDeCamino(c.camino).join(" › ");
    if (camino && !categorias.has(claveNombre(camino))) categorias.set(claveNombre(camino), { camino, color: c.color });
  }
  for (const e of p.entradas) {
    for (const t of e.etiquetas) {
      const k = claveEtiqueta(t.tipo, t.nombre);
      if (!etiquetas.has(k)) etiquetas.set(k, { nombre: t.nombre, tipo: t.tipo, grupo: null, icono: null, tipoIcono: "emoji", color: null });
    }
    const camino = e.categoria ? partesDeCamino(e.categoria).join(" › ") : "";
    if (camino && !categorias.has(claveNombre(camino))) categorias.set(claveNombre(camino), { camino, color: null });
  }
  return { grupos: [...grupos.values()], etiquetas: [...etiquetas.values()], categorias: [...categorias.values()] };
}
