// Diario (lane 293): diseño de la tarjeta de imagen de una entrada. Reglas puras: sin canvas, sin red, sin DOM. Con tests.
// Portado de vendor/moodiary/packages/feature/moodiary_export/lib/src/presentation/image_card/{card,card_style,blocks}.dart y de
// .../data/image_composer.dart (ZhuJHua/moodiary@2c552dd): ancho de 360 con 24 de margen, fecha grande + día de la semana y hora, chip de ánimo,
// categoría, etiquetas con «#», título de 22, cuerpo de 16 con interlineado de 1,7, separaciones entre bloques (títulos 22, reglas 19, código/cita/tabla 13, resto 10),
// citas con barra, listas con viñeta / número / casilla, código sobre fondo, reglas con sus variantes, imágenes con su ancho %, tablas con borde,
// marca de agua al pie, claro u oscuro y la escala que baja cuando el contenido es muy alto (`_kDowngradeAboveLogical`).
// La función de diseño recibe cómo medir un texto y el tamaño de las imágenes, y devuelve una lista de comandos con sus posiciones: el canvas solo la ejecuta.
import { extensionDe, formatearTamano } from "./adjuntos.ts";
import { imagenesDe, textoPlanoDe, type NodoDoc } from "./contenido.ts";

// ── Medidas ──────────────────────────────────────────────────────────────────

export const ANCHO_TARJETA = 360;
export const ESCALA_TARJETA = 3;
export const MARGEN_X = 24;
export const MARGEN_SUP = 28;
export const MARGEN_INF = 20;
/** Los navegadores móviles limitan el lienzo (alto y superficie): se baja la escala antes de pasarse. */
export const MAX_ALTO_PX = 16_000;
export const MAX_PIXELES = 16_000_000;
/** Alto lógico (a escala 1) que se dibuja como máximo; lo que sigue se corta con «…». */
export const MAX_ALTO_LOGICO = MAX_ALTO_PX;

const TAM_CUERPO = 16;
const INTERLINEADO_CUERPO = 1.7;
const TAM_TITULO = 22;
const TAM_FECHA = 20;
const TAM_META = 12;
const TAM_CODIGO = 14.08;

/** moodiary `_heading`: 1,7 · 1,45 · 1,25 · 1,1 · 1 · 1 por el cuerpo. */
const ESCALA_TITULO = [1.7, 1.45, 1.25, 1.1, 1, 1];

// ── Estilo ───────────────────────────────────────────────────────────────────

export interface Paleta {
  fondo: string;
  texto: string;
  apagado: string;
  borde: string;
  lineaFina: string;
  acento: string;
  superficieCodigo: string;
  resaltado: string;
  marcador: string;
}

export const PALETA_CLARA: Paleta = {
  fondo: "#FBF9F5",
  texto: "#2B2118",
  apagado: "#6B5D50",
  borde: "#8A7A6A",
  lineaFina: "#E3DCCF",
  acento: "#502300",
  superficieCodigo: "#F1EBE0",
  resaltado: "#F6E3A1",
  marcador: "#EBE4D6",
};

export const PALETA_OSCURA: Paleta = {
  fondo: "#17130F",
  texto: "#F1EBE0",
  apagado: "#B3A594",
  borde: "#8A7A6A",
  lineaFina: "#3A322A",
  acento: "#E6B27A",
  superficieCodigo: "#262019",
  resaltado: "#5A4A16",
  marcador: "#2D261F",
};

export interface OpcionesTarjeta {
  oscuro: boolean;
  marcaDeAgua: boolean;
  /** 1 a 3 (moodiary `ImageExportOptions.scale`). */
  escala: number;
}

export const OPCIONES_TARJETA: OpcionesTarjeta = { oscuro: false, marcaDeAgua: true, escala: ESCALA_TARJETA };

export const esOpcionesTarjeta = (v: unknown): v is OpcionesTarjeta => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.oscuro === "boolean" && typeof o.marcaDeAgua === "boolean" && typeof o.escala === "number" && Number.isInteger(o.escala) && o.escala >= 1 && o.escala <= 3;
};

export const paletaDe = (oscuro: boolean): Paleta => (oscuro ? PALETA_OSCURA : PALETA_CLARA);

// ── Lo que se dibuja ─────────────────────────────────────────────────────────

export interface Fuente {
  tam: number;
  negrita: boolean;
  cursiva: boolean;
  mono: boolean;
}

