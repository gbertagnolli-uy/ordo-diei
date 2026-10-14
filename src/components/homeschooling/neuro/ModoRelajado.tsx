"use client";

// Propio de Ordo: pone el atributo `data-relajado` en <html> cuando el alumno tiene activado el modo relajado (H6).
// El estilo vive en globals.css y el confeti se corta dentro de `celebrate` (ModalManager).

import { useEffect } from "react";

export default function ModoRelajado({ activo }: { activo: boolean }) {
  useEffect(() => {
    const html = document.documentElement;
    if (activo) html.dataset.relajado = "1";
    else delete html.dataset.relajado;
    return () => {
      delete html.dataset.relajado;
    };
  }, [activo]);
  return null;
}
