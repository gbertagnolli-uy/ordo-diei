"use client";
// Diario (lane 286): carga las plantillas y expone las acciones. Hace el papel del `TemplatesProvider` de Daily You
// (vendor/Daily_You/lib/providers/templates_provider.dart, Demizo/Daily_You@7cc237d).
import { useCallback, useEffect, useState } from "react";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { PlantillaVista } from "@/lib/diario/servidor-plantillas";
import { toast } from "@/lib/toast";

async function pedir(url: string, metodo: string, cuerpo?: unknown): Promise<Record<string, unknown>> {
  const r = await fetch(url, { method: metodo, headers: cuerpo ? { "content-type": "application/json" } : undefined, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? "No se pudo completar");
  return d;
}

export interface AccionesPlantillas {
  tipo: TipoDiario;
  /** null = todavía cargando. */
  lista: PlantillaVista[] | null;
  recargar: () => Promise<void>;
  /** Devuelve el id creado, o null si falló (ya avisó con un toast). */
  crear: (cuerpo: Record<string, unknown>) => Promise<number | null>;
  editar: (id: number, cuerpo: Record<string, unknown>) => Promise<boolean>;
  borrar: (id: number) => Promise<boolean>;
  /** La estrella de la lista: marca esta plantilla como predeterminada o saca la marca. */
  predeterminada: (id: number, valor: boolean) => Promise<boolean>;
}

export function usePlantillas(tipo: TipoDiario): AccionesPlantillas {
  const [lista, setLista] = useState<PlantillaVista[] | null>(null);

  const recargar = useCallback(async () => {
    try {
      setLista(((await pedir(`/api/diario/plantillas?tipo=${tipo}`, "GET")) as { plantillas: PlantillaVista[] }).plantillas);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar las plantillas");
    }
  }, [tipo]);

  // Carga inicial (y al cambiar de diario). `recargar` queda para después de cada cambio
  useEffect(() => {
    let vivo = true;
    pedir(`/api/diario/plantillas?tipo=${tipo}`, "GET")
      .then((d) => vivo && setLista((d as { plantillas: PlantillaVista[] }).plantillas))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudieron cargar las plantillas"));
    return () => {
      vivo = false;
    };
  }, [tipo]);

  const intentar = useCallback(
    async <T,>(hacer: () => Promise<T>, fallo: T): Promise<T> => {
      try {
        const r = await hacer();
        await recargar();
        return r;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo completar");
        return fallo;
      }
    },
    [recargar],
  );

  return {
    tipo,
    lista,
    recargar,
    crear: (cuerpo) => intentar(async () => (await pedir("/api/diario/plantillas", "POST", { tipo, ...cuerpo })).id as number, null),
    editar: (id, cuerpo) => intentar(async () => (await pedir(`/api/diario/plantillas/${id}`, "PATCH", { tipo, ...cuerpo }), true), false),
    borrar: (id) => intentar(async () => (await pedir(`/api/diario/plantillas/${id}?tipo=${tipo}`, "DELETE"), true), false),
    predeterminada: (id, valor) => intentar(async () => (await pedir(`/api/diario/plantillas/${id}`, "PATCH", { tipo, predeterminada: valor }), true), false),
  };
}
