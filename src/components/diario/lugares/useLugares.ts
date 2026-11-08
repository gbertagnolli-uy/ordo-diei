"use client";
// Diario (lane 296): carga los lugares frecuentes y expone las acciones. Hace el papel del `PlaceController` de moodiary
// (vendor/moodiary/packages/feature_base/moodiary_data/lib/src/place_controller.dart, ZhuJHua/moodiary@2c552dd).
import { useCallback, useEffect, useState } from "react";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { LugarVista } from "@/lib/diario/servidor-lugares";
import { toast } from "@/lib/toast";

async function pedir(url: string, metodo: string, cuerpo?: unknown): Promise<Record<string, unknown>> {
  const r = await fetch(url, { method: metodo, headers: cuerpo ? { "content-type": "application/json" } : undefined, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? "No se pudo completar");
  return d;
}

export interface AccionesLugares {
  tipo: TipoDiario;
  /** null = todavía cargando. */
  lista: LugarVista[] | null;
  recargar: () => Promise<void>;
  /** Devuelve el id creado, o null si falló (ya avisó con un toast). */
  crear: (cuerpo: Record<string, unknown>) => Promise<number | null>;
  editar: (id: number, cuerpo: Record<string, unknown>) => Promise<boolean>;
  borrar: (id: number) => Promise<boolean>;
  reordenar: (ids: number[]) => Promise<boolean>;
  /** moodiary `fetchPosition`: la ubicación pasa a ser un lugar (el que ya está cerca, el del mismo nombre o uno nuevo). null si falló. */
  deUbicacion: (latitud: number, longitud: number) => Promise<LugarVista | null>;
}

export function useLugares(tipo: TipoDiario): AccionesLugares {
  const [lista, setLista] = useState<LugarVista[] | null>(null);

  const recargar = useCallback(async () => {
    try {
      setLista(((await pedir(`/api/diario/lugares?tipo=${tipo}`, "GET")) as { lugares: LugarVista[] }).lugares);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los lugares");
    }
  }, [tipo]);

  // Carga inicial (y al cambiar de diario). `recargar` queda para después de cada cambio
  useEffect(() => {
    let vivo = true;
    pedir(`/api/diario/lugares?tipo=${tipo}`, "GET")
      .then((d) => vivo && setLista((d as { lugares: LugarVista[] }).lugares))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudieron cargar los lugares"));
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
    crear: (cuerpo) => intentar(async () => (await pedir("/api/diario/lugares", "POST", { tipo, ...cuerpo })).id as number, null),
    editar: (id, cuerpo) => intentar(async () => (await pedir(`/api/diario/lugares/${id}`, "PATCH", { tipo, ...cuerpo }), true), false),
    borrar: (id) => intentar(async () => (await pedir(`/api/diario/lugares/${id}?tipo=${tipo}`, "DELETE"), true), false),
    reordenar: (ids) => intentar(async () => (await pedir("/api/diario/lugares/orden", "POST", { tipo, ids }), true), false),
    deUbicacion: (latitud, longitud) => intentar(async () => ((await pedir("/api/diario/lugares/ubicacion", "POST", { tipo, latitud, longitud })).lugar as LugarVista), null),
  };
}
