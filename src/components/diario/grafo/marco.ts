// Diario (lane 295): el cuadro de posiciones que el motor de fuerzas va entregando y el lienzo va dibujando.
// Portado de `GraphFrame` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/graph_canvas.dart, ZhuJHua/moodiary@2c552dd).

export class MarcoGrafo {
  /** `[x0, y0, x1, y1, …]` en el espacio del mundo. */
  posiciones: Float32Array = new Float32Array(0);
  /** El motor terminó: el lienzo muestra las etiquetas. */
  asentado = false;
  private oyentes = new Set<() => void>();

  empujar(posiciones: Float32Array, asentado = false): void {
    this.posiciones = posiciones;
    this.asentado = asentado;
    this.avisar();
  }

  marcarAsentado(): void {
    if (this.asentado) return;
    this.asentado = true;
    this.avisar();
  }

  suscribir(oyente: () => void): () => void {
    this.oyentes.add(oyente);
    return () => {
      this.oyentes.delete(oyente);
    };
  }

  private avisar(): void {
    for (const o of this.oyentes) o();
  }
}
