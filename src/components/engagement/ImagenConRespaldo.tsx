"use client";

// Imagen del compañero con respaldo (vault/COMPANERO_IMAGENES.md): prueba cada fuente en orden y, si ninguna
// existe todavía, muestra el respaldo (un emoji). Así la app funciona antes de que lleguen las ilustraciones.
import { useState, type ReactNode } from "react";

function Intento({ srcs, alt, className, respaldo }: { srcs: string[]; alt: string; className?: string; respaldo: ReactNode }) {
  const [fallos, setFallos] = useState(0);
  const src = srcs[fallos];

  // Si la imagen falló antes de que React tomara el control (render del servidor), `onError` ya no avisa
  const revisar = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth === 0) queueMicrotask(() => setFallos((n) => Math.max(n, fallos + 1)));
  };

  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img ref={revisar} src={src} alt={alt} className={className} draggable={false} decoding="async" onError={() => setFallos((n) => Math.max(n, fallos + 1))} /> : <>{respaldo}</>;
}

/** Se vuelve a probar desde la primera fuente cuando cambian */
export function ImagenConRespaldo(props: { srcs: string[]; alt: string; className?: string; respaldo: ReactNode }) {
  return <Intento key={props.srcs.join("|")} {...props} />;
}
