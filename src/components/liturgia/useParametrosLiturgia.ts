"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fechaDeParametro, guardarVersion, leerVersionGuardada, resolverVersion } from "@/lib/liturgia/cliente";
import { VERSION_PREDETERMINADA } from "@/lib/liturgia/tipos";
import type { VersionLiturgica } from "@/lib/liturgia/tipos";

/**
 * Versión y fecha de una pantalla de liturgia. Viven en la URL (`?version=1888&fecha=2026-10-14`,
 * compartible) y la versión se recuerda por pantalla y dispositivo (SPEC §7).
 * Pantalla nueva o sin preferencia ⇒ 1906.
 */
export function useParametrosLiturgia(pantalla: string) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const urlVersion = search.get("version");
  const urlFecha = search.get("fecha");

  const version: VersionLiturgica = useMemo(
    // En el servidor no hay localStorage: se pinta con la URL y el efecto de abajo completa la preferencia.
    () => resolverVersion(urlVersion, typeof window === "undefined" ? null : leerVersionGuardada(pantalla)),
    [urlVersion, pantalla],
  );
  const fecha = useMemo(() => fechaDeParametro(urlFecha), [urlFecha]);

  const reemplazar = useCallback(
    (cambios: Record<string, string | null>) => {
      const p = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(cambios)) {
        if (v === null) p.delete(k);
        else p.set(k, v);
      }
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, search],
  );

  // Preferencia recordada y la URL no la trae ⇒ la pone (así el enlace queda completo).
  useEffect(() => {
    if (urlVersion) return;
    const guardada = resolverVersion(null, leerVersionGuardada(pantalla));
    if (guardada !== VERSION_PREDETERMINADA) reemplazar({ version: guardada });
  }, [urlVersion, pantalla, reemplazar]);

  const setVersion = useCallback(
    (v: VersionLiturgica) => {
      guardarVersion(pantalla, v);
      reemplazar({ version: v });
    },
    [pantalla, reemplazar],
  );
  const setFecha = useCallback((iso: string) => reemplazar({ fecha: iso }), [reemplazar]);

  return { version, setVersion, fecha, setFecha };
}
