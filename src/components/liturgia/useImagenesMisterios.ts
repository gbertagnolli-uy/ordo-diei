"use client";

import { useEffect, useState } from "react";
import { urlArte } from "@/lib/cartas/arte";
import type { Misterio } from "@/lib/liturgia/rosario";

/**
 * Obtiene las imágenes de los misterios sincronizadas con las Cartas Católicas del usuario
 * (incluyendo imágenes subidas desde el panel o el grado actual de la carta), con respaldo
 * inmediato al arte del catálogo (`misterio.imagenUrl`).
 */
export function useImagenesMisterios() {
  const [mapaPorClave, setMapaPorClave] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelado = false;
    fetch("/api/cartas")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelado || !Array.isArray(data?.cartas)) return;
        const nuevo: Record<string, string> = {};
        for (const c of data.cartas) {
          if (c?.clave && c?.imagenUrl) {
            nuevo[c.clave] = urlArte(c.imagenUrl);
          }
        }
        setMapaPorClave(nuevo);
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, []);

  return function imagenDeMisterio(misterio: Pick<Misterio, "claveCarta" | "imagenUrl">): string {
    return mapaPorClave[misterio.claveCarta] || misterio.imagenUrl;
  };
}
