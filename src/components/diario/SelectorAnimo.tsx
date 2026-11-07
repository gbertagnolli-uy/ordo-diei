"use client";
// Diario (lane 272): selector de ánimo de 5 caritas. UX basada en Demizo/Daily_You@7cc237d (lib/models/mood.dart).
import { ANIMOS } from "@/lib/diario/reglas";
import { cn } from "@/lib/utils";

export function SelectorAnimo({ valor, onCambio }: { valor: number | null; onCambio: (v: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label="¿Cómo te sentís?" className="flex justify-between gap-1">
      {ANIMOS.map((a) => {
        const elegido = valor === a.valor;
        return (
          <button
            key={a.valor}
            type="button"
            role="radio"
            aria-checked={elegido}
            aria-label={a.etiqueta}
            title={a.etiqueta}
            onClick={() => onCambio(elegido ? null : a.valor)}
            className={cn(
              "flex size-12 items-center justify-center rounded-full text-2xl transition",
              elegido ? "scale-110 bg-primary/15 ring-2 ring-primary" : "opacity-60 hover:opacity-100",
            )}
          >
            {a.emoji}
          </button>
        );
      })}
    </div>
  );
}
