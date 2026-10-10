"use client";

import { useMemo, useRef, useState } from "react";
import MorphSlider from "@/components/MorphSlider";
import type { HabitoVista } from "@/lib/habitos/server";
import imagenes from "@/lib/habitos/imagenes.json";

// Reparto estable (igual en servidor y cliente) de los paisajes entre los hábitos sin foto propia.
function imagenDe(h: HabitoVista, posicion: number): string {
  const propia = h.clave ? (imagenes.porClave as Record<string, string>)[h.clave] : undefined;
  if (propia) return propia;
  const p = imagenes.paisajes;
  return p[(posicion * 7 + 3) % p.length];
}

export function HabitosCarrusel({
  habitos,
  onElegir,
}: {
  habitos: HabitoVista[];
  onElegir: (habitoId: number) => void;
}) {
  const items = useMemo(
    () => habitos.map((h, i) => ({ image: imagenDe(h, i), caption: h.nombre })),
    [habitos]
  );
  const [indice, setIndice] = useState(0);
  const inicioX = useRef(0);

  if (habitos.length === 0) return null;

  return (
    <div
      className="relative h-[420px] cursor-pointer"
      onPointerDown={(e) => (inicioX.current = e.clientX)}
      onClick={(e) => {
        // Un arrastre o un clic en las flechas/puntos no abre la configuración
        if (Math.abs(e.clientX - inicioX.current) > 5) return;
        if ((e.target as HTMLElement).closest("button")) return;
        const h = habitos[indice];
        if (h) onElegir(h.id);
      }}
    >
      <MorphSlider
        items={items}
        transition="melt"
        intensity={0.55}
        aberration={0.35}
        drift={0.4}
        autoplay
        onIndexChange={setIndice}
      />
    </div>
  );
}
