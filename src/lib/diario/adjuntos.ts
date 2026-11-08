// Diario (lane 294): reglas puras de adjuntos, notas de voz y visor de fotos. Sin base, sin red, sin DOM. Con tests.
// Portado de vendor/Daily_You/lib/utils/{attachment_mime,attachment_file_name}.dart, lib/pages/audio_recorder_page.dart, lib/widgets/{zoomable_attachment_page_view,
// audio_waveform_decoration}.dart (Demizo/Daily_You@7cc237d) y de vendor/moodiary/editor/src/core/editor/media.ts, src/ui/hooks/use-media.ts (ZhuJHua/moodiary@2c552dd):
// tipo MIME por extensión, nombre de archivo sin caracteres prohibidos ni nombres reservados, tamaño legible, tiempo m:ss, reglas de la grabadora
// (mínimo 1 s, confirmar el descarte pasados 3 s, calidad alta / media / baja), onda con semilla y la cuenta del zoom del visor (1× a 10×, doble toque a 2×).
import { generador } from "./recuerdos.ts";

/** Vercel corta el cuerpo de un pedido en 4,5 MB: los archivos más grandes esperan a la lane 277 fase B (almacén de objetos). */
export const MAX_BYTES_ADJUNTO = 4 * 1024 * 1024;

export type CategoriaAdjunto = "audio" | "video" | "documento";

export interface TipoAdjunto {
  /** Tipo con el que se guarda y se sirve. */
  mime: string;
  categoria: CategoriaAdjunto;
}

const AUDIO: Record<string, string> = {
  // «.weba» es el audio de WebM: así un .webm de audio no se confunde con un video al volver a importarlo
  weba: "audio/webm",
  webm: "audio/webm",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  m4a: "audio/mp4",
  m4b: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  amr: "audio/amr",
};

const VIDEO: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  "3gp": "video/3gpp",
  webm: "video/webm",
};

const DOCUMENTO: Record<string, string> = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  mobi: "application/x-mobipocket-ebook",
  azw: "application/vnd.amazon.ebook",
  azw3: "application/vnd.amazon.mobi8-ebook",
  cbz: "application/vnd.comicbook+zip",
  fb2: "application/x-fictionbook+xml",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  markdown: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  rtf: "application/rtf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/** Lo que manda el navegador como `file.type` -> el tipo con el que se guarda. */
const MIME_ADMITIDO: Record<string, TipoAdjunto> = {
  ...Object.fromEntries(Object.values(AUDIO).map((m) => [m, { mime: m, categoria: "audio" as const }])),
  ...Object.fromEntries(Object.values(VIDEO).map((m) => [m, { mime: m, categoria: "video" as const }])),
  ...Object.fromEntries(Object.values(DOCUMENTO).map((m) => [m.split(";")[0], { mime: m, categoria: "documento" as const }])),
  "audio/mp3": { mime: "audio/mpeg", categoria: "audio" },
  "audio/x-wav": { mime: "audio/wav", categoria: "audio" },
  "audio/wave": { mime: "audio/wav", categoria: "audio" },
  "audio/x-m4a": { mime: "audio/mp4", categoria: "audio" },
  "audio/m4a": { mime: "audio/mp4", categoria: "audio" },
  "audio/x-m4b": { mime: "audio/mp4", categoria: "audio" },
  "audio/x-flac": { mime: "audio/flac", categoria: "audio" },
  "application/x-cbz": { mime: "application/vnd.comicbook+zip", categoria: "documento" },
  "application/x-fb2": { mime: "application/x-fictionbook+xml", categoria: "documento" },
  "text/fb2+xml": { mime: "application/x-fictionbook+xml", categoria: "documento" },
  "application/x-mobi8-ebook": { mime: "application/vnd.amazon.mobi8-ebook", categoria: "documento" },
};

/** Extensión en minúsculas, sin el punto («Foto.JPG» → «jpg»); vacía si no hay. moodiary `fileExtension`. */
export function extensionDe(nombre: string): string {
  const punto = nombre.lastIndexOf(".");
  return punto > 0 && punto < nombre.length - 1 ? nombre.slice(punto + 1).toLowerCase() : "";
}

