"use client";
// Buscar y reemplazar dentro del texto de la entrada. En moodiary la barra es de Flutter y habla con el editor por el puente
// (`search`, `searchNext`, `searchPrev`, `replace`, `replaceAll`, `clearSearch`, estado `searchState`); acá es React y usa las mismas órdenes de `core/commands.ts`.
import { useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import { ArrowDown, ArrowUp, CaseSensitive, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { execCommand } from "../core/commands";
import { searchStatus } from "../core/search";

export function BarraBusqueda({ editor, onCerrar }: { editor: Editor; onCerrar: () => void }) {
  const estado = useEditorState({ editor, selector: ({ editor: e }) => searchStatus(e.state) });
  const [consulta, setConsulta] = useState(estado.query);
  const [mayusculas, setMayusculas] = useState(false);
  const [reemplazo, setReemplazo] = useState("");
  const [conReemplazo, setConReemplazo] = useState(false);
  const run = (cmd: string, args?: Record<string, unknown>) => execCommand(editor, cmd, args);

  function buscar(texto: string, may = mayusculas) {
    setConsulta(texto);
    run("search", { query: texto, caseSensitive: may });
  }

  function cerrar() {
    run("clearSearch");
    onCerrar();
    editor.commands.focus();
  }

  return (
    <div role="search" aria-label="Buscar en el texto" className="flex flex-col gap-1 rounded-xl border bg-card p-1.5">
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon-sm" aria-label={conReemplazo ? "Ocultar reemplazo" : "Mostrar reemplazo"} aria-expanded={conReemplazo} onClick={() => setConReemplazo(!conReemplazo)}>
          <ChevronDown className={cn("transition-transform", !conReemplazo && "-rotate-90")} />
        </Button>
        <Input
          autoFocus
          value={consulta}
          placeholder="Buscar en el texto"
          aria-label="Buscar en el texto"
          className="h-8 min-w-0 flex-1"
          onChange={(e) => buscar(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") return cerrar();
            if (e.key === "Enter") {
              e.preventDefault();
              run(e.shiftKey ? "searchPrev" : "searchNext");
            }
          }}
        />
        <span className="w-14 shrink-0 text-center text-xs text-muted-foreground" aria-live="polite">
          {consulta ? (estado.total ? `${estado.current || "–"} de ${estado.total}` : "Sin resultados") : ""}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Distinguir mayúsculas" aria-pressed={mayusculas} className={cn(mayusculas && "bg-primary/15 text-primary")} onClick={() => {
          setMayusculas(!mayusculas);
          if (consulta) buscar(consulta, !mayusculas);
        }}>
          <CaseSensitive />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Anterior" disabled={!estado.total} onClick={() => run("searchPrev")}>
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Siguiente" disabled={!estado.total} onClick={() => run("searchNext")}>
          <ArrowDown />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar la búsqueda" onClick={cerrar}>
          <X />
        </Button>
      </div>
      {conReemplazo && (
        <div className="flex items-center gap-1 pl-9">
          <Input value={reemplazo} placeholder="Reemplazar por" aria-label="Reemplazar por" className="h-8 min-w-0 flex-1" onChange={(e) => setReemplazo(e.target.value)} />
          <Button type="button" size="sm" variant="outline" disabled={!estado.total} onClick={() => run("replace", { text: reemplazo })}>
            Reemplazar
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!estado.total} onClick={() => run("replaceAll", { text: reemplazo })}>
            Todo
          </Button>
        </div>
      )}
    </div>
  );
}
