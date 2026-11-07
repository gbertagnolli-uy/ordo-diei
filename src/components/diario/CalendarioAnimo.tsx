"use client";
// Diario (lane 272): calendario del mes con el ánimo de cada día. UX basada en theachoem/storypad@a76825e (lib/views/calendar).
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FONDO_ANIMO } from "./animo";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Suma `n` meses a "YYYY-MM". */
export function moverMes(mes: string, n: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function CalendarioAnimo({
  mes,
  dias,
  seleccionado,
  hoy,
  onDia,
  onMes,
}: {
  mes: string;
  dias: Record<string, { animo: number | null; cantidad: number }>;
  seleccionado: string;
  hoy: string;
  onDia: (fecha: string) => void;
  onMes: (mes: string) => void;
}) {
  const [y, m] = mes.split("-").map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const huecos = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const fechas = Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);

  return (
    <section aria-label="Calendario" className="rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => onMes(moverMes(mes, -1))}>
          <ChevronLeft />
        </Button>
        <h2 className="font-medium capitalize">
          {MESES[m - 1]} {y}
        </h2>
        <Button variant="ghost" size="icon" aria-label="Mes siguiente" disabled={moverMes(mes, 1) > hoy.slice(0, 7)} onClick={() => onMes(moverMes(mes, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DIAS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: huecos }, (_, i) => (
          <span key={`h${i}`} />
        ))}
        {fechas.map((f) => {
          const d = dias[f];
          const futuro = f > hoy;
          return (
            <button
              key={f}
              type="button"
              disabled={futuro}
              aria-pressed={f === seleccionado}
              aria-label={`${Number(f.slice(8))}${d ? `, ${d.cantidad} ${d.cantidad === 1 ? "entrada" : "entradas"}` : ""}`}
              onClick={() => onDia(f)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition",
                f === seleccionado ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                f === hoy && f !== seleccionado && "font-semibold text-primary",
                futuro && "opacity-30",
              )}
            >
              {Number(f.slice(8))}
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  d ? (d.animo ? FONDO_ANIMO[d.animo] : "bg-foreground/40") : "bg-transparent",
                  d && f === seleccionado && "ring-1 ring-primary-foreground",
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
