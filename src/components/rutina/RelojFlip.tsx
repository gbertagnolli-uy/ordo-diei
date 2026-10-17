"use client";

import { useThemeStore } from "@/store/themeStore";

// Open Fliqlo (CogitoForge-AI/Open-Fliqlo, MIT) compilado a web desde vendor/open-fliqlo con
// scripts/construir_fliqlo.sh y servido desde public/fliqlo/. Se embebe en un iframe sin
// interacción; el tema, el fondo transparente y el modo salen de la URL (ver ORIGEN.md).

// Proporción ancho/alto del reloj HH:MM de Open Fliqlo (4 dígitos 0.72:1, huecos y separador)
const PROPORCION = 3.45;

interface RelojFlipProps {
  className?: string;
  /** Alto del reloj (cualquier longitud CSS), p. ej. "min(26vh, 21vw)". */
  alto?: string;
}

/** Reloj Flip de hora real (HH:MM, 24 h). Sigue el tema claro/oscuro de la app. */
export function RelojFlip({ className = "", alto = "min(26vh, 21vw)" }: RelojFlipProps) {
  const darkMode = useThemeStore((s) => s.darkMode);
  const tema = darkMode ? "oscuro" : "claro";

  return (
    <iframe
      key={tema}
      title="Reloj"
      src={`/fliqlo/index.html?tema=${tema}&modo=lockscreen&fondo=transparente&show-seconds=false&use-24-hour=true`}
      tabIndex={-1}
      className={`block max-w-full border-0 pointer-events-none select-none ${className}`}
      style={{
        height: alto,
        width: `calc(${alto} * ${PROPORCION})`,
        colorScheme: darkMode ? "dark" : "light",
        background: "transparent",
      }}
    />
  );
}
