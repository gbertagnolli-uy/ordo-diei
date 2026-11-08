// Diario (lane 295): la escena del grafo (adyacencia, radios, orden de etiquetas), la siembra de posiciones y la disposición radial del grafo local.
// Portado de `GraphScene`, `seedByBfs`, `egoDirectionsOf` y `layoutEgoRadial` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/graph_scene.dart)
// y de `GraphTuning` (graph_style.dart) (ZhuJHua/moodiary@2c552dd). Sin dibujo: solo cuentas.
import type { DatosGrafo, DensidadGrafo } from "./grafo.ts";
import { cantidadAristas } from "./grafo.ts";

/** moodiary `GraphTuning`: medidas del dibujo y del motor de fuerzas. */
export const AJUSTES_GRAFO = {
  radioNodoMin: 5,
  radioNodoMax: 8.5,
  radioBase: 14,
  radioCentro: 9.5,
  anilloElegidoAncho: 1.6,
  anilloElegidoHueco: 1.2,
  anilloElegidoMinPx: 1.2,
  nucleoElegidoMinRazon: 0.34,
  aristaAncho: 0.8,
  aristaAnchoResaltada: 1.4,
  fuerzaResorte: 0.08,
  decaimientoVelocidad: 0.5,
  theta: 0.9,
  iteraciones: 600,
  iteracionesGrande: 900,
  nodosGrande: 1500,
  cuadrosObjetivo: 110,
  pasoMinRazon: 0.001,
  alfaRefresco: 0.3,
  puntoSeparacion: 48,
  puntoSeparacionAmplia: 192,
  puntoMinPx: 14,
  puntoMaxPx: 160,
  etiquetaTamano: 11,
  etiquetaAnchoMax: 116,
  etiquetasMax: 140,
  etiquetaCeldaPx: 30,
  margenEncaje: 64,
  encajeMaximoInicial: 1,
  escalaMin: 0.02,
  escalaMax: 24,
  margenToquePx: 12,
  inerciaFriccion: 0.92,
  inerciaCorteSegundoPx: 40,
  asentarMs: 260,
  enfoqueMs: 220,
  desenfoqueMs: 180,
  camaraMs: 420,
} as const;

export const longitudResorte = (d: DensidadGrafo): number => AJUSTES_GRAFO.radioBase * (d === "dispersa" ? 7 : d === "normal" ? 4.5 : 3.2);
export const radioColision = (d: DensidadGrafo): number => (d === "dispersa" ? 34 : d === "normal" ? 27 : 21);
export const gravedad = (d: DensidadGrafo): number => (d === "dispersa" ? 0.02 : d === "normal" ? 0.03 : 0.05);
export const repulsion = (d: DensidadGrafo): number => AJUSTES_GRAFO.fuerzaResorte * (longitudResorte(d) / 2) ** 2;

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** moodiary `GraphTuning.radiusOf`: crece con la raíz del grado, entre el mínimo y el máximo. */
export function radioDeNodo(grado: number, tope: number): number {
  const { radioNodoMin, radioNodoMax } = AJUSTES_GRAFO;
  if (tope <= 1) return radioNodoMin;
  const t = clamp((clamp(grado, 1, tope) - 1) / (tope - 1), 0, 1);
  return radioNodoMin + (radioNodoMax - radioNodoMin) * Math.sqrt(t);
}

/** moodiary `selectedCoreRadius`: el núcleo del nodo elegido se achica para dejar lugar al anillo. */
export const radioNucleoElegido = (r: number): number => Math.max(r * AJUSTES_GRAFO.nucleoElegidoMinRazon, r - AJUSTES_GRAFO.anilloElegidoAncho - AJUSTES_GRAFO.anilloElegidoHueco);

export interface Escena {
  datos: DatosGrafo;
  /** Adyacencia sin repetidos ni sentido (CSR): los vecinos de `i` son `destinos[desplazamientos[i] .. desplazamientos[i + 1]]`. */
  desplazamientos: Int32Array;
  destinos: Int32Array;
  /** Cada enlace una sola vez, con el índice menor primero: lo que recibe el motor de fuerzas. */
  aristasNoDirigidas: Int32Array;
  radios: Float32Array;
  /** Índices de los nodos en el orden en que se les pone etiqueta: el centro, luego los de más enlaces. */
  ordenEtiquetas: Int32Array;
  centro: number | null;
}

