"use client";

// Propio de Ordo (lane 166, M1): el material que el padre dejó, visto por el alumno. M2 reemplaza «Abrir» por el visor
// integrado; acá el texto se lee en la misma tarjeta y lo demás se abre en otra pestaña.
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ETIQUETA_TIPO } from "@/lib/homeschooling/material";
import type { MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import IconoMaterial from "./IconoMaterial";

export default function MaterialesDelDia({ materiales, titulo = "Material" }: { materiales: MaterialVista[]; titulo?: string }) {
  if (materiales.length === 0) return null;
  return (
    <section aria-label={titulo} className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
      <ul className="space-y-2">
        {materiales.map((m) => (
          <li key={m.id} className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-3">
              <IconoMaterial tipo={m.tipo} className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{m.titulo}</p>
                <p className="text-xs text-muted-foreground">{ETIQUETA_TIPO[m.tipo]}</p>
              </div>
              {m.url && (
                <Button asChild variant="outline" size="sm">
                  <a href={m.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink /> Abrir
                  </a>
                </Button>
              )}
            </div>
            {m.contenido !== null && <p className="mt-3 whitespace-pre-wrap border-t pt-3 text-sm text-foreground">{m.contenido}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
