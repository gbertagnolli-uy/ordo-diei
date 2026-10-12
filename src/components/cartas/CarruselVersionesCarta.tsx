"use client";

import React from "react";
import { Lock } from "lucide-react";
import DepthCarousel from "@/components/DepthCarousel";
import { CartaVista } from "@/components/cartas/CartaVista";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { RarezaCarta, GradoCarta } from "@/lib/cartas/economia";
import type { VersionCarta } from "@/lib/cartas/versiones";

const ANCHO = 240;
const ALTO = Math.round((ANCHO * 88) / 63);

const ETIQUETA_ESTADO = {
  actual: "Tu versión actual",
  alcanzado: "Versión superada",
  bloqueado: "Aún no alcanzada",
} as const;

interface CarruselVersionesCartaProps {
  carta: {
    clave: string;
    nombre: string;
    rareza: RarezaCarta;
    fragmentosRequeridos: number;
    grado: GradoCarta;
    versiones: VersionCarta[];
  };
}

/** Los 4 grados de una carta en un carrusel de profundidad; abre en el grado actual */
export function CarruselVersionesCarta({ carta }: CarruselVersionesCartaProps) {
  const { versiones } = carta;
  const inicio = Math.max(0, versiones.findIndex((v) => v.estado === "actual"));
  const [indice, setIndice] = React.useState(inicio);
  const activa = versiones[indice] ?? versiones[0];

  const items = versiones.map((v) => ({
    image: v.url,
    alt: `${carta.nombre} · ${TEXTOS_CARTAS.grados[v.grado]}`,
    contenido: (
      <div className="relative size-full">
        <CartaVista
          // La URL ya trae el arte (real o silueta) de este grado; el resto de los grados no se consulta
          carta={{ ...carta, imagenUrl: v.url }}
          modo={v.estado === "bloqueado" ? "bloqueada" : "plana"}
          grado={v.grado}
          ancho={ANCHO}
          className="!rounded-none !border-0 !ring-0"
        />
        {v.estado === "bloqueado" && v.grado > 1 && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-md border border-stone-600/60 bg-stone-900/80 px-2 py-0.5 font-serif text-xs font-bold tracking-wider text-stone-200">
            {TEXTOS_CARTAS.gradosRomanos[v.grado]}
          </span>
        )}
      </div>
    ),
  }));

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <div className="h-[460px] w-full">
        <DepthCarousel
          items={items}
          initialIndex={inicio}
          cardWidth={ANCHO}
          cardHeight={ALTO}
          radius={12}
          depth={180}
          spread={70}
          tilt={22}
          tiltDirection="right"
          perspective={1400}
          visibleCards={3}
          falloff={0.2}
          blur={5}
          loop={false}
          showControls
          showIndicators
          ariaLabel={`Versiones de ${carta.nombre}`}
          onChange={(i) => setIndice(i)}
        />
      </div>
      <div className="text-center">
        <p className="font-serif text-sm font-bold text-foreground">
          {TEXTOS_CARTAS.grados[activa.grado]}
        </p>
        <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          {activa.estado === "bloqueado" && <Lock className="size-3" />}
          {ETIQUETA_ESTADO[activa.estado]}
        </p>
      </div>
    </div>
  );
}
