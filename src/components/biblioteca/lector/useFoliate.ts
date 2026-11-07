"use client";
// Portado de vendor/bookorbit (bookorbit/bookorbit@6ad1445), traduciendo Vue → React:
// - client/src/features/reader/epub/composables/useFoliate.ts (abrir el libro, índice, navegación)
// - client/src/features/reader/epub/composables/useFoliateInput.ts (zonas de toque y swipe)
// Se usa foliate-js tal cual lo sirve bookorbit en public/assets/foliate (ver public/lector/foliate/ORIGEN.md).
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { aplanarIndice, cssLector, porcentajeDeFraccion, zonaDeToque, type CapituloLector, type TemaLector } from "@/lib/biblioteca/lector";

type DetalleUbicacion = {
  cfi?: string | null;
  fraction?: number;
  tocItem?: { label?: string; href?: string } | null;
};

type VistaFoliate = HTMLElement & {
  open: (file: File) => Promise<void>;
  goTo: (target: string | number) => Promise<unknown>;
  goToFraction?: (fraccion: number) => Promise<unknown>;
  next: () => Promise<unknown>;
  prev: () => Promise<unknown>;
  destroy?: () => void;
  renderer?: {
    setStyles?: (css: string) => void;
    setAttribute?: (nombre: string, valor: string) => void;
    removeAttribute?: (nombre: string) => void;
  };
  book?: { toc?: unknown[] };
};

const RUTA_SCRIPT = "/lector/foliate/view.js";
const SWIPE_MINIMO = 50;
const MOVIMIENTO_TAP = 10;
const DURACION_TAP = 500;

let carga: Promise<void> | null = null;

/** Carga (una sola vez) el componente <foliate-view> desde public/lector/foliate. */
function cargarFoliate(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("El lector necesita el navegador"));
  if (customElements.get("foliate-view")) return Promise.resolve();
  if (!carga) {
    carga = new Promise<void>((resolver, rechazar) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = RUTA_SCRIPT;
      script.onload = () => {
        customElements.whenDefined("foliate-view").then(() => resolver(), rechazar);
      };
      script.onerror = () => {
        carga = null;
        script.remove();
        rechazar(new Error("No se pudo cargar el motor del lector"));
      };
      document.head.appendChild(script);
    });
  }
  return carga;
}

function estaSeleccionando(doc: Document): boolean {
  const seleccion = doc.defaultView?.getSelection();
  return !!seleccion && !seleccion.isCollapsed && seleccion.rangeCount > 0;
}

/** Toca un enlace del libro: no debe pasar de página ni ocultar la UI. */
function tocaEnlace(doc: Document, objetivo: EventTarget | null): boolean {
  const el = objetivo as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest("a, button, input, select, textarea, label");
}

export type OpcionesLector = {
  contenedor: RefObject<HTMLDivElement | null>;
  url: string;
  cfiInicial?: string | null;
  tamano: number;
  tema: TemaLector;
  /** Cada cambio de página, con el CFI (si lo hay) y el porcentaje 0–100 de todo el libro. */
  alMover?: (cfi: string | null, porcentaje: number) => void;
  /** Toque en el centro del libro: mostrar u ocultar la UI. */
  alAlternarUi?: () => void;
};

export type ResultadoLector = {
  estado: "cargando" | "listo" | "error";
  error: string;
  porcentaje: number;
  capitulo: string | null;
  capitulos: CapituloLector[];
  siguiente: () => void;
  anterior: () => void;
  irA: (href: string) => void;
  irAFraccion: (fraccion: number) => void;
  reintentar: () => void;
};

