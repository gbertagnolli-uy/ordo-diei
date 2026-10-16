// «Tu parte de hoy» (vault/ENGAGEMENT_PLAN.md): las mini-misiones de los padres y su racha de días en la app.
// Componente de servidor: se recalcula cada vez que se entra al inicio, sin estado propio.
import Link from "next/link";
import { CheckCircle2, Circle, Flame, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import type { ParteDeHoy as Datos } from "@/lib/engagement/servidor";

const dias = (n: number) => `${n} ${n === 1 ? "día" : "días"}`;

export function ParteDeHoy({ datos }: { datos: Datos }) {
  const { racha, misiones, hechas, completa, puntosHoy, proximoHito } = datos;
  const total = misiones.length;

  return (
    <Card aria-labelledby="parte-de-hoy" className="gap-3 py-4">
      <CardHeader>
        <CardTitle id="parte-de-hoy" className="font-heading text-lg">
          Tu parte de hoy
        </CardTitle>
        <CardDescription>
          {completa
            ? "¡Completaste todo! Hoy sumaste "
            : hechas === 0
              ? "Tres cosas chicas que ayudan a toda la familia."
              : `${hechas} de ${total} · hoy sumaste `}
          {(completa || hechas > 0) && <span className="font-medium text-foreground">{puntosHoy} puntos</span>}
          {completa && " y un premio sorpresa."}
        </CardDescription>
        <CardAction>
          <Badge variant={racha.dias > 0 ? "default" : "secondary"}>
            <Flame className="size-3" /> {racha.dias > 0 ? dias(racha.dias) : "Empezá tu racha"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={total ? (hechas / total) * 100 : 0} aria-label={`${hechas} de ${total} misiones cumplidas`} className="h-2" />
        <ItemGroup className="gap-2 md:grid md:grid-cols-3 md:items-stretch">
          {misiones.map((m) => (
            <Item key={m.clave} variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>
                  {m.hecha ? <CheckCircle2 className="size-4 shrink-0 text-primary" aria-label="Hecha" /> : <Circle className="size-4 shrink-0 text-muted-foreground" aria-label="Pendiente" />}
                  {m.titulo}
                </ItemTitle>
                <ItemDescription>{m.detalle}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {m.hecha ? (
                  <Badge variant="secondary">+{m.puntos} pts</Badge>
                ) : (
                  <Button asChild size="sm" variant="outline">
                    <Link href={m.href}>Ir</Link>
                  </Button>
                )}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {proximoHito
            ? `Te ${proximoHito.faltan === 1 ? "falta 1 día" : `faltan ${proximoHito.faltan} días`} para el premio de los ${proximoHito.dias} días.`
            : "Llegaste a todos los premios de racha."}{" "}
          Si un día no podés entrar, no pasa nada: perdonamos un día por semana.
        </span>
        {completa && (
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/mis-premios">
              <Gift className="size-4" /> Ver mi premio
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
