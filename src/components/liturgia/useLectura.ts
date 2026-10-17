"use client";

import { useEffect, useState } from "react";

export type EstadoLectura<T> =
  | { estado: "cargando" }
  | { estado: "ok"; datos: T }
  | { estado: "no-generado" }
  | { estado: "error"; mensaje: string };

/**
 * Lee un endpoint de /api/liturgia/*. `ruta` es la URL completa con sus parámetros, o `null` para
 * no pedir nada. Cancela la petición anterior si cambia la ruta.
 */
export function useLectura<T>(ruta: string | null): EstadoLectura<T> {
  // El resultado se guarda junto a la ruta que lo originó: mientras la ruta cambia se ve «cargando»
  // sin necesidad de reiniciar el estado dentro del efecto.
  const [resultado, setResultado] = useState<{ ruta: string; r: EstadoLectura<T> } | null>(null);

  useEffect(() => {
    if (!ruta) return;
    const ctl = new AbortController();
    fetch(ruta, { signal: ctl.signal })
      .then(async (res) => {
        if (res.status === 404) return { estado: "no-generado" } as EstadoLectura<T>;
        if (!res.ok) {
          const cuerpo = await res.json().catch(() => ({}));
          return { estado: "error", mensaje: cuerpo.error ?? `Error ${res.status}` } as EstadoLectura<T>;
        }
        const cuerpo = await res.json();
        return { estado: "ok", datos: cuerpo.datos as T } as EstadoLectura<T>;
      })
      .then((r) => setResultado({ ruta, r }))
      .catch((e) => {
        if (e?.name !== "AbortError") setResultado({ ruta, r: { estado: "error", mensaje: "No se pudo conectar" } });
      });
    return () => ctl.abort();
  }, [ruta]);

  if (!ruta || resultado?.ruta !== ruta) return { estado: "cargando" };
  return resultado.r;
}

/** Arma `/api/liturgia/<endpoint>?a=1&b=2`, ignorando los valores vacíos. */
export function rutaLiturgia(endpoint: string, params: Record<string, string | number | null | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") p.set(k, String(v));
  return `/api/liturgia/${endpoint}?${p.toString()}`;
}