export const gradoDe = (e: Escena, i: number): number => e.desplazamientos[i + 1] - e.desplazamientos[i];

export function esVecino(e: Escena, i: number, j: number): boolean {
  for (let k = e.desplazamientos[i]; k < e.desplazamientos[i + 1]; k++) if (e.destinos[k] === j) return true;
  return false;
}

/** moodiary `_buildCsr`: se ignoran los enlaces a uno mismo y los que se salen de rango; A→B y B→A cuentan como un solo vecino. */
function adyacencia(n: number, aristas: number[]): { desplazamientos: Int32Array; destinos: Int32Array } {
  if (n === 0) return { desplazamientos: new Int32Array(1), destinos: new Int32Array(0) };
  const claves: number[] = [];
  for (let e = 0; e + 1 < aristas.length; e += 2) {
    const a = aristas[e];
    const b = aristas[e + 1];
    if (a === b || a < 0 || b < 0 || a >= n || b >= n) continue;
    claves.push(a * n + b, b * n + a);
  }
  const ordenadas = Float64Array.from(claves).sort();
  const desplazamientos = new Int32Array(n + 1);
  const destinos: number[] = [];
  let previa = -1;
  for (const clave of ordenadas) {
    if (clave === previa) continue;
    previa = clave;
    desplazamientos[Math.floor(clave / n) + 1]++;
    destinos.push(clave % n);
  }
  for (let i = 0; i < n; i++) desplazamientos[i + 1] += desplazamientos[i];
  return { desplazamientos, destinos: Int32Array.from(destinos) };
}

function noDirigidas(desplazamientos: Int32Array, destinos: Int32Array): Int32Array {
  const n = desplazamientos.length - 1;
  const salida: number[] = [];
  for (let a = 0; a < n; a++) for (let k = desplazamientos[a]; k < desplazamientos[a + 1]; k++) if (destinos[k] > a) salida.push(a, destinos[k]);
  return Int32Array.from(salida);
}

/** Percentil 95 de los grados (índice redondeado), como `_percentile95`. */
function percentil95(grados: Int32Array): number {
  if (!grados.length) return 1;
  const ordenados = Int32Array.from(grados).sort();
  return ordenados[Math.round((ordenados.length - 1) * 0.95)];
}

/** moodiary `GraphScene.build` (sin los lotes de dibujo de Flutter ni los colores, que salen de `paleta.ts`). */
export function construirEscena(datos: DatosGrafo): Escena {
  const n = datos.nodos.length;
  const { desplazamientos, destinos } = adyacencia(n, datos.aristas);
  const grados = new Int32Array(n);
  for (let i = 0; i < n; i++) grados[i] = desplazamientos[i + 1] - desplazamientos[i];
  const tope = clamp(percentil95(grados), 4, 24);
  const radios = new Float32Array(n);
  for (let i = 0; i < n; i++) radios[i] = radioDeNodo(grados[i], tope);
  const centro = datos.centro !== undefined && datos.centro < n ? datos.centro : null;
  if (centro !== null) radios[centro] = AJUSTES_GRAFO.radioCentro;
  const ordenEtiquetas = Int32Array.from({ length: n }, (_, i) => i).sort((a, b) => {
    if (a === centro) return -1;
    if (b === centro) return 1;
    return grados[b] - grados[a] || a - b;
  });
  return { datos, desplazamientos, destinos, aristasNoDirigidas: noDirigidas(desplazamientos, destinos), radios, ordenEtiquetas, centro };
}

const ANGULO_AUREO = 2.3999632;

/**
 * moodiary `seedByBfs`: posiciones de partida para el motor de fuerzas. Cada componente conexa se tiende en anillos por distancia (en saltos) a su nodo
 * de más enlaces, y las componentes se separan en espiral. `[x0, y0, x1, y1, …]`.
 */
