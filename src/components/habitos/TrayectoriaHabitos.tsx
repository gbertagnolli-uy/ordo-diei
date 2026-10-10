"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { EstadoHabito } from "@/lib/habitos/server";

const DIAS = 60;
const config = { constancia: { label: "Constancia", color: "var(--primary)" } } satisfies ChartConfig;
const corta = (f: string) => format(parseISO(f), "d MMM", { locale: es });

export function TrayectoriaHabitos({ habitos }: { habitos: EstadoHabito[] }) {
  const [filtroId, setFiltroId] = useState<string>("todos");

  const habitosAMostrar =
    filtroId === "todos"
      ? habitos
      : habitos.filter((h) => String(h.habitoId) === filtroId);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="font-heading text-lg">Trayectoria de constancia</CardTitle>
          <CardDescription>
            Evolución de los últimos {DIAS} días. Un día sin realizar no borra tu avance; solo genera una leve caída.
          </CardDescription>
        </div>

        {habitos.length > 1 && (
          <div className="w-full sm:w-56">
            <NativeSelect value={filtroId} onChange={(e) => setFiltroId(e.target.value)}>
              <NativeSelectOption value="todos">Todos los hábitos</NativeSelectOption>
              {habitos.map((h) => (
                <NativeSelectOption key={h.habitoId} value={String(h.habitoId)}>
                  {h.nombre}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
      </CardHeader>

      <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {habitosAMostrar.map((h) => {
          const datos = h.trayectoria
            .slice(-DIAS)
            .map((p) => ({ fecha: p.fecha, constancia: Math.round(p.constancia * 100) }));

          return (
            <figure key={h.habitoId} className="space-y-2">
              <figcaption className="flex items-baseline justify-between text-sm">
                <span className="font-medium truncate max-w-[200px]">{h.nombre}</span>
                <span className="tabular-nums text-muted-foreground font-semibold">
                  {Math.round(h.constancia * 100)} %
                </span>
              </figcaption>

              {datos.length < 2 ? (
                <p className="flex h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                  La trayectoria se dibuja a partir del segundo día
                </p>
              ) : (
                <ChartContainer config={config} className="aspect-auto h-28 w-full">
                  <LineChart data={datos} margin={{ left: 0, right: 8, top: 4, bottom: 0 }} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickFormatter={corta} minTickGap={32} />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 50, 100]}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <ChartTooltip
                      cursor
                      content={
                        <ChartTooltipContent
                          labelFormatter={(f) => corta(String(f))}
                          formatter={(v) => `Constancia ${v} %`}
                          hideIndicator
                        />
                      }
                    />
                    <Line
                      dataKey="constancia"
                      type="monotone"
                      stroke="var(--color-constancia)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </figure>
          );
        })}
      </CardContent>
    </Card>
  );
}
