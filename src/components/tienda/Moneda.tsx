"use client";

// Ícono, precio y saldo de cada moneda. Un precio nunca se muestra como número pelado (SPEC §9).
import { Award, Flame, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONEDAS, type Costo, type Moneda } from "@/lib/tienda/monedas";

const ICONOS: Record<Moneda, { icono: LucideIcon; color: string; relleno?: boolean }> = {
  puntos: { icono: Award, color: "text-amber-500" },
  estrellas: { icono: Star, color: "text-yellow-400", relleno: true },
  incienso: { icono: Flame, color: "text-orange-500" },
};

export function MonedaIcono({ moneda, className }: { moneda: Moneda; className?: string }) {
  const { icono: Icono, color, relleno } = ICONOS[moneda];
  return <Icono aria-hidden className={cn("size-4 shrink-0", color, relleno && "fill-current", className)} />;
}

/** «250 [ico]» o varias monedas juntas «250 [ico] + 1 [ico]» */
export function Precio({
  costos,
  className,
  tachado,
}: {
  costos: Costo[];
  className?: string;
  tachado?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-semibold tabular-nums", tachado && "line-through opacity-60", className)}
      aria-label={costos.map((c) => `${c.monto} ${MONEDAS[c.moneda].nombre}`).join(" más ")}
    >
      {costos.map((c, i) => (
        <span key={c.moneda} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground">+</span>}
          {c.monto}
          <MonedaIcono moneda={c.moneda} />
        </span>
      ))}
    </span>
  );
}

export function textoFaltan(faltan: Costo[]): string {
  return faltan.map((c) => `${c.monto} ${c.monto === 1 ? MONEDAS[c.moneda].singular : MONEDAS[c.moneda].nombre.toLowerCase()}`).join(" y ");
}
