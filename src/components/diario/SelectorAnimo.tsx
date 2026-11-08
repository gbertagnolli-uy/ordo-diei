"use client";
// Diario (lane 272): selector de ánimo de 5 caritas. UX basada en Demizo/Daily_You@7cc237d (lib/models/mood.dart).
import { nombreDeNivel } from "@/lib/diario/escala";
import { cn } from "@/lib/utils";
import { GlifoAnimo, useEscala } from "./EscalaAnimo";

export function SelectorAnimo({ valor, onCambio }: { valor: number | null; onCambio: (v: number | null) => void }) {
  const escala = useEscala();
  return (
    <div role="radiogroup" aria-label="¿Cómo te sentís?" className="flex justify-between gap-1">
      {escala.map((a) => {
        const elegido = valor === a.valor;
        const nombre = nombreDeNivel(a);
        return (
          <button
            key={a.valor}
            type="button"
            role="radio"
            aria-checked={elegido}
            aria-label={nombre}
            title={nombre}
            onClick={() => onCambio(elegido ? null : a.valor)}
            className={cn(
              "flex size-12 items-center justify-center rounded-full transition",
              elegido ? "scale-110 bg-primary/15 ring-2 ring-primary" : "opacity-60 hover:opacity-100",
            )}
          >
            <GlifoAnimo nivel={a} tamano={26} />
          </button>
        );
      })}
    </div>
  );
}
