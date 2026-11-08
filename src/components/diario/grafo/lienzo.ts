// Diario (lane 295): el lienzo del grafo. Dibuja nodos, flechas y etiquetas en un Canvas 2D y atiende arrastre, pellizco, rueda, inercia y toque.
// Portado de `GraphCanvas` y `_GraphPainter` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/graph_canvas.dart, ZhuJHua/moodiary@2c552dd):
// en Flutter se dibuja con `drawVertices` y `drawRawPoints`; acá, con trazados `Path2D` agrupados por color. Sin React: lo maneja GrafoCanvas.tsx.
import { atenuar, atenuarArista, colorCss, mezclar, type Rgba } from "@/lib/diario/grafo-color";
import { AJUSTES_GRAFO as A, esVecino, radioNucleoElegido, type DireccionEgo, type Escena } from "@/lib/diario/grafo-escena";
import { suaveCubica } from "./motor";
import type { MarcoGrafo } from "./marco";
import { colorDeArista, type PaletaGrafo } from "./paleta";

export interface PropsLienzo {
  escena: Escena;
  marco: MarcoGrafo;
  paleta: PaletaGrafo;
  /** Un color por nodo. */
  colores: Rgba[];
  /** El texto de la etiqueta de cada nodo. */
  rotulos: string[];
  seleccionado: number | null;
  etiquetas: boolean;
  /** Dirección de cada nodo respecto del centro (grafo local): colorea las flechas del centro. */
  direcciones: (DireccionEgo | null)[] | null;
  /** Radio del mundo que debe ocupar el 42 % de la pantalla (grafo local); `null` = encajar todo. */
  extension: number | null;
  alSeleccionar: (indice: number | null) => void;
  /** La persona movió o acercó el lienzo (aparece el botón para volver a encajar). */
  alMover: (movido: boolean) => void;
}

const acotar = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const TAU = Math.PI * 2;
/** Cuánto hay que mover el dedo para que sea un arrastre y no un toque. */
const UMBRAL_ARRASTRE_PX = 6;

interface Punto {
  x: number;
  y: number;
}

export class MotorLienzo {
  private ctx: CanvasRenderingContext2D;
  private props: PropsLienzo;
  private ancho = 0;
  private alto = 0;
  private dpr = 1;
  private escala = 1;
  private tx = 0;
  private ty = 0;
  private autoEncaje = true;
  private movido = false;

  private foco: number | null = null;
  private focoT = 0;
  private focoDestino: 0 | 1 = 0;
  private salida: number | null = null;
  private salidaT = 0;
  private asentarT = 0;
  private camara: { t: number; escala0: number; escala1: number; tx0: number; ty0: number; tx1: number; ty1: number } | null = null;
  private inercia: Punto | null = null;

  private punteros = new Map<number, Punto>();
  private gesto: { escala0: number; tx0: number; ty0: number; foco: Punto; distancia0: number } | null = null;
  private toque: { x: number; y: number; t: number } | null = null;
  private arrastrando = false;
  private muestras: { x: number; y: number; t: number }[] = [];

