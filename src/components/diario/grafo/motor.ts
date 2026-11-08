// Diario (lane 295): lleva el motor de fuerzas (lib/diario/grafo-layout.ts) al ritmo de los cuadros de animación y mueve las posiciones de un lugar a otro.
// En moodiary el motor corre en un hilo de Rust y manda cuadros; acá un generador entrega uno por cuadro de animación (decisión G5).
import { disponerPorFuerzas, type ParametrosFuerzas } from "@/lib/diario/grafo-layout";
import type { MarcoGrafo } from "./marco";

export interface OpcionesMotor {
  n: number;
  /** Pares de índices sin sentido. */
  aristas: ArrayLike<number>;
  semilla: Float32Array;
  params: ParametrosFuerzas;
  marco: MarcoGrafo;
  /** `true`: cada cuadro del motor se dibuja (grafo general). `false`: solo se guarda el último y se entrega al terminar (grafo local). */
  mostrarCuadros: boolean;
  /** Recibe las posiciones finales (null si el motor falló). */
  alTerminar?: (final: Float32Array | null) => void;
}

/** Empieza a correr el motor. Devuelve la función que lo cancela. */
export function correrFuerzas(o: OpcionesMotor): () => void {
  if (o.n === 0) {
    o.marco.empujar(new Float32Array(0), true);
    o.alTerminar?.(new Float32Array(0));
    return () => {};
  }
  let id = 0;
  let cancelado = false;
  let ultimo: Float32Array | null = null;
  let generador: Generator<Float32Array, void, undefined>;
  try {
    generador = disponerPorFuerzas(o.n, o.aristas, o.semilla, o.params);
  } catch {
    o.marco.empujar(o.semilla, true);
    o.alTerminar?.(null);
    return () => {};
  }
  o.marco.empujar(o.semilla);
  const paso = () => {
    if (cancelado) return;
    try {
      const r = generador.next();
      if (r.done) {
        if (o.mostrarCuadros) o.marco.marcarAsentado();
        o.alTerminar?.(ultimo);
        return;
      }
      ultimo = r.value;
      if (o.mostrarCuadros) o.marco.empujar(r.value);
      id = requestAnimationFrame(paso);
    } catch {
      o.marco.marcarAsentado();
      o.alTerminar?.(null);
    }
  };
  id = requestAnimationFrame(paso);
  return () => {
    cancelado = true;
    cancelAnimationFrame(id);
  };
}

/** `Curves.easeInOutCubic`. */
export const suaveCubica = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Mueve los nodos de `desde` a `hasta` en `ms` milisegundos y deja el marco asentado. Devuelve la función que lo cancela. */
export function animarPosiciones(desde: Float32Array, hasta: Float32Array, ms: number, marco: MarcoGrafo, alTerminar?: () => void): () => void {
  if (desde.length !== hasta.length) {
    marco.empujar(hasta, true);
    alTerminar?.();
    return () => {};
  }
  let id = 0;
  let inicio = 0;
  const paso = (ts: number) => {
    if (!inicio) inicio = ts;
    const t = Math.min(1, (ts - inicio) / ms);
    const e = suaveCubica(t);
    const salida = new Float32Array(hasta.length);
    for (let i = 0; i < hasta.length; i++) salida[i] = desde[i] + (hasta[i] - desde[i]) * e;
    marco.empujar(salida, t >= 1);
    if (t < 1) id = requestAnimationFrame(paso);
    else alTerminar?.();
  };
  id = requestAnimationFrame(paso);
  return () => cancelAnimationFrame(id);
}
