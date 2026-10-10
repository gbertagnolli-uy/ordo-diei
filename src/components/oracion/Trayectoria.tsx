"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { HABITOS } from "@/lib/oracion/catalogo";
import type { EstadoHabito } from "@/lib/oracion/engine";

const DIAS = 60;
const config = { constancia: { label: "Constancia", color: "var(--primary)" } } satisfies ChartConfig;
const corta = (f: string) => format(parseISO(f), "d MMM", { locale: es });

// Trayectoria de la constancia (Loop): un día perdido es una leve caída, nunca un reinicio.
// Múltiplos pequeños: una línea por oración, misma escala 0–100 %, sin depender del color.
export function Trayectoria({ habitos }: { habitos: EstadoHabito[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Trayectoria</CardTitle>
        <CardDescription>Constancia de los últimos {DIAS} días. Un día sin rezar baja un poco la línea; no la borra.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {habitos.map((h) => {
          const datos = h.trayectoria.slice(-DIAS).map((p) => ({ fecha: p.fecha, constancia: Math.round(p.constancia * 100) }));
          return (
            <figure key={h.habito} className="space-y-2">
              <figcaption className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{HABITOS[h.habito].nombre}</span>
                <span className="tabular-nums text-muted-foreground">{Math.round(h.constancia * 100)} %</span>
              </figcaption>
              {datos.length < 2 ? (
                <p className="flex h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                  La línea aparece desde el segundo día
                </p>
              ) : (
                <ChartContainer config={config} className="aspect-auto h-28 w-full">
                  <LineChart data={datos} margin={{ left: 0, right: 8, top: 4, bottom: 0 }} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickFormatter={corta} minTickGap={32} />
                    <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip
                      cursor
                      content={<ChartTooltipContent labelFormatter={(f) => corta(String(f))} formatter={(v) => `Constancia ${v} %`} hideIndicator />}
                    />
                    <Line dataKey="constancia" type="monotone" stroke="var(--color-constancia)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
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
