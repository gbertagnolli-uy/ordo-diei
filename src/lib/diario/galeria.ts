// Diario (lane 293): reglas puras de la galería — entradas con fotos en una grilla, con búsqueda, etiquetas y orden. Sin base ni red, con tests.
// Portado de vendor/Daily_You/lib/pages/gallery_page.dart (Demizo/Daily_You@7cc237d): tarjeta grande (500 px, relación 2) con la lista o con texto buscado,
// tarjeta chica (300 px, relación 1) en la grilla, opción «ocultar fotos en la galería», cuenta de resultados y botón de subir pasados 500 px.
import { FILTRO_VACIO, type FiltroBusqueda } from "./busqueda.ts";
import { imagenesDe, type NodoDoc } from "./contenido.ts";

/** Entradas por página (decisión G4: Daily You las carga todas de la base local; acá hay un servidor). */
export const PAGINA_GALERIA = 48;
/** Daily You `_showScrollToTop`: el botón de subir aparece pasados 500 px. */
export const PX_PARA_SUBIR = 500;
/** Fotos que se ven además de la portada en una tarjeta grande. */
export const MINIATURAS_GRANDE = 3;

export type ModoGaleria = "grilla" | "lista";

export interface OpcionesGaleria {
  modo: ModoGaleria;
  /** Daily You `hideImagesInGallery`, al revés: con `false` la galería muestra las tarjetas sin fotos. */
  mostrarFotos: boolean;
}

export const OPCIONES_GALERIA: OpcionesGaleria = { modo: "grilla", mostrarFotos: true };

export const esOpcionesGaleria = (v: unknown): v is OpcionesGaleria => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (o.modo === "grilla" || o.modo === "lista") && typeof o.mostrarFotos === "boolean";
};

/** Todas las fotos de la entrada: las adjuntas y las que están dentro del texto, sin repetir y en ese orden. */
export const fotosDeEntrada = (e: { fotos: string[]; contenido: NodoDoc | null }): string[] => [...new Set([...e.fotos, ...(e.contenido ? imagenesDe(e.contenido) : [])])];

/** Daily You: tarjeta grande en el modo lista o mientras se busca un texto. */
export const tarjetaGrande = (o: OpcionesGaleria, consulta: string): boolean => o.modo === "lista" || consulta.trim().length > 0;

/** El filtro de la galería: el de la búsqueda, solo entradas con fotos, desde el principio y con la página de la galería. */
export const filtroDeGaleria = (f: FiltroBusqueda): FiltroBusqueda => ({ ...f, soloFotos: true, desplazamiento: 0, limite: PAGINA_GALERIA });

/** El filtro vacío de la galería (se ordena por fecha, de la más nueva a la más vieja). */
export const FILTRO_GALERIA: FiltroBusqueda = filtroDeGaleria(FILTRO_VACIO);

export interface FotosDeTarjeta {
  portada: string | null;
  /** Miniaturas debajo de la portada (solo en la tarjeta grande). */
  miniaturas: string[];
  /** Cuántas fotos más tiene la entrada y no se ven. */
  restantes: number;
}

/** Qué fotos muestra una tarjeta. Con `mostrarFotos` en falso no muestra ninguna. */
export function fotosDeTarjeta(fotos: string[], grande: boolean, mostrarFotos: boolean): FotosDeTarjeta {
  if (!mostrarFotos || fotos.length === 0) return { portada: null, miniaturas: [], restantes: 0 };
  const miniaturas = grande ? fotos.slice(1, 1 + MINIATURAS_GRANDE) : [];
  return { portada: fotos[0], miniaturas, restantes: fotos.length - 1 - miniaturas.length };
}

/** «1 entrada con fotos» / «12 entradas con fotos». */
export const cuentaDeGaleria = (n: number): string => `${n.toLocaleString("es-UY")} ${n === 1 ? "entrada con fotos" : "entradas con fotos"}`;

/** Daily You `showScrollToTop`: ¿se pasó de los 500 px? */
export const mostrarSubir = (desplazamiento: number): boolean => desplazamiento > PX_PARA_SUBIR;
