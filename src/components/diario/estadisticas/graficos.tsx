"use client";
// Diario (lane 287): gráficos de línea y de barras con recharts. Hacen el papel de los `LineChart` y `BarChart` de fl_chart que usan
// vendor/Daily_You/lib/widgets/{value_over_time_chart,value_by_day_chart,distribution_chart}.dart (Demizo/Daily_You@7cc237d)
// y de `MLineChart` de moodiary (mood_insights_page.dart, ZhuJHua/moodiary@2c552dd).
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export interface PuntoLinea {
  /** Clave del eje X (única). */
  x: string;
  /** Texto del eje X cuando se muestra esta marca. */
  marca: string;
  y: number | null;
}

const config = { valor: { label: "Valor", color: "var(--primary)" } } satisfies ChartConfig;

const numero = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const valorTexto = (v: unknown, f?: (n: number) => string) => (typeof v === "number" ? (f ? f(v) : String(Math.round(v * 100) / 100)) : String(v));

export function GraficoLinea({
  datos,
  yMin,
  yMax,
  ticks,
  suave,
  color = "var(--primary)",
  referencia,
  marcasX,
  etiquetaValor,
}: {
  datos: PuntoLinea[];
  yMin: number;
  yMax: number;
  ticks?: number[];
  suave?: boolean;
  color?: string;
  /** Línea horizontal de referencia (moodiary: el 3). */
  referencia?: number;
  /** Índices cuya marca del eje X se escribe (por defecto, unas seis repartidas). */
  marcasX?: Set<number>;
  etiquetaValor?: (v: number) => string;
}) {
  const total = datos.length;
  const paso = Math.max(1, Math.ceil(total / 6));
  const marcas = new Map(datos.map((d, i) => [d.x, (marcasX ? marcasX.has(i) : i % paso === 0) ? d.marca : ""]));
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <LineChart data={datos} margin={{ left: 0, right: 12, top: 8, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="x" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} tickFormatter={(x: string) => marcas.get(x) ?? ""} />
        <YAxis domain={[yMin, yMax]} ticks={ticks} tickLine={false} axisLine={false} width={36} allowDecimals tick={{ fontSize: 11 }} tickFormatter={numero} />
        {referencia !== undefined && <ReferenceLine y={referencia} stroke="var(--border)" strokeDasharray="4 4" />}
        <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v) => valorTexto(v, etiquetaValor)} />} />
        <Line type={suave ? "monotone" : "linear"} dataKey="y" name="valor" stroke={color} strokeWidth={3} dot={total <= 45 ? { r: 2.5 } : false} connectNulls isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
}

export interface PuntoBarra {
  nombre: string;
  valor: number | null;
  color?: string;
}

export function GraficoBarras({
  datos,
  yMin,
  yMax,
  ticks,
  color = "var(--primary)",
  referencia,
  etiquetaValor,
  formatoY,
  alto = "h-48",
}: {
  datos: PuntoBarra[];
  yMin: number;
  yMax: number;
  ticks?: number[];
  color?: string;
  referencia?: number;
  etiquetaValor?: (v: number) => string;
  /** Cómo se escribe cada marca del eje Y (por defecto, el número). */
  formatoY?: (v: number) => string;
  alto?: string;
}) {
  return (
    <ChartContainer config={config} className={`aspect-auto w-full ${alto}`}>
      <BarChart data={datos} margin={{ left: 0, right: 12, top: 8, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="nombre" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
        <YAxis domain={[yMin, yMax]} ticks={ticks} tickLine={false} axisLine={false} width={36} allowDecimals tick={{ fontSize: 11 }} tickFormatter={formatoY ?? numero} />
        {referencia !== undefined && <ReferenceLine y={referencia} stroke="var(--border)" />}
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v) => valorTexto(v, etiquetaValor)} />} />
        <Bar dataKey="valor" radius={4} isAnimationActive={false}>
          {datos.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
