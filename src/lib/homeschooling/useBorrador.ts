"use client";

// Propio de Ordo (lane 170, M3): autoguardado de borradores en el navegador. Si se cierra el diálogo o se recarga la página, lo
// escrito vuelve. Se borra al guardar. Cada clave es de un formulario (y de su curso/día), así no se mezclan.
import { useCallback, useRef, useState } from "react";

const PREFIJO = "hs-borrador:";

function leer(clave: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(PREFIJO + clave) ?? "";
  } catch {
    return "";
  }
}

/** Cambiar de clave pide remontar el componente (key={clave}): el borrador se lee una sola vez, al montar */
export function useBorrador(clave: string): [string, (valor: string) => void, () => void] {
  const [valor, setValorEstado] = useState(() => leer(clave));
  const claveActual = useRef(clave);

  const setValor = useCallback((v: string) => {
    setValorEstado(v);
    try {
      if (v) window.localStorage.setItem(PREFIJO + claveActual.current, v);
      else window.localStorage.removeItem(PREFIJO + claveActual.current);
    } catch {
      // sin almacenamiento: el formulario funciona igual, solo que sin borrador
    }
  }, []);

  const borrar = useCallback(() => {
    setValorEstado("");
    try {
      window.localStorage.removeItem(PREFIJO + claveActual.current);
    } catch {
      // idem
    }
  }, []);

  return [valor, setValor, borrar];
}
