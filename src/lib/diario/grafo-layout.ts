// Diario (lane 295): disposición del grafo por fuerzas. Portado de vendor/moodiary/packages/foundation/fast_core/rust/src/graph/layout.rs (ZhuJHua/moodiary@2c552dd):
// repulsión Barnes–Hut sobre un árbol cuaternario, resortes en los enlaces, gravedad al centro, colisiones en rejilla, enfriamiento (alfa), escala normalizada
// al largo del resorte y nodos fijos. En moodiary corre en un hilo de Rust y manda cuadros por un canal; acá es un generador: cada `next()` entrega un cuadro.
// Sin dibujo ni red.

/** moodiary `GraphLayoutParams`. Lo que vale 0 (o es inválido) toma el valor por omisión de `normalizar`. */
export interface ParametrosFuerzas {
  iteraciones: number;
  theta: number;
  repulsion: number;
  largoResorte: number;
  fuerzaResorte: number;
  gravedad: number;
  radioColision: number;
  decaimientoVelocidad: number;
  /** Cada cuántas iteraciones se entrega un cuadro. */
  emitirCada: number;
  alfaInicial: number;
  /** Desplazamiento (en largos de resorte) por debajo del cual el grafo se da por quieto; 0 = nunca. */
  pasoMinimo: number;
  /** Los primeros `fijos` nodos no se mueven. */
  fijos: number;
  normalizarEscala: boolean;
}

interface Parametros {
  iteraciones: number;
  thetaCuadrado: number;
  repulsion: number;
  largoResorte: number;
  fuerzaResorte: number;
  gravedad: number;
  radioColision: number;
  velocidadRetenida: number;
  emitirCada: number;
  alfaInicial: number;
  pasoMinimo: number;
  fijos: number;
  normalizarEscala: boolean;
}

export function normalizar(p: ParametrosFuerzas): Parametros {
  const pos = (v: number, d: number) => (v > 0 ? v : d);
  const theta = pos(p.theta, 0.9);
  const decaimiento = p.decaimientoVelocidad > 0 && p.decaimientoVelocidad < 1 ? p.decaimientoVelocidad : 0.4;
  return {
    iteraciones: p.iteraciones > 0 ? Math.floor(p.iteraciones) : 400,
    thetaCuadrado: theta * theta,
    repulsion: pos(p.repulsion, 72),
    largoResorte: pos(p.largoResorte, 60),
    fuerzaResorte: pos(p.fuerzaResorte, 0.08),
    gravedad: p.gravedad >= 0 ? p.gravedad : 0.02,
    radioColision: pos(p.radioColision, 12),
    velocidadRetenida: 1 - decaimiento,
    emitirCada: p.emitirCada > 0 ? Math.floor(p.emitirCada) : 1,
    alfaInicial: p.alfaInicial > 0 && p.alfaInicial <= 1 ? p.alfaInicial : 1,
    pasoMinimo: Math.max(0, p.pasoMinimo),
    fijos: Math.max(0, Math.floor(p.fijos)),
    normalizarEscala: p.normalizarEscala,
  };
}

const SUAVIZADO = 0.01;
const PROFUNDIDAD_MAX = 24;
const ALFA_MIN = 0.001;
const ABERTURA_SEMILLA = 20;
const PASOS_QUIETO = 5;
const ALFA_QUIETO = 0.05;
const ANGULO_AUREO = 2.3999632;

/** Posiciones de partida: las dadas o, sin ellas, una espiral áurea (`seed_positions`). */
export function posicionesIniciales(n: number, inicial: ArrayLike<number> | null): Float32Array {
  if (inicial && inicial.length) {
    if (inicial.length !== n * 2) throw new Error(`initial_positions: se esperaban ${n * 2} valores y llegaron ${inicial.length}`);
    return Float32Array.from(inicial);
  }
  const escala = ABERTURA_SEMILLA * Math.max(Math.sqrt(n), 1);
  const pos = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const r = escala * Math.sqrt(i / Math.max(n, 1));
    const a = i * ANGULO_AUREO;
    pos[i * 2] = r * Math.cos(a);
    pos[i * 2 + 1] = r * Math.sin(a);
  }
  return pos;
}

/** `node_masses`: cada nodo pesa 1 más su cantidad de enlaces. */
function masasDe(n: number, aristas: ArrayLike<number>): Float32Array {
  const m = new Float32Array(n).fill(1);
  for (let k = 0; k + 1 < aristas.length; k += 2) {
    m[aristas[k]] += 1;
    m[aristas[k + 1]] += 1;
  }
  return m;
}

