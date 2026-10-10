"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { pasosDe } from "@/lib/habitos/catalogo";
import type { EstadoHabito } from "@/lib/habitos/server";

const SUBPASOS_ROSARIO = ["3", "6", "10"];

export function Escalera({
  habitos,
  misterios,
}: {
  habitos: EstadoHabito[];
  misterios: readonly string[];
}) {
  const conEscalera = habitos.filter((h) => h.pasos > 1);
  const [seleccionadoId, setSeleccionadoId] = useState<number>(conEscalera[0]?.habitoId ?? 0);

  if (conEscalera.length === 0) return null;

  const h = conEscalera.find((x) => x.habitoId === seleccionadoId) ?? conEscalera[0];
  const listaPasos = pasosDe(h);
  const total = h.pasos;
  const logrados = h.paso + (h.completo ? 1 : 0);
  const esRosario = h.clave === "rosario";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="font-heading text-lg">Escalera de progreso</CardTitle>
          <CardDescription>
            {h.nombre}: Paso {h.paso + 1} de {total}. Subís de paso con días seguidos cumplidos.
          </CardDescription>
        </div>

        {conEscalera.length > 1 && (
          <div className="w-full sm:w-64">
            <NativeSelect
              value={String(h.habitoId)}
              onChange={(e) => setSeleccionadoId(Number(e.target.value))}
            >
              {conEscalera.map((item) => (
                <NativeSelectOption key={item.habitoId} value={String(item.habitoId)}>
                  {item.nombre}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={(logrados / total) * 100} aria-label={`Avance hacia ${h.nombre} completo`} />

        {esRosario ? (
          <ItemGroup className="gap-1">
            {misterios.map((nombre, m) => {
              const pasosDelMisterio = [0, 1, 2].map((s) => m * 3 + s);
              const hecho = pasosDelMisterio.every((p) => p < logrados);
              const actual = pasosDelMisterio.includes(h.paso) && !h.completo;
              return (
                <Item
                  key={nombre}
                  size="sm"
                  variant={actual ? "outline" : "default"}
                  className={cn(!hecho && !actual && "opacity-60")}
                >
                  <ItemMedia
                    variant="icon"
                    className={cn(
                      "size-8 rounded-md",
                      hecho ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {hecho ? <Check className="size-4" /> : <span className="text-xs font-semibold tabular-nums">{m + 1}</span>}
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
                        className={cn(
                          "tabular-nums",
                          p === h.paso && !h.completo && "border-primary text-primary",
                          p > h.paso && "text-muted-foreground"
                        )}
                      >
                        {SUBPASOS_ROSARIO[i]}
                      </Badge>
                    ))}
                  </ItemActions>
                </Item>
              );
            })}
          </ItemGroup>
        ) : (
          <ItemGroup className="gap-1">
            {listaPasos.map((paso, idx) => {
              const hecho = idx < logrados;
              const actual = idx === h.paso && !h.completo;
              return (
                <Item
                  key={idx}
                  size="sm"
                  variant={actual ? "outline" : "default"}
                  className={cn(!hecho && !actual && "opacity-60")}
                >
                  <ItemMedia
                    variant="icon"
                    className={cn(
                      "size-8 rounded-md",
                      hecho ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {hecho ? <Check className="size-4" /> : <span className="text-xs font-semibold tabular-nums">{idx + 1}</span>}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{paso.titulo}</ItemTitle>
                    <ItemDescription>
                      {paso.diasParaSubir ? `${paso.diasParaSubir} días seguidos para subir` : "Paso final y consolidación"}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge
                      variant={hecho ? "default" : actual ? "outline" : "secondary"}
                      className={cn(actual && "border-primary text-primary")}
                    >
                      {hecho ? "Superado" : actual ? "Actual" : "Por alcanzar"}
                    </Badge>
                  </ItemActions>
                </Item>
              );
            })}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  );
}