export type Comando =
  | { t: "rect"; x: number; y: number; w: number; h: number; color: string; radio?: number }
  /** `y` es la línea base del texto. */
  | { t: "texto"; x: number; y: number; texto: string; fuente: Fuente; color: string }
  | { t: "linea"; x1: number; y1: number; x2: number; y2: number; color: string; ancho: number; trazo?: number[] }
  | { t: "poli"; puntos: [number, number][]; color: string; ancho: number }
  | { t: "circulo"; x: number; y: number; r: number; color: string }
  | { t: "imagen"; src: string; x: number; y: number; w: number; h: number; radio: number };

export type Medidor = (texto: string, fuente: Fuente) => number;
export type Dimensiones = (src: string) => { w: number; h: number } | null;

export interface DatosTarjeta {
  /** "YYYY-MM-DD". */
  fecha: string;
  /** Minutos desde la medianoche. */
  hora: number;
  titulo: string | null;
  /** Nombre del ánimo y su color (`#rrggbb`). */
  animo: { nombre: string; color: string } | null;
  categoria: { nombre: string; color: string | null } | null;
  etiquetas: string[];
  contenido: NodoDoc | null;
  texto: string;
  fotos: string[];
}

export interface Diseno {
  comandos: Comando[];
  /** Alto lógico (a escala 1). */
  alto: number;
  ancho: number;
  /** El cuerpo era más alto que lo que se puede dibujar y se cortó con «…». */
  truncada: boolean;
}

// ── Fechas ───────────────────────────────────────────────────────────────────

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** «8 de noviembre» y «domingo» de una fecha "YYYY-MM-DD" (sin zonas horarias: la fecha ya viene en la zona de la familia). */
export function fechaDeTarjeta(fecha: string): { diaMes: string; semana: string; anio: string } {
  const [y, m, d] = fecha.split("-").map(Number);
  const semana = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { diaMes: `${d} de ${MESES[m - 1]}`, semana, anio: String(y) };
}

