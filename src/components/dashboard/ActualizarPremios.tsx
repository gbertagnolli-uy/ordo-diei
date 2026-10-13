"use client";

// Mantiene al día banners e insignias de premios: los padres registran comportamientos desde otro
// dispositivo y el layout (servidor) solo se calcula al navegar, así que se vuelve a pedir cada
// pocos segundos y al volver a la pestaña.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const CADA_MS = 15_000;

export function ActualizarPremios() {
  const router = useRouter();

  useEffect(() => {
    const refrescar = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(refrescar, CADA_MS);
    document.addEventListener("visibilitychange", refrescar);
    window.addEventListener("focus", refrescar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refrescar);
      window.removeEventListener("focus", refrescar);
    };
  }, [router]);

  return null;
}
