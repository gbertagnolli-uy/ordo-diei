"use client";
// Diario (lane 284): carga el catálogo (etiquetas, categorías de etiquetas, categorías de entrada) y expone las acciones.
// Hace el papel del `TagsProvider` de Daily You (vendor/Daily_You/lib/providers/tags_provider.dart, Demizo/Daily_You@7cc237d).
import { useCallback, useEffect, useState } from "react";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo, Recurso } from "@/lib/diario/servidor-catalogo";
import { toast } from "@/lib/toast";

async function pedir(url: string, metodo: string, cuerpo?: unknown): Promise<Record<string, unknown>> {
  const r = await fetch(url, { method: metodo, headers: cuerpo ? { "content-type": "application/json" } : undefined, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: string }).error ?? "No se pudo completar");
  return d;
}

export interface AccionesCatalogo {
  catalogo: Catalogo | null;
  recargar: () => Promise<void>;
  /** Devuelve el id creado, o null si falló (ya avisó con un toast). */
  crear: (recurso: Recurso, cuerpo: Record<string, unknown>) => Promise<number | null>;
  editar: (recurso: Recurso, id: number, cuerpo: Record<string, unknown>) => Promise<boolean>;
  borrar: (recurso: Recurso, id: number) => Promise<boolean>;
  reordenar: (recurso: "etiquetas" | "grupos", ids: number[]) => Promise<boolean>;
}

export function useCatalogo(tipo: TipoDiario): AccionesCatalogo {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);

  const recargar = useCallback(async () => {
    try {
      setCatalogo((await pedir(`/api/diario/catalogo?tipo=${tipo}`, "GET")) as unknown as Catalogo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar las etiquetas");
    }
  }, [tipo]);

  // Carga inicial (y al cambiar de diario). `recargar` queda para después de cada cambio
  useEffect(() => {
    let vivo = true;
    pedir(`/api/diario/catalogo?tipo=${tipo}`, "GET")
      .then((d) => vivo && setCatalogo(d as unknown as Catalogo))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudieron cargar las etiquetas"));
    return () => {
      vivo = false;
    };
  }, [tipo]);

  const intentar = useCallback(
    async <T,>(accion: () => Promise<T>, fallido: T): Promise<T> => {
      try {
        const r = await accion();
        await recargar();
        return r;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo completar");
        return fallido;
      }
    },
    [recargar],
  );

  return {
    catalogo,
    recargar,
    crear: (recurso, cuerpo) => intentar(async () => ((await pedir(`/api/diario/catalogo/${recurso}`, "POST", { ...cuerpo, tipo })).id as number), null),
    editar: (recurso, id, cuerpo) => intentar(async () => (await pedir(`/api/diario/catalogo/${recurso}/${id}`, "PATCH", { ...cuerpo, tipo }), true), false),
    borrar: (recurso, id) => intentar(async () => (await pedir(`/api/diario/catalogo/${recurso}/${id}?tipo=${tipo}`, "DELETE"), true), false),
    reordenar: (recurso, ids) => intentar(async () => (await pedir(`/api/diario/catalogo/${recurso}/orden`, "POST", { tipo, ids }), true), false),
  };
}
