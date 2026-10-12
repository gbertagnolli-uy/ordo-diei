"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import DomeGallery, { type DomeItem } from "@/components/DomeGallery";
import { CartaVista } from "@/components/cartas/CartaVista";
import { ReversoCarta } from "@/components/cartas/ReversoCarta";
import { imagenDeGrado } from "@/lib/cartas/fragmentos";
import { urlArte } from "@/lib/cartas/arte";
import type { CartaListada } from "@/lib/cartas/server";

interface AlbumDomoProps {
  cartas: CartaListada[];
}

// Fondo del domo: stone-950 del tema
const FONDO_DOMO = "#0c0a09";

export function AlbumDomo({ cartas }: AlbumDomoProps) {
  const [claveAbierta, setClaveAbierta] = useState<string | null>(null);

  const items = useMemo<DomeItem[]>(
    () =>
      cartas.map((c) => ({
        id: c.clave,
        // Igual que en la grilla del álbum: la bloqueada muestra el arte base en B/N
        src: urlArte(c.desbloqueada ? imagenDeGrado(c, c.grado) : c.imagenUrl),
        alt: c.desbloqueada ? c.nombre : `${c.nombre} (Bloqueada)`,
        locked: !c.desbloqueada,
      })),
    [cartas]
  );

  const abierta = cartas.find((c) => c.clave === claveAbierta) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[calc(100dvh-20rem)] min-h-[460px] overflow-hidden rounded-2xl border">
        <DomeGallery
          items={items}
          onSelect={(item) => setClaveAbierta(item.id)}
          overlayBlurColor={FONDO_DOMO}
          fit={0.9}
          minRadius={650}
          maxVerticalRotationDeg={20}
          dragDampening={3.6}
          segments={35}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Arrastrá para girar el domo. Tocá una carta para verla de cerca.
      </p>

      <Dialog open={abierta !== null} onOpenChange={(open) => !open && setClaveAbierta(null)}>
        <DialogPortal>
          <DialogOverlay className="bg-black/80" />
          <DialogPrimitive.Content
            className="fixed top-1/2 left-1/2 z-50 flex max-h-[100dvh] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 outline-none"
            aria-describedby="album-domo-descripcion"
          >
            <DialogTitle className="sr-only">{abierta?.nombre ?? "Carta"}</DialogTitle>
            <DialogDescription id="album-domo-descripcion" className="sr-only">
              Tocá la carta para darla vuelta y abrir su página.
            </DialogDescription>
            {abierta && (
              <div className="w-[min(320px,78vw)]">
                <CartaVista
                  key={abierta.clave}
                  carta={abierta}
                  modo="holo"
                  grado={abierta.grado}
                  blancoYNegro={!abierta.desbloqueada}
                  ancho={320}
                  mostrarTitulo={false}
                  prioridad
                  reverso={
                    <ReversoCarta
                      clave={abierta.clave}
                      nombre={abierta.nombre}
                      subtitulo={abierta.subtitulo}
                      rareza={abierta.rareza}
                      desbloqueada={abierta.desbloqueada}
                      grado={abierta.grado}
                      fragmentos={abierta.fragmentos}
                      fragmentosRequeridos={abierta.fragmentosRequeridos}
                    />
                  }
                />
              </div>
            )}
            <p className="text-xs text-stone-300">Tocá la carta para darla vuelta</p>
            <DialogClose asChild>
              <Button variant="secondary" size="sm" className="gap-1.5">
                <X className="size-4" />
                Cerrar
              </Button>
            </DialogClose>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
