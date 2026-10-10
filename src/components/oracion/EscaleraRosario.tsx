"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ESCALERAS } from "@/lib/oracion/catalogo";
import type { EstadoHabito } from "@/lib/oracion/engine";

const SUBPASOS = ["3", "6", "10"];

// Escalera de 15 pasos: por cada misterio, 3 → 6 → 10 avemarías meditando el misterio.
export function EscaleraRosario({ h, misterios }: { h: EstadoHabito; misterios: readonly string[] }) {
  const total = ESCALERAS.rosario.length;
  const logrados = h.paso + (h.completo ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Camino al Rosario diario</CardTitle>
        <CardDescription>
          Paso {h.paso + 1} de {total}. Cada uno se sube con días seguidos: 7, 7 y 14 por misterio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(logrados / total) * 100} aria-label="Avance hacia el Rosario completo" />
        <ItemGroup className="gap-1">
          {misterios.map((nombre, m) => {
            const pasosDelMisterio = [0, 1, 2].map((s) => m * 3 + s);
            const hecho = pasosDelMisterio.every((p) => p < logrados);
            const actual = pasosDelMisterio.includes(h.paso) && !h.completo;
            return (
              <Item key={nombre} size="sm" variant={actual ? "outline" : "default"} className={cn(!hecho && !actual && "opacity-60")}>
                <ItemMedia
                  variant="icon"
                  className={cn("size-8 rounded-md", hecho ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                >
                  {hecho ? <Check /> : <span className="text-xs font-semibold tabular-nums">{m + 1}</span>}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{m + 1}.º misterio</ItemTitle>
                  <ItemDescription className="line-clamp-1">Hoy: {nombre}</ItemDescription>
                </ItemContent>
                <ItemActions className="gap-1" aria-label="Avemarías">
                  {pasosDelMisterio.map((p, i) => (
                    <Badge
                      key={p}
                      variant={p < logrados ? "default" : "outline"}
                      className={cn("tabular-nums", p === h.paso && !h.completo && "border-primary text-primary", p > h.paso && "text-muted-foreground")}
                    >
                      {SUBPASOS[i]}
                    </Badge>
                  ))}
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
