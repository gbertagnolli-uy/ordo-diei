// Diario (lane 295): los colores del grafo, tomados del tema (variables CSS) y recalculados cuando cambia entre claro y oscuro.
// Portado de `GraphPalette` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/graph_style.dart, ZhuJHua/moodiary@2c552dd).
import { useSyncExternalStore } from "react";
import { colorDeCategoria, colorPorFecha, leerColor, type Rgba } from "@/lib/diario/grafo-color";
import { fraccionesDeFecha, type DatosGrafo, type ModoColorGrafo } from "@/lib/diario/grafo";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";

export interface PaletaGrafo {
  oscuro: boolean;
  fondo: Rgba;
  primerPlano: Rgba;
  /** El color de los nodos sin categoría y de los seleccionados cuando no hay otro. */
  base: Rgba;
  punto: Rgba;
  foco: Rgba;
  /** Solo con tema oscuro. */
  vineta: Rgba | null;
  etiqueta: Rgba;
  halo: Rgba;
  saliente: Rgba;
  entrante: Rgba;
}

/** El color de las flechas: más tenue cuando el grafo tiene muchos enlaces (`GraphPalette.of`: más de 3.000). */
export function colorDeArista(p: PaletaGrafo, cantidad: number): Rgba {
  const denso = cantidad > 3000;
  const alfa = denso ? (p.oscuro ? 0.08 : 0.09) : p.oscuro ? 0.16 : 0.18;
  return [p.primerPlano[0], p.primerPlano[1], p.primerPlano[2], alfa];
}

const RESPALDO: PaletaGrafo = {
  oscuro: false,
  fondo: [251, 249, 245, 1],
  primerPlano: [44, 24, 16, 1],
  base: [80, 35, 0, 1],
  punto: [44, 24, 16, 0.045],
  foco: [80, 35, 0, 0.045],
  vineta: null,
  etiqueta: [44, 24, 16, 0.88],
  halo: [251, 249, 245, 1],
  saliente: [80, 35, 0, 1],
  entrante: [45, 106, 46, 1],
};

function calcular(): PaletaGrafo {
  if (typeof document === "undefined" || !document.body) return RESPALDO;
  const sonda = document.createElement("span");
  sonda.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
  document.body.appendChild(sonda);
  try {
    const leer = (css: string, respaldo: Rgba): Rgba => {
      sonda.style.color = "";
      sonda.style.color = css;
      return sonda.style.color ? (leerColor(getComputedStyle(sonda).color) ?? respaldo) : respaldo;
    };
    const oscuro = document.documentElement.classList.contains("dark");
    const fondo = leer("var(--background)", RESPALDO.fondo);
    const primerPlano = leer("var(--foreground)", RESPALDO.primerPlano);
    const base = leer("var(--primary)", RESPALDO.base);
    return {
      oscuro,
      fondo,
      primerPlano,
      base,
      punto: [primerPlano[0], primerPlano[1], primerPlano[2], oscuro ? 0.055 : 0.045],
      foco: [base[0], base[1], base[2], oscuro ? 0.07 : 0.045],
      vineta: oscuro ? [0, 0, 0, 0.3] : null,
      etiqueta: [primerPlano[0], primerPlano[1], primerPlano[2], oscuro ? 0.9 : 0.88],
      halo: fondo,
      saliente: base,
      entrante: leer("var(--chart-3)", RESPALDO.entrante),
    };
  } finally {
    sonda.remove();
  }
}

let actual: PaletaGrafo | null = null;
const oyentes = new Set<() => void>();
let observador: MutationObserver | null = null;

function suscribir(aviso: () => void): () => void {
  oyentes.add(aviso);
  if (!observador && typeof MutationObserver !== "undefined") {
    observador = new MutationObserver(() => {
      actual = null;
      for (const o of oyentes) o();
    });
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
  }
  return () => {
    oyentes.delete(aviso);
    if (!oyentes.size && observador) {
      observador.disconnect();
      observador = null;
      actual = null;
    }
  };
}

/** La paleta del tema de ahora; se actualiza sola si cambia entre claro y oscuro. `null` mientras se arma en el servidor. */
export function usePaleta(): PaletaGrafo | null {
  return useSyncExternalStore(
    suscribir,
    () => (actual ??= calcular()),
    () => null,
  );
}

/** Un color por nodo, según el modo elegido: la categoría de la entrada, qué tan nueva es, o todos iguales. */
export function coloresDeNodos(datos: DatosGrafo, modo: ModoColorGrafo, catalogo: Catalogo | null, p: PaletaGrafo): Rgba[] {
  if (modo === "ninguno") return datos.nodos.map(() => p.base);
  if (modo === "fecha") return fraccionesDeFecha(datos.nodos).map((t) => colorPorFecha(p.base, t, p.oscuro));
  const porId = new Map((catalogo?.categorias ?? []).map((c) => [c.id, colorDeCategoria(c.color, c.id)]));
  return datos.nodos.map((n) => (n.categoriaId !== null ? (porId.get(n.categoriaId) ?? p.base) : p.base));
}
