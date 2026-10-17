"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { urlArte } from "@/lib/cartas/arte";
import { Sparkles, Gift, Calendar, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartaVista } from "@/components/cartas/CartaVista";
import { BordeReclamable } from "@/components/cartas/BordeReclamable";
import { useReclamoCarta, claveReclamo } from "@/components/cartas/useReclamoCarta";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { CategoriaCarta, RarezaCarta } from "@/lib/cartas/economia";
import { cn } from "@/lib/utils";

interface FiestaLiturgicaInfo {
  cartaId: number;
  clave: string;
  nombre: string;
  subtitulo?: string | null;
  rareza: string;
  imagenUrl: string;
  regaloFragmentos: number;
  xpMinimo: number;
  xpInsuficiente: boolean;
  yaLaTiene: boolean;
  reclamado: boolean;
}

interface CartaElegibleCumple {
  cartaId: number;
  clave: string;
  nombre: string;
  rareza: RarezaCarta;
  categoria: CategoriaCarta;
  imagenUrl: string;
  fragmentos: number;
  fragmentosRequeridos: number;
}

interface EventosHoyResponse {
  fechaHoy: string;
  periodo: string;
  esCumple: boolean;
  cumpleReclamado: boolean;
  cumpleElegibles: CartaElegibleCumple[];
  bienvenidaDisponible: boolean;
  gradosPendientes: number;
  fiestas: FiestaLiturgicaInfo[];
}

interface BannerEventosCartasProps {
  className?: string;
  onReclamoExitoso?: () => void;
}

