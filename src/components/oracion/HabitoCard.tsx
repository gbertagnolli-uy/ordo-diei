"use client";

import { Check, ChevronDown, Lock, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ETAPAS, HABITOS, type HabitoId, type Marca } from "@/lib/oracion/catalogo";
import type { EstadoHabito } from "@/lib/oracion/engine";

export const MOTIVOS = ["Enfermedad", "Viaje", "Otro motivo"];

const pct = (n: number) => `${Math.round(n * 100)} %`;

// Una oración del día: qué rezar hoy, en qué etapa está y registro en un toque.
export function HabitoCard({
  h,
  misterios,
  ocupado,
  onRegistrar,
}: {
  h: EstadoHabito;
  misterios: readonly string[];
  ocupado: boolean;
  onRegistrar: (habito: HabitoId, marca: Marca | null, motivo?: string) => void;
}) {
  const info = HABITOS[h.habito];
  const meta = h.pasoActual.diasParaSubir;
  const hecho = h.hoy === "hecho";

  return (
    <Card className={cn("transition-colors", hecho && "border-[color-mix(in_srgb,var(--success)_40%,transparent)]")}>
      <CardHeader>
        <CardDescription>{info.momento} · {info.ancla}</CardDescription>
        <CardTitle className="font-heading text-xl">{info.nombre}</CardTitle>
        <CardAction>
          <Badge variant={h.etapa === "retomando" ? "outline" : "secondary"}>{ETAPAS[h.etapa]}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Hoy</p>
          <p className="font-heading text-2xl font-semibold text-primary">{h.pasoActual.titulo}</p>
          {h.pasoActual.misterios > 0 && (
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground">
              {misterios.slice(0, h.pasoActual.misterios).map((m) => <li key={m}>{m}</li>)}
            </ol>
          )}
        </div>

        <div className="mt-auto space-y-3 text-sm">
          {meta !== null && !h.completo && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Días seguidos para el próximo paso</span>
                <span className="tabular-nums">{h.seguidos}/{meta}</span>
              </div>
              <Progress value={(h.seguidos / meta) * 100} />
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Constancia</span>
            <span className="tabular-nums font-medium text-foreground">{pct(h.constancia)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        {h.hoy ? (
          <>
            <span className={cn("flex flex-1 items-center gap-1.5 text-sm font-medium", hecho ? "text-[var(--success)]" : "text-muted-foreground")}>
              <Check className="size-4" /> {hecho ? "Rezado hoy" : "Día justificado"}
            </span>
            <Button variant="ghost" size="sm" disabled={ocupado} onClick={() => onRegistrar(h.habito, null)}>
              {ocupado ? <Spinner /> : <Undo2 />} Deshacer
            </Button>
          </>
        ) : (
          <>
            <Button className="flex-1" disabled={ocupado} onClick={() => onRegistrar(h.habito, "hecho")}>
              {ocupado ? <Spinner /> : <Check />} Rezado
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={ocupado}>
                  No pude <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>No cuenta como falta</DropdownMenuLabel>
                {MOTIVOS.map((m) => (
                  <DropdownMenuItem key={m} onSelect={() => onRegistrar(h.habito, "justificado", m)}>{m}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

// La mañana todavía no habilitada: muestra cuánto le falta a la noche.
export function HabitoBloqueadoCard({ constanciaNoche, objetivo }: { constanciaNoche: number; objetivo: number }) {
  const info = HABITOS.matutinum;
  return (
    <Card className="border-dashed bg-muted/40">
      <CardHeader>
        <CardDescription>{info.momento} · {info.ancla}</CardDescription>
        <CardTitle className="font-heading text-xl text-muted-foreground">{info.nombre}</CardTitle>
        <CardAction><Lock className="size-4 text-muted-foreground" /></CardAction>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Se habilita sola cuando las oraciones de la noche lleguen a <strong className="text-foreground">Consolidación</strong>. Un paso a la vez.</p>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span>Constancia de la noche</span>
            <span className="tabular-nums">{pct(constanciaNoche)} / {pct(objetivo)}</span>
          </div>
          <Progress value={Math.min(100, (constanciaNoche / objetivo) * 100)} />
        </div>
      </CardContent>
    </Card>
  );
}
