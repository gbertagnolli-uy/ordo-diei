"use client";
// Diario (lane 288): mapa de calor de los días con entradas. Portado de vendor/moodiary/packages/foundation/mui/lib/src/components/common/heatmap.dart
// (ZhuJHua/moodiary@2c552dd, `MHeatmap`): una columna por semana, una celda por día, el nombre del mes sobre la primera columna de cada mes, y el día de hoy y el
// elegido con borde. En modo «Ánimo» cada día toma el color de su ánimo y los días pasados sin entradas quedan con borde punteado (`colorOf` + `emptyCell: dashed`).
import { useEffect, useRef } from "react";
import { columnasCalor, marcasDeMeses, PASOS_NIVEL, type DiaEscrito } from "@/lib/diario/calendario";
import { nivelDe, type EscalaAnimo } from "@/lib/diario/escala";
import { cn } from "@/lib/utils";
import { colorDe } from "../EscalaAnimo";
import { MESES } from "../estadisticas/controles";

const CELDA = 11;
const RANURA = 14;
const ALTO_MES = 15;

/** moodiary `levelColor`: del fondo (nivel 0) al color primario (nivel 4). */
export const colorDeNivel = (nivel: number): string => {
  const t = PASOS_NIVEL[Math.min(Math.max(nivel, 0), PASOS_NIVEL.length - 1)];
  return t === 0 ? "var(--muted)" : `color-mix(in oklch, var(--primary) ${Math.round(t * 100)}%, var(--muted))`;
};

export type ModoCalor = "intensidad" | "animo";
export const esModoCalor = (v: unknown): v is ModoCalor => v === "intensidad" || v === "animo";

export function MapaCalor({
  dias,
  fin,
  inicio = null,
  semanas = 53,
  modo,
  escala,
  hoy,
  elegido,
  onDia,
  etiqueta,
}: {
  dias: ReadonlyMap<string, DiaEscrito>;
  /** Último día que se dibuja. */
  fin: string;
  /** Primer día que se dibuja; antes quedan huecos. Sin él, las últimas `semanas` semanas. */
  inicio?: string | null;
  semanas?: number;
  modo: ModoCalor;
  escala: EscalaAnimo;
  hoy: string;
  elegido: string | null;
  onDia: (fecha: string) => void;
  etiqueta: string;
}) {
  const columnas = columnasCalor(fin, semanas, inicio);
  const marcas = marcasDeMeses(columnas, inicio);
  const ancho = columnas.length * RANURA;
  const contenedor = useRef<HTMLDivElement>(null);
  // Arranca mostrando lo más reciente (moodiary `initialScrollOffset`)
  useEffect(() => {
    const el = contenedor.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [fin, inicio, semanas]);

  function colorDelDia(fecha: string): string | null {
    const d = dias.get(fecha);
    if (modo === "intensidad") return colorDeNivel(d?.nivel ?? 0);
    if (!d) return null;
    const nivel = d.animo === null ? null : nivelDe(escala, Math.min(5, Math.max(1, Math.round(d.animo))));
    return nivel ? colorDe(nivel) : "color-mix(in oklch, var(--muted-foreground) 40%, var(--muted))";
  }

  return (
    <div ref={contenedor} role="group" aria-label={etiqueta} className="overflow-x-auto pb-1">
      <div style={{ width: ancho }}>
        <div className="relative" style={{ height: ALTO_MES }}>
          {marcas.map((m) => (
            <span key={m.mes} className="absolute top-0 text-[11px] leading-none whitespace-nowrap text-muted-foreground capitalize" style={{ left: m.columna * RANURA }}>
              {MESES[Number(m.mes.slice(5)) - 1].slice(0, 3)}
            </span>
          ))}
        </div>
        <div className="flex">
          {columnas.map((c) => (
            <div key={c.inicio} className="flex flex-col" style={{ width: RANURA }}>
              {c.dias.map((f, i) => {
                if (f === null) return <span key={i} style={{ width: RANURA, height: RANURA }} />;
                const color = colorDelDia(f);
                const d = dias.get(f);
                const vacioPasado = color === null && f <= hoy;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onDia(f)}
                    aria-pressed={f === elegido}
                    aria-label={`${f}${d ? `: ${d.cantidad} ${d.cantidad === 1 ? "entrada" : "entradas"}` : ""}`}
                    title={`${f}${d ? ` · ${d.cantidad} ${d.cantidad === 1 ? "entrada" : "entradas"} · ${d.palabras} palabras` : ""}`}
                    className="flex items-center justify-center"
                    style={{ width: RANURA, height: RANURA }}
                  >
                    <span
                      className={cn("block rounded-[2.5px]", vacioPasado && "border border-dashed border-border", f === elegido ? "ring-[1.6px] ring-foreground" : f === hoy && "ring-[1.2px] ring-muted-foreground")}
                      style={{ width: CELDA, height: CELDA, backgroundColor: color ?? "transparent" }}
                    />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** moodiary `MHeatmapLegend`: «Menos» … «Más» con los cinco niveles. */
export function LeyendaCalor() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground" aria-hidden>
      Menos
      {PASOS_NIVEL.map((_, i) => (
        <span key={i} className="mx-0.5 size-2.5 rounded-[2px]" style={{ backgroundColor: colorDeNivel(i) }} />
      ))}
      Más
    </span>
  );
}
