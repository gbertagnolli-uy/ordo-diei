// Diario (lane 272): resumen del mes — entradas y días por ánimo (5 barras).
import { ANIMOS } from "@/lib/diario/reglas";
import { FONDO_ANIMO } from "./animo";

export function ResumenMes({ totalEntradas, diasPorAnimo }: { totalEntradas: number; diasPorAnimo: number[] }) {
  const max = Math.max(1, ...diasPorAnimo);
  return (
    <section aria-label="Resumen del mes" className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-sm text-muted-foreground">
        {totalEntradas} {totalEntradas === 1 ? "entrada" : "entradas"} este mes
      </p>
      <ul className="flex flex-col gap-1.5">
        {ANIMOS.map((a, i) => (
          <li key={a.valor} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="w-6 text-center">{a.emoji}</span>
            <span className="sr-only">{a.etiqueta}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${FONDO_ANIMO[a.valor]}`} style={{ width: `${(diasPorAnimo[i] / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right tabular-nums">{diasPorAnimo[i]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
