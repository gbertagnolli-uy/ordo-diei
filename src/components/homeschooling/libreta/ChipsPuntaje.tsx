"use client";

// Propio de Ordo (lane 172, K1): la nota se pone con un toque (100, 90…) o escribiéndola; muestra la letra al lado.
import { Input } from "@/components/ui/input";
import { letraDe, puntajeValido } from "@/lib/homeschooling/calificaciones";

const RAPIDAS = [100, 90, 80, 70, 60, 50];

export default function ChipsPuntaje({ valor, onChange, id }: { valor: string; onChange: (v: string) => void; id?: string }) {
  const n = valor.trim() === "" ? NaN : Number(valor);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Notas rápidas">
        {RAPIDAS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(String(r))}
            aria-pressed={n === r}
            className={`h-9 min-w-12 rounded-lg border px-3 text-sm font-semibold tabular-nums transition-colors ${n === r ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Input id={id} type="number" inputMode="numeric" min={0} max={100} step={1} value={valor} onChange={(e) => onChange(e.target.value)} placeholder="0 a 100" className="w-28 tabular-nums" aria-invalid={valor !== "" && !puntajeValido(n)} />
        {puntajeValido(n) && <span className="text-lg font-bold text-foreground">{letraDe(n)}</span>}
      </div>
    </div>
  );
}