/**
 * Qué es un archivo que se quiere adjuntar. Se mira primero el tipo que dice el navegador (sin parámetros) y, si no sirve,
 * la extensión (Daily You `attachmentMimeType`). Devuelve `null` si no está en la lista admitida.
 */
export function clasificarAdjunto(nombre: string, mimeDelNavegador: string): TipoAdjunto | null {
  const base = mimeDelNavegador.split(";")[0].trim().toLowerCase();
  const ext = extensionDe(nombre);
  // Una nota de voz de Chrome llega como «video/webm» en algunos navegadores; si se llama .webm y el tipo es de audio gana el tipo
  const porTipo = MIME_ADMITIDO[base];
  if (porTipo) return porTipo;
  if (AUDIO[ext] && !VIDEO[ext]) return { mime: AUDIO[ext], categoria: "audio" };
  if (VIDEO[ext] && !AUDIO[ext]) return { mime: VIDEO[ext], categoria: "video" };
  if (DOCUMENTO[ext]) return { mime: DOCUMENTO[ext], categoria: "documento" };
  // «.mp4» y «.webm» sin tipo claro: video, que es lo habitual
  if (VIDEO[ext]) return { mime: VIDEO[ext], categoria: "video" };
  return null;
}

export const MENSAJE_FORMATO_ADJUNTO = "Formato no permitido. Podés adjuntar audio, un video corto, PDF, libros (ePub, MOBI, AZW, CBZ, FB2), Word, Excel, PowerPoint o texto.";

export type ResultadoAdjunto = { ok: true; tipo: TipoAdjunto } | { ok: false; error: string };

/** Valida tipo y peso antes de subir (el navegador) y antes de guardar (el servidor): la misma regla en los dos lados. */
export function validarAdjunto(nombre: string, mime: string, bytes: number): ResultadoAdjunto {
  const tipo = clasificarAdjunto(nombre, mime);
  if (!tipo) return { ok: false, error: MENSAJE_FORMATO_ADJUNTO };
  if (!Number.isFinite(bytes) || bytes <= 0) return { ok: false, error: "El archivo está vacío" };
  if (bytes > MAX_BYTES_ADJUNTO) return { ok: false, error: `El archivo no puede superar ${formatearTamano(MAX_BYTES_ADJUNTO)}` };
  return { ok: true, tipo };
}

// ── Nombres ──────────────────────────────────────────────────────────────────