export function useFoliate({ contenedor, url, cfiInicial, tamano, tema, alMover, alAlternarUi }: OpcionesLector): ResultadoLector {
  const vistaRef = useRef<VistaFoliate | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [error, setError] = useState("");
  const [porcentaje, setPorcentaje] = useState(0);
  const [capitulo, setCapitulo] = useState<string | null>(null);
  const [capitulos, setCapitulos] = useState<CapituloLector[]>([]);
  const [intento, setIntento] = useState(0);

  const alMoverRef = useRef(alMover);
  const alAlternarUiRef = useRef(alAlternarUi);
  const tamanoRef = useRef(tamano);
  const temaRef = useRef(tema);
  useEffect(() => {
    alMoverRef.current = alMover;
    alAlternarUiRef.current = alAlternarUi;
    tamanoRef.current = tamano;
    temaRef.current = tema;
  }, [alMover, alAlternarUi, tamano, tema]);

  useEffect(() => {
    const zona = contenedor.current;
    if (!zona) return;
    let vivo = true;
    let vista: VistaFoliate | null = null;
    const limpiezas: Array<() => void> = [];

    setEstado("cargando");
    setError("");

    const aplicarEstilos = () => {
      const r = vista?.renderer;
      if (!r) return;
      // Los atributos son los que entiende <foliate-paginator> (ver public/lector/foliate/paginator.js).
      r.setAttribute?.("max-column-count", "2");
      r.setAttribute?.("gap", "5%");
      r.setAttribute?.("max-inline-size", "720px");
      r.setAttribute?.("max-block-size", "1440px");
      r.setAttribute?.("margin", "40px");
      r.setAttribute?.("flow", "paginated");
      r.setStyles?.(cssLector(tamanoRef.current, temaRef.current));
    };

    const irSiguiente = () => void vista?.next();
    const irAnterior = () => void vista?.prev();
    const anchoLector = () => zona.getBoundingClientRect().width || window.innerWidth;

    const manejarToque = (x: number) => {
      const donde = zonaDeToque(x, anchoLector());
      if (donde === "centro") alAlternarUiRef.current?.();
      else if (donde === "anterior") irAnterior();
      else irSiguiente();
    };

    /** Engancha toques y clics dentro del iframe de cada capítulo (bookorbit: attachIframeClicks). */
    const conectarGestos = (doc: Document) => {
      let inicio: { x: number; y: number; t: number } | null = null;
      let ultimoToque = 0;
      let cancelado = false;

      const xEnPantalla = (x: number) => {
        const marco = doc.defaultView?.frameElement as HTMLElement | null;
        return (marco?.getBoundingClientRect().left ?? 0) + x;
      };

      const alClic = (e: MouseEvent) => {
        if (cancelado || Date.now() - ultimoToque < 500) return;
        if (tocaEnlace(doc, e.target) || estaSeleccionando(doc)) return;
        manejarToque(xEnPantalla(e.clientX));
      };

      const alTouchStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        if (!t) return;
        inicio = { x: t.clientX, y: t.clientY, t: Date.now() };
      };

      const alTouchEnd = (e: TouchEvent) => {
        if (!inicio || e.changedTouches.length !== 1) return;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - inicio.x;
        const dy = t.clientY - inicio.y;
        const duracion = Date.now() - inicio.t;
        ultimoToque = Date.now();
        const seleccion = estaSeleccionando(doc);
        inicio = null;
        if (seleccion || tocaEnlace(doc, e.target)) return;
        if (Math.abs(dx) >= SWIPE_MINIMO && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) irSiguiente();
          else irAnterior();
          return;
        }
        if (duracion < DURACION_TAP && Math.abs(dx) < MOVIMIENTO_TAP && Math.abs(dy) < MOVIMIENTO_TAP) {
          manejarToque(xEnPantalla(t.clientX));
        }
      };

      // Con el foco dentro del libro, las flechas y Escape no llegan a la ventana de la app.
      const alTecla = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          irAnterior();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          irSiguiente();
        } else if (e.key === "Escape") {
          // En pantalla completa, Escape la maneja el navegador para salir.
          if (document.fullscreenElement) return;
          e.preventDefault();
          alAlternarUiRef.current?.();
        }
      };

      doc.addEventListener("click", alClic, true);
      doc.addEventListener("touchstart", alTouchStart, { passive: true });
      doc.addEventListener("touchend", alTouchEnd, { passive: true });
      doc.addEventListener("keydown", alTecla);
      return () => {
        cancelado = true;
        doc.removeEventListener("click", alClic, true);
        doc.removeEventListener("touchstart", alTouchStart);
        doc.removeEventListener("touchend", alTouchEnd);
        doc.removeEventListener("keydown", alTecla);
      };
    };

    // En los márgenes (fuera del iframe) el clic llega al <foliate-view>: también cuenta como toque.
    const alClicMargen = (e: MouseEvent) => {
      const objetivo = e.target as HTMLElement | null;
      if (!objetivo || objetivo.closest("button, a, input, label, [data-ui]")) return;
      if (objetivo.tagName !== "FOLIATE-VIEW" && objetivo !== zona) return;
      manejarToque(e.clientX);
    };
    zona.addEventListener("click", alClicMargen);
    limpiezas.push(() => zona.removeEventListener("click", alClicMargen));

    (async () => {
      try {
        await cargarFoliate();
        if (!vivo) return;
        vista = document.createElement("foliate-view") as VistaFoliate;
        vista.style.cssText = "width:100%;height:100%;display:block;";
        zona.replaceChildren(vista);
        vistaRef.current = vista;

        vista.addEventListener("load", (evento) => {
          const doc = (evento as CustomEvent<{ doc?: Document }>).detail?.doc;
          aplicarEstilos();
          if (!doc) return;
          // Cada capítulo trae su propio documento: se limpia el anterior y se engancha el nuevo.
          limpiezas.splice(1).forEach((fn) => fn());
          limpiezas.push(conectarGestos(doc));
        });

        vista.addEventListener("relocate", (evento) => {
          const detalle = (evento as CustomEvent<DetalleUbicacion>).detail;
          const pct = porcentajeDeFraccion(detalle?.fraction);
          setPorcentaje(pct);
          if (detalle?.tocItem?.label) setCapitulo(detalle.tocItem.label.trim());
          alMoverRef.current?.(detalle?.cfi ?? null, pct);
        });

        vista.addEventListener("error", (evento) => {
          const detalle = (evento as unknown as CustomEvent<{ message?: string }>).detail;
          setError(detalle?.message || "No se pudo abrir el libro");
          setEstado("error");
        });

        const res = await fetch(url);
        if (!res.ok) throw new Error("No se pudo descargar el libro");
        const blob = await res.blob();
        if (!vivo) return;
        const archivo = new File([blob], "libro.epub", { type: "application/epub+zip" });
        await vista.open(archivo);
        if (!vivo) return;
        aplicarEstilos();

        // Retoma el CFI guardado; si el libro cambió y ya no existe, abre al principio.
        const destino = cfiInicial && cfiInicial.trim() ? cfiInicial : 0;
        const ubicado = await vista.goTo(destino).catch(() => undefined);
        if (!ubicado && destino !== 0) await vista.goTo(0).catch(() => undefined);

        const indice = (vista.book?.toc ?? []) as Array<{ label?: string; href?: string; subitems?: unknown }>;
        if (vivo) setCapitulos(aplanarIndice(indice));
        if (vivo) setEstado("listo");
      } catch (e) {
        if (!vivo) return;
        setError(e instanceof Error && e.message ? e.message : "No se pudo abrir el libro");
        setEstado("error");
      }
    })();

    return () => {
      vivo = false;
      limpiezas.forEach((fn) => fn());
      vista?.destroy?.();
      vista?.remove();
      vistaRef.current = null;
    };
  }, [contenedor, url, cfiInicial, intento]);

  // El tamaño de letra y el tema se aplican sin volver a abrir el libro.
  useEffect(() => {
    vistaRef.current?.renderer?.setStyles?.(cssLector(tamano, tema));
  }, [tamano, tema]);

  const siguiente = useCallback(() => void vistaRef.current?.next(), []);
  const anterior = useCallback(() => void vistaRef.current?.prev(), []);
  const irA = useCallback((href: string) => void vistaRef.current?.goTo(href), []);
  const irAFraccion = useCallback((fraccion: number) => void vistaRef.current?.goToFraction?.(fraccion), []);
  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { estado, error, porcentaje, capitulo, capitulos, siguiente, anterior, irA, irAFraccion, reintentar };
}