  private rotulosMedidos = new Map<number, { texto: string; ancho: number }>();
  private familia = "system-ui, sans-serif";
  private raf: number | null = null;
  private ultimoTs = 0;
  private baja: (() => void) | null = null;
  private observador: ResizeObserver | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    props: PropsLienzo,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Este navegador no puede dibujar el grafo");
    this.ctx = ctx;
    this.props = props;
    this.familia = getComputedStyle(canvas).fontFamily || this.familia;
    this.baja = props.marco.suscribir(this.alCuadro);
    if (props.seleccionado !== null && props.seleccionado < props.escena.datos.nodos.length) {
      this.foco = props.seleccionado;
      this.focoT = 1;
      this.focoDestino = 1;
    }
    if (props.marco.asentado) this.asentarT = 1;
    canvas.addEventListener("pointerdown", this.alBajar);
    canvas.addEventListener("pointermove", this.alMoverPuntero);
    canvas.addEventListener("pointerup", this.alSubir);
    canvas.addEventListener("pointercancel", this.alCancelar);
    canvas.addEventListener("wheel", this.alRueda, { passive: false });
    canvas.addEventListener("keydown", this.alTecla);
    this.observador = new ResizeObserver(() => this.medir());
    this.observador.observe(canvas);
    this.medir();
  }

  destruir(): void {
    this.baja?.();
    this.baja = null;
    this.observador?.disconnect();
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    const c = this.canvas;
    c.removeEventListener("pointerdown", this.alBajar);
    c.removeEventListener("pointermove", this.alMoverPuntero);
    c.removeEventListener("pointerup", this.alSubir);
    c.removeEventListener("pointercancel", this.alCancelar);
    c.removeEventListener("wheel", this.alRueda);
    c.removeEventListener("keydown", this.alTecla);
  }

  /** Cambian las propiedades (nueva escena, selección, colores, tema…). */
  actualizar(nuevas: PropsLienzo): void {
    const antes = this.props;
    this.props = nuevas;
    if (antes.marco !== nuevas.marco) {
      this.baja?.();
      this.baja = nuevas.marco.suscribir(this.alCuadro);
      this.asentarT = nuevas.marco.asentado ? 1 : 0;
    }
    const n = nuevas.escena.datos.nodos.length;
    if (antes.escena !== nuevas.escena) {
      this.rotulosMedidos.clear();
      if (antes.escena.datos.nodos.length !== n) {
        this.autoEncaje = true;
        this.cambiarMovido(false);
        this.inercia = null;
        this.camara = null;
      }
      if (!nuevas.marco.asentado) this.asentarT = 0;
      if (this.foco !== null && this.foco >= n) {
        this.foco = null;
        this.focoT = 0;
      }
      if (this.salida !== null && this.salida >= n) {
        this.salida = null;
        this.salidaT = 0;
      }
    }
    if (antes.rotulos !== nuevas.rotulos) this.rotulosMedidos.clear();
    if (antes.seleccionado !== nuevas.seleccionado) {
      if (nuevas.seleccionado !== null) {
        if (this.foco !== null && this.foco !== nuevas.seleccionado && this.focoT > 0) {
          this.salida = this.foco;
          this.salidaT = this.focoT;
        }
        this.foco = nuevas.seleccionado;
        this.focoT = 0;
        this.focoDestino = 1;
      } else {
        this.focoDestino = 0;
      }
    }
    if (this.autoEncaje && this.ancho > 0) this.encajarCamara();
    this.pedir();
  }

  /** Vuelve a encajar todo el grafo en pantalla, con una animación. */
  encajar(): void {
    if (this.ancho <= 0) return;
    this.inercia = null;
    const e0 = this.escala;
    const x0 = this.tx;
    const y0 = this.ty;
    this.encajarCamara();
    this.camara = { t: 0, escala0: e0, escala1: this.escala, tx0: x0, ty0: y0, tx1: this.tx, ty1: this.ty };
    this.escala = e0;
    this.tx = x0;
    this.ty = y0;
    this.autoEncaje = true;
    this.cambiarMovido(false);
    this.pedir();
  }

  // ── Tamaño y cámara ────────────────────────────────────────────────────────

  private medir(): void {
    const caja = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const ancho = Math.max(0, Math.round(caja.width));
    const alto = Math.max(0, Math.round(caja.height));
    if (ancho === this.ancho && alto === this.alto && dpr === this.dpr) return;
    this.ancho = ancho;
    this.alto = alto;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(ancho * dpr));
    this.canvas.height = Math.max(1, Math.round(alto * dpr));
    if (this.autoEncaje) this.encajarCamara();
    this.pedir();
  }

  /** moodiary `_fitCamera`. */
  private encajarCamara(): void {
    const pos = this.props.marco.posiciones;
    const n = this.props.escena.datos.nodos.length;
    if (pos.length !== n * 2 || n === 0 || this.ancho <= 0 || this.alto <= 0) return;
    const extension = this.props.extension;
    if (extension !== null && extension > 0) {
      this.escala = acotar((Math.min(this.ancho, this.alto) * 0.42) / extension, 0.35, 1.6);
      this.tx = this.ancho / 2;
      this.ty = this.alto / 2;
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      minX = Math.min(minX, pos[i * 2]);
      maxX = Math.max(maxX, pos[i * 2]);
      minY = Math.min(minY, pos[i * 2 + 1]);
      maxY = Math.max(maxY, pos[i * 2 + 1]);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return;
    const w = maxX - minX;
    const h = maxY - minY;
    const sx = w <= 0 ? A.encajeMaximoInicial : (this.ancho - A.margenEncaje * 2) / w;
    const sy = h <= 0 ? A.encajeMaximoInicial : (this.alto - A.margenEncaje * 2) / h;
    this.escala = acotar(Math.min(sx, sy), A.escalaMin, A.encajeMaximoInicial);
    this.tx = this.ancho / 2 - ((minX + maxX) / 2) * this.escala;
    this.ty = this.alto / 2 - ((minY + maxY) / 2) * this.escala;
  }

  private cambiarMovido(v: boolean): void {
    if (this.movido === v) return;
    this.movido = v;
    this.props.alMover(v);
  }

  /** Acerca o aleja alrededor del punto (x, y) de la pantalla, sin mover lo que hay debajo. */
  private acercar(nuevaEscala: number, x: number, y: number): void {
    const e = acotar(nuevaEscala, A.escalaMin, A.escalaMax);
    const mundoX = (x - this.tx) / this.escala;
    const mundoY = (y - this.ty) / this.escala;
    this.escala = e;
    this.tx = x - mundoX * e;
    this.ty = y - mundoY * e;
  }

  // ── Eventos ────────────────────────────────────────────────────────────────

  private alCuadro = (): void => {
    const { marco } = this.props;
    if (!marco.asentado && this.asentarT !== 0) this.asentarT = 0;
    if (this.autoEncaje && this.ancho > 0) this.encajarCamara();
    this.pedir();
  };

  private local(e: PointerEvent | WheelEvent): Punto {
    const caja = this.canvas.getBoundingClientRect();
    return { x: e.clientX - caja.left, y: e.clientY - caja.top };
  }

  private empezarGesto(): void {
    const puntos = [...this.punteros.values()];
    if (!puntos.length) {
      this.gesto = null;
      return;
    }
    const centro = { x: puntos.reduce((s, p) => s + p.x, 0) / puntos.length, y: puntos.reduce((s, p) => s + p.y, 0) / puntos.length };
    const distancia0 = puntos.length > 1 ? Math.hypot(puntos[1].x - puntos[0].x, puntos[1].y - puntos[0].y) : 0;
    this.gesto = { escala0: this.escala, tx0: this.tx, ty0: this.ty, foco: centro, distancia0 };
  }

  private alBajar = (e: PointerEvent): void => {
    this.canvas.setPointerCapture?.(e.pointerId);
    this.canvas.focus({ preventScroll: true });
    this.punteros.set(e.pointerId, this.local(e));
    this.inercia = null;
    this.camara = null;
    if (this.punteros.size === 1) {
      const p = this.local(e);
      this.toque = { x: p.x, y: p.y, t: performance.now() };
      this.arrastrando = false;
      this.muestras = [{ x: p.x, y: p.y, t: performance.now() }];
    } else {
      this.toque = null;
      this.arrastrando = true;
      this.autoEncaje = false;
      this.cambiarMovido(true);
    }
    this.empezarGesto();
  };

  private alMoverPuntero = (e: PointerEvent): void => {
    if (!this.punteros.has(e.pointerId)) return;
    const p = this.local(e);
    this.punteros.set(e.pointerId, p);
    if (!this.arrastrando && this.toque && Math.hypot(p.x - this.toque.x, p.y - this.toque.y) > UMBRAL_ARRASTRE_PX) {
      this.arrastrando = true;
      this.autoEncaje = false;
      this.cambiarMovido(true);
      this.empezarGesto();
    }
    if (!this.arrastrando || !this.gesto) return;
    const puntos = [...this.punteros.values()];
    const centro = { x: puntos.reduce((s, q) => s + q.x, 0) / puntos.length, y: puntos.reduce((s, q) => s + q.y, 0) / puntos.length };
    const g = this.gesto;
    const razon = puntos.length > 1 && g.distancia0 > 0 ? Math.hypot(puntos[1].x - puntos[0].x, puntos[1].y - puntos[0].y) / g.distancia0 : 1;
    const nuevaEscala = acotar(g.escala0 * razon, A.escalaMin, A.escalaMax);
    const mundoX = (g.foco.x - g.tx0) / g.escala0;
    const mundoY = (g.foco.y - g.ty0) / g.escala0;
    this.escala = nuevaEscala;
    this.tx = centro.x - mundoX * nuevaEscala;
    this.ty = centro.y - mundoY * nuevaEscala;
    const ahora = performance.now();
    this.muestras.push({ x: centro.x, y: centro.y, t: ahora });
    this.muestras = this.muestras.filter((m) => ahora - m.t < 120);
    this.pedir();
  };

  private terminarPuntero(e: PointerEvent, cancelado: boolean): void {
    if (!this.punteros.has(e.pointerId)) return;
    const p = this.local(e);
    this.punteros.delete(e.pointerId);
    this.canvas.releasePointerCapture?.(e.pointerId);
    if (this.punteros.size > 0) {
      this.empezarGesto();
      return;
    }
    if (!this.arrastrando && this.toque && !cancelado) {
      this.props.alSeleccionar(this.buscarNodo(p.x, p.y));
    } else if (this.arrastrando && !cancelado) {
      this.empezarInercia();
    }
    this.toque = null;
    this.arrastrando = false;
    this.gesto = null;
  }

  private alSubir = (e: PointerEvent): void => this.terminarPuntero(e, false);
  private alCancelar = (e: PointerEvent): void => this.terminarPuntero(e, true);

  private empezarInercia(): void {
    const m = this.muestras;
    if (m.length < 2) return;
    const a = m[0];
    const b = m[m.length - 1];
    const dt = (b.t - a.t) / 1000;
    if (dt <= 0) return;
    const v = { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
    if (Math.hypot(v.x, v.y) < A.inerciaCorteSegundoPx * 3) return;
    this.inercia = v;
    this.pedir();
  }

  private alRueda = (e: WheelEvent): void => {
    e.preventDefault();
    const p = this.local(e);
    const paso = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
    this.autoEncaje = false;
    this.cambiarMovido(true);
    this.camara = null;
    this.acercar(this.escala * Math.exp(-paso * (e.ctrlKey ? 0.01 : 0.0015)), p.x, p.y);
    this.pedir();
  };

  /** Flechas: pasa de un nodo al siguiente (en el orden de las etiquetas); Escape suelta la selección. */
  private alTecla = (e: KeyboardEvent): void => {
    const orden = this.props.escena.ordenEtiquetas;
    if (!orden.length) return;
    const actual = this.props.seleccionado;
    const posicion = actual === null ? -1 : orden.indexOf(actual);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      this.props.alSeleccionar(orden[(posicion + 1) % orden.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      this.props.alSeleccionar(orden[(posicion <= 0 ? orden.length : posicion) - 1]);
    } else if (e.key === "Escape" && actual !== null) {
      e.preventDefault();
      this.props.alSeleccionar(null);
    }
  };

  /** moodiary `_hitTest`: el nodo más cercano dentro de su radio más un margen de 12 px. */
  private buscarNodo(x: number, y: number): number | null {
    const { escena, marco } = this.props;
    const pos = marco.posiciones;
    const n = escena.datos.nodos.length;
    if (pos.length !== n * 2) return null;
    let mejor = -1;
    let mejorD2 = Infinity;
    for (let i = 0; i < n; i++) {
      const dx = pos[i * 2] * this.escala + this.tx - x;
      const dy = pos[i * 2 + 1] * this.escala + this.ty - y;
      const d2 = dx * dx + dy * dy;
      const r = escena.radios[i] * this.escala + A.margenToquePx;
      if (d2 <= r * r && d2 < mejorD2) {
        mejorD2 = d2;
        mejor = i;
      }
    }
    return mejor < 0 ? null : mejor;
  }

  // ── Animación ──────────────────────────────────────────────────────────────

  private pedir(): void {
    if (this.raf !== null) return;
    this.raf = requestAnimationFrame(this.cuadro);
  }

  private cuadro = (ts: number): void => {
    this.raf = null;
    const dt = this.ultimoTs ? Math.min(0.05, (ts - this.ultimoTs) / 1000) : 1 / 60;
    this.ultimoTs = ts;
    let seguir = false;

    if (this.foco !== null) {
      if (this.focoDestino === 1) this.focoT = Math.min(1, this.focoT + (dt * 1000) / A.enfoqueMs);
      else this.focoT = Math.max(0, this.focoT - (dt * 1000) / A.desenfoqueMs);
      if (this.focoT === 0 && this.focoDestino === 0) this.foco = null;
      else if (this.focoT !== this.focoDestino) seguir = true;
    }
    if (this.salida !== null) {
      this.salidaT -= (dt * 1000) / A.desenfoqueMs;
      if (this.salidaT <= 0) {
        this.salida = null;
        this.salidaT = 0;
      } else seguir = true;
    }
    if (this.props.marco.asentado && this.asentarT < 1) {
      this.asentarT = Math.min(1, this.asentarT + (dt * 1000) / A.asentarMs);
      if (this.asentarT < 1) seguir = true;
    }
    if (this.camara) {
      const c = this.camara;
      c.t = Math.min(1, c.t + (dt * 1000) / A.camaraMs);
      const e = suaveCubica(c.t);
      this.escala = Math.exp(Math.log(c.escala0) + (Math.log(c.escala1) - Math.log(c.escala0)) * e);
      this.tx = c.tx0 + (c.tx1 - c.tx0) * e;
      this.ty = c.ty0 + (c.ty1 - c.ty0) * e;
      if (c.t >= 1) this.camara = null;
      else seguir = true;
    }
    if (this.inercia) {
      this.tx += this.inercia.x * dt;
      this.ty += this.inercia.y * dt;
      const f = A.inerciaFriccion ** (dt * 60);
      this.inercia = { x: this.inercia.x * f, y: this.inercia.y * f };
      if (Math.hypot(this.inercia.x, this.inercia.y) < A.inerciaCorteSegundoPx) this.inercia = null;
      else seguir = true;
    }

    this.dibujar();
    if (seguir) this.raf = requestAnimationFrame(this.cuadro);
    else this.ultimoTs = 0;
  };

  // ── Dibujo ─────────────────────────────────────────────────────────────────

  private dibujar(): void {
    const { ctx } = this;
    const { escena, marco, paleta } = this.props;
    const pos = marco.posiciones;
    const n = escena.datos.nodos.length;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Entre una escena y la siguiente las listas pueden tardar un cuadro en coincidir: ese cuadro no se dibuja
    if (n === 0 || pos.length !== n * 2 || this.ancho <= 0 || this.props.colores.length !== n || this.props.rotulos.length !== n) return;

    const foco = this.foco !== null && this.foco < n ? this.foco : null;
    const focoT = foco === null ? 0 : this.focoT;
    const salida = this.salida !== null && this.salida < n ? this.salida : null;
    const salidaT = salida === null ? 0 : this.salidaT;
    const atenuado = Math.max(focoT, salidaT);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.fondo();

    ctx.setTransform(this.dpr * this.escala, 0, 0, this.dpr * this.escala, this.dpr * this.tx, this.dpr * this.ty);
    this.aristas(foco);
    this.nodos(atenuado, [salida, foco]);
    if (salida !== null) this.nodoEnfocado(salida, salidaT, atenuado);
    if (foco !== null) this.nodoEnfocado(foco, focoT, atenuado);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.props.etiquetas && this.asentarT > 0.01) {
      ctx.globalAlpha = this.asentarT;
      this.rotulos(foco, focoT);
      ctx.globalAlpha = 1;
    }
    if (paleta.vineta) {
      const r = 0.78 * Math.min(this.ancho, this.alto);
      const g = ctx.createRadialGradient(this.ancho / 2, this.alto / 2, 0, this.ancho / 2, this.alto / 2, r);
      g.addColorStop(0, colorCss(paleta.vineta, 0));
      g.addColorStop(1, colorCss(paleta.vineta));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.ancho, this.alto);
    }
  }

  /** Foco de luz y rejilla de puntos que se mueve con la cámara. */
  private fondo(): void {
    const { ctx, ancho, alto } = this;
    const { paleta } = this.props;
    const cy = alto * 0.425;
    const luz = ctx.createRadialGradient(ancho / 2, cy, 0, ancho / 2, cy, 0.95 * Math.min(ancho, alto));
    luz.addColorStop(0, colorCss(paleta.foco));
    luz.addColorStop(1, colorCss(paleta.foco, 0));
    ctx.fillStyle = luz;
    ctx.fillRect(0, 0, ancho, alto);

    let separacion: number = A.puntoSeparacion;
    let paso = separacion * this.escala;
    if (paso > A.puntoMaxPx) {
      separacion = A.puntoSeparacionAmplia;
      paso = separacion * this.escala;
    }
    if (paso < A.puntoMinPx) return;
    const columnas = Math.ceil(ancho / paso) + 1;
    const filas = Math.ceil(alto / paso) + 1;
    if (columnas * filas > 6000) return;
    const x0 = ((this.tx % paso) + paso) % paso;
    const y0 = ((this.ty % paso) + paso) % paso;
    ctx.fillStyle = colorCss(paleta.punto);
    ctx.beginPath();
    for (let r = 0; r < filas; r++) for (let c = 0; c < columnas; c++) ctx.rect(x0 + c * paso - 1, y0 + r * paso - 1, 2, 2);
    ctx.fill();
  }

  /** Flechas: una línea hasta la base de la punta y un triángulo en el extremo del destino, agrupadas por estilo. */
  private aristas(foco: number | null): void {
    const { ctx } = this;
    const { escena, marco, paleta, colores, direcciones } = this.props;
    const pos = marco.posiciones;
    const aristas = escena.datos.aristas;
    const total = aristas.length / 2;
    if (!total) return;
    const radios = escena.radios;
    const centro = escena.centro;
    const base = colorDeArista(paleta, total);
    const grupos = new Map<string, { lineas: Path2D; puntas: Path2D; color: Rgba; ancho: number }>();
    const minimo = 0.6 / this.escala;
    for (let k = 0; k < total; k++) {
      const a = aristas[k * 2];
      const b = aristas[k * 2 + 1];
      let color: Rgba = base;
      if (direcciones && centro !== null) {
        if (a === centro) color = [paleta.saliente[0], paleta.saliente[1], paleta.saliente[2], 0.8];
        else if (b === centro) color = [paleta.entrante[0], paleta.entrante[1], paleta.entrante[2], 0.8];
      }
      let ancho = direcciones ? 0.9 : A.aristaAncho;
      if (foco !== null) {
        if (a === foco || b === foco) {
          color = colores[a];
          ancho = A.aristaAnchoResaltada;
        } else {
          color = atenuarArista(color);
        }
      }
      const ax = pos[a * 2];
      const ay = pos[a * 2 + 1];
      const bx = pos[b * 2];
      const by = pos[b * 2 + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const largo = Math.hypot(dx, dy);
      const largoPunta = 2.4 + radios[b] * 0.24;
      const mitad = largoPunta * 0.38;
      const recorteA = radios[a] + 1;
      const recorteB = radios[b] + 1.5;
      if (!Number.isFinite(largo) || largo <= recorteA + recorteB + largoPunta + 2) continue;
      const ux = dx / largo;
      const uy = dy / largo;
      const puntaX = bx - ux * recorteB;
      const puntaY = by - uy * recorteB;
      const fondoX = puntaX - ux * largoPunta;
      const fondoY = puntaY - uy * largoPunta;
      const anchoReal = Math.max(ancho, minimo);
      const clave = `${color[0]},${color[1]},${color[2]},${color[3].toFixed(3)}|${anchoReal.toFixed(3)}`;
      let g = grupos.get(clave);
      if (!g) {
        g = { lineas: new Path2D(), puntas: new Path2D(), color, ancho: anchoReal };
        grupos.set(clave, g);
      }
      g.lineas.moveTo(ax + ux * recorteA, ay + uy * recorteA);
      g.lineas.lineTo(fondoX, fondoY);
      g.puntas.moveTo(puntaX, puntaY);
      g.puntas.lineTo(fondoX - uy * mitad, fondoY + ux * mitad);
      g.puntas.lineTo(fondoX + uy * mitad, fondoY - ux * mitad);
      g.puntas.closePath();
    }
    for (const g of grupos.values()) {
      ctx.strokeStyle = colorCss(g.color);
      ctx.lineWidth = g.ancho;
      ctx.stroke(g.lineas);
      ctx.fillStyle = colorCss(g.color, Math.min(0.95, g.color[3] * 2.2));
      ctx.fill(g.puntas);
    }
  }

  /** Los círculos, agrupados por color. Los que se dibujan aparte (el elegido y el que se suelta) se saltan. */
  private nodos(atenuado: number, aparte: (number | null)[]): void {
    const { ctx } = this;
    const { escena, marco, colores, paleta } = this.props;
    const pos = marco.posiciones;
    const n = escena.datos.nodos.length;
    const grupos = new Map<string, { camino: Path2D; color: Rgba }>();
    for (let i = 0; i < n; i++) {
      if (aparte.includes(i)) continue;
      const color = atenuado > 0 ? mezclar(colores[i], atenuar(colores[i], paleta.oscuro), atenuado) : colores[i];
      const clave = colorCss(color);
      let g = grupos.get(clave);
      if (!g) {
        g = { camino: new Path2D(), color };
        grupos.set(clave, g);
      }
      const x = pos[i * 2];
      const y = pos[i * 2 + 1];
      const r = escena.radios[i];
      g.camino.moveTo(x + r, y);
      g.camino.arc(x, y, r, 0, TAU);
    }
    for (const [clave, g] of grupos) {
      ctx.fillStyle = clave;
      ctx.fill(g.camino);
    }
  }

  /** moodiary `_paintFocus`: los vecinos recuperan su color y el nodo elegido lleva un anillo con el núcleo más chico. */
  private nodoEnfocado(i: number, t: number, atenuado: number): void {
    const { ctx } = this;
    const { escena, marco, colores, paleta } = this.props;
    const pos = marco.posiciones;
    for (let k = escena.desplazamientos[i]; k < escena.desplazamientos[i + 1]; k++) {
      const v = escena.destinos[k];
      const c = colores[v];
      ctx.fillStyle = colorCss(mezclar(mezclar(c, atenuar(c, paleta.oscuro), atenuado), c, t));
      ctx.beginPath();
      ctx.arc(pos[v * 2], pos[v * 2 + 1], escena.radios[v], 0, TAU);
      ctx.fill();
    }
    const x = pos[i * 2];
    const y = pos[i * 2 + 1];
    const exterior = escena.radios[i];
    const color = colorCss(colores[i]);
    const anchoAnillo = Math.min(exterior, Math.max(A.anilloElegidoAncho, A.anilloElegidoMinPx / this.escala));
    ctx.strokeStyle = color;
    ctx.lineWidth = anchoAnillo;
    ctx.beginPath();
    ctx.arc(x, y, exterior - anchoAnillo / 2, 0, TAU);
    ctx.stroke();
    const nucleo = exterior + (radioNucleoElegido(exterior) - exterior) * t;
    if (nucleo > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, nucleo, 0, TAU);
      ctx.fill();
    }
  }

  /** Etiquetas bajo cada nodo, de los de más enlaces a los de menos, sin solaparse (rejilla de celdas ocupadas) y hasta 140. */
  private rotulos(foco: number | null, focoT: number): void {
    const { ctx } = this;
    const { escena, marco, paleta, rotulos } = this.props;
    const pos = marco.posiciones;
    ctx.font = `${A.etiquetaTamano}px ${this.familia}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineJoin = "round";
    ctx.lineWidth = paleta.oscuro ? 4 : 3.5;
    ctx.strokeStyle = colorCss(paleta.halo);
    ctx.fillStyle = colorCss(paleta.etiqueta);
    const ocupadas = new Set<number>();
    const celda = A.etiquetaCeldaPx;
    const clave = (r: number, c: number) => ((r & 0xffff) << 16) | (c & 0xffff);
    let dibujadas = 0;
    for (const i of escena.ordenEtiquetas) {
      if (dibujadas >= A.etiquetasMax) break;
      const siempre = i === foco || i === escena.centro;
      if (foco !== null && focoT > 0.5 && i !== foco && !esVecino(escena, foco, i)) continue;
      const sx = pos[i * 2] * this.escala + this.tx;
      const sy = pos[i * 2 + 1] * this.escala + this.ty;
      if (sx < -80 || sx > this.ancho + 80 || sy < -40 || sy > this.alto + 40) continue;
      const medida = this.medirRotulo(i, rotulos[i] ?? "");
      const izquierda = sx - medida.ancho / 2;
      const arriba = sy + escena.radios[i] * this.escala + 5;
      const c0 = Math.floor(izquierda / celda);
      const c1 = Math.floor((izquierda + medida.ancho) / celda);
      const r0 = Math.floor(arriba / celda);
      const r1 = Math.floor((arriba + A.etiquetaTamano * 1.2) / celda);
      let bloqueada = false;
      for (let r = r0; r <= r1 && !bloqueada; r++) for (let c = c0; c <= c1; c++) if (ocupadas.has(clave(r, c))) { bloqueada = true; break; }
      if (bloqueada && !siempre) continue;
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) ocupadas.add(clave(r, c));
      ctx.strokeText(medida.texto, sx, arriba);
      ctx.fillText(medida.texto, sx, arriba);
      dibujadas++;
    }
  }

  private medirRotulo(i: number, texto: string): { texto: string; ancho: number } {
    const guardado = this.rotulosMedidos.get(i);
    if (guardado) return guardado;
    let t = texto;
    let ancho = this.ctx.measureText(t).width;
    // Casi nunca pasa (el rótulo ya viene cortado en 10 caracteres), pero con letras anchas se acorta hasta que entre
    while (ancho > A.etiquetaAnchoMax && t.length > 1) {
      t = `${t.replace(/…$/, "").slice(0, -1)}…`;
      ancho = this.ctx.measureText(t).width;
    }
    const medida = { texto: t, ancho };
    this.rotulosMedidos.set(i, medida);
    return medida;
  }
}