export function sembrarPorCapas(escena: Escena, largoResorte: number): Float32Array {
  const n = escena.datos.nodos.length;
  const pos = new Float32Array(n * 2);
  if (n === 0) return pos;
  const visitado = new Uint8Array(n);
  const anillo = largoResorte * 0.85;
  let desdeX = 0;
  let desdeY = 0;
  let componente = 0;
  let radioAcumulado = 0;
  for (const raiz of escena.ordenEtiquetas) {
    if (visitado[raiz]) continue;
    const capas: number[][] = [[raiz]];
    visitado[raiz] = 1;
    let frontera = [raiz];
    while (frontera.length) {
      const siguiente: number[] = [];
      for (const u of frontera) {
        for (let k = escena.desplazamientos[u]; k < escena.desplazamientos[u + 1]; k++) {
          const v = escena.destinos[k];
          if (visitado[v]) continue;
          visitado[v] = 1;
          siguiente.push(v);
        }
      }
      if (!siguiente.length) break;
      capas.push(siguiente);
      frontera = siguiente;
    }
    const radioComponente = anillo * (capas.length - 1) + AJUSTES_GRAFO.radioNodoMax;
    if (componente > 0) {
      radioAcumulado += radioComponente * 0.9;
      const a = componente * ANGULO_AUREO;
      desdeX = radioAcumulado * Math.cos(a);
      desdeY = radioAcumulado * Math.sin(a);
    }
    capas.forEach((capa, d) => {
      const r = anillo * d;
      if (d === 0) {
        pos[capa[0] * 2] = desdeX;
        pos[capa[0] * 2 + 1] = desdeY;
        return;
      }
      const fase = d * ANGULO_AUREO;
      capa.forEach((nodo, i) => {
        const a = fase + (2 * Math.PI * i) / capa.length;
        pos[nodo * 2] = desdeX + r * Math.cos(a);
        pos[nodo * 2 + 1] = desdeY + r * Math.sin(a);
      });
    });
    componente++;
  }
  return pos;
}

/** Cómo se relaciona un nodo con el centro del grafo local: el centro enlaza a él, él al centro, o ambos. */
export type DireccionEgo = "saliente" | "entrante" | "mutuo";

function enlacesDelCentro(escena: Escena): { salientes: Set<number>; entrantes: Set<number> } {
  const salientes = new Set<number>();
  const entrantes = new Set<number>();
  const centro = escena.centro;
  if (centro === null) return { salientes, entrantes };
  const { aristas } = escena.datos;
  for (let e = 0; e < aristas.length; e += 2) {
    const a = aristas[e];
    const b = aristas[e + 1];
    if (a === centro && b !== centro) salientes.add(b);
    if (b === centro && a !== centro) entrantes.add(a);
  }
  return { salientes, entrantes };
}

/** moodiary `egoDirectionsOf`: la dirección de cada nodo respecto del centro; `null` para el centro y para los de segundo salto. */
export function direccionesDesdeCentro(escena: Escena): (DireccionEgo | null)[] {
  const n = escena.datos.nodos.length;
  const direcciones: (DireccionEgo | null)[] = Array.from({ length: n }, () => null);
  const { salientes, entrantes } = enlacesDelCentro(escena);
  for (let i = 0; i < n; i++) {
    if (i === escena.centro) continue;
    const sale = salientes.has(i);
    const entra = entrantes.has(i);
    if (sale && entra) direcciones[i] = "mutuo";
    else if (sale) direcciones[i] = "saliente";
    else if (entra) direcciones[i] = "entrante";
  }
  return direcciones;
}

export interface DisposicionRadial {
  posiciones: Float32Array;
  direcciones: (DireccionEgo | null)[];
  radioExterior: number;
}

const grados = (g: number): number => (g * Math.PI) / 180;

/**
 * moodiary `layoutEgoRadial`: el centro en el origen; a la derecha los que él enlaza, a la izquierda los que lo enlazan, arriba los mutuos (el eje y crece hacia
 * abajo, así que −90° es arriba) y en un anillo exterior los de segundo salto, cerca del ángulo de su vecino de primer salto.
 */
