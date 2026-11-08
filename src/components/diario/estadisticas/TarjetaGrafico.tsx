"use client";
// Diario (lane 287): marco de cada gráfico. Portado del patrón común de vendor/Daily_You/lib/widgets/{value_over_time_chart,value_by_day_chart,
// distribution_chart,mood_summary_chart}.dart (Demizo/Daily_You@7cc237d): título arriba y, sin datos suficientes, el gráfico atenuado con el aviso encima.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TarjetaGrafico({ titulo, hayDatos, acciones, children, className }: { titulo: string; hayDatos: boolean; acciones?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-center text-base font-semibold">{titulo}</h3>
        {acciones}
      </div>
      <div className="relative">
        <div className={cn(!hayDatos && "pointer-events-none opacity-30")} aria-hidden={!hayDatos}>
          {children}
        </div>
        {!hayDatos && <p className="absolute inset-0 flex items-center justify-center text-lg font-bold text-muted-foreground">No hay suficientes datos…</p>}
      </div>
    </section>
  );
}
