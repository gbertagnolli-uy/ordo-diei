"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { urlArte } from "@/lib/cartas/arte";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Gift,
  Calendar,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ModalAperturaSobre,
  type ResultadoCompraSobre,
} from "@/components/cartas/ModalAperturaSobre";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";

interface FiestaLiturgicaInfo {
  cartaId: number;
  clave: string;
  nombre: string;
  subtitulo?: string | null;
  rareza: string;
  imagenUrl: string;
  regaloFragmentos: number;
  reclamado: boolean;
}

interface EventosHoyResponse {
  fechaHoy: string;
  periodo: number;
  esCumple: boolean;
  cumpleReclamado: boolean;
  fiestas: FiestaLiturgicaInfo[];
}

interface BannerEventosCartasProps {
  className?: string;
  onReclamoExitoso?: () => void;
}

export function BannerEventosCartas({ className = "", onReclamoExitoso }: BannerEventosCartasProps) {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventosHoyResponse | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [reclamandoFiestaId, setReclamandoFiestaId] = useState<number | null>(null);
  const [reclamandoCumple, setReclamandoCumple] = useState<boolean>(false);

  // Modal para regalo de cumpleaños
  const [modalSobreAbierto, setModalSobreAbierto] = useState<boolean>(false);
  const [resultadoSobre, setResultadoSobre] = useState<ResultadoCompraSobre | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarEventos = async () => {
    try {
      const res = await fetch("/api/cartas/eventos");
      if (res.ok) {
        const data: EventosHoyResponse = await res.json();
        setEventos(data);
      }
    } catch (err) {
      console.error("Error al cargar eventos del día:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  if (cargando || !eventos) {
    return null;
  }

  // Filtrar fiestas pendientes de reclamo
  const fiestasPendientes = eventos.fiestas.filter((f) => !f.reclamado);
  const cumplePendiente = eventos.esCumple && !eventos.cumpleReclamado;

  // Si no hay ningún evento pendiente, no mostrar nada
  if (!cumplePendiente && fiestasPendientes.length === 0 && !mensajeExito) {
    return null;
  }

  // Manejar reclamo de fiesta litúrgica (50%)
  const reclamarPremioFiesta = async (fiesta: FiestaLiturgicaInfo) => {
    try {
      setReclamandoFiestaId(fiesta.cartaId);
      const res = await fetch("/api/cartas/reclamar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "fiesta", cartaId: fiesta.cartaId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al reclamar fiesta litúrgica");
      }

      // Disparar confeti sagrado
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#fbbf24", "#d97706", "#f59e0b", "#ffffff"],
      });

      // Actualizar estado local
      router.refresh(); // actualiza el aviso de la barra lateral
      setEventos((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          fiestas: prev.fiestas.map((f) =>
            f.cartaId === fiesta.cartaId ? { ...f, reclamado: true } : f
          ),
        };
      });

      const detalleIncienso =
        data.inciensoGanado > 0 ? ` y +${data.inciensoGanado} granos de Incienso` : "";
      setMensajeExito(
        `¡Gloria a Dios! Reclamaste +${data.fragmentosGanados} fragmentos para ${data.nombre}${detalleIncienso}.`
      );

      onReclamoExitoso?.();
    } catch (err: unknown) {
      console.error("Error al reclamar fiesta:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado";
      alert(msg);
    } finally {
      setReclamandoFiestaId(null);
    }
  };

  // Manejar reclamo de cumpleaños (100% de cartas del día o Sobre gratis)
  const reclamarPremioCumple = async () => {
    try {
      setReclamandoCumple(true);
      const res = await fetch("/api/cartas/reclamar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "cumple" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al reclamar regalo de cumpleaños");
      }

      // Gran explosión de confeti
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#10b981"],
      });

      router.refresh(); // actualiza el aviso de la barra lateral
      setEventos((prev) => (prev ? { ...prev, cumpleReclamado: true } : null));

      if (data.tipo === "sobre_revelacion_gratis" && data.cartasAfectadas) {
        // Adaptar a ResultadoCompraSobre para abrir animación
        const adaptado: ResultadoCompraSobre = {
          tipoSobre: "revelacion",
          nombreSobre: data.sobre || "Sobre de Revelación (Regalo)",
          puntosGastados: 0,
          nuevoSaldoPuntos: 0,
          nuevoSaldoIncienso: data.totalInciensoGanado || 0,
          totalInciensoGanado: data.totalInciensoGanado || 0,
          cartasAfectadas: data.cartasAfectadas.map((c: { cartaId: number; nombre: string; rareza: string; cantidad: number; fragmentosDespues: number; desbloquea?: boolean }) => ({
            cartaId: c.cartaId,
            cartaClave: c.nombre.toLowerCase().replace(/\s+/g, "-"),
            nombre: c.nombre,
            rareza: c.rareza,
            cantidadBase: c.cantidad,
            cantidadFinal: c.cantidad,
            bonoFiestaAplicado: false,
            fragmentosAntes: Math.max(0, c.fragmentosDespues - c.cantidad),
            fragmentosDespues: c.fragmentosDespues,
            desbloquea: Boolean(c.desbloquea),
            gradoAntes: 0,
            gradoDespues: c.desbloquea ? 1 : 0,
            excedente: 0,
            inciensoGanado: 0,
          })),
        };
        setResultadoSobre(adaptado);
        setModalSobreAbierto(true);
      } else if (data.tipo === "santos_del_dia" && data.cartas) {
        // Santos del día completados
        const adaptado: ResultadoCompraSobre = {
          tipoSobre: "revelacion",
          nombreSobre: "Santos Patronos de tu Cumpleaños",
          puntosGastados: 0,
          nuevoSaldoPuntos: 0,
          nuevoSaldoIncienso: 0,
          totalInciensoGanado: 0,
          cartasAfectadas: data.cartas.map((c: { cartaId: number; nombre: string; fragmentosRegalados: number; grado?: number }) => ({
            cartaId: c.cartaId,
            cartaClave: c.nombre.toLowerCase().replace(/\s+/g, "-"),
            nombre: c.nombre,
            rareza: "Comun",
            cantidadBase: c.fragmentosRegalados,
            cantidadFinal: c.fragmentosRegalados,
            bonoFiestaAplicado: false,
            fragmentosAntes: 0,
            fragmentosDespues: c.fragmentosRegalados,
            desbloquea: true,
            gradoAntes: 0,
            gradoDespues: c.grado || 1,
            excedente: 0,
            inciensoGanado: 0,
          })),
        };
        setResultadoSobre(adaptado);
        setModalSobreAbierto(true);
      }

      setMensajeExito(data.mensaje || "¡Feliz cumpleaños! Reclamaste tu regalo festivo.");
      onReclamoExitoso?.();
    } catch (err: unknown) {
      console.error("Error al reclamar cumpleaños:", err);
      const msg = err instanceof Error ? err.message : "Error inesperado";
      alert(msg);
    } finally {
      setReclamandoCumple(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Mensaje de confirmación temporal */}
      {mensajeExito && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Aviso de Cumpleaños */}
      {cumplePendiente && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Gift className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                    🎉 ¡Feliz Cumpleaños!
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">Día especial</span>
                </div>
                <h4 className="font-serif font-bold text-base text-foreground">
                  {TEXTOS_CARTAS.eventos.cumpleAviso}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Reclamá todo lo necesario para completar al 100% las cartas de tu día o un Sobre de Revelación gratis.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={reclamarPremioCumple}
              disabled={reclamandoCumple}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-bold shadow-md self-start sm:self-center shrink-0"
            >
              <PartyPopper className="h-4 w-4" />
              {reclamandoCumple ? "Abriendo regalo..." : TEXTOS_CARTAS.eventos.cumplePremio}
            </Button>
          </div>
        </div>
      )}

      {/* 2. Aviso de Fiestas Litúrgicas del Día */}
      {fiestasPendientes.map((fiesta) => (
        <div
          key={fiesta.cartaId}
          className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-muted/60 via-muted/30 to-background p-3.5 sm:p-4 shadow-2xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Miniatura de la carta */}
              <div className="relative aspect-[63/88] w-10 sm:w-12 shrink-0 overflow-hidden rounded-lg border border-border shadow-xs bg-muted">
                {fiesta.imagenUrl ? (
                  <Image
                    src={urlArte(fiesta.imagenUrl)}
                    alt={fiesta.nombre}
                    fill
                    sizes="50px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    Santo
                  </div>
                )}
              </div>

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
                {fiesta.subtitulo && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {fiesta.subtitulo}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Badge variant="secondary" className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15">
                +{fiesta.regaloFragmentos} fragmentos (50 %)
              </Badge>

              <Button
                type="button"
                size="sm"
                onClick={() => reclamarPremioFiesta(fiesta)}
                disabled={reclamandoFiestaId === fiesta.cartaId}
                className="gap-1.5 text-xs h-8 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {reclamandoFiestaId === fiesta.cartaId ? "Reclamando..." : "Reclamar 50 %"}
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Modal de Apertura de Sobre para regalo de Cumpleaños */}
      {resultadoSobre && (
        <ModalAperturaSobre
          open={modalSobreAbierto}
          onOpenChange={setModalSobreAbierto}
          resultado={resultadoSobre}
          onVerColeccion={() => {
            setModalSobreAbierto(false);
            setResultadoSobre(null);
          }}
        />
      )}
    </div>
  );
}
