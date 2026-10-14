"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLectura, rutaLiturgia } from "./useLectura";
import { ColorLiturgicoPunto } from "./ColorLiturgicoPunto";
import { diasDelMes } from "@/lib/liturgia/lecturas";
import type { FilaDia } from "@/lib/liturgia/repositorio";
import type { VersionLiturgica } from "@/lib/liturgia/tipos";
import { cn } from "@/lib/utils";

interface CalendariumMesProps {
  fechaSeleccionada: string;
  version: VersionLiturgica;
  onFecha: (iso: string) => void;
  className?: string;
}

const DIAS_CABECERA = ["L", "M", "M", "J", "V", "S", "D"];
const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function rangoAbreviado(rango: string): string {
  if (!rango) return "";
  const r = rango.toLowerCase();
  if (r.includes("i classis") || r.includes("1.ª clase")) return "I cl";
  if (r.includes("ii classis") || r.includes("2.ª clase")) return "II cl";
  if (r.includes("duplex majus")) return "D.M.";
  if (r.startsWith("semiduplex")) return "Sd";
  if (r.startsWith("duplex")) return "D";
  if (r.startsWith("simplex")) return "S";
  if (r.startsWith("feria")) return "F";
  if (r.startsWith("commemoratio")) return "C";
  if (r.startsWith("vigilia")) return "Vig";
  return rango.slice(0, 3);
}

/**
 * Grilla mensual del Calendarium litúrgico (SPEC §10.1).
 * Muestra los días del mes con su punto de color litúrgico y rango abreviado (D, Sd, S, F...).
 * Permite cambiar de mes y seleccionar cualquier día para actualizar todo el dashboard.
 */
export function CalendariumMes({
  fechaSeleccionada,
  version,
  onFecha,
  className,
}: CalendariumMesProps) {
  const [anio, setAnio] = useState(() => Number(fechaSeleccionada.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(fechaSeleccionada.slice(5, 7)));

  // Carga del mes litúrgico
  const mesRuta = rutaLiturgia("mes", { anio, mes, version });
  const lectura = useLectura<FilaDia[]>(mesRuta);

  const totalDias = diasDelMes(anio, mes);
  // getDay() devuelve 0 para domingo, lo ajustamos a 0 = lunes ... 6 = domingo
  const primerDiaSemana = (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;

  const anteriorMes = () => {
    if (mes === 1) {
      setAnio((a) => a - 1);
      setMes(12);
    } else {
      setMes((m) => m - 1);
    }
  };

  const siguienteMes = () => {
    if (mes === 12) {
      setAnio((a) => a + 1);
      setMes(1);
    } else {
      setMes((m) => m + 1);
    }
  };

  const mapaDias = new Map<string, FilaDia>();
  if (lectura.estado === "ok" && Array.isArray(lectura.datos)) {
    for (const d of lectura.datos) {
      mapaDias.set(d.fecha, d);
    }
  }

  return (
    <Card className={cn("border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-4">
        <CardTitle className="font-heading text-base font-bold">
          {NOMBRES_MESES[mes - 1]} {anio}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={anteriorMes} aria-label="Mes anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={siguienteMes} aria-label="Mes siguiente">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-4">
        {/* Cabecera de días (L M M J V S D) */}
        <div className="grid grid-cols-7 gap-1 text-center font-sans text-xs font-semibold text-muted-foreground mb-2">
          {DIAS_CABECERA.map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas del calendario */}
        {lectura.estado === "cargando" ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios vacíos antes del día 1 */}
            {Array.from({ length: primerDiaSemana }).map((_, i) => (
              <div key={`empty-${i}`} className="h-11 rounded-md" />
            ))}

            {/* Días del mes */}
            {Array.from({ length: totalDias }).map((_, i) => {
              const diaNum = i + 1;
              const iso = `${anio}-${String(mes).padStart(2, "0")}-${String(diaNum).padStart(2, "0")}`;
              const datosDia = mapaDias.get(iso);
              const esSeleccionado = iso === fechaSeleccionada;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onFecha(iso)}
                  className={cn(
                    "flex flex-col items-center justify-between p-1 h-11 rounded-md border text-left transition-colors cursor-pointer select-none",
                    esSeleccionado
                      ? "border-primary bg-primary/10 font-bold ring-1 ring-primary shadow-xs"
                      : "border-transparent hover:bg-muted/60",
                    datosDia?.dominical && !esSeleccionado && "bg-muted/30 font-medium",
                  )}
                  title={datosDia ? `${datosDia.titulo} (${datosDia.rango})` : iso}
                >
                  <span className={cn("text-xs leading-none", esSeleccionado ? "text-primary" : "text-foreground")}>
                    {diaNum}
                  </span>

                  {datosDia ? (
                    <div className="flex items-center justify-center gap-1 w-full mt-0.5">
                      <ColorLiturgicoPunto color={datosDia.color} className="size-2 shrink-0" />
                      <span className="text-[9px] leading-tight text-muted-foreground truncate font-sans">
                        {rangoAbreviado(datosDia.rango)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/40 font-mono">·</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
