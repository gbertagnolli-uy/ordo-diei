// Diario (lane 293): dibuja en un canvas la tarjeta que diseñó `lib/diario/tarjeta.ts`. Solo navegador.
// Portado de vendor/moodiary/packages/feature/moodiary_export/lib/src/data/image_composer.dart (ZhuJHua/moodiary@2c552dd): se cargan las imágenes antes
// de armar la tarjeta (el árbol fuera de pantalla no espera a las imágenes), se baja la escala si no entra y se escribe un PNG.
import { MAX_ALTO_PX, disenarTarjeta, escalaDeTarjeta, imagenesDeTarjeta, paletaDe, type Comando, type DatosTarjeta, type Fuente, type OpcionesTarjeta } from "@/lib/diario/tarjeta";

export interface TarjetaDibujada {
  blob: Blob;
  /** Medidas en píxeles del PNG. */
  anchoPx: number;
  altoPx: number;
  escala: number;
  /** El cuerpo se cortó por ser demasiado largo. */
  truncada: boolean;
  /** Imágenes que no se pudieron cargar. */
  omitidas: number;
}

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const cargarImagen = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolver) => {
    const img = new Image();
    img.onload = () => resolver(img.naturalWidth > 0 ? img : null);
    img.onerror = () => resolver(null);
    img.src = src;
  });

function fuenteCss(f: Fuente, familia: string): string {
  return `${f.cursiva ? "italic " : ""}${f.negrita ? "700 " : "400 "}${f.tam}px ${f.mono ? MONO : familia}`;
}

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radio: number) {
  const r = Math.min(radio, w / 2, h / 2);
  ctx.beginPath();
  if (r > 0 && typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function ejecutar(ctx: CanvasRenderingContext2D, c: Comando, familia: string, imagenes: Map<string, HTMLImageElement>) {
  switch (c.t) {
    case "rect":
      ctx.fillStyle = c.color;
      rectRedondeado(ctx, c.x, c.y, c.w, c.h, c.radio ?? 0);
      ctx.fill();
      break;
    case "texto":
      ctx.font = fuenteCss(c.fuente, familia);
      ctx.fillStyle = c.color;
      ctx.textBaseline = "alphabetic";
      ctx.fillText(c.texto, c.x, c.y);
      break;
    case "linea":
      ctx.strokeStyle = c.color;
      ctx.lineWidth = c.ancho;
      ctx.lineCap = c.trazo ? "round" : "butt";
      ctx.setLineDash(c.trazo ?? []);
      ctx.beginPath();
      ctx.moveTo(c.x1, c.y1);
      ctx.lineTo(c.x2, c.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case "poli":
      ctx.strokeStyle = c.color;
      ctx.lineWidth = c.ancho;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      c.puntos.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      break;
    case "circulo":
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "imagen": {
      const img = imagenes.get(c.src);
      if (!img) break;
      ctx.save();
      rectRedondeado(ctx, c.x, c.y, c.w, c.h, c.radio);
      ctx.clip();
      ctx.drawImage(img, c.x, c.y, c.w, c.h);
      ctx.restore();
      break;
    }
  }
}

export async function dibujarTarjeta(datos: DatosTarjeta, opciones: OpcionesTarjeta): Promise<TarjetaDibujada> {
  const srcs = imagenesDeTarjeta(datos);
  const cargadas = await Promise.all(srcs.map(async (s) => [s, await cargarImagen(s)] as const));
  const imagenes = new Map<string, HTMLImageElement>();
  for (const [s, img] of cargadas) if (img) imagenes.set(s, img);

  const familia = window.getComputedStyle(document.body).fontFamily || "sans-serif";
  const medidor = document.createElement("canvas").getContext("2d");
  if (!medidor) throw new Error("Este navegador no puede dibujar la imagen");
  const medir = (texto: string, f: Fuente) => {
    medidor.font = fuenteCss(f, familia);
    return medidor.measureText(texto).width;
  };
  const dims = (src: string) => {
    const img = imagenes.get(src);
    return img ? { w: img.naturalWidth, h: img.naturalHeight } : null;
  };

  const diseno = disenarTarjeta(datos, opciones, medir, dims);
  const escala = escalaDeTarjeta(diseno.alto, diseno.ancho, opciones.escala);
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(diseno.ancho * escala);
  lienzo.height = Math.min(Math.round(diseno.alto * escala), MAX_ALTO_PX);
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Este navegador no puede dibujar la imagen");
  ctx.scale(escala, escala);
  ctx.fillStyle = paletaDe(opciones.oscuro).fondo;
  ctx.fillRect(0, 0, diseno.ancho, diseno.alto);
  for (const c of diseno.comandos) ejecutar(ctx, c, familia, imagenes);

  const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/png"));
  if (!blob) throw new Error("No se pudo armar la imagen");
  return { blob, anchoPx: lienzo.width, altoPx: lienzo.height, escala, truncada: diseno.truncada, omitidas: srcs.length - imagenes.size };
}
