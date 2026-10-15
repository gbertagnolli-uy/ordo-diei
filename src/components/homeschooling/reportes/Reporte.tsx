"use client";

// Propio de Ordo (usa StatsCard portado de Roost): reporte imprimible de un alumno — portada, KPI, horas por materia con
// gráfico y metas, cursos con avance y, de H3, un anexo con las evidencias destacadas. «Imprimir / Guardar PDF» = window.print().

import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BookCheck, Clock, Compass, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { formatoDuracion } from "@/lib/homeschooling/horas";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { resumenHoras } from "@/lib/homeschooling/servidor/horas";
import { toast } from "@/lib/toast";
import { StatsCard } from "@/components/homeschooling/roost/StatsCard";
import type { AlumnoLite } from "@/components/homeschooling/cursos/MateriaHeader";

type Resumen = Awaited<ReturnType<typeof resumenHoras>>;

const CONFIG = { horas: { label: "Horas", color: "var(--primary)" } } satisfies ChartConfig;
const horasDe = (min: number) => Math.round((min / 60) * 10) / 10;

export default function Reporte({
  resumen,
  alumnos,
  materias,
  esPadre,
  tipo,
  referencia,
}: {
  resumen: Resumen;
  alumnos: AlumnoLite[];
  materias: { id: number; name: string }[];
  esPadre: boolean;
  tipo: "anio" | "trimestre" | "mes";
  referencia: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const poner = (clave: string, valor: string) => {
    const nuevo = new URLSearchParams(params.toString());
    nuevo.set(clave, valor);
    router.replace(`?${nuevo}`);
  };

  const guardarMeta = async (materiaId: number, valor: string) => {
    const horas = Math.max(0, Math.round(Number(valor) || 0));
    try {
      await api("/api/homeschooling/metas", { method: "PUT", body: { alumnoId: resumen.alumno.id, materiaId, horas } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la meta");
    }
  };

  const datos = resumen.materias.map((m) => ({ materia: m.nombre, horas: horasDe(m.minutosTotal) }));
  const periodo = `${new Date(`${resumen.desde}T12:00:00`).toLocaleDateString("es", { dateStyle: "long" })} al ${new Date(`${resumen.hasta}T12:00:00`).toLocaleDateString("es", { dateStyle: "long" })}`;

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        {esPadre && (
          <NativeSelect aria-label="Alumno" value={resumen.alumno.id} onChange={(e) => poner("alumno", e.target.value)}>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </NativeSelect>
        )}
        <NativeSelect aria-label="Período" value={tipo} onChange={(e) => poner("tipo", e.target.value)}>
          <option value="anio">Año escolar</option>
          <option value="trimestre">Trimestre</option>
          <option value="mes">Mes</option>
        </NativeSelect>
        <Input aria-label="Fecha de referencia" type="date" className="w-44" value={referencia} onChange={(e) => e.target.value && poner("ref", e.target.value)} />
        <Button className="ml-auto" onClick={() => window.print()}>
          <Printer /> Imprimir / Guardar PDF
        </Button>
      </div>

      <header className="sin-corte space-y-1 border-b pb-4">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Reporte de estudio</p>
        <h1 className="text-3xl font-bold text-foreground">{resumen.alumno.nombre}</h1>
        <p className="text-muted-foreground">{periodo}</p>
      </header>

      <section className="sin-corte grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatsCard title="Horas de estudio" value={formatoDuracion(resumen.totales.minutos)} icon={Clock} color="primary" />
        <StatsCard title="Lecciones hechas" value={`${resumen.totales.leccionesHechas} de ${resumen.totales.leccionesPlanificadas}`} icon={BookCheck} color="success" />
        <StatsCard title="Actividades" value={resumen.totales.actividades} icon={Compass} color="warning" />
      </section>

      <section className="sin-corte space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Horas por materia</h2>
        {datos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay horas registradas en este período.</p>
        ) : (
          <ChartContainer config={CONFIG} className="aspect-auto h-56 w-full">
            <BarChart data={datos} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="materia" tickLine={false} axisLine={false} />
              <YAxis width={32} tickLine={false} axisLine={false} allowDecimals />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="horas" fill="var(--color-horas)" radius={4} maxBarSize={72} />
            </BarChart>
          </ChartContainer>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 font-medium">Materia</th>
              <th className="py-2 font-medium">Horas</th>
              <th className="py-2 font-medium">Lecciones</th>
              <th className="py-2 font-medium">Nota</th>
              <th className="w-40 py-2 font-medium">Meta (h)</th>
            </tr>
          </thead>
          <tbody>
            {materias.map((m) => {
              const f = resumen.materias.find((x) => x.materiaId === m.id);
              const meta = resumen.metas.find((x) => x.materiaId === m.id)?.horas ?? 0;
              if (!f && !meta && !esPadre) return null;
              const hechas = f ? horasDe(f.minutosTotal) : 0;
              return (
                <tr key={m.id} className="border-b sin-corte">
                  <td className="py-2 font-medium text-foreground">{m.name}</td>
                  <td className="py-2">{f ? formatoDuracion(f.minutosTotal) : "—"}</td>
                  <td className="py-2">{f ? `${f.leccionesHechas}/${f.leccionesPlanificadas}` : "—"}</td>
                  <td className="py-2">{f?.promedioNotas != null ? `${f.promedioNotas} %` : "—"}</td>
                  <td className="py-2">
                    {esPadre ? (
                      <Input
                        type="number"
                        min={0}
                        aria-label={`Meta de horas de ${m.name}`}
                        className="h-8 w-20 print:hidden"
                        defaultValue={meta || ""}
                        key={`${resumen.alumno.id}-${m.id}-${meta}`}
                        onBlur={(e) => Number(e.target.value || 0) !== meta && guardarMeta(m.id, e.target.value)}
                      />
                    ) : null}
                    {meta > 0 && (
                      <div className="space-y-1">
                        <Progress value={Math.min(100, (hechas / meta) * 100)} />
                        <p className="text-xs text-muted-foreground">
                          {hechas} / {meta} h
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {resumen.cursos.length > 0 && (
        <section className="sin-corte space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Cursos</h2>
          {resumen.cursos.map((c) => (
            <div key={`${c.materia}-${c.titulo}`} className="space-y-1">
              <p className="flex justify-between text-sm">
                <span className="text-foreground">
                  {c.titulo} <span className="text-muted-foreground">· {c.materia}</span>
                </span>
                <span className="text-muted-foreground">{c.porcentaje}%</span>
              </p>
              <Progress value={c.porcentaje} />
            </div>
          ))}
        </section>
      )}

      {resumen.evidenciasDestacadas.length > 0 && (
        <section className="salto-de-pagina space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Anexo: trabajos destacados</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {resumen.evidenciasDestacadas.map((e) => (
              <figure key={e.id} className="sin-corte space-y-1">
                {e.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.foto} alt={e.titulo ?? "Trabajo"} className="aspect-4/3 w-full rounded-lg border object-cover" />
                )}
                <figcaption className="text-xs text-muted-foreground">
                  {e.titulo || "Sin título"} · {e.fecha}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
