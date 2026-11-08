"use client";
// Diario (lane 287): carga la lista liviana de entradas sobre la que se calculan las estadísticas (E1). Se pide una vez por diario.
import { useEffect, useState } from "react";
import type { FilaEstadistica } from "@/lib/diario/estadisticas";
import type { TipoDiario } from "@/lib/diario/reglas";
import { toast } from "@/lib/toast";

export interface DatosEstadisticasCliente {
  filas: FilaEstadistica[];
  truncado: boolean;
}

/** null = todavía cargando. `version` fuerza una carga nueva (cuando se guardó o borró una entrada). */
export function useEstadisticas(tipo: TipoDiario, version: number): DatosEstadisticasCliente | null {
  const [datos, setDatos] = useState<DatosEstadisticasCliente | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario/estadisticas?tipo=${tipo}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudieron cargar las estadísticas");
        if (vivo) setDatos(d as DatosEstadisticasCliente);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudieron cargar las estadísticas"));
    return () => {
      vivo = false;
    };
  }, [tipo, version]);
  return datos;
}
