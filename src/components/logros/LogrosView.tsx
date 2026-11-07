"use client";

// Pantalla de logros (lane 275, Plane #34): una sección plegable por categoría y una barra fina en cada logro.
import { CheckCircle2, ChevronDown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { evaluarLogros, type CategoriaLogro, type DatosLogros, type LogroEvaluado } from "@/lib/logros";
import { LogroIcon } from "@/components/perfil/LogroIcon";

const CATEGORIAS: { id: CategoriaLogro; titulo: string }[] = [
  { id: "tareas", titulo: "Tareas" },
  { id: "constancia", titulo: "Constancia" },
  { id: "habitos", titulo: "Hábitos" },
  { id: "oracion", titulo: "Oración" },
  { id: "nivel", titulo: "Nivel" },
  { id: "cartas", titulo: "Cartas" },
];

export function LogrosView({ datos }: { datos: DatosLogros }) {
  const logros = evaluarLogros(datos);
  const total = logros.filter((l) => l.obtenido).length;
  const grupos = CATEGORIAS.map((c) => ({ ...c, logros: logros.filter((l) => l.categoria === c.id) })).filter((g) => g.logros.length > 0);
  const abierta = grupos.find((g) => g.logros.some((l) => !l.obtenido))?.id ?? grupos[0]?.id;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 sm:p-6">
      <p className="text-sm text-muted-foreground tabular-nums">
        {total} de {logros.length} logros obtenidos
      </p>
      {grupos.map((g) => {
        const obtenidos = g.logros.filter((l) => l.obtenido).length;
        return (
          <details key={g.id} open={g.id === abierta} className="group rounded-xl border bg-card">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="font-heading text-base font-semibold">{g.titulo}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {obtenidos}/{g.logros.length}
              </span>
              <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="grid gap-2 border-t p-3 sm:grid-cols-2">
              {g.logros.map((l) => (
                <FilaLogro key={l.id} logro={l} />
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function FilaLogro({ logro }: { logro: LogroEvaluado }) {
  return (
    <li className={cn("flex items-start gap-3 rounded-lg border p-3", logro.obtenido ? "bg-card" : "border-dashed bg-muted/30")}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg border",
          logro.obtenido ? "border-primary/30 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <LogroIcon name={logro.icono} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{logro.titulo}</span>
          {logro.obtenido ? (
            <Badge variant="secondary" className="gap-1 py-0 text-[10px] text-[var(--success)]">
              <CheckCircle2 className="size-3" /> Obtenido
            </Badge>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
              <Lock className="size-3" /> {logro.valorActual} / {logro.meta}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{logro.descripcion}</p>
        <Progress
          value={Math.round(logro.progreso * 100)}
          className="mt-2 h-1"
          aria-label={`Progreso de ${logro.titulo}: ${Math.round(logro.progreso * 100)} %`}
        />
      </div>
    </li>
  );
}
