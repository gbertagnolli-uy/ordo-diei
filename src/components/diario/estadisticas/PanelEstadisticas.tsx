"use client";
// Diario (lane 287): pantalla de estadísticas, con tres pestañas: General (rachas y totales), Período (semana, mes o año) y Gráficos (por sujeto y rango).
// Reúne vendor/Daily_You/lib/pages/statistics_page.dart (Demizo/Daily_You@7cc237d), vendor/storypad/lib/views/stats (theachoem/storypad@a76825e)
// y vendor/moodiary/.../mood_insights (ZhuJHua/moodiary@2c552dd).
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { GraficosEstadisticas } from "./GraficosEstadisticas";
import { PeriodoEstadisticas } from "./PeriodoEstadisticas";
import { ResumenGeneral } from "./ResumenGeneral";
import { usePreferencia } from "./controles";
import { useEstadisticas } from "./useEstadisticas";

type Pestana = "general" | "periodo" | "graficos";
const esPestana = (v: unknown): v is Pestana => v === "general" || v === "periodo" || v === "graficos";

export function PanelEstadisticas({
  tipo,
  hoy,
  catalogo,
  version,
  onVolver,
  onIrADia,
}: {
  tipo: TipoDiario;
  hoy: string;
  catalogo: Catalogo | null;
  /** Sube cuando se guardó o borró una entrada, para volver a pedir los datos. */
  version: number;
  onVolver: () => void;
  onIrADia: (fecha: string) => void;
}) {
  const datos = useEstadisticas(tipo, version);
  const [pestana, setPestana] = usePreferencia<Pestana>("diario.stats.pestana", "general", esPestana);

  return (
    <section aria-label="Estadísticas del diario" className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Volver al diario" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">Estadísticas</h2>
      </div>
      {datos === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : datos.filas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Todavía no hay entradas para mostrar estadísticas.</p>
      ) : (
        <>
          {datos.truncado && <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Hay muchas entradas: las estadísticas cuentan las 20.000 más recientes.</p>}
          <Tabs value={pestana} onValueChange={(v) => esPestana(v) && setPestana(v)}>
            <TabsList className="w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="periodo">Período</TabsTrigger>
              <TabsTrigger value="graficos">Gráficos</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-3">
              <ResumenGeneral filas={datos.filas} hoy={hoy} />
            </TabsContent>
            <TabsContent value="periodo" className="mt-3">
              <PeriodoEstadisticas tipo={tipo} filas={datos.filas} hoy={hoy} catalogo={catalogo} onIrADia={onIrADia} />
            </TabsContent>
            <TabsContent value="graficos" className="mt-3">
              <GraficosEstadisticas tipo={tipo} filas={datos.filas} hoy={hoy} catalogo={catalogo} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </section>
  );
}
