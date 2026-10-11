"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Flame,
  Award,
  Layers,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CartaVista } from "@/components/cartas/CartaVista";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { GradoCarta, RarezaCarta } from "@/lib/cartas/economia";

export interface CartaAfectadaCompra {
  cartaId: number;
  cartaClave: string;
  nombre: string;
  rareza: string;
  cantidadBase: number;
  cantidadFinal: number;
  bonoFiestaAplicado: boolean;
  fragmentosAntes: number;
  fragmentosDespues: number;
  desbloquea: boolean;
  gradoAntes: number;
  gradoDespues: number;
  /** Arte del grado que se ve; lo manda el servidor (D19) */
  imagenUrl?: string;
  excedente: number;
  inciensoGanado: number;
  /** Alcanzó un grado que todavía hay que reclamar (D20) */
  reclamable?: boolean;
}

export interface ResultadoCompraSobre {
  tipoSobre?: "meditacion" | "revelacion";
  nombreSobre?: string;
  puntosGastados?: number;
  nuevoSaldoPuntos: number;
  nuevoSaldoIncienso: number;
  totalInciensoGanado: number;
  cartasAfectadas: CartaAfectadaCompra[];
  /** Los reclamos no gastan puntos: sin saldos que mostrar */
  mostrarSaldos?: boolean;
}

interface ModalAperturaSobreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultado: ResultadoCompraSobre | null;
  onAbrirOtro?: () => void;
  onVerColeccion?: () => void;
}

const RAREZA_ORDEN: Record<string, number> = {
  Comun: 1,
  Buena: 2,
  Perfecta: 3,
  Celestial: 4,
};

const COLORES_RESPLANDOR: Record<string, string> = {
  Comun: "rgba(168, 162, 158, 0.4)",
  Buena: "rgba(16, 185, 129, 0.6)",
  Perfecta: "rgba(245, 158, 11, 0.75)",
  Celestial: "rgba(56, 189, 248, 0.9)",
};