/** `layout_scale`: la mediana del largo de los enlaces (o, sin enlaces, la diagonal repartida entre los nodos). */
function escalaDelDiseno(pos: Float32Array, aristas: ArrayLike<number>, n: number): number {
  if (n === 0) return 1;
  const largos: number[] = [];
  for (let k = 0; k + 1 < aristas.length; k += 2) {
    const a = aristas[k];
    const b = aristas[k + 1];
    if (a === b) continue;
    largos.push(Math.hypot(pos[b * 2] - pos[a * 2], pos[b * 2 + 1] - pos[a * 2 + 1]));
  }
  if (!largos.length) {
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
    return Math.max(Math.hypot(maxX - minX, maxY - minY) / (4 * Math.max(Math.sqrt(n), 1)), 1e-6);
  }
  largos.sort((x, y) => x - y);
  return Math.max(largos[Math.floor(largos.length / 2)], 1e-6);
}

function atraccion(pos: Float32Array, aristas: ArrayLike<number>, p: Parametros, fuerza: Float32Array): void {
  const ka = p.fuerzaResorte;
  for (let k = 0; k + 1 < aristas.length; k += 2) {
    const a = aristas[k];
    const b = aristas[k + 1];
    if (a === b) continue;
    const fx = (pos[b * 2] - pos[a * 2]) * ka;
    const fy = (pos[b * 2 + 1] - pos[a * 2 + 1]) * ka;
    fuerza[a * 2] += fx;
    fuerza[a * 2 + 1] += fy;
    fuerza[b * 2] -= fx;
    fuerza[b * 2 + 1] -= fy;
  }
}

function gravedadAlCentro(pos: Float32Array, n: number, p: Parametros, fuerza: Float32Array): void {
  if (p.gravedad <= 0) return;
  for (let i = 0; i < n; i++) {
    fuerza[i * 2] -= pos[i * 2] * p.gravedad;
    fuerza[i * 2 + 1] -= pos[i * 2 + 1] * p.gravedad;
  }
}

// ── Árbol cuaternario de Barnes–Hut ──────────────────────────────────────────

class Arbol {
  cx: number[] = [];
  cy: number[] = [];
  mitad: number[] = [];
  masa: number[] = [];
  comX: number[] = [];
  comY: number[] = [];
  cuerpo: number[] = [];
  hijos: number[] = [];
  interno: boolean[] = [];
  pila: number[] = [];

  reiniciar(cx: number, cy: number, mitad: number): void {
    this.cx.length = this.cy.length = this.mitad.length = this.masa.length = this.comX.length = this.comY.length = this.cuerpo.length = this.hijos.length = this.interno.length = 0;
    this.nueva(cx, cy, mitad);
  }

  private nueva(cx: number, cy: number, mitad: number): number {
    const idx = this.cx.length;
    this.cx.push(cx);
    this.cy.push(cy);
    this.mitad.push(mitad);
    this.masa.push(0);
    this.comX.push(0);
    this.comY.push(0);
    this.cuerpo.push(-1);
    this.hijos.push(-1, -1, -1, -1);
    this.interno.push(false);
    return idx;
  }

  private cuadrante(celda: number, x: number, y: number): number {
    return (y >= this.cy[celda] ? 2 : 0) + (x >= this.cx[celda] ? 1 : 0);
  }

  private celdaHija(celda: number, q: number): number {
    const existente = this.hijos[celda * 4 + q];
    if (existente >= 0) return existente;
    const h = this.mitad[celda] * 0.5;
    const idx = this.nueva((q & 1) === 1 ? this.cx[celda] + h : this.cx[celda] - h, (q & 2) === 2 ? this.cy[celda] + h : this.cy[celda] - h, h);
    this.hijos[celda * 4 + q] = idx;
    return idx;
  }

  private sumar(celda: number, x: number, y: number, masa: number): void {
    const m = this.masa[celda] + masa;
    this.comX[celda] = (this.comX[celda] * this.masa[celda] + x * masa) / m;
    this.comY[celda] = (this.comY[celda] * this.masa[celda] + y * masa) / m;
    this.masa[celda] = m;
  }

  insertar(cuerpo: number, x: number, y: number, masa: number, pos: Float32Array, masas: Float32Array): void {
    let celda = 0;
    let profundidad = 0;
    for (;;) {
      this.sumar(celda, x, y, masa);
      if (this.interno[celda]) {
        celda = this.celdaHija(celda, this.cuadrante(celda, x, y));
        profundidad++;
        continue;
      }
      if (this.cuerpo[celda] < 0) {
        this.cuerpo[celda] = cuerpo;
        return;
      }
      if (profundidad >= PROFUNDIDAD_MAX) return;
      const viejo = this.cuerpo[celda];
      const ox = pos[viejo * 2];
      const oy = pos[viejo * 2 + 1];
      this.interno[celda] = true;
      this.cuerpo[celda] = -1;
      const hijoViejo = this.celdaHija(celda, this.cuadrante(celda, ox, oy));
      this.sumar(hijoViejo, ox, oy, masas[viejo]);
      this.cuerpo[hijoViejo] = viejo;
      celda = this.celdaHija(celda, this.cuadrante(celda, x, y));
      profundidad++;
    }
  }

