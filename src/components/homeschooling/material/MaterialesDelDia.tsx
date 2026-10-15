"use client";

// Propio de Ordo (lane 166 M1 / lane 167 M2): el material que el padre dejó, visto por el alumno. Cada tarjeta abre el visor
// a pantalla completa (VisorMaterial); el texto muestra un adelanto de las primeras líneas.
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ETIQUETA_TIPO } from "@/lib/homeschooling/material";
import type { MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import IconoMaterial from "./IconoMaterial";
import VisorMaterial from "./VisorMaterial";

const adelanto = (texto: string) => texto.replace(/[#>*_`|~-]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);

export default function MaterialesDelDia({ materiales, titulo = "Material" }: { materiales: MaterialVista[]; titulo?: string }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  if (materiales.length === 0) return null;
  return (
    <section aria-label={titulo || "Material"} className="space-y-2">
      {titulo && <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>}
      <ul className="space-y-2">
        {materiales.map((m, i) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setAbierto(i)}
              className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconoMaterial tipo={m.tipo} className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{m.titulo}</span>
                <span className="block truncate text-xs text-muted-foreground">{m.contenido !== null ? adelanto(m.contenido) || ETIQUETA_TIPO[m.tipo] : ETIQUETA_TIPO[m.tipo]}</span>
              </span>
              <Button asChild variant="ghost" size="sm" tabIndex={-1} className="pointer-events-none shrink-0">
                <span>
                  <Eye /> {m.tipo === "video" ? "Mirar" : "Leer"}
                </span>
              </Button>
            </button>
          </li>
        ))}
      </ul>
      <VisorMaterial lista={materiales} indice={abierto} onCambiar={setAbierto} onClose={() => setAbierto(null)} />
    </section>
  );
}
