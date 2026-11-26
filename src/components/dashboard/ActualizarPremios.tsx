"use client";

// Mantiene al día banners e insignias de premios consultando un endpoint liviano de conteos
// y disparando `router.refresh()` únicamente cuando alguno de los contadores cambia.
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const CADA_MS = 45_000;
const COOLDOWN_FOCO_MS = 10_000;

export type ContadoresRapidosLayout = {
  premiosPendientes: number;
  sorpresas: number;
  reconocimientos: number;
  tiendaCompartidasPendientes: number;
};

export function ActualizarPremios({ inicial }: { inicial: ContadoresRapidosLayout }) {
  const router = useRouter();
  const ultimoRef = useRef<ContadoresRapidosLayout>(inicial);
  const enVueloRef = useRef(false);
  const ultimaConsultaRef = useRef(0);

  useEffect(() => {
    ultimoRef.current = inicial;
  }, [inicial]);

  useEffect(() => {
    const verificar = async (forzarPorFoco = false) => {
      if (document.visibilityState !== "visible") return;
      if (enVueloRef.current) return;
      const ahora = Date.now();
      if (forzarPorFoco && ahora - ultimaConsultaRef.current < COOLDOWN_FOCO_MS) return;

      enVueloRef.current = true;
      ultimaConsultaRef.current = ahora;
      try {
        const res = await fetch("/api/estado-rapido", { cache: "no-store" });
        if (!res.ok) return;
        const datos = (await res.json()) as Partial<ContadoresRapidosLayout>;
        if (
          typeof datos.premiosPendientes !== "number" ||
          typeof datos.sorpresas !== "number" ||
          typeof datos.reconocimientos !== "number" ||
          typeof datos.tiendaCompartidasPendientes !== "number"
        ) {
          return;
        }
        const prev = ultimoRef.current;
        const cambio =
          datos.premiosPendientes !== prev.premiosPendientes ||
          datos.sorpresas !== prev.sorpresas ||
          datos.reconocimientos !== prev.reconocimientos ||
          datos.tiendaCompartidasPendientes !== prev.tiendaCompartidasPendientes;
        if (cambio) {
          ultimoRef.current = {
            premiosPendientes: datos.premiosPendientes,
            sorpresas: datos.sorpresas,
            reconocimientos: datos.reconocimientos,
            tiendaCompartidasPendientes: datos.tiendaCompartidasPendientes,
          };
          router.refresh();
        }
      } catch {
        // Red temporalmente caída: se reintenta en el próximo ciclo
      } finally {
        enVueloRef.current = false;
      }
    };

    const alVolver = () => {
      void verificar(true);
    };
    const id = setInterval(() => {
      void verificar(false);
    }, CADA_MS);
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [router]);

  return null;
}
