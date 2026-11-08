"use client";
// Diario (lane 285): entradas fijadas, arriba de la lista. Portado de la idea de vendor/storypad (`pinnedStories` en el inicio, theachoem/storypad@a76825e).
import { useEffect, useState } from "react";
import { ChevronDown, Pin } from "lucide-react";
import { FILTRO_VACIO, aParametros } from "@/lib/diario/busqueda";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { HallazgoVista, ResultadoBusqueda } from "@/lib/diario/servidor-busqueda";
import { cn } from "@/lib/utils";

const MAX_FIJADAS = 30;
const fechaCorta = (clave: string) => new Date(`${clave}T12:00:00`).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" });

const resumen = (h: HallazgoVista) => h.titulo?.map((s) => s.texto).join("") || h.extracto.map((s) => s.texto).join("") || "(sin texto)";

export function SeccionFijadas({ tipo, version, onIrADia }: { tipo: TipoDiario; version: number; onIrADia: (fecha: string) => void }) {
  const [lista, setLista] = useState<HallazgoVista[]>([]);
  const [abierta, setAbierta] = useState(true);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario/buscar?${aParametros({ ...FILTRO_VACIO, fijada: true, limite: MAX_FIJADAS }, tipo)}`)
      .then(async (r) => {
        const d = (await r.json().catch(() => null)) as ResultadoBusqueda | null;
        if (r.ok && d && vivo) setLista(d.hallazgos);
      })
      .catch(() => {
        /* las fijadas son un extra: si no cargan, la lista del día sigue funcionando */
      });
    return () => {
      vivo = false;
    };
  }, [tipo, version]);

  if (!lista.length) return null;
  return (
    <section className="rounded-xl border bg-card">
      <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium" aria-expanded={abierta} onClick={() => setAbierta(!abierta)}>
        <Pin className="size-4 fill-current text-primary" aria-hidden />
        <span className="flex-1">Fijadas ({lista.length})</span>
        <ChevronDown className={cn("size-4 transition-transform", abierta && "rotate-180")} aria-hidden />
      </button>
      {abierta && (
        <ul className="flex flex-col border-t">
          {lista.map((h) => (
            <li key={h.entrada.id}>
              <button type="button" className="flex w-full items-baseline gap-3 px-4 py-2 text-left text-sm hover:bg-muted" onClick={() => onIrADia(h.entrada.fecha)}>
                <span className="shrink-0 text-xs text-muted-foreground">{fechaCorta(h.entrada.fecha)}</span>
                <span className="min-w-0 flex-1 truncate">{resumen(h)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
