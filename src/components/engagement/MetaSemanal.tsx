// Meta semanal en familia (vault/ENGAGEMENT_PLAN.md, lane 202): un objetivo compartido, sin presión ni castigos.
// Componente de servidor; los padres fijan la meta con <FijarMeta> (cliente).
import Link from "next/link";
import { Gift, PartyPopper, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FijarMeta } from "@/components/engagement/FijarMeta";
import type { MetaSemanalVista } from "@/lib/engagement/metaServidor";

export function MetaSemanal({ datos }: { datos: MetaSemanalVista }) {
  const { meta, esPadre, sugerido } = datos;

  // Sin meta: solo los padres ven la invitación; los chicos no ven nada hasta que exista
  if (!meta) {
    if (!esPadre) return null;
    return (
      <Card aria-labelledby="meta-semanal" className="gap-3 py-4">
        <CardHeader>
          <CardTitle id="meta-semanal" className="font-heading text-lg">
            Meta de la semana
          </CardTitle>
          <CardDescription>Un objetivo entre todos los chicos con un premio para cada uno. A los chicos les encanta tener algo por lo que sumar juntos.</CardDescription>
          <CardAction>
            <FijarMeta sugerido={sugerido} editar={false} />
          </CardAction>
        </CardHeader>
      </Card>
    );
  }

  const faltan = Math.max(0, meta.objetivo - meta.actual);
  return (
    <Card aria-labelledby="meta-semanal" className="gap-3 py-4">
      <CardHeader>
        <CardTitle id="meta-semanal" className="font-heading text-lg">
          Meta de la semana
        </CardTitle>
        <CardDescription>
          {meta.cumplida ? (
            <>
              ¡Lo lograron entre todos! Cada uno tiene un <span className="font-medium text-foreground">vale por {meta.premio}</span>.
            </>
          ) : (
            <>
              Si llegamos juntos, cada uno gana un <span className="font-medium text-foreground">vale por {meta.premio}</span>.
            </>
          )}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Badge variant={meta.cumplida ? "default" : "secondary"}>
            {meta.cumplida ? <PartyPopper className="size-3" /> : <Target className="size-3" />}
            {meta.cumplida ? "¡Cumplida!" : `${meta.actual} de ${meta.objetivo}`}
          </Badge>
          {esPadre && !meta.cumplida && <FijarMeta sugerido={meta.objetivo} premioActual={meta.premio} editar />}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={meta.porcentaje} aria-label={`Avance de la meta: ${meta.actual} de ${meta.objetivo}`} className="h-2" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {meta.cumplida
              ? "Una tarea aprobada o un hábito hecho suma para todos."
              : faltan === 1
                ? "¡Falta 1 solo!"
                : `Faltan ${faltan}. Cada tarea aprobada o hábito hecho suma para todos.`}
          </span>
          {meta.cumplida && (
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/mis-premios">
                <Gift className="size-4" /> Ver mi vale
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