export function disposicionRadial(escena: Escena): DisposicionRadial {
  const n = escena.datos.nodos.length;
  const posiciones = new Float32Array(n * 2);
  const direcciones: (DireccionEgo | null)[] = Array.from({ length: n }, () => null);
  const centro = escena.centro;
  if (n === 0 || centro === null) return { posiciones, direcciones, radioExterior: 1 };
  const { salientes, entrantes } = enlacesDelCentro(escena);
  const profundidad = (i: number) => escena.datos.nodos[i].profundidad;

  const primero: number[] = [];
  const segundo: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i === centro) continue;
    const d = profundidad(i) ?? (esVecino(escena, i, centro) ? 1 : 2);
    (d <= 1 ? primero : segundo).push(i);
  }

  const mutuos: number[] = [];
  const salida: number[] = [];
  const entrada: number[] = [];
  for (const i of primero) {
    const sale = salientes.has(i);
    const entra = entrantes.has(i);
    const dir: DireccionEgo = sale && entra ? "mutuo" : sale ? "saliente" : "entrante";
    direcciones[i] = dir;
    (dir === "mutuo" ? mutuos : dir === "saliente" ? salida : entrada).push(i);
  }

  const r1 = clamp(110 + 12 * primero.length, 150, 420);
  const angulos = new Array<number>(n).fill(0);
  let exterior = r1;
  const colocar = (grupo: number[], centroGrados: number, mitadGrados: number, radio: number) => {
    if (!grupo.length) return;
    const c = grados(centroGrados);
    const h = grados(mitadGrados);
    const hueco = grupo.length > 1 ? (2 * h) / grupo.length : Math.PI;
    const partir = hueco < grados(18) && grupo.length > 3;
    grupo.forEach((nodo, i) => {
      const a = grupo.length === 1 ? c : c - h + (2 * h * (i + 0.5)) / grupo.length;
      const r = partir && i % 2 === 1 ? radio * 1.32 : radio;
      if (r > exterior) exterior = r;
      angulos[nodo] = a;
      posiciones[nodo * 2] = r * Math.cos(a);
      posiciones[nodo * 2 + 1] = r * Math.sin(a);
    });
  };
  colocar(salida, 0, 65, r1);
  colocar(entrada, 180, 65, r1);
  colocar(mutuos, -90, 22, r1);

  if (segundo.length) {
    const deseado = new Map<number, number>();
    for (const i of segundo) {
      let a = 0;
      for (let k = escena.desplazamientos[i]; k < escena.desplazamientos[i + 1]; k++) {
        const p = escena.destinos[k];
        if (p !== centro && (profundidad(p) ?? 2) <= 1) {
          a = angulos[p];
          break;
        }
      }
      deseado.set(i, a);
    }
    segundo.sort((a, b) => deseado.get(a)! - deseado.get(b)!);
    const separacionMin = Math.min((2 * Math.PI) / segundo.length, grados(22));
    const r2 = r1 * 1.95;
    let previo = -Infinity;
    segundo.forEach((nodo, i) => {
      const a = i === 0 ? deseado.get(segundo[0])! : Math.max(deseado.get(nodo)!, previo + separacionMin);
      previo = a;
      posiciones[nodo * 2] = r2 * Math.cos(a);
      posiciones[nodo * 2 + 1] = r2 * Math.sin(a);
    });
    if (previo - deseado.get(segundo[0])! > 2 * Math.PI - separacionMin) {
      segundo.forEach((nodo, i) => {
        const a = deseado.get(segundo[0])! + (2 * Math.PI * i) / segundo.length;
        posiciones[nodo * 2] = r2 * Math.cos(a);
        posiciones[nodo * 2 + 1] = r2 * Math.sin(a);
      });
    }
    exterior = r2;
  }
  return { posiciones, direcciones, radioExterior: exterior };
}

/** Cuántos enlaces salen de `i` y cuántos llegan a `i` (la tarjeta del nodo). */
export function gradosDirigidos(datos: DatosGrafo, i: number): { salientes: number; entrantes: number } {
  let salientes = 0;
  let entrantes = 0;
  for (let e = 0; e < cantidadAristas(datos); e++) {
    if (datos.aristas[e * 2] === i) salientes++;
    if (datos.aristas[e * 2 + 1] === i) entrantes++;
  }
  return { salientes, entrantes };
}
