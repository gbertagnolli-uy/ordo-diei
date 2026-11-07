"use client";
// Portado de vendor/bookorbit (bookorbit/bookorbit@6ad1445) client/src/features/reader/shared/composables/useVisibility.ts:
// la barra y el pie del lector se ocultan solos a los 3 s y vuelven con un toque en el centro o con Escape.
import { useCallback, useEffect, useRef, useState } from "react";

const ESPERA_MS = 3000;

export function useCromo(visibleInicial = true) {
  const [visible, setVisible] = useState(visibleInicial);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limpiarReloj = useCallback(() => {
    if (reloj.current) clearTimeout(reloj.current);
    reloj.current = null;
  }, []);

  const programarOcultar = useCallback(() => {
    limpiarReloj();
    reloj.current = setTimeout(() => setVisible(false), ESPERA_MS);
  }, [limpiarReloj]);

  const mostrar = useCallback(() => {
    setVisible(true);
    programarOcultar();
  }, [programarOcultar]);

  const ocultar = useCallback(() => {
    limpiarReloj();
    setVisible(false);
  }, [limpiarReloj]);

  const alternar = useCallback(() => {
    if (visible) {
      limpiarReloj();
      setVisible(false);
    } else {
      setVisible(true);
      programarOcultar();
    }
  }, [visible, limpiarReloj, programarOcultar]);

  useEffect(() => {
    // Al abrir el libro la UI se muestra unos segundos y se va sola.
    if (visibleInicial) programarOcultar();
    return limpiarReloj;
  }, [visibleInicial, programarOcultar, limpiarReloj]);

  return { visible, mostrar, ocultar, alternar };
}