export function BannerEventosCartas({ className = "", onReclamoExitoso }: BannerEventosCartasProps) {
  const [eventos, setEventos] = useState<EventosHoyResponse | null>(null);
  const [selectorCumpleAbierto, setSelectorCumpleAbierto] = useState(false);
  const [cartaCumple, setCartaCumple] = useState<number | null>(null);

  const cargarEventos = () =>
    fetch("/api/cartas/eventos")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EventosHoyResponse | null) => data && setEventos(data))
      .catch((err) => console.error("Error al cargar eventos del día:", err));

  const { reclamar, reclamando, modal } = useReclamoCarta(() => {
    setSelectorCumpleAbierto(false);
    cargarEventos();
    onReclamoExitoso?.();
  });

  useEffect(() => {
    cargarEventos();
  }, []);

  const fiestasPendientes = eventos?.fiestas.filter((f) => !f.reclamado) ?? [];
  const cumplePendiente = !!eventos?.esCumple && !eventos.cumpleReclamado;
  const elegibles = eventos?.cumpleElegibles ?? [];

  // El modal queda montado aunque ya no quede nada por reclamar, para mostrar el último reclamo
  if (!eventos || (!cumplePendiente && !eventos.bienvenidaDisponible && fiestasPendientes.length === 0)) {
    return modal;
  }

  const reclamarCumple = () => {
    if (elegibles.length === 0) {
      reclamar({ tipo: "cumple" }); // sin cartas elegibles: Sobre de Revelación
    } else {
      setSelectorCumpleAbierto(true);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* 1. Regalo de bienvenida (D23) */}
      {eventos.bienvenidaDisponible && (
        <BordeReclamable activo radio={16}>
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-background p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Gift className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="font-serif font-bold text-base text-foreground">
                    {TEXTOS_CARTAS.eventos.bienvenidaAviso}
                  </h4>
                  <p className="text-xs text-muted-foreground">{TEXTOS_CARTAS.eventos.bienvenidaDetalle}</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => reclamar({ tipo: "bienvenida" })}
                disabled={reclamando === "bienvenida"}
                className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold shadow-md self-start sm:self-center shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                {reclamando === "bienvenida" ? "Abriendo..." : TEXTOS_CARTAS.eventos.bienvenidaPremio}
              </Button>
            </div>
          </div>
        </BordeReclamable>
      )}

      {/* 2. Cumpleaños: elegir una carta (D22) */}
      {cumplePendiente && (
        <div className="relative rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Gift className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="outline" className="self-start bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                  🎉 ¡Feliz Cumpleaños!
                </Badge>
                <h4 className="font-serif font-bold text-base text-foreground">
                  {TEXTOS_CARTAS.eventos.cumpleAviso}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {elegibles.length > 0
                    ? TEXTOS_CARTAS.eventos.cumpleDetalle
                    : TEXTOS_CARTAS.eventos.cumpleSinElegibles}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={reclamarCumple}
              disabled={reclamando?.startsWith("cumple")}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold shadow-md self-start sm:self-center shrink-0"
            >
              <PartyPopper className="h-4 w-4" />
              {reclamando?.startsWith("cumple") ? "Abriendo regalo..." : TEXTOS_CARTAS.eventos.cumplePremio}
            </Button>
          </div>
        </div>
      )}

      {/* 3. Fiestas del día: la carta entera (D21) */}
      {fiestasPendientes.map((fiesta) => {
        const clave = claveReclamo({ tipo: "fiesta", cartaId: fiesta.cartaId });
        return (
          <div
            key={fiesta.cartaId}
            className="relative rounded-2xl border border-border/80 bg-gradient-to-r from-muted/60 via-muted/30 to-background p-3.5 sm:p-4 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <BordeReclamable activo radio={8} className="shrink-0">
                  <div className="relative aspect-[63/88] w-12 sm:w-14 overflow-hidden rounded-lg bg-muted">
                    {fiesta.imagenUrl ? (
                      <Image
                        src={urlArte(fiesta.imagenUrl)}
                        alt={fiesta.nombre}
                        fill
                        sizes="56px"
                        className={cn("object-cover", !fiesta.yaLaTiene && "grayscale")}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        Santo
                      </div>
                    )}
                  </div>
                </BordeReclamable>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 font-medium gap-1">
                      <Calendar className="h-2.5 w-2.5" /> Fiesta Litúrgica
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">Hoy</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-foreground truncate">
                    {TEXTOS_CARTAS.eventos.fiestaAviso(fiesta.nombre)}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {TEXTOS_CARTAS.eventos.fiestaDetalle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Badge variant="secondary" className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15">
                  +{fiesta.regaloFragmentos} fragmentos
                </Badge>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => reclamar({ tipo: "fiesta", cartaId: fiesta.cartaId })}
                  disabled={reclamando === clave || fiesta.xpInsuficiente}
                  className="gap-1.5 text-xs h-8 shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {fiesta.xpInsuficiente
                    ? `Requiere ${fiesta.xpMinimo} XP`
                    : reclamando === clave
                    ? "Reclamando..."
                    : fiesta.yaLaTiene
                      ? TEXTOS_CARTAS.eventos.fiestaPremioRepetida
                      : TEXTOS_CARTAS.eventos.fiestaPremio}
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Selector de la carta de cumpleaños */}
      <Dialog open={selectorCumpleAbierto} onOpenChange={setSelectorCumpleAbierto}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{TEXTOS_CARTAS.eventos.cumpleAviso}</DialogTitle>
            <DialogDescription>{TEXTOS_CARTAS.eventos.cumpleDetalle}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[55vh] pr-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
              {elegibles.map((c) => (
                <button
                  key={c.cartaId}
                  type="button"
                  onClick={() => setCartaCumple(c.cartaId)}
                  aria-pressed={cartaCumple === c.cartaId}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl p-1.5 text-left transition-colors hover:bg-muted/60",
                    cartaCumple === c.cartaId && "bg-amber-500/15 ring-2 ring-amber-500"
                  )}
                >
                  <div className="relative aspect-[63/88] w-full overflow-hidden rounded-lg">
                    <CartaVista
                      carta={c}
                      modo="bloqueada"
                      grado={0}
                      fragmentos={c.fragmentos}
                      ancho={120}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-medium leading-tight line-clamp-2">{c.nombre}</span>
                  <span className="text-[10px] text-muted-foreground">{TEXTOS_CARTAS.rarezas[c.rareza]}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              type="button"
              disabled={cartaCumple === null || reclamando?.startsWith("cumple")}
              onClick={() => cartaCumple !== null && reclamar({ tipo: "cumple", cartaId: cartaCumple })}
              className="gap-2"
            >
              <PartyPopper className="h-4 w-4" />
              {cartaCumple === null
                ? "Elegí una carta"
                : `Recibir ${elegibles.find((c) => c.cartaId === cartaCumple)?.nombre ?? "carta"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {modal}
    </div>
  );
}