export const horaDeTarjeta = (min: number): string => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** `#rrggbb` + opacidad → `rgba(...)` (el chip de ánimo de moodiary es el color con 15–18 % de opacidad). Si no es un hex válido, el gris de la paleta. */
export function colorConOpacidad(hex: string, opacidad: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(128,128,128,${opacidad})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacidad})`;
}

// ── Texto en línea ───────────────────────────────────────────────────────────

interface Trozo {
  texto: string;
  fuente: Fuente;
  color: string;
  subrayado: boolean;
  tachado: boolean;
  fondo: string | null;
}

interface Colocado extends Trozo {
  x: number;
  ancho: number;
  /** Índice del trozo de origen, para unir los pedazos contiguos. */
  de: number;
}

const cuerpo = (extra: Partial<Fuente> = {}): Fuente => ({ tam: TAM_CUERPO, negrita: false, cursiva: false, mono: false, ...extra });

/** Parte una palabra más ancha que la línea, letra por letra. */
function partirPorLetras(texto: string, ancho: number, fuente: Fuente, medir: Medidor): string[] {
  const partes: string[] = [];
  let actual = "";
  for (const c of texto) {
    if (actual && medir(actual + c, fuente) > ancho) {
      partes.push(actual);
      actual = c;
    } else {
      actual += c;
    }
  }
  if (actual) partes.push(actual);
  return partes;
}

/** Corte de líneas: por palabras, con saltos forzados (`\n`) y palabras largas partidas. Los espacios del principio de una línea se descartan. */
export function lineasDe(trozos: Trozo[], ancho: number, medir: Medidor): Colocado[][] {
  const lineas: Colocado[][] = [];
  let linea: Colocado[] = [];
  let x = 0;
  const cerrar = () => {
    // sin los espacios del final
    while (linea.length && /^\s*$/.test(linea[linea.length - 1].texto)) linea.pop();
    const ultimo = linea[linea.length - 1];
    if (ultimo && /\s$/.test(ultimo.texto)) {
      const t = ultimo.texto.replace(/\s+$/, "");
      ultimo.texto = t;
      ultimo.ancho = medir(t, ultimo.fuente);
    }
    lineas.push(linea);
    linea = [];
    x = 0;
  };
  const poner = (t: Trozo, de: number, texto: string, w: number) => {
    const ultimo = linea[linea.length - 1];
    if (ultimo && ultimo.de === de) {
      ultimo.texto += texto;
      ultimo.ancho += w;
    } else {
      linea.push({ ...t, texto, x, ancho: w, de });
    }
    x += w;
  };
  trozos.forEach((t, de) => {
    for (const ficha of t.texto.split(/(\n|[ \t]+)/)) {
      if (ficha === "") continue;
      if (ficha === "\n") {
        cerrar();
        continue;
      }
      const espacio = /^[ \t]+$/.test(ficha);
      if (espacio) {
        if (x === 0) continue;
        poner(t, de, " ", medir(" ", t.fuente));
        continue;
      }
      let w = medir(ficha, t.fuente);
      if (x + w > ancho && x > 0) cerrar();
      if (w > ancho) {
        const pedazos = partirPorLetras(ficha, ancho, t.fuente, medir);
        pedazos.forEach((p, i) => {
          if (i > 0 || x > 0) cerrar();
          poner(t, de, p, medir(p, t.fuente));
        });
        continue;
      }
      w = medir(ficha, t.fuente);
      poner(t, de, ficha, w);
    }
  });
  cerrar();
  return lineas;
}

// ── Contexto de diseño ───────────────────────────────────────────────────────

interface Ctx {
  medir: Medidor;
  dims: Dimensiones;
  p: Paleta;
  ancho: number;
  /** Color del texto del cuerpo (más apagado dentro de una cita). */
  colorTexto: string;
  out: Comando[];
}

const baseDe = (y: number, alto: number, tam: number) => y + alto / 2 + tam * 0.35;

/** Dibuja líneas ya cortadas y devuelve el alto que ocupan. */
function dibujarLineas(lineas: Colocado[][], x: number, y: number, alto: number, ctx: Ctx, alinear: "izq" | "centro" = "izq", anchoUtil = 0): number {
  let yy = y;
  for (const linea of lineas) {
    const ancho = linea.length ? linea[linea.length - 1].x + linea[linea.length - 1].ancho : 0;
    const desvio = alinear === "centro" ? Math.max(0, (anchoUtil - ancho) / 2) : 0;
    for (const c of linea) {
      const xx = x + desvio + c.x;
      const base = baseDe(yy, alto, c.fuente.tam);
      if (c.fondo) ctx.out.push({ t: "rect", x: xx, y: yy + (alto - c.fuente.tam * 1.35) / 2, w: c.ancho, h: c.fuente.tam * 1.35, color: c.fondo, radio: 3 });
      if (c.texto) ctx.out.push({ t: "texto", x: xx, y: base, texto: c.texto, fuente: c.fuente, color: c.color });
      if (c.subrayado) ctx.out.push({ t: "linea", x1: xx, y1: base + 2, x2: xx + c.ancho, y2: base + 2, color: c.color, ancho: 1 });
      if (c.tachado) ctx.out.push({ t: "linea", x1: xx, y1: base - c.fuente.tam * 0.3, x2: xx + c.ancho, y2: base - c.fuente.tam * 0.3, color: c.color, ancho: 1 });
    }
    yy += alto;
  }
  return yy - y;
}

function texto(trozos: Trozo[], x: number, y: number, ancho: number, alto: number, ctx: Ctx): number {
  if (!trozos.length) return alto;
  return dibujarLineas(lineasDe(trozos, ancho, ctx.medir), x, y, alto, ctx);
}

// ── Bloques ──────────────────────────────────────────────────────────────────

/** moodiary `_gapBefore`. */
const separacionAntes = (tipo: string): number => (tipo === "heading" ? 22 : tipo === "horizontalRule" ? 19 : tipo === "codeBlock" || tipo === "blockquote" || tipo === "table" ? 13 : 10);

interface Base {
  fuente: Fuente;
  color: string;
}

/** Trozos de un párrafo; una imagen dentro del párrafo corta el texto en dos. */
function trozosDe(nodos: NodoDoc[] | undefined, base: Base, ctx: Ctx): (Trozo | NodoDoc)[] {
  const salida: (Trozo | NodoDoc)[] = [];
  for (const n of nodos ?? []) {
    if (n.type === "image") {
      salida.push(n);
      continue;
    }
    if (n.type === "hardBreak") {
      salida.push({ texto: "\n", fuente: base.fuente, color: base.color, subrayado: false, tachado: false, fondo: null });
      continue;
    }
    const enlaceAEntrada = n.type === "diaryLink";
    const crudo = n.type === "text" ? (n.text ?? "") : enlaceAEntrada ? String(n.attrs?.label || "entrada").replace(/\s+/g, " ").trim() : "";
    if (!crudo) continue;
    const marcas = new Set((n.marks ?? []).map((m) => m.type));
    let fuente: Fuente = { ...base.fuente };
    if (marcas.has("code")) fuente = { ...fuente, mono: true, tam: base.fuente.tam * 0.88 };
    if (marcas.has("bold")) fuente = { ...fuente, negrita: true };
    if (marcas.has("italic")) fuente = { ...fuente, cursiva: true };
    const esEnlace = marcas.has("link") || enlaceAEntrada;
    salida.push({
      texto: crudo,
      fuente,
      color: esEnlace ? ctx.p.acento : base.color,
      subrayado: marcas.has("underline") || esEnlace,
      tachado: marcas.has("strike"),
      fondo: marcas.has("code") ? ctx.p.superficieCodigo : marcas.has("highlight") ? ctx.p.resaltado : null,
    });
  }
  return salida;
}

function imagen(n: NodoDoc, x: number, y: number, ancho: number, ctx: Ctx): number {
  const src = typeof n.attrs?.src === "string" ? n.attrs.src : "";
  const porcentaje = typeof n.attrs?.widthPercent === "number" ? n.attrs.widthPercent : 100;
  const d = ctx.dims(src);
  if (!d || d.w <= 0 || d.h <= 0) {
    // moodiary `_placeholderBox`: una caja con el aviso
    const alto = 24 * 2 + 18;
    ctx.out.push({ t: "rect", x, y, w: ancho, h: alto, color: ctx.p.marcador, radio: 8 });
    const fuente: Fuente = cuerpo({ tam: TAM_META });
    ctx.out.push({ t: "texto", x: x + 14, y: baseDe(y, alto, TAM_META), texto: "Imagen no disponible", fuente, color: ctx.p.apagado });
    return alto;
  }
  const w = ancho * (Math.min(100, Math.max(1, porcentaje)) / 100);
  const h = (w * d.h) / d.w;
  ctx.out.push({ t: "imagen", src, x: x + (ancho - w) / 2, y, w, h, radio: 8 });
  return h;
}

function parrafo(n: NodoDoc, x: number, y: number, ancho: number, base: Base, alto: number, ctx: Ctx): number {
  const partes = trozosDe(n.content, base, ctx);
  if (!partes.length) return alto;
  let yy = y;
  let pendiente: Trozo[] = [];
  const vaciar = () => {
    if (pendiente.length) yy += texto(pendiente, x, yy, ancho, alto, ctx);
    pendiente = [];
  };
  for (const p of partes) {
    if ("type" in p) {
      vaciar();
      yy += imagen(p, x, yy, ancho, ctx) + 4;
    } else {
      pendiente.push(p);
    }
  }
  vaciar();
  return yy - y;
}

function regla(n: NodoDoc, x: number, y: number, ancho: number, ctx: Ctx): number {
  const variante = String(n.attrs?.variant ?? "solid");
  const rotulo = typeof n.attrs?.label === "string" && n.attrs.label.trim() ? n.attrs.label.trim() : null;
  const color = variante === "dashed" || variante === "dotted" || variante === "wavy" ? ctx.p.borde : ctx.p.lineaFina;
  if (variante === "text" && rotulo) {
    const alto = 20;
    const fuente = cuerpo({ tam: TAM_META });
    const w = ctx.medir(rotulo, fuente);
    const lado = Math.max(0, (ancho - w) / 2 - 12);
    ctx.out.push({ t: "linea", x1: x, y1: y + alto / 2, x2: x + lado, y2: y + alto / 2, color: ctx.p.lineaFina, ancho: 1 });
    ctx.out.push({ t: "texto", x: x + lado + 12, y: baseDe(y, alto, TAM_META), texto: rotulo, fuente, color: ctx.p.apagado });
    ctx.out.push({ t: "linea", x1: x + ancho - lado, y1: y + alto / 2, x2: x + ancho, y2: y + alto / 2, color: ctx.p.lineaFina, ancho: 1 });
    return alto;
  }
  const alto = 8;
  const m = y + alto / 2;
  if (variante === "dashed") ctx.out.push({ t: "linea", x1: x, y1: m, x2: x + ancho, y2: m, color, ancho: 1, trazo: [6, 4] });
  else if (variante === "dotted") ctx.out.push({ t: "linea", x1: x, y1: m, x2: x + ancho, y2: m, color, ancho: 2, trazo: [1, 4] });
  else if (variante === "double") {
    ctx.out.push({ t: "linea", x1: x, y1: m - 1.5, x2: x + ancho, y2: m - 1.5, color, ancho: 1 });
    ctx.out.push({ t: "linea", x1: x, y1: m + 1.5, x2: x + ancho, y2: m + 1.5, color, ancho: 1 });
  } else if (variante === "wavy") {
    const puntos: [number, number][] = [];
    for (let i = 0; i <= ancho; i += 1) puntos.push([x + i, m + Math.sin((i / 5) * Math.PI) * 2.5]);
    ctx.out.push({ t: "poli", puntos, color, ancho: 1 });
  } else ctx.out.push({ t: "linea", x1: x, y1: m, x2: x + ancho, y2: m, color, ancho: 1 });
  return alto;
}

function codigo(n: NodoDoc, x: number, y: number, ancho: number, ctx: Ctx): number {
  const idioma = typeof n.attrs?.language === "string" ? n.attrs.language : "";
  const fuente = cuerpo({ tam: TAM_CODIGO, mono: true });
  const alto = TAM_CODIGO * 1.6;
  const util = ancho - 28;
  const inicio = ctx.out.length;
  let yy = y + 12;
  if (idioma) {
    const f = cuerpo({ tam: TAM_META });
    ctx.out.push({ t: "texto", x: x + 14, y: baseDe(yy, TAM_META * 1.4, TAM_META), texto: idioma, fuente: f, color: ctx.p.apagado });
    yy += TAM_META * 1.4 + 6;
  }
  const crudo = (n.content ?? []).map((c) => c.text ?? "").join("");
  for (const linea of crudo.split("\n")) {
    const piezas = linea === "" ? [""] : medirOPartir(linea, util, fuente, ctx.medir);
    for (const p of piezas) {
      if (p) ctx.out.push({ t: "texto", x: x + 14, y: baseDe(yy, alto, TAM_CODIGO), texto: p, fuente, color: ctx.p.texto });
      yy += alto;
    }
  }
  yy += 12;
  ctx.out.splice(inicio, 0, { t: "rect", x, y, w: ancho, h: yy - y, color: ctx.p.superficieCodigo, radio: 8 });
  return yy - y;
}

const medirOPartir = (linea: string, ancho: number, fuente: Fuente, medir: Medidor): string[] => (medir(linea, fuente) <= ancho ? [linea] : partirPorLetras(linea, ancho, fuente, medir));

function lista(n: NodoDoc, x: number, y: number, ancho: number, base: Base, ctx: Ctx): number {
  const ordenada = n.type === "orderedList";
  const tareas = n.type === "taskList";
  const inicio = typeof n.attrs?.start === "number" ? n.attrs.start : 1;
  const alto = TAM_CUERPO * INTERLINEADO_CUERPO;
  let yy = y;
  (n.content ?? []).forEach((item, i) => {
    if (i > 0) yy += 4;
    if (tareas) {
      const marcado = item.attrs?.checked === true;
      const lado = 14;
      const cy = yy + (alto - lado) / 2;
      if (marcado) {
        ctx.out.push({ t: "rect", x: x + 2, y: cy, w: lado, h: lado, color: ctx.p.acento, radio: 3 });
        ctx.out.push({ t: "poli", puntos: [[x + 5, cy + 7.5], [x + 8, cy + 10.5], [x + 13, cy + 4.5]], color: ctx.p.fondo, ancho: 1.8 });
      } else {
        ctx.out.push({ t: "rect", x: x + 2, y: cy, w: lado, h: lado, color: ctx.p.borde, radio: 3 });
        ctx.out.push({ t: "rect", x: x + 3, y: cy + 1, w: lado - 2, h: lado - 2, color: ctx.p.fondo, radio: 2 });
      }
    } else if (ordenada) {
      ctx.out.push({ t: "texto", x, y: baseDe(yy, alto, TAM_CUERPO), texto: `${inicio + i}.`, fuente: cuerpo(), color: ctx.colorTexto });
    } else {
      ctx.out.push({ t: "circulo", x: x + 8, y: yy + alto / 2, r: 2.5, color: ctx.colorTexto });
    }
    yy += bloques(item.content ?? [], x + 24, yy, ancho - 24, base, ctx);
  });
  return yy - y;
}

function cita(n: NodoDoc, x: number, y: number, ancho: number, ctx: Ctx): number {
  const inicio = ctx.out.length;
  const interior: Ctx = { ...ctx, colorTexto: ctx.p.apagado };
  const alto = bloques(n.content ?? [], x + 16, y, ancho - 16, { fuente: cuerpo(), color: ctx.p.apagado }, interior);
  ctx.out.splice(inicio, 0, { t: "rect", x, y, w: 3, h: alto, color: ctx.p.borde });
  return alto;
}

function tabla(n: NodoDoc, x: number, y: number, ancho: number, ctx: Ctx): number {
  const filas = (n.content ?? []).filter((f) => f.type === "tableRow");
  if (!filas.length) return 0;
  const columnas = Math.max(...filas.map((f) => f.content?.length ?? 0), 1);
  const col = ancho / columnas;
  let yy = y;
  const bordes: Comando[] = [];
  const lineaH = (yl: number): Comando => ({ t: "linea", x1: x, y1: yl, x2: x + ancho, y2: yl, color: ctx.p.lineaFina, ancho: 1 });
  bordes.push(lineaH(yy));
  for (const fila of filas) {
    const celdas = fila.content ?? [];
    const encabezado = celdas.some((c) => c.type === "tableHeader");
    const interior: Ctx = { ...ctx, out: [] };
    let altoFila = 0;
    celdas.forEach((c, i) => {
      const h = bloques(c.content ?? [], x + i * col + 10, yy + 6, col - 20, { fuente: cuerpo(), color: ctx.colorTexto }, interior);
      altoFila = Math.max(altoFila, h);
    });
    altoFila += 12;
    if (encabezado) ctx.out.push({ t: "rect", x, y: yy, w: ancho, h: altoFila, color: ctx.p.superficieCodigo });
    ctx.out.push(...interior.out);
    yy += altoFila;
    bordes.push(lineaH(yy));
  }
  for (let i = 0; i <= columnas; i++) bordes.push({ t: "linea", x1: x + i * col, y1: y, x2: x + i * col, y2: yy, color: ctx.p.lineaFina, ancho: 1 });
  ctx.out.push(...bordes);
  return yy - y;
}

/**
 * Lane 294 (moodiary `_placeholderBox`): un audio, video o documento no se puede dibujar en una imagen; queda un recuadro con su tipo, su nombre y su peso.
 */
function archivo(n: NodoDoc, x: number, y: number, ancho: number, ctx: Ctx): number {
  const nombre = typeof n.attrs?.name === "string" && n.attrs.name.trim() ? n.attrs.name.trim() : n.type === "audio" ? "Audio" : n.type === "video" ? "Video" : "Archivo";
  const tamano = n.type === "attachment" ? formatearTamano(typeof n.attrs?.size === "number" ? n.attrs.size : null) : "";
  const sello = n.type === "audio" ? "AUDIO" : n.type === "video" ? "VIDEO" : (extensionDe(nombre).slice(0, 4).toUpperCase() || "?");
  const alto = 48;
  const lado = 34;
  const fuenteSello = cuerpo({ tam: TAM_META - 2, negrita: true });
  const fuenteNombre = cuerpo({ tam: TAM_CUERPO - 1 });
  const fuenteTamano = cuerpo({ tam: TAM_META });
  ctx.out.push({ t: "rect", x, y, w: ancho, h: alto, color: ctx.p.superficieCodigo, radio: 10 });
  ctx.out.push({ t: "rect", x: x + 8, y: y + (alto - lado) / 2, w: lado, h: lado, color: ctx.p.lineaFina, radio: 8 });
  const ws = ctx.medir(sello, fuenteSello);
  ctx.out.push({ t: "texto", x: x + 8 + (lado - ws) / 2, y: baseDe(y + (alto - lado) / 2, lado, TAM_META - 2), texto: sello, fuente: fuenteSello, color: ctx.p.apagado });
  const xt = x + 8 + lado + 10;
  const util = ancho - (xt - x) - 10;
  let rotulo = nombre;
  if (ctx.medir(rotulo, fuenteNombre) > util) {
    while (rotulo.length > 1 && ctx.medir(`${rotulo}…`, fuenteNombre) > util) rotulo = rotulo.slice(0, -1);
    rotulo = `${rotulo.trimEnd()}…`;
  }
  const altoNombre = tamano ? 20 : alto;
  ctx.out.push({ t: "texto", x: xt, y: baseDe(tamano ? y + 6 : y, altoNombre, TAM_CUERPO - 1), texto: rotulo, fuente: fuenteNombre, color: ctx.p.texto });
  if (tamano) ctx.out.push({ t: "texto", x: xt, y: baseDe(y + 26, 16, TAM_META), texto: tamano, fuente: fuenteTamano, color: ctx.p.apagado });
  return alto;
}

function bloque(n: NodoDoc, x: number, y: number, ancho: number, base: Base, ctx: Ctx): number {
  switch (n.type) {
    case "paragraph":
      return parrafo(n, x, y, ancho, base, TAM_CUERPO * INTERLINEADO_CUERPO, ctx);
    case "heading": {
      const nivel = Math.min(6, Math.max(1, Number(n.attrs?.level) || 1));
      const tam = TAM_CUERPO * ESCALA_TITULO[nivel - 1];
      return parrafo(n, x, y, ancho, { fuente: cuerpo({ tam, negrita: true }), color: ctx.p.texto }, tam * 1.3, ctx);
    }
    case "blockquote":
      return cita(n, x, y, ancho, ctx);
    case "bulletList":
    case "orderedList":
    case "taskList":
      return lista(n, x, y, ancho, base, ctx);
    case "codeBlock":
      return codigo(n, x, y, ancho, ctx);
    case "horizontalRule":
      return regla(n, x, y, ancho, ctx);
    case "image":
      return imagen(n, x, y, ancho, ctx);
    case "audio":
    case "video":
    case "attachment":
      return archivo(n, x, y, ancho, ctx);
    case "table":
      return tabla(n, x, y, ancho, ctx);
    default:
      return 0;
  }
}

function bloques(nodos: NodoDoc[], x: number, y: number, ancho: number, base: Base, ctx: Ctx): number {
  let yy = y;
  let primero = true;
  for (const n of nodos) {
    const separacion = primero ? 0 : separacionAntes(n.type);
    const h = bloque(n, x, yy + separacion, ancho, base, ctx);
    if (h === 0 && n.type !== "paragraph") continue;
    yy += separacion + h;
    primero = false;
  }
  return yy - y;
}

// ── Cabecera, pie y tarjeta entera ───────────────────────────────────────────

function cabecera(d: DatosTarjeta, x: number, y: number, ancho: number, ctx: Ctx): number {
  const f = fechaDeTarjeta(d.fecha);
  const fuenteFecha = cuerpo({ tam: TAM_FECHA, negrita: true });
  const meta = cuerpo({ tam: TAM_META });
  const altoFecha = TAM_FECHA * 1.3;
  const wFecha = ctx.medir(f.diaMes, fuenteFecha);
  ctx.out.push({ t: "texto", x, y: baseDe(y, altoFecha, TAM_FECHA), texto: f.diaMes, fuente: fuenteFecha, color: ctx.p.texto });
  const semana = `${f.semana}, ${f.anio} · ${horaDeTarjeta(d.hora)}`;
  ctx.out.push({ t: "texto", x: x + wFecha + 8, y: baseDe(y, altoFecha, TAM_META) + 2, texto: semana, fuente: meta, color: ctx.p.apagado });
  let yy = y + altoFecha + 8;

  // Chips: ánimo, categoría
  const altoChip = 22;
  let cx = x;
  const colocar = (w: number): number => {
    if (cx > x && cx + w > x + ancho) {
      cx = x;
      yy += altoChip + 6;
    }
    const pos = cx;
    cx += w + 10;
    return pos;
  };
  let hayFila = false;
  if (d.animo) {
    const fuente = cuerpo({ tam: TAM_META, negrita: true });
    const w = ctx.medir(d.animo.nombre, fuente) + 20 + 12;
    const px = colocar(w);
    ctx.out.push({ t: "rect", x: px, y: yy, w, h: altoChip, color: colorConOpacidad(d.animo.color, 0.16), radio: altoChip / 2 });
    ctx.out.push({ t: "circulo", x: px + 13, y: yy + altoChip / 2, r: 4, color: d.animo.color });
    ctx.out.push({ t: "texto", x: px + 24, y: baseDe(yy, altoChip, TAM_META), texto: d.animo.nombre, fuente, color: d.animo.color });
    hayFila = true;
  }
  if (d.categoria) {
    const fuente = cuerpo({ tam: TAM_META });
    const maximo = ancho * 0.5;
    let nombre = d.categoria.nombre;
    while (nombre.length > 1 && ctx.medir(nombre, fuente) > maximo) nombre = nombre.slice(0, -1);
    if (nombre !== d.categoria.nombre) nombre += "…";
    const w = ctx.medir(nombre, fuente) + 14;
    const px = colocar(w);
    ctx.out.push({ t: "circulo", x: px + 4, y: yy + altoChip / 2, r: 3.5, color: d.categoria.color ?? ctx.p.apagado });
    ctx.out.push({ t: "texto", x: px + 14, y: baseDe(yy, altoChip, TAM_META), texto: nombre, fuente, color: ctx.p.apagado });
    hayFila = true;
  }
  if (hayFila) yy += altoChip;

  if (d.etiquetas.length) {
    const fuente = cuerpo({ tam: TAM_META });
    const trozos: Trozo[] = d.etiquetas.map((e, i) => ({ texto: `#${e}${i < d.etiquetas.length - 1 ? " " : ""}`, fuente, color: ctx.p.borde, subrayado: false, tachado: false, fondo: null }));
    yy += 6;
    yy += texto(trozos, x, yy, ancho, TAM_META * 1.6, ctx);
  }
  return yy - y;
}

