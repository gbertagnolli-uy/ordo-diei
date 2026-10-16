// Compañero que evoluciona (vault/ENGAGEMENT_PLAN.md, lane 203): crece con los días de uso y nunca se achica.
// Componente de servidor; el nombre y el festejo son acciones de cliente.
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FestejarEtapa, NombrarCompanero } from "@/components/engagement/CompaneroAcciones";
import type { CompaneroVista } from "@/lib/engagement/companeroServidor";

export function CompaneroCard({ datos }: { datos: CompaneroVista }) {
  const { nombre, tieneNombre, etapa, proxima, avance, nuevaEtapa, regreso, racha, diasDeUso } = datos;

  return (
    <Card aria-label="Tu compañero" className="gap-3 py-4">
      <CardHeader className="items-center">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xl">
            {etapa.emoji}
          </span>
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              {nombre} <Badge variant="secondary">{etapa.nombre}</Badge>
            </CardTitle>
            <CardDescription>{tieneNombre ? etapa.frase : "Es tu compañero: crece cada día que entrás. ¿Le ponés un nombre?"}</CardDescription>
          </div>
        </div>
        {tieneNombre && (
          <CardAction className="flex items-center gap-1">
            {racha > 1 && (
              <Badge>
                <Flame className="size-3" /> {racha} días
              </Badge>
            )}
            <NombrarCompanero nombreActual={nombre} primeraVez={false} />
          </CardAction>
        )}
      </CardHeader>

      {(!tieneNombre || nuevaEtapa || regreso || proxima) && (
        <CardContent className="space-y-2">
          {!tieneNombre && <NombrarCompanero nombreActual={nombre} primeraVez />}
          {nuevaEtapa && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
              <span>
                <span className="font-medium">¡{nombre} creció!</span> Ahora es {etapa.nombre === "Palomita" ? "una" : "un"} {etapa.nombre}.
              </span>
              <FestejarEtapa />
            </div>
          )}
          {!nuevaEtapa && regreso && <p className="text-sm text-muted-foreground">{regreso}</p>}
          {tieneNombre && proxima && (
            <div className="space-y-1">
              <Progress value={avance} aria-label={`Avance hacia ${proxima.nombre}`} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {proxima.faltan === 1 ? "Falta 1 día" : `Faltan ${proxima.faltan} días`} de uso para que sea {proxima.nombre} {proxima.emoji}
                {diasDeUso > 0 && ` · ${diasDeUso} ${diasDeUso === 1 ? "día" : "días"} juntos`}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
