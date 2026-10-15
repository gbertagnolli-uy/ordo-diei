"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@/lib/utils";

interface DragScrollProps {
  children: React.ReactNode;
  className?: string;
  /** Índice del elemento que debe quedar a la vista (p. ej. el filtro activo). */
  activeIndex?: number;
}

/**
 * Fila horizontal que se desplaza arrastrando (mouse o touch) sin barra de scroll.
 * Los elementos que no entran quedan fuera de cuadro y se alcanzan arrastrando;
 * los bordes se atenúan para indicar que hay más contenido.
 * Construido sobre Embla (la misma base del Carousel de shadcn/ui).
 */
export function DragScroll({ children, className, activeIndex }: DragScrollProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: true,
    containScroll: "trimSnaps",
    align: "start",
    axis: "x",
  });
  const [puedeIzq, setPuedeIzq] = React.useState(false);
  const [puedeDer, setPuedeDer] = React.useState(false);

  const actualizarBordes = React.useCallback(() => {
    if (!emblaApi) return;
    setPuedeIzq(emblaApi.canScrollPrev());
    setPuedeDer(emblaApi.canScrollNext());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    actualizarBordes();
    emblaApi.on("select", actualizarBordes);
    emblaApi.on("scroll", actualizarBordes);
    emblaApi.on("reInit", actualizarBordes);
    return () => {
      emblaApi.off("select", actualizarBordes);
      emblaApi.off("scroll", actualizarBordes);
      emblaApi.off("reInit", actualizarBordes);
    };
  }, [emblaApi, actualizarBordes]);

  React.useEffect(() => {
    if (emblaApi && typeof activeIndex === "number") emblaApi.scrollTo(activeIndex);
  }, [emblaApi, activeIndex]);

  return (
    <div className={cn("relative", className)}>
      <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5 touch-pan-y">{children}</div>
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent transition-opacity",
          puedeIzq ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity",
          puedeDer ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
