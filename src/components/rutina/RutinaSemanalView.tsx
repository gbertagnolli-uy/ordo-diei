"use client";

import React, { useState } from "react";
import { Calendar, Sun, Sparkles, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragScroll } from "@/components/ui/drag-scroll";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EtapaRutina, RutinaSemanalConfig } from "@/lib/rutina/tipos";
import { filtrarEtapasPorDia } from "@/lib/rutina/calculadorHorarios";
import { IconoRutina } from "./IconoRutina";

interface RutinaSemanalViewProps {
  etapas: EtapaRutina[];
  semanalConfig: RutinaSemanalConfig;
  esPadre?: boolean;
}

const DIAS = [
  { num: 1, nombre: "Lunes", tipo: "laborable" },
  { num: 2, nombre: "Martes", tipo: "laborable" },
  { num: 3, nombre: "Miércoles", tipo: "laborable" },
  { num: 4, nombre: "Jueves", tipo: "laborable" },
  { num: 5, nombre: "Viernes", tipo: "laborable" },
  { num: 6, nombre: "Sábado", tipo: "finde" },
  { num: 0, nombre: "Domingo", tipo: "domingo" },
];

export function RutinaSemanalView({
  etapas,
  semanalConfig,
  esPadre = false,
}: RutinaSemanalViewProps) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<number>(1); // Lunes por defecto

  // Etapas del día seleccionado
  const etapasDelDia = React.useMemo(() => {
    // Generar una fecha simulada con el día de la semana pedido
    const fechaRef = new Date();
    // Ajustar día de la semana
    const diff = diaSeleccionado - fechaRef.getDay();
    const fechaSimulada = new Date(fechaRef.getTime() + diff * 24 * 3600 * 1000);
    return filtrarEtapasPorDia(etapas, fechaSimulada);
  }, [etapas, diaSeleccionado]);

  return (
    <div className="space-y-6">
      {/* Tarjeta de enfoque semanal */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">Enfoque y Ritmo de la Semana</CardTitle>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Homeschooling y Hogar
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            {semanalConfig.enfoqueSemanal}
          </p>
        </CardContent>
      </Card>

      {/* Selector de días de la semana */}
      <DragScroll activeIndex={DIAS.findIndex((d) => d.num === diaSeleccionado)}>
        {DIAS.map((d) => {
          const esActivo = diaSeleccionado === d.num;
          return (
            <Button
              key={d.num}
              variant={esActivo ? "default" : "outline"}
              onClick={() => setDiaSeleccionado(d.num)}
              className="shrink-0 min-w-[96px] h-12 flex flex-col items-center justify-center rounded-xl p-1 font-semibold"
            >
              <span className="text-xs">{d.nombre}</span>
              <span className="text-[10px] opacity-75 font-normal">
                {d.tipo === "laborable" ? "Estudio" : d.tipo === "finde" ? "Hogar" : "Día del Señor"}
              </span>
            </Button>
          );
        })}
      </DragScroll>

      {/* Detalle del día seleccionado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1 y 2: Horario y etapas de este día */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              Cronograma para los {DIAS.find((d) => d.num === diaSeleccionado)?.nombre}s ({etapasDelDia.length} etapas)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">08:00 a 22:00</span>
          </div>

          <div className="space-y-2">
            {etapasDelDia.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-card/80 hover:bg-card text-xs gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    <IconoRutina nombre={e.icono} className="size-4 text-primary" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-foreground block truncate">{e.titulo}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {e.horaInicio} – {e.horaFin} ({e.duracionMin} min)
                    </span>
                  </div>
                </div>

                <Badge variant="secondary" className="shrink-0 text-[10px] capitalize">
                  {e.categoria}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 3: Notas del Fin de Semana y Tradiciones Familiares */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sun className="size-4 text-amber-500" />
                Sábado: Hogar y Familia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {semanalConfig.notasSabado}
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/20 bg-indigo-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <Heart className="size-4 text-indigo-500" />
                Domingo: Día del Señor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {semanalConfig.notasDomingo}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