  /** Fuerza de repulsión sobre un cuerpo en (x, y): las celdas lejanas se tratan como una sola masa (criterio theta). */
  repulsionSobre(x: number, y: number, masaPropia: number, p: Parametros): [number, number] {
    let fx = 0;
    let fy = 0;
    const pila = this.pila;
    pila.length = 0;
    pila.push(0);
    while (pila.length) {
      const idx = pila.pop()!;
      if (this.masa[idx] === 0) continue;
      const dx = x - this.comX[idx];
      const dy = y - this.comY[idx];
      const distCuadrada = dx * dx + dy * dy + SUAVIZADO;
      const ancho = this.mitad[idx] * 2;
      if (!this.interno[idx] || ancho * ancho < p.thetaCuadrado * distCuadrada) {
        const f = (p.repulsion * masaPropia * this.masa[idx]) / distCuadrada;
        fx += dx * f;
        fy += dy * f;
        continue;
      }
      for (let q = 0; q < 4; q++) {
        const h = this.hijos[idx * 4 + q];
        if (h >= 0) pila.push(h);
      }
    }
    return [fx, fy];
  }
}

function repulsion(pos: Float32Array, masas: Float32Array, n: number, p: Parametros, fuerza: Float32Array, arbol: Arbol): void {
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
  arbol.reiniciar((minX + maxX) * 0.5, (minY + maxY) * 0.5, Math.max((maxX - minX) / 2, (maxY - minY) / 2, 1) + 1);
  for (let i = 0; i < n; i++) arbol.insertar(i, pos[i * 2], pos[i * 2 + 1], masas[i], pos, masas);
  for (let i = 0; i < n; i++) {
    const [fx, fy] = arbol.repulsionSobre(pos[i * 2], pos[i * 2 + 1], masas[i], p);
    fuerza[i * 2] += fx;
    fuerza[i * 2 + 1] += fy;
  }
}

/** `resolve_collisions`: separa los pares más cerca que 2 radios, usando una rejilla de celdas de ese lado; los nodos fijos no se mueven. */
function colisiones(pos: Float32Array, r: number, fijos: number): void {
  const n = pos.length / 2;
  if (r <= 0 || n < 2) return;
  const d = r * 2;
  const celdaDe = (v: number) => Math.floor(v / d);
  const clave = (cx: number, cy: number) => (cx + 1_048_576) * 2_097_152 + (cy + 1_048_576);
  const rejilla = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(pos[i * 2]) || !Number.isFinite(pos[i * 2 + 1])) continue;
    const k = clave(celdaDe(pos[i * 2]), celdaDe(pos[i * 2 + 1]));
    const lista = rejilla.get(k);
    if (lista) lista.push(i);
    else rejilla.set(k, [i]);
  }
  for (let i = 0; i < n; i++) {
    const cx = celdaDe(pos[i * 2]);
    const cy = celdaDe(pos[i * 2 + 1]);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const lista = rejilla.get(clave(gx, gy));
        if (!lista) continue;
        for (const j of lista) {
          if (j <= i) continue;
          const iFijo = i < fijos;
          const jFijo = j < fijos;
          if (iFijo && jFijo) continue;
          const wi = iFijo ? 0 : jFijo ? 1 : 0.5;
          const wj = jFijo ? 0 : iFijo ? 1 : 0.5;
          const dx = pos[j * 2] - pos[i * 2];
          const dy = pos[j * 2 + 1] - pos[i * 2 + 1];
          const distCuadrada = dx * dx + dy * dy;
          if (distCuadrada >= d * d) continue;
          if (distCuadrada <= 1.1920929e-7) {
            const a = i * ANGULO_AUREO;
            const s = Math.sin(a);
            const c = Math.cos(a);
            pos[i * 2] -= c * r * wi;
            pos[i * 2 + 1] -= s * r * wi;
            pos[j * 2] += c * r * wj;
            pos[j * 2 + 1] += s * r * wj;
            continue;
          }
          const dist = Math.sqrt(distCuadrada);
          const exceso = (d - dist) / dist;
          pos[i * 2] -= dx * exceso * wi;
          pos[i * 2 + 1] -= dy * exceso * wi;
          pos[j * 2] += dx * exceso * wj;
          pos[j * 2 + 1] += dy * exceso * wj;
        }
      }
    }
  }
}

interface Cuerpos {
  pos: Float32Array;
  vel: Float32Array;
  fuerza: Float32Array;
}

