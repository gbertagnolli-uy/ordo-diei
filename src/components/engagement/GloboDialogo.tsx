"use client";

// Globo de diálogo dibujado con SVG (lane 247): cuerpo redondeado + cola, a la medida del texto.
// La cola está abajo a la derecha (apunta al personaje que queda debajo y a la derecha); con `lado="derecha"` se espeja.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const RADIO = 14;
const COLA = 12;

/** Contorno: rectángulo redondeado de `ancho` × (`alto` − cola) con la cola colgando de la base, hacia la derecha */
export function trazoGlobo(ancho: number, alto: number): string {
  const cuerpo = alto - COLA;
  const r = Math.min(RADIO, ancho / 2, cuerpo / 2);
  const baseDer = Math.max(ancho - 26, r);
  const baseIzq = Math.max(ancho - 46, r);
  return [
    `M${r},0`,
    `H${ancho - r}`,
    `Q${ancho},0 ${ancho},${r}`,
    `V${cuerpo - r}`,
    `Q${ancho},${cuerpo} ${ancho - r},${cuerpo}`,
    `H${baseDer}`,
    `L${ancho - 8},${alto}`,
    `L${baseIzq},${cuerpo}`,
    `H${r}`,
    `Q0,${cuerpo} 0,${cuerpo - r}`,
    `V${r}`,
    `Q0,0 ${r},0`,
    "Z",
  ].join(" ");
}

export function GloboDialogo({ children, lado = "izquierda", className }: { children: ReactNode; lado?: "izquierda" | "derecha"; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [medida, setMedida] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setMedida({ w: el.offsetWidth, h: el.offsetHeight });
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={caja} role="status" className={cn("relative w-max max-w-[13rem] animate-in fade-in zoom-in-95 duration-200", className)}>
      {medida && (
        <svg
          aria-hidden
          width={medida.w}
          height={medida.h}
          viewBox={`0 0 ${medida.w} ${medida.h}`}
          className={cn("pointer-events-none absolute inset-0 overflow-visible drop-shadow-md", lado === "derecha" && "-scale-x-100")}
        >
          <path d={trazoGlobo(medida.w, medida.h)} style={{ fill: "var(--card)", stroke: "var(--border)" }} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      )}
      <p className="relative px-3.5 pt-2.5 text-sm leading-snug text-card-foreground" style={{ paddingBottom: COLA + 10 }}>
        {children}
      </p>
    </div>
  );
}
