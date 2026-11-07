// Lector de eBook (lane 280). Reglas puras del visor, portadas de bookorbit (bookorbit/bookorbit@6ad1445):
// - zonas de toque y umbrales: client/src/features/reader/epub/composables/useFoliateInput.ts
// - temas de lectura: client/src/features/reader/epub/constants/themes.ts
// - CSS que se inyecta en el libro: client/src/features/reader/epub/composables/useReaderState.ts
// Acá no hay DOM: se prueba con node --test.

/** Dónde cayó un toque sobre el ancho del lector. */
export type ZonaToque = "anterior" | "centro" | "siguiente";

// Mismos porcentajes que bookorbit: el 30 % de cada lado pasa de página; el centro muestra u oculta la UI.
export const ZONA_ANTERIOR = 0.3;
export const ZONA_SIGUIENTE = 0.7;

export function zonaDeToque(x: number, ancho: number): ZonaToque {
  if (!Number.isFinite(x) || !Number.isFinite(ancho) || ancho <= 0) return "centro";
  const fraccion = x / ancho;
  if (fraccion < ZONA_ANTERIOR) return "anterior";
  if (fraccion > ZONA_SIGUIENTE) return "siguiente";
  return "centro";
}

export type TemaLector = "claro" | "sepia" | "oscuro";

export const TEMAS: Record<TemaLector, { etiqueta: string; fondo: string; texto: string; enlace: string; oscuro: boolean }> = {
  claro: { etiqueta: "Claro", fondo: "#ffffff", texto: "#1a1a1a", enlace: "#0066cc", oscuro: false },
  sepia: { etiqueta: "Sepia", fondo: "#f1e8d0", texto: "#5b4636", enlace: "#007a7a", oscuro: false },
  oscuro: { etiqueta: "Oscuro", fondo: "#222222", texto: "#e0e0e0", enlace: "#77bbee", oscuro: true },
};

export const TAMANO_MIN = 14;
export const TAMANO_MAX = 26;
export const TAMANO_INICIAL = 18;

export function limitarTamano(n: number): number {
  if (!Number.isFinite(n)) return TAMANO_INICIAL;
  return Math.max(TAMANO_MIN, Math.min(TAMANO_MAX, Math.round(n)));
}

/** epub.js y foliate dan la fracción 0–1; la base guarda 0–100 con un decimal. */
export function porcentajeDeFraccion(fraccion: number | null | undefined): number {
  if (typeof fraccion !== "number" || !Number.isFinite(fraccion)) return 0;
  return Math.round(Math.max(0, Math.min(1, fraccion)) * 1000) / 10;
}

/**
 * CSS que se aplica al libro dentro de su iframe. Es la parte de `generateCSS()` de bookorbit que
 * nos sirve: tamaño, colores, párrafos y medios; sin tipografías ni espaciados configurables.
 */
export function cssLector(tamano: number, tema: TemaLector): string {
  const t = TEMAS[tema];
  const px = limitarTamano(tamano);
  return `
    @namespace epub "http://www.idpf.org/2007/ops";
    html {
      color-scheme: ${t.oscuro ? "dark" : "light"};
      color: ${t.texto} !important;
      background: ${t.fondo} !important;
      font-size: ${px}px !important;
      line-height: 1.6 !important;
      orphans: 2;
      widows: 2;
    }
    body {
      color: ${t.texto} !important;
      background: ${t.fondo} !important;
    }
    a:any-link {
      color: ${t.enlace} !important;
      text-underline-offset: 0.1em;
    }
    aside[epub|type~="footnote"] { display: none; }
    p { margin-block: 0 0.8em !important; }
    p, li, blockquote, dd { text-align: justify; hyphens: auto; }
    :is(hgroup, header) p { text-align: unset; hyphens: unset; }
    h1, h2, h3, h4, h5, h6, hgroup, th { text-wrap: balance; }
    pre { white-space: pre-wrap !important; tab-size: 2; }
    img, svg, video { max-width: 100% !important; height: auto !important; }
    @media print {
      html { column-width: auto !important; height: auto !important; width: auto !important; }
    }
  `;
}

/** Aplana el índice del libro (label/href/subitems) a una lista con nivel de anidado. */
export type CapituloLector = { etiqueta: string; href: string; nivel: number };

export function aplanarIndice(
  items: ReadonlyArray<{ label?: string; href?: string; subitems?: unknown }> | null | undefined,
  nivel = 0,
): CapituloLector[] {
  if (!Array.isArray(items)) return [];
  const salida: CapituloLector[] = [];
  for (const item of items) {
    if (!item || typeof item.href !== "string" || !item.href) continue;
    salida.push({ etiqueta: typeof item.label === "string" && item.label.trim() ? item.label.trim() : item.href, href: item.href, nivel });
    salida.push(...aplanarIndice(item.subitems as ReadonlyArray<{ label?: string; href?: string; subitems?: unknown }> | undefined, nivel + 1));
  }
  return salida;
}
