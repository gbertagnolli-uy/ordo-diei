// Diario (lane 292): lo que producen los lectores de cada formato. Es la versión web de `ImportBundle` de Daily You
// (vendor/Daily_You/lib/utils/imports/import_bundle.dart, Demizo/Daily_You@7cc237d).
import type { NodoDoc } from "../contenido.ts";

/** Los archivos de lo que se abrió (un ZIP ya descomprimido o un solo archivo), por ruta con `/`. */
export type Archivos = Map<string, Uint8Array>;

export type FormatoImport = "ordo-json" | "daily-you-json" | "markdown" | "daylio" | "daybook" | "diaro" | "mybrain" | "oneshot" | "pixels";

export const NOMBRES_FORMATO: Record<FormatoImport, string> = {
  "ordo-json": "Respaldo de Ordo Diei (JSON)",
  "daily-you-json": "Daily You (JSON)",
  markdown: "Markdown",
  daylio: "Daylio",
  daybook: "Daybook",
  diaro: "Diaro",
  mybrain: "MyBrain",
  oneshot: "OneShot",
  pixels: "Pixels",
};

export type TipoIconoImport = "emoji" | "icono";

export interface GrupoImport {
  nombre: string;
  icono: string | null;
  tipoIcono: TipoIconoImport;
  color: string | null;
  seleccionUnica: boolean;
}

export interface EtiquetaDefImport {
  nombre: string;
  tipo: "etiqueta" | "contador";
  grupo: string | null;
  icono: string | null;
  tipoIcono: TipoIconoImport;
  color: string | null;
}

export interface CategoriaImport {
  /** «Fe › Misa»: la categoría con sus madres. */
  camino: string;
  color: string | null;
}

export interface EtiquetaPuestaImport {
  nombre: string;
  tipo: "etiqueta" | "contador";
  valor: string | null;
}

/**
 * Cuándo se escribió. `fecha`/`hora` son hora de pared (la que vio quien escribió); `instante` es un momento exacto (ISO con zona)
 * que el servidor pasa a la zona de la familia. Si trae los dos, manda `fecha`/`hora` para el día y `instante` para la hora de creación.
 */
export interface MomentoImport {
  fecha: string | null;
  hora: number | null;
  instante: string | null;
}

export interface EntradaImport extends MomentoImport {
  titulo: string | null;
  /** Cuerpo en Markdown. Si `contenido` viene, es el documento y este es solo el respaldo en texto. */
  markdown: string;
  contenido: NodoDoc | null;
  animo: number | null;
  categoria: string | null;
  etiquetas: EtiquetaPuestaImport[];
  favorita: boolean;
  fijada: boolean;
  /** Rutas dentro de `Archivos` de las fotos de la entrada. */
  fotos: string[];
  /**
   * Archivos que el cuerpo (o el documento) usa: imágenes y, desde la lane 294, audios, videos y documentos. En el texto aparecen como
   * `imagen://N` (imágenes y bloques del documento) o como un enlace a `MARCADOR_ARCHIVO` + N (documentos en Markdown), con N = posición en esta lista.
   */
  imagenes: string[];
  /** Lane 294. Audios y videos que la app de origen guarda aparte del texto (Daily You): pasan al final del documento como bloques. */
  adjuntos: string[];
}

export interface PaqueteImport {
  formato: FormatoImport;
  grupos: GrupoImport[];
  etiquetas: EtiquetaDefImport[];
  categorias: CategoriaImport[];
  entradas: EntradaImport[];
  /** Fotos que el archivo nombra y no estaban. */
  fotosFaltantes: number;
  avisos: string[];
}

/** El marcador de la imagen N de `EntradaImport.imagenes` en el Markdown o en el documento. */
export const MARCADOR_IMAGEN = "imagen://";
/**
 * Lane 294: el marcador del archivo N (audio, video o documento) en un enlace de Markdown. Es una dirección https (válida para el editor) de un dominio
 * que no existe; el documento la cambia por el bloque con el archivo ya subido.
 */
export const MARCADOR_ARCHIVO = "https://ordo-diei.invalid/archivo/";

export const paqueteVacio = (formato: FormatoImport): PaqueteImport => ({ formato, grupos: [], etiquetas: [], categorias: [], entradas: [], fotosFaltantes: 0, avisos: [] });

export const entradaBase = (m: Partial<EntradaImport> = {}): EntradaImport => ({
  fecha: null,
  hora: null,
  instante: null,
  titulo: null,
  markdown: "",
  contenido: null,
  animo: null,
  categoria: null,
  etiquetas: [],
  favorita: false,
  fijada: false,
  fotos: [],
  imagenes: [],
  adjuntos: [],
  ...m,
});

/** Un archivo que no es del formato: el lector lanza esto y la interfaz muestra el mensaje. */
export class ImportacionError extends Error {}