export function ModalAperturaSobre({
  open,
  onOpenChange,
  resultado,
  onAbrirOtro,
  onVerColeccion,
}: ModalAperturaSobreProps) {
  const [etapa, setEtapa] = useState<"anticipacion" | "revelacion" | "confirmacion">("anticipacion");
  const [indiceActual, setIndiceActual] = useState<number>(0);
  const shouldReduceMotion = useReducedMotion();

  const cartas = useMemo(() => resultado?.cartasAfectadas ?? [], [resultado]);
  const cartaActual = cartas[indiceActual];

  // Identificar la rareza más alta del sobre para el resplandor inicial
  const mejorRareza = useMemo(() => {
    if (!cartas.length) return "Comun";
    let mejor = "Comun";
    let max = 0;
    for (const c of cartas) {
      const val = RAREZA_ORDEN[c.rareza] ?? 1;
      if (val > max) {
        max = val;
        mejor = c.rareza;
      }
    }
    return mejor;
  }, [cartas]);

  // Transición automática de anticipación a revelación tras 1.5s
  useEffect(() => {
    if (!open || !resultado || etapa !== "anticipacion") return;

    const timer = setTimeout(() => {
      setEtapa("revelacion");
    }, 1500);

    return () => clearTimeout(timer);
  }, [open, resultado, etapa]);

  const handleCerrar = (nuevoOpen: boolean) => {
    if (!nuevoOpen) {
      setEtapa("anticipacion");
      setIndiceActual(0);
    }
    onOpenChange(nuevoOpen);
  };

  // Si la carta actual desbloquea o sube de grado, disparar confeti
  useEffect(() => {
    if (etapa === "revelacion" && cartaActual && (cartaActual.desbloquea || cartaActual.gradoDespues > cartaActual.gradoAntes)) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#fbbf24", "#38bdf8", "#e0e7ff"],
      });
    }
  }, [etapa, cartaActual]);

  if (!resultado || cartas.length === 0) {
    return null;
  }

  const handleSiguienteCarta = () => {
    if (indiceActual < cartas.length - 1) {
      setIndiceActual((prev) => prev + 1);
    } else {
      setEtapa("confirmacion");
    }
  };

  const handleSaltar = () => {
    setEtapa("confirmacion");
  };

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent
        className="sm:max-w-md md:max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 bg-card text-card-foreground border-stone-800 shadow-2xl focus:outline-hidden"
        aria-live="polite"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Apertura de Sobre Sagrado</DialogTitle>
          <DialogDescription>
            Revelación de fragmentos de cartas católicas
          </DialogDescription>
        </DialogHeader>

        {/* ============================================================ */}
        {/* ETAPA 1: ANTICIPACIÓN (Sobre temblando con halo celestial)  */}
        {/* ============================================================ */}
        {etapa === "anticipacion" && (
          <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
            <motion.div
              animate={
                shouldReduceMotion
                  ? { scale: [1, 1.05, 1] }
                  : {
                      scale: [1, 1.04, 1],
                      rotate: [-1, 1, -1, 1, 0],
                      x: [-2, 2, -2, 2, 0],
                    }
              }
              transition={{ repeat: Infinity, duration: 0.4 }}
              className="relative flex items-center justify-center size-36 rounded-2xl border-2 border-amber-400/80 bg-stone-950 p-4 shadow-2xl cursor-pointer"
              onClick={() => setEtapa("revelacion")}
              style={{
                boxShadow: `0 0 45px ${COLORES_RESPLANDOR[mejorRareza] || "rgba(245, 158, 11, 0.5)"}`,
              }}
            >
              <div className="absolute inset-0 bg-radial from-amber-400/20 via-transparent to-transparent rounded-2xl" />
              <Layers className="size-16 text-amber-300 drop-shadow-md" />
              <Sparkles className="absolute top-2 right-2 size-5 text-amber-200 animate-pulse" />
            </motion.div>

            <div className="flex flex-col gap-1.5">
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                {resultado.nombreSobre || "Abriendo sobre sagrado..."}
              </h2>
              <p className="text-xs text-muted-foreground">
                Bendiciendo la ofrenda y revelando dones celestiales...
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEtapa("revelacion")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Revelar ahora
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 2: REVELACIÓN CARTA A CARTA                            */}
        {/* ============================================================ */}
        {etapa === "revelacion" && cartaActual && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="flex items-center justify-between w-full px-2">
              <Badge variant="outline" className="text-xs">
                Carta {indiceActual + 1} de {cartas.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaltar}
                className="text-xs text-muted-foreground hover:text-foreground h-7"
              >
                Saltar
              </Button>
            </div>

            {/* Carta revelada con Holo y animación */}
            <motion.div
              key={cartaActual.cartaId}
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              // En pantallas bajas la carta se achica para que el modal entre sin recortarse
              className="relative flex w-[min(240px,max(150px,calc((100dvh_-_28rem)*0.716)))] justify-center"
            >
              <CartaVista
                carta={{
                  clave: cartaActual.cartaClave,
                  nombre: cartaActual.nombre,
                  rareza: cartaActual.rareza as RarezaCarta,
                  fragmentosRequeridos: 100, // proporcional
                  imagenUrl:
                    cartaActual.imagenUrl ??
                    `/cartas/${cartaActual.cartaClave}/${Math.max(1, cartaActual.gradoDespues)}.webp`,
                }}
                modo="holo"
                blancoYNegro={cartaActual.gradoDespues < 1}
                grado={cartaActual.gradoDespues as GradoCarta}
                fragmentos={cartaActual.fragmentosDespues}
                ancho={240}
                className="min-w-0 max-w-full"
                mostrarTitulo={false}
              />
            </motion.div>

            {/* Eventos especiales (Desbloqueo, Grado, Incienso) */}
            <div className="flex flex-col items-center gap-1.5 text-center w-full">
              <span className="font-heading text-base font-bold text-foreground">
                {cartaActual.nombre}
              </span>

              <div className="flex items-center gap-2">
                {cartaActual.cantidadFinal > 0 && (
                  <Badge className="bg-primary/20 text-primary border-primary/40 font-semibold text-xs">
                    +{cartaActual.cantidadFinal} fragmentos
                  </Badge>
                )}
                {cartaActual.bonoFiestaAplicado && (
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-500 border-amber-500/30">
                    Bono fiesta ×1,5
                  </Badge>
                )}
              </div>

              {/* Hitos Especiales */}
              {cartaActual.desbloquea && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-semibold text-xs mt-1">
                  <CheckCircle2 className="size-3.5" />
                  <span>¡Nueva carta consagrada! (100 %)</span>
                </div>
              )}

              {cartaActual.gradoDespues > cartaActual.gradoAntes && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 font-semibold text-xs mt-1">
                  <Sparkles className="size-3.5" />
                  <span>
                    ¡Subió a Grado {TEXTOS_CARTAS.gradosRomanos[cartaActual.gradoDespues as GradoCarta]} (
                    {TEXTOS_CARTAS.gradosCortos[cartaActual.gradoDespues as GradoCarta]})!
                  </span>
                </div>
              )}

              {cartaActual.reclamable && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 font-semibold text-xs mt-1">
                  <Sparkles className="size-3.5" />
                  <span>{TEXTOS_CARTAS.reclamos.listaParaReclamar}</span>
                </div>
              )}

              {cartaActual.inciensoGanado > 0 && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-500 font-medium text-xs mt-1">
                  <Flame className="size-3.5" />
                  <span>+{cartaActual.inciensoGanado} Granos de Incienso por excedente</span>
                </div>
              )}

              {/* Progreso acumulado */}
              <div className="w-full max-w-xs flex flex-col gap-1 mt-2">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Fragmentos totales:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {cartaActual.fragmentosDespues}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, cartaActual.fragmentosDespues)}
                  className="h-1.5"
                />
              </div>
            </div>

            <Button onClick={handleSiguienteCarta} className="w-full max-w-xs mt-2 gap-2">
              <span>
                {indiceActual < cartas.length - 1 ? "Siguiente carta" : "Ver resumen"}
              </span>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {/* ============================================================ */}
        {/* ETAPA 3: CONFIRMACIÓN Y RESUMEN FINAL                        */}
        {/* ============================================================ */}
        {etapa === "confirmacion" && (
          <div className="flex flex-col gap-5 py-2">
            <div className="text-center flex flex-col gap-1">
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                ¡Dones recibidos!
              </h2>
              <p className="text-xs text-muted-foreground">
                Resumen de los fragmentos consagrados en esta apertura.
              </p>
            </div>

            {/* Lista resumen */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto p-1 rounded-xl bg-muted/20 border">
              {cartas.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-card border text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{c.nombre}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {TEXTOS_CARTAS.rarezas[c.rareza as RarezaCarta] || c.rareza}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.cantidadFinal > 0 && (
                      <Badge variant="secondary" className="text-xs tabular-nums">
                        +{c.cantidadFinal} frags
                      </Badge>
                    )}
                    {c.reclamable && (
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">
                        Para reclamar
                      </Badge>
                    )}
                    {c.desbloquea && (
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px]">
                        ¡Consagrada!
                      </Badge>
                    )}
                    {c.gradoDespues > c.gradoAntes && (
                      <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">
                        Grado {TEXTOS_CARTAS.gradosRomanos[c.gradoDespues as GradoCarta]}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Incienso si hubo */}
            {resultado.totalInciensoGanado > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="size-4" />
                  <span>Total de Incienso ganado:</span>
                </div>
                <span className="font-bold tabular-nums">
                  +{resultado.totalInciensoGanado} granos
                </span>
              </div>
            )}

            {/* Saldos actualizados */}
            {resultado.mostrarSaldos !== false && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Award className="size-3.5 text-amber-500" />
                <span>Puntos restantes:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {resultado.nuevoSaldoPuntos}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="size-3.5 text-orange-500" />
                <span>Incienso total:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {resultado.nuevoSaldoIncienso}
                </span>
              </div>
            </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {onAbrirOtro && (
                <Button
                  onClick={onAbrirOtro}
                  className="flex-1 text-xs"
                >
                  Abrir otro sobre
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  handleCerrar(false); // vuelve a la etapa inicial para la próxima apertura
                  if (onVerColeccion) onVerColeccion();
                }}
                className="flex-1 text-xs"
              >
                Ver mi colección
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
