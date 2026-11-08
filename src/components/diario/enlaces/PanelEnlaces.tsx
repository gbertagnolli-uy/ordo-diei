"use client";
// Diario (lane 290): las entradas que enlaza esta entrada y las que la enlazan (backlinks). Portado de vendor/moodiary/editor/src/ui/EditorLinksPanel.tsx
// y de `getForwardLinks` / `getBacklinks` de diary_repository.dart (ZhuJHua/moodiary@2c552dd). Sin el botón del grafo (fase 4).
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight, CornerDownLeft, Link2 } from "lucide-react";
import type { ResumenEnlace } from "@/lib/diario/enlaces";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { EnlacesDeEntrada } from "@/lib/diario/servidor-enlaces";
import { fechaLarga } from "../estadisticas/controles";
import { useAbrirEntrada } from "./ContextoEnlaces";

function Lista({ titulo, items, saliente, onAbrir }: { titulo: string; items: ResumenEnlace[]; saliente: boolean; onAbrir: ((id: number) => void) | null }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="px-3 pt-2 text-xs font-medium text-muted-foreground">{titulo}</p>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            <button type="button" disabled={!onAbrir} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted" onClick={() => onAbrir?.(i.id)}>
              {saliente ? <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden /> : <CornerDownLeft className="size-4 shrink-0 text-primary" aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{i.rotulo}</span>
                <span className="block text-xs text-muted-foreground">{fechaLarga(i.fecha)}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PanelEnlaces({ tipo, entradaId }: { tipo: TipoDiario; entradaId: number }) {
  const [datos, setDatos] = useState<EnlacesDeEntrada | null>(null);
  const [fallo, setFallo] = useState(false);
  const abrir = useAbrirEntrada();

  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario/enlaces/${entradaId}?tipo=${tipo}`)
      .then(async (r) => {
        const d = (await r.json().catch(() => null)) as EnlacesDeEntrada | null;
        if (!vivo) return;
        if (r.ok && d) setDatos(d);
        else setFallo(true);
      })
      .catch(() => {
        if (vivo) setFallo(true);
      });
    return () => {
      vivo = false;
    };
  }, [tipo, entradaId]);

  return (
    <section aria-label="Enlaces de la entrada" className="mt-2 overflow-hidden rounded-lg border bg-background">
      <h4 className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
        <Link2 className="size-4 text-primary" aria-hidden /> Enlaces
        {datos && <span className="ml-auto text-xs font-normal text-muted-foreground">{datos.salientes.length + datos.entrantes.length}</span>}
      </h4>
      {fallo ? (
        <p className="px-3 pb-2 text-sm text-muted-foreground">No se pudieron cargar los enlaces.</p>
      ) : !datos ? (
        <p className="px-3 pb-2 text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="pb-1">
          <Lista titulo="Enlaza a" items={datos.salientes} saliente onAbrir={abrir} />
          <Lista titulo="Enlazada desde" items={datos.entrantes} saliente={false} onAbrir={abrir} />
        </div>
      )}
    </section>
  );
}
