"use client";
// Diario (lane 295): el lienzo del grafo como componente. Toda la lógica de dibujo y gestos está en lienzo.ts; acá solo se crea y se mantiene al día.
// Portado de `GraphCanvas` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/graph/graph_canvas.dart, ZhuJHua/moodiary@2c552dd).
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { cn } from "@/lib/utils";
import { MotorLienzo, type PropsLienzo } from "./lienzo";

export interface ControlGrafo {
  /** Vuelve a encajar todo el grafo en pantalla. */
  encajar: () => void;
}

export function GrafoCanvas({ descripcion, className, control, ...props }: PropsLienzo & { descripcion: string; className?: string; control?: Ref<ControlGrafo> }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const motor = useRef<MotorLienzo | null>(null);
  const ultimas = useRef<PropsLienzo>(props);

  useEffect(() => {
    ultimas.current = props;
  });

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    let m: MotorLienzo;
    try {
      m = new MotorLienzo(canvas, ultimas.current);
    } catch {
      return;
    }
    motor.current = m;
    return () => {
      m.destruir();
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    motor.current?.actualizar(props);
  });

  useImperativeHandle(control, () => ({ encajar: () => motor.current?.encajar() }), []);

  return <canvas ref={lienzo} tabIndex={0} role="img" aria-label={descripcion} className={cn("block size-full touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} />;
}
