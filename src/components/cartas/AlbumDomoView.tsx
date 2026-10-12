"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import DomeGallery, { type DomeItem } from "@/components/DomeGallery";
import { CartaVista } from "@/components/cartas/CartaVista";
import { ReversoCarta } from "@/components/cartas/ReversoCarta";
import { imagenDeGrado } from "@/lib/cartas/fragmentos";
import { urlArte } from "@/lib/cartas/arte";
import type { CartaListada } from "@/lib/cartas/server";

interface AlbumDomoViewProps {
  cartas: CartaListada[];
}

// Fondo del domo: stone-950 del tema
const FONDO_DOMO = "#0c0a09";

export function AlbumDomoView({ cartas }: AlbumDomoViewProps) {
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
  const totalDesbloqueadas = cartas.filter((c) => c.desbloqueada).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/dashboard/cartas?tab=album">
              <ArrowLeft className="size-4" />
              <span>Volver al Álbum</span>
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">Álbum en 3D</h1>
          </div>
        </div>
        <Badge variant="outline" className="tabular-nums">
          {totalDesbloqueadas}/{cartas.length} descubiertas
        </Badge>
      </div>

      {cartas.length === 0 ? (
        <Empty className="rounded-2xl border bg-muted/20 py-16">
          <EmptyMedia variant="icon">
            <Layers className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No hay cartas en el catálogo</EmptyTitle>
            <EmptyDescription>Cuando haya cartas disponibles, vas a poder recorrerlas acá.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="relative h-[calc(100dvh-16rem)] min-h-[460px] overflow-hidden rounded-2xl border">
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
        </>
      )}

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
