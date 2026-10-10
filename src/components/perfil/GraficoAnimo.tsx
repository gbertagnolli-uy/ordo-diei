"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { addDays, format, startOfDay, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const DIAS = 90;
const config = { felicidad: { label: "Felicidad", color: "var(--primary)" } } satisfies ChartConfig;

export interface RegistroAnimoItem {
  creadoEn: string;
  puntaje: number;
}

// Promedio diario de felicidad de los últimos 90 días; los días sin registro quedan sin punto y la línea los une.
export function GraficoAnimo({ registros, nombre, esPropio }: { registros: RegistroAnimoItem[]; nombre: string; esPropio: boolean }) {
  const datos = useMemo(() => {
    const porDia = new Map<string, number[]>();
    for (const r of registros) {
      const dia = format(new Date(r.creadoEn), "yyyy-MM-dd");
      porDia.set(dia, [...(porDia.get(dia) ?? []), r.puntaje]);
    }
    const inicio = subDays(startOfDay(new Date()), DIAS - 1);
    return Array.from({ length: DIAS }, (_, i) => {
      const fecha = format(addDays(inicio, i), "yyyy-MM-dd");
      const p = porDia.get(fecha);
      return { fecha, felicidad: p ? Math.round(p.reduce((a, b) => a + b, 0) / p.length) : null };
    });
  }, [registros]);

  const corta = (f: string) => format(new Date(`${f}T00:00:00`), "d MMM", { locale: es });
  const conDatos = datos.filter((d) => d.felicidad !== null).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg">Estado de ánimo</CardTitle>
        <CardDescription>
          Nivel de felicidad de {esPropio ? "tus" : "los"} últimos {DIAS} días según {esPropio ? "los estados que elegiste" : `los estados que eligió ${nombre}`}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {conDatos === 0 ? (
          <p className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Todavía no hay estados de ánimo registrados
          </p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <LineChart data={datos} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="fecha" tickLine={false} axisLine={false} tickFormatter={corta} minTickGap={40} />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(v) => (v === 100 ? "Muy feliz" : v === 50 ? "Neutral" : v === 0 ? "Poco feliz" : "")}
              />
              <ChartTooltip
                cursor
                content={
                  <ChartTooltipContent
                    labelFormatter={(f) => corta(String(f))}
                    formatter={(v) => `Felicidad ${v} / 100`}
                    hideIndicator
                  />
                }
              />
              <Line
                dataKey="felicidad"
                type="monotone"
                stroke="var(--color-felicidad)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