/** `integrate_step`: un paso de fuerzas y de velocidades. Devuelve el mayor desplazamiento. */
function paso(c: Cuerpos, aristas: ArrayLike<number>, masas: Float32Array, p: Parametros, alfa: number, escala: number, arbol: Arbol): number {
  const n = c.pos.length / 2;
  c.fuerza.fill(0);
  repulsion(c.pos, masas, n, p, c.fuerza, arbol);
  atraccion(c.pos, aristas, p, c.fuerza);
  gravedadAlCentro(c.pos, n, p, c.fuerza);
  const pasoMax = p.largoResorte * escala;
  const fijos = Math.min(p.fijos, n);
  let mayor = 0;
  for (let i = 0; i < n; i++) {
    const ix = i * 2;
    const iy = ix + 1;
    if (i < fijos) {
      c.vel[ix] = 0;
      c.vel[iy] = 0;
      continue;
    }
    let vx = c.vel[ix] * p.velocidadRetenida + c.fuerza[ix] * alfa;
    let vy = c.vel[iy] * p.velocidadRetenida + c.fuerza[iy] * alfa;
    let rapidez = Math.hypot(vx, vy);
    if (rapidez > pasoMax) {
      const s = pasoMax / rapidez;
      vx *= s;
      vy *= s;
      rapidez = pasoMax;
    }
    c.vel[ix] = vx;
    c.vel[iy] = vy;
    c.pos[ix] += vx;
    c.pos[iy] += vy;
    mayor = Math.max(mayor, rapidez);
  }
  colisiones(c.pos, p.radioColision * escala, fijos);
  return mayor;
}

const aEscala = (pos: Float32Array, escala: number): Float32Array => (escala === 1 ? Float32Array.from(pos) : pos.map((v) => v / escala));

/**
 * `layout_graph_stream` + `run_layout`: entrega primero las posiciones de partida y después un cuadro cada `emitirCada` iteraciones (y el último al quedar quieto
 * o al terminar). `aristas` son pares de índices sin sentido. Con 0 o 1 nodos entrega un solo cuadro. Lanza si un índice de `aristas` se sale de rango o si
 * `inicial` no mide `2 × n`.
 */
export function* disponerPorFuerzas(n: number, aristas: ArrayLike<number>, inicial: ArrayLike<number> | null, params: ParametrosFuerzas): Generator<Float32Array, void, undefined> {
  if (aristas.length % 2 !== 0) throw new Error("aristas: la longitud debe ser par (pares de índices)");
  for (let k = 0; k < aristas.length; k++) if (aristas[k] < 0 || aristas[k] >= n || !Number.isInteger(aristas[k])) throw new Error(`aristas: índice fuera de rango (${aristas[k]}, nodos=${n})`);
  const pos = posicionesIniciales(n, inicial);
  if (n <= 1) {
    yield pos;
    return;
  }
  const p = normalizar(params);
  const masas = masasDe(n, aristas);
  const c: Cuerpos = { pos, vel: new Float32Array(n * 2), fuerza: new Float32Array(n * 2) };
  const arbol = new Arbol();
  let escala = p.normalizarEscala ? Math.min(1e6, Math.max(1e-3, escalaDelDiseno(pos, aristas, n) / p.largoResorte)) : 1;
  yield aEscala(pos, escala);

  const decaimientoAlfa = 1 - ALFA_MIN ** (1 / p.iteraciones);
  let alfa = p.alfaInicial;
  let quieto = 0;
  for (let iter = 0; iter < p.iteraciones; iter++) {
    const movido = paso(c, aristas, masas, p, alfa, escala, arbol);
    alfa *= 1 - decaimientoAlfa;
    if (p.normalizarEscala) {
      const cruda = escalaDelDiseno(pos, aristas, n) / p.largoResorte;
      escala = Math.min(1e6, Math.max(1e-3, escala * 0.9 + cruda * 0.1));
    }
    const asentado = p.pasoMinimo > 0 && alfa < ALFA_QUIETO && movido < p.pasoMinimo * p.largoResorte * escala;
    quieto = asentado ? quieto + 1 : 0;
    const ultimo = quieto >= PASOS_QUIETO || iter + 1 === p.iteraciones;
    if (ultimo || iter % p.emitirCada === 0) yield aEscala(pos, escala);
    if (ultimo) return;
  }
}

/** Corre el motor hasta el final y devuelve el último cuadro y cuántas iteraciones hicieron falta (para las pruebas). */
export function disponerHastaElFinal(n: number, aristas: ArrayLike<number>, inicial: ArrayLike<number> | null, params: ParametrosFuerzas): { posiciones: Float32Array; cuadros: number } {
  let ultimo = posicionesIniciales(n, inicial);
  let cuadros = 0;
  for (const f of disponerPorFuerzas(n, aristas, inicial, params)) {
    ultimo = f;
    cuadros++;
  }
  return { posiciones: ultimo, cuadros };
}
