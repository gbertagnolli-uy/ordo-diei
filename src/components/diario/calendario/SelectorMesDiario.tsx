"use client";
// Diario (lane 288): el selector de mes con los datos del diario — de la primera entrada al mes de hoy, con un punto en los meses que tienen entradas.
import { useMemo } from "react";
import { primeraFecha, rangoDeMeses } from "@/lib/diario/calendario";
import type { TipoDiario } from "@/lib/diario/reglas";
import { useEstadisticas } from "../estadisticas/useEstadisticas";
import { SelectorMes } from "./SelectorMes";

export function SelectorMesDiario({ tipo, version, mes, hoy, onElegir, onCerrar }: { tipo: TipoDiario; version: number; mes: string; hoy: string; onElegir: (mes: string) => void; onCerrar: () => void }) {
  const datos = useEstadisticas(tipo, version);
  const rango = useMemo(() => (datos ? rangoDeMeses(primeraFecha(datos.filas), hoy) : null), [datos, hoy]);
  const conEntradas = useMemo(() => (datos ? new Set(datos.filas.map((f) => f.fecha.slice(0, 7))) : undefined), [datos]);
  if (!rango) return null;
  return <SelectorMes rango={rango} inicial={mes} conEntradas={conEntradas} hoy={hoy} onElegir={onElegir} onCerrar={onCerrar} />;
}
