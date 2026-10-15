// Propio de Ordo (lane 198): tres números juntos en una sola tarjeta, que entran en una fila también en el teléfono (las tres
// StatsCard de Roost, cada una con su ícono, se apretaban a 390 px). Cada número lleva su rótulo debajo.
import type { LucideIcon } from "lucide-react";

export interface DatoResumen {
  rotulo: string;
  valor: string | number;
  icono: LucideIcon;
  /** Clase de color del número (p. ej. text-warning); por defecto el texto normal */
  color?: string;
}

export default function ResumenCompacto({ datos, etiqueta = "Resumen" }: { datos: DatoResumen[]; etiqueta?: string }) {
  return (
    <section aria-label={etiqueta} className="grid divide-x rounded-xl border bg-card" style={{ gridTemplateColumns: `repeat(${datos.length}, minmax(0, 1fr))` }}>
      {datos.map((d) => (
        <div key={d.rotulo} className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-3 text-center">
          <d.icono className="size-4 text-muted-foreground" aria-hidden />
          <p className={`text-2xl leading-tight font-bold tabular-nums ${d.color ?? "text-foreground"}`}>{d.valor}</p>
          <p className="text-xs leading-tight text-muted-foreground">{d.rotulo}</p>
        </div>
      ))}
    </section>
  );
}