function pie(x: number, y: number, ancho: number, ctx: Ctx): number {
  const fuente = cuerpo({ tam: TAM_META, negrita: true });
  ctx.out.push({ t: "linea", x1: x, y1: y + 22, x2: x + ancho, y2: y + 22, color: ctx.p.lineaFina, ancho: 1 });
  const rotulo = "Ordo Diei";
  const w = ctx.medir(rotulo, fuente);
  ctx.out.push({ t: "texto", x: x + (ancho - w) / 2, y: baseDe(y + 22 + 14, 18, TAM_META), texto: rotulo, fuente, color: ctx.p.borde });
  return 22 + 14 + 18;
}

/** Las imágenes que va a usar la tarjeta (primero las del texto, después las fotos que no están en él), para cargarlas antes del diseño. */
export function imagenesDeTarjeta(d: Pick<DatosTarjeta, "contenido" | "fotos">): string[] {
  const enTexto = d.contenido ? imagenesDe(d.contenido) : [];
  return [...new Set([...enTexto, ...d.fotos])];
}

/** Diseña la tarjeta de una entrada: lista de comandos con posiciones y el alto lógico total. */
export function disenarTarjeta(d: DatosTarjeta, opciones: Pick<OpcionesTarjeta, "oscuro" | "marcaDeAgua">, medir: Medidor, dims: Dimensiones, ancho = ANCHO_TARJETA): Diseno {
  const p = paletaDe(opciones.oscuro);
  const ctx: Ctx = { medir, dims, p, ancho, colorTexto: p.texto, out: [] };
  const x = MARGEN_X;
  const util = ancho - MARGEN_X * 2;
  let y = MARGEN_SUP;

  y += cabecera(d, x, y, util, ctx);
  if (d.titulo?.trim()) {
    const alto = TAM_TITULO * 1.4;
    const trozos: Trozo[] = [{ texto: d.titulo.trim(), fuente: cuerpo({ tam: TAM_TITULO, negrita: true }), color: p.texto, subrayado: false, tachado: false, fondo: null }];
    y += 18;
    y += texto(trozos, x, y, util, alto, ctx);
  }

  const base: Base = { fuente: cuerpo(), color: p.texto };
  const doc: NodoDoc[] = d.contenido?.content ?? d.texto.split(/\r?\n/).map((l) => (l ? { type: "paragraph", content: [{ type: "text", text: l }] } : { type: "paragraph" }));
  const fotosSueltas = d.fotos.filter((f) => !(d.contenido && imagenesDe(d.contenido).includes(f))).map((src): NodoDoc => ({ type: "image", attrs: { src } }));
  const todos = [...doc, ...fotosSueltas];
  // Un cuerpo vacío (solo espacios) no deja hueco
  const hayCuerpo = todos.some((n) => n.type !== "paragraph" || textoPlanoDe({ type: "doc", content: [n] }).trim() !== "" || (n.content ?? []).some((c) => c.type !== "text"));
  let truncada = false;
  if (hayCuerpo) {
    y += y > MARGEN_SUP ? 12 : 0;
    let primero = true;
    for (const n of todos) {
      if (y > MAX_ALTO_LOGICO - 200) {
        truncada = true;
        break;
      }
      const sep = primero ? 0 : separacionAntes(n.type);
      const h = bloque(n, x, y + sep, util, base, ctx);
      if (h === 0 && n.type !== "paragraph") continue;
      y += sep + h;
      primero = false;
    }
    if (truncada) {
      const alto = TAM_CUERPO * INTERLINEADO_CUERPO;
      ctx.out.push({ t: "texto", x, y: baseDe(y + 10, alto, TAM_CUERPO), texto: "…", fuente: cuerpo(), color: p.apagado });
      y += 10 + alto;
    }
  }
  if (opciones.marcaDeAgua) y += pie(x, y, util, ctx);
  y += MARGEN_INF;
  return { comandos: ctx.out, alto: Math.ceil(y), ancho, truncada };
}

/** moodiary `_kDowngradeAboveLogical`: la escala pedida baja hasta que el lienzo entre en los límites del navegador. */
export function escalaDeTarjeta(alto: number, ancho: number, pedida: number): number {
  let escala = Math.min(3, Math.max(1, Math.round(pedida)));
  while (escala > 1 && (alto * escala > MAX_ALTO_PX || ancho * escala * alto * escala > MAX_PIXELES)) escala -= 1;
  return escala;
}