const MAX_BYTES_NOMBRE = 100;
const MAX_BYTES_EXTENSION = 16;
// Daily You `_forbiddenCharacters`: controles y los prohibidos de Windows
const PROHIBIDOS = /[\x00-\x1F\x7F"*/:<>?\\|]/g;
const PUNTOS_Y_ESPACIOS = /^[.\s]+|[.\s]+$/g;
const RESERVADOS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const codificador = new TextEncoder();

function cortarEnBytes(texto: string, maximo: number): string {
  let bytes = 0;
  let salida = "";
  for (const c of texto) {
    const n = codificador.encode(c).length;
    if (bytes + n > maximo) break;
    bytes += n;
    salida += c;
  }
  return salida;
}

/** Daily You `sanitizedStem` + `sanitizedExtension`: un nombre que sirve en cualquier sistema de archivos. Sin nombre usable queda «archivo». */
export function nombreSeguro(nombre: string | null | undefined, porDefecto = "archivo"): string {
  const crudo = (nombre ?? "").replace(/^.*[\\/]/, "");
  const punto = crudo.lastIndexOf(".");
  const tieneExt = punto > 0 && punto < crudo.length - 1;
  const cuerpo = tieneExt ? crudo.slice(0, punto) : crudo;
  const ext = tieneExt ? cortarEnBytes(crudo.slice(punto + 1).replace(PROHIBIDOS, "_").replace(PUNTOS_Y_ESPACIOS, ""), MAX_BYTES_EXTENSION) : "";
  let tallo = cortarEnBytes(cuerpo.replace(PROHIBIDOS, "_"), MAX_BYTES_NOMBRE).replace(PUNTOS_Y_ESPACIOS, "");
  if (!tallo) tallo = porDefecto;
  else if (RESERVADOS.test(tallo)) tallo = `_${tallo}`;
  return ext ? `${tallo}.${ext}` : tallo;
}

/** Nombre sin la extensión, para el rótulo de un bloque («Informe.pdf» → «Informe»). */
export const nombreSinExtension = (nombre: string): string => (extensionDe(nombre) ? nombre.slice(0, nombre.lastIndexOf(".")) : nombre);

// ── Formatos ─────────────────────────────────────────────────────────────────

/** moodiary `formatFileSize`: «512 B», «1,5 KB», «12 MB». */
export function formatearTamano(bytes: number | null | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const unidades = ["KB", "MB", "GB"];
  let valor = bytes / 1024;
  let u = 0;
  while (valor >= 1024 && u < unidades.length - 1) {
    valor /= 1024;
    u += 1;
  }
  return `${valor >= 10 ? Math.round(valor) : valor.toFixed(1).replace(".", ",")} ${unidades[u]}`;
}

/** moodiary `formatTime`: «0:07», «12:05», «1:02:03». */
export function formatearTiempo(segundos: number): string {
  const s = Number.isFinite(segundos) && segundos > 0 ? Math.floor(segundos) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${seg}` : `${m}:${seg}`;
}

// ── Grabadora de voz ─────────────────────────────────────────────────────────

/** Daily You `_minimumSaveDuration` y `_confirmDiscardAfter`. */
export const MIN_GRABACION_SEG = 1;
export const CONFIRMAR_DESCARTE_SEG = 3;

export type CalidadVoz = "alta" | "media" | "baja";
/** Daily You `audioQualityBitRateMapping`: bits por segundo de cada calidad. */
export const CALIDADES_VOZ: { valor: CalidadVoz; titulo: string; bps: number }[] = [
  { valor: "alta", titulo: "Alta", bps: 64_000 },
  { valor: "media", titulo: "Media", bps: 32_000 },
  { valor: "baja", titulo: "Baja", bps: 16_000 },
];
export const CALIDAD_VOZ_PREDETERMINADA: CalidadVoz = "media";
export const esCalidadVoz = (v: unknown): v is CalidadVoz => CALIDADES_VOZ.some((c) => c.valor === v);
export const bpsDe = (c: CalidadVoz): number => CALIDADES_VOZ.find((x) => x.valor === c)!.bps;

/** Margen para que el contenedor (webm, mp4) y el cierre no pasen el tope. */
const MARGEN_GRABACION = 0.9;

/** Segundos que se pueden grabar a esa calidad sin pasar el tope de 4 MB. */
export const limiteDeGrabacionSeg = (bps: number): number => Math.floor((MAX_BYTES_ADJUNTO * MARGEN_GRABACION * 8) / bps);

export const puedeGuardarGrabacion = (segundos: number): boolean => segundos >= MIN_GRABACION_SEG;
export const pideConfirmarDescarte = (segundos: number): boolean => segundos >= CONFIRMAR_DESCARTE_SEG;

/** Formatos que el navegador puede grabar, de mejor a peor para este caso (Chrome/Firefox: webm u ogg con opus; Safari: mp4). */
export const MIMES_DE_GRABACION = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];

/** El primero de la lista que el navegador acepta (`MediaRecorder.isTypeSupported`), o `""` para que use el suyo. */
export function elegirMimeDeGrabacion(soportado: (mime: string) => boolean): string {
  return MIMES_DE_GRABACION.find((m) => soportado(m)) ?? "";
}

export const extensionDeGrabacion = (mime: string): string => {
  const base = mime.split(";")[0].trim().toLowerCase();
  return base === "audio/mp4" ? "m4a" : base === "audio/ogg" ? "ogg" : base === "audio/mpeg" ? "mp3" : base === "audio/wav" ? "wav" : "webm";
};

const dos = (n: number) => String(n).padStart(2, "0");

/** «Nota de voz 2026-11-08 08:05». */
export const nombreDeNotaDeVoz = (fecha: string, hora: number): string => `Nota de voz ${fecha} ${dos(Math.floor(hora / 60))}:${dos(hora % 60)}`;

/** Daily You `AudioWaveformDecoration`: barras con semilla que se afinan en los bordes y, mientras se graba, se mueven. */
export function barrasDeOnda(semilla: number, cantidad: number, fase = 0, intensidad = 0): number[] {
  const azar = generador(semilla);
  const azarMovimiento = generador(semilla ^ 0x5bd1e995);
  const afinadas = Math.min(9, Math.floor(cantidad / 2));
  const suave = (t: number) => 1 - (1 - t) * (1 - t); // easeOut
  const salida: number[] = [];
  for (let i = 0; i < cantidad; i++) {
    const borde = Math.min(i, cantidad - 1 - i);
    const afinado = suave(Math.min(1, Math.max(0, (borde + 1) / (afinadas + 1))));
    const altura = (0.2 + azar() * 0.8) * afinado;
    let escala = 1;
    if (intensidad > 0) {
      const ciclos = 1 + Math.floor(azarMovimiento() * 3);
      const desfase = azarMovimiento();
      const onda = 0.5 + 0.5 * Math.sin(2 * Math.PI * (fase * ciclos + desfase));
      const movimiento = 0.4 + (1.3 - 0.4) * onda;
      escala = 1 + (movimiento - 1) * intensidad;
    }
    salida.push(altura * escala);
  }
  return salida;
}

// ── Visor de fotos ───────────────────────────────────────────────────────────

export const ESCALA_MINIMA = 1;
export const ESCALA_MAXIMA = 10;
export const ESCALA_DOBLE_TOQUE = 2;
/** Flutter `kDefaultMouseScrollToScaleFactor`. */
const RUEDA_A_ESCALA = 200;

export interface Tamano {
  w: number;
  h: number;
}
export interface Vista {
  escala: number;
  /** Desplazamiento del centro de la imagen respecto del centro del visor, en píxeles. */
  x: number;
  y: number;
}
export const VISTA_INICIAL: Vista = { escala: ESCALA_MINIMA, x: 0, y: 0 };

/** Cómo entra la imagen en el visor sin deformarse (`BoxFit.contain`). */
export function ajustarAlVisor(imagen: Tamano, visor: Tamano): Tamano {
  if (imagen.w <= 0 || imagen.h <= 0 || visor.w <= 0 || visor.h <= 0) return { w: 0, h: 0 };
  const f = Math.min(visor.w / imagen.w, visor.h / imagen.h);
  return { w: imagen.w * f, h: imagen.h * f };
}

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Daily You `_clampOffset`: la imagen no se despega de los bordes del visor. */
export function limitarDesplazamiento(x: number, y: number, escala: number, ajustada: Tamano, visor: Tamano): { x: number; y: number } {
  const maxX = Math.max(0, (ajustada.w * escala - visor.w) / 2);
  const maxY = Math.max(0, (ajustada.h * escala - visor.h) / 2);
  // «+ 0» evita un -0 cuando no hay recorrido
  return { x: limitar(x, -maxX, maxX) + 0, y: limitar(y, -maxY, maxY) + 0 };
}

/** Daily You `_applyFocalScale`: cambia la escala dejando quieto el punto de la imagen que está bajo `foco` (coordenadas del visor, desde su esquina). */
export function acercarEnFoco(vista: Vista, foco: { x: number; y: number }, nuevaEscala: number, ajustada: Tamano, visor: Tamano, movimientoDelFoco = { x: 0, y: 0 }): Vista {
  const escala = limitar(nuevaEscala, ESCALA_MINIMA, ESCALA_MAXIMA);
  const centro = { x: visor.w / 2, y: visor.h / 2 };
  const focoAnterior = { x: foco.x - movimientoDelFoco.x, y: foco.y - movimientoDelFoco.y };
  const ancla = { x: (focoAnterior.x - centro.x - vista.x) / vista.escala, y: (focoAnterior.y - centro.y - vista.y) / vista.escala };
  const deseado = { x: foco.x - centro.x - ancla.x * escala, y: foco.y - centro.y - ancla.y * escala };
  return { escala, ...limitarDesplazamiento(deseado.x, deseado.y, escala, ajustada, visor) };
}

/** Daily You `_handleDoubleTap`: con zoom vuelve a 1×; sin zoom va a 2×. */
export const escalaDeDobleToque = (escala: number): number => (escala > ESCALA_MINIMA + 0.01 ? ESCALA_MINIMA : ESCALA_DOBLE_TOQUE);

/** Daily You `_handlePointerSignal`: cuánto cambia la escala con una vuelta de la rueda (hacia arriba acerca). */
export const factorDeRueda = (deltaY: number): number => Math.exp(-deltaY / RUEDA_A_ESCALA);

export type Direccion = "izquierda" | "derecha" | "arriba" | "abajo";

/**
 * Daily You `_computeVerdict`: con la imagen más chica que el visor, o ya pegada al borde hacia donde se arrastra, el gesto lo recibe
 * el pasador de fotos («soltar»); si no, mueve la imagen («reclamar»).
 */
export function arrastreMueveLaImagen(direccion: Direccion, vista: Vista, ajustada: Tamano, visor: Tamano): boolean {
  const horizontal = direccion === "izquierda" || direccion === "derecha";
  const ancho = ajustada.w * vista.escala;
  const alto = ajustada.h * vista.escala;
  if ((horizontal ? ancho : alto) <= (horizontal ? visor.w : visor.h) + 0.5) return false;
  const izquierda = visor.w / 2 + vista.x - ancho / 2;
  const derecha = izquierda + ancho;
  const arriba = visor.h / 2 + vista.y - alto / 2;
  const abajo = arriba + alto;
  switch (direccion) {
    case "izquierda":
      return derecha > visor.w + 0.5;
    case "derecha":
      return izquierda < -0.5;
    case "arriba":
      return abajo > visor.h + 0.5;
    case "abajo":
      return arriba < -0.5;
  }
}

/** Foto anterior o siguiente (sin dar la vuelta); devuelve el mismo índice si no hay. */
export const moverFoto = (indice: number, total: number, paso: -1 | 1): number => limitar(indice + paso, 0, Math.max(0, total - 1));

// ── Rangos (Safari y iOS no reproducen audio ni video si el servidor no contesta 206) ─────────────

export interface RangoBytes {
  inicio: number;
  /** Incluido, como en `Content-Range`. */
  fin: number;
}

/**
 * Interpreta `Range: bytes=…` para un archivo de `total` bytes. `null` = sin rango (se manda todo),
 * `"invalido"` = no se puede cumplir (416). Solo admite un rango: si piden varios se manda todo.
 */
export function leerRango(cabecera: string | null | undefined, total: number): RangoBytes | "invalido" | null {
  if (!cabecera) return null;
  const m = /^\s*bytes\s*=\s*(.+)$/i.exec(cabecera);
  if (!m || m[1].includes(",")) return null;
  const partes = /^\s*(\d*)\s*-\s*(\d*)\s*$/.exec(m[1]);
  if (!partes || (partes[1] === "" && partes[2] === "")) return null;
  if (total <= 0) return "invalido";
  if (partes[1] === "") {
    // «-500» = los últimos 500 bytes
    const ultimos = Number(partes[2]);
    if (ultimos <= 0) return "invalido";
    return { inicio: Math.max(0, total - ultimos), fin: total - 1 };
  }
  const inicio = Number(partes[1]);
  if (inicio >= total) return "invalido";
  const fin = partes[2] === "" ? total - 1 : Math.min(Number(partes[2]), total - 1);
  if (fin < inicio) return "invalido";
  return { inicio, fin };
}

/** Para el `accept` del selector de archivos: audio, video y las extensiones de documentos admitidas. */
export const ACEPTAR_ADJUNTOS = ["audio/*", "video/*", ...Object.keys(DOCUMENTO).map((e) => `.${e}`)].join(",");

/** Extensión (sin punto) con la que se guarda un archivo de ese tipo: la primera de las tablas de arriba que lo declara (`audio/mp4` → `m4a`). */
export function extensionDeArchivo(mime: string): string {
  const base = mime.split(";")[0].trim().toLowerCase();
  for (const tabla of [AUDIO, VIDEO, DOCUMENTO]) {
    for (const [ext, m] of Object.entries(tabla)) if (m.split(";")[0] === base) return ext;
  }
  return "bin";
}
