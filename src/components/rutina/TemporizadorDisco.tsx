"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  Plus,
  SkipForward,
  SkipBack,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EtapaRutina, CATEGORIAS_INFO } from "@/lib/rutina/tipos";
import { formatearSegundos } from "@/lib/rutina/calculadorHorarios";
import { IconoRutina } from "./IconoRutina";
import { TipoSonidoRutina } from "@/lib/rutina/audioRutina";

interface TemporizadorDiscoProps {
  etapaActual: EtapaRutina | null;
  proximaEtapa: EtapaRutina | null;
  etapaAnterior?: EtapaRutina | null;
  restanteSeg: number;
  totalSeg: number;
  ratioRestante: number; // 0.0 a 1.0 continuo (con decimales) para fluidez absoluta
  fase: "verde" | "ambar" | "rojo";
  estaPausado?: boolean;
  onTogglePausa?: () => void;
  onExtenderTiempo?: () => void;
  onAvanzarEtapa?: () => void;
  onRetrocederEtapa?: () => void;
  puedeAvanzar?: boolean;
  puedeRetroceder?: boolean;
  esFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  sonidoHabilitado: boolean;
  onToggleSonido: () => void;
  tipoSonido: TipoSonidoRutina;
  onChangeTipoSonido: (tipo: TipoSonidoRutina) => void;
  volumen: number;
  onChangeVolumen: (vol: number) => void;
  onProbarSonido: () => void;
  notificacionesActivas?: boolean;
  onToggleNotificaciones?: () => void;
}

export function TemporizadorDisco({
  etapaActual,
  proximaEtapa,
  etapaAnterior = null,
  restanteSeg,
  totalSeg,
  ratioRestante,
  fase,
  estaPausado = false,
  onTogglePausa,
  onExtenderTiempo,
  onAvanzarEtapa,
  onRetrocederEtapa,
  puedeAvanzar = true,
  puedeRetroceder = true,
  esFullscreen = false,
  onToggleFullscreen,
  sonidoHabilitado,
  onToggleSonido,
  tipoSonido,
  onChangeTipoSonido,
  volumen,
  onChangeVolumen,
  onProbarSonido,
  notificacionesActivas = false,
  onToggleNotificaciones,
}: TemporizadorDiscoProps) {
  const [mostrarAjustesAudio, setMostrarAjustesAudio] = useState(false);
  // El callback cambia en cada render del padre (reloj de 1 s); lo guardamos en un ref para que
  // el efecto de pantalla completa no se reinicie ni salga del modo cada segundo.
  const alSalirRef = useRef(onToggleFullscreen);
  useEffect(() => {
    alSalirRef.current = onToggleFullscreen;
  }, [onToggleFullscreen]);

  // Modo Enfoque: pide pantalla completa real al navegador y mantiene sincronizado el estado
  // cuando se sale por fuera de la app (Esc nativo, gesto del sistema, etc.).
  useEffect(() => {
    if (!esFullscreen) return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Sin API de pantalla completa (p. ej. iOS): queda el overlay que cubre toda la ventana
      });
    }

    const alCambiarFullscreen = () => {
      if (!document.fullscreenElement) alSalirRef.current?.();
    };
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alSalirRef.current?.();
    };
    document.addEventListener("fullscreenchange", alCambiarFullscreen);
    window.addEventListener("keydown", alPresionarTecla);

    // Evita que el layout haga scroll por detrás del overlay
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("fullscreenchange", alCambiarFullscreen);
      window.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowPrevio;
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [esFullscreen]);

  // Dimensiones del disco SVG
  // Unidades del viewBox; el tamaño real en pantalla lo da el contenedor (responsivo)
  const tamano = 280;
  const strokeWidth = 14;
  const center = tamano / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;

  // Offset continuo: ratioRestante es un float de 0.0 a 1.0 (Time-Timer)
  const ratioClamped = Math.max(0, Math.min(1, ratioRestante));
  const strokeDashoffset = circumference * (1 - ratioClamped);

  // Paleta armónica según fase
  const colorFase =
    fase === "rojo"
      ? {
          stroke: "#f43f5e",
          glow: "rgba(244, 63, 94, 0.4)",
          badgeBg: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          texto: "¡Últimos minutos!",
        }
      : fase === "ambar"
      ? {
          stroke: "#f59e0b",
          glow: "rgba(245, 158, 11, 0.3)",
          badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          texto: "Mitad de tiempo",
        }
      : {
          stroke: "#10b981",
          glow: "rgba(16, 185, 129, 0.3)",
          badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          texto: "En curso",
        };

  const categoriaInfo = etapaActual ? CATEGORIAS_INFO[etapaActual.categoria] : null;

  // Contenido visual del temporizador
  const contenido = (
    <div
      role={esFullscreen ? "dialog" : undefined}
      aria-modal={esFullscreen || undefined}
      aria-label={esFullscreen ? "Modo Enfoque" : undefined}
      className={`flex flex-col items-center justify-center ${
        esFullscreen
          ? "fixed inset-0 z-[9999] h-dvh w-screen overflow-y-auto bg-background p-4 sm:p-10"
          : "relative w-full max-w-xl mx-auto rounded-3xl border bg-card/85 p-6 shadow-xl backdrop-blur-md"
      }`}
      style={{
        boxShadow: esFullscreen ? undefined : `0 10px 30px -10px ${colorFase.glow}`,
      }}
    >
      {/* Barra superior de controles en fullscreen o tarjeta normal */}
      <div
        className={`flex w-full items-center justify-between gap-3 mb-4 ${
          esFullscreen ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-center gap-2">
          {etapaActual ? (
            <Badge
              variant="outline"
              className={`px-3 py-1 font-medium transition-colors ${
                estaPausado ? "bg-amber-500/20 text-amber-600 border-amber-500/40" : colorFase.badgeBg
              }`}
            >
              <span className="relative flex size-2 mr-2">
                <span
                  className={`absolute inline-flex size-full rounded-full opacity-75 ${
                    estaPausado
                      ? "bg-amber-400"
                      : fase === "rojo"
                      ? "bg-rose-400 animate-ping"
                      : "bg-emerald-400 animate-ping"
                  }`}
                />
                <span
                  className={`relative inline-flex size-2 rounded-full ${
                    estaPausado ? "bg-amber-500" : fase === "rojo" ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
              </span>
              {estaPausado ? "⏸️ EN PAUSA" : colorFase.texto}
            </Badge>
          ) : (
            <Badge variant="outline" className="px-3 py-1">
              Sin etapa activa
            </Badge>
          )}

          {categoriaInfo && (
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoriaInfo.colorBg} ${categoriaInfo.colorText}`}
            >
              <IconoRutina nombre={etapaActual?.icono || categoriaInfo.defaultIcon} className="size-3.5" />
              {categoriaInfo.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ajustes de audio */}
          <DropdownMenu open={mostrarAjustesAudio} onOpenChange={setMostrarAjustesAudio}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                title="Configuración de audio de la campana"
              >
                {sonidoHabilitado ? <Volume2 className="size-4" /> : <VolumeX className="size-4 text-rose-500" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3 space-y-3 z-[10001]">
              <DropdownMenuLabel className="flex items-center justify-between text-xs font-semibold">
                <span>Alarma Sonora de Rutina</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={onToggleSonido}
                >
                  {sonidoHabilitado ? "Silenciar" : "Activar"}
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Tono de campana</label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {(
                    [
                      { id: "campanilla", label: "Campanilla" },
                      { id: "monasterio", label: "Monasterio" },
                      { id: "cuenco", label: "Cuenco Zen" },
                      { id: "marimba", label: "Marimba" },
                      { id: "suave", label: "Ping Suave" },
                    ] as const
                  ).map((t) => (
                    <Button
                      key={t.id}
                      variant={tipoSonido === t.id ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs justify-start px-2"
                      onClick={() => onChangeTipoSonido(t.id)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Volumen</span>
                  <span>{volumen}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumen}
                  onChange={(e) => onChangeVolumen(Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {onToggleNotificaciones && (
                <Button
                  variant={notificacionesActivas ? "default" : "outline"}
                  size="sm"
                  className="w-full h-8 text-xs font-medium"
                  onClick={onToggleNotificaciones}
                >
                  {notificacionesActivas ? (
                    <BellRing className="size-3.5 mr-1.5" />
                  ) : (
                    <BellOff className="size-3.5 mr-1.5" />
                  )}
                  Avisos del navegador: {notificacionesActivas ? "activados" : "desactivados"}
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="w-full h-8 text-xs font-medium"
                onClick={onProbarSonido}
              >
                <Sparkles className="size-3.5 mr-1.5" />
                Probar campana ahora
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botón de Enfoque / Salir de Fullscreen */}
          {onToggleFullscreen && (
            <Button
              variant={esFullscreen ? "default" : "ghost"}
              size="sm"
              onClick={onToggleFullscreen}
              className={`rounded-xl gap-1.5 text-xs font-semibold ${
                esFullscreen ? "h-9 px-3 bg-primary text-primary-foreground" : "size-9 p-0"
              }`}
              title={esFullscreen ? "Salir de pantalla completa (Esc)" : "Modo Enfoque Pantalla Completa"}
            >
              {esFullscreen ? (
                <>
                  <Minimize2 className="size-4" />
                  <span>Salir de Enfoque</span>
                </>
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Temporizador Circular Central */}
      <div
        className="relative my-4 flex items-center justify-center"
        style={{ width: esFullscreen ? "min(54vh, 90vw, 600px)" : 280, aspectRatio: "1 / 1" }}
      >
        <svg
          viewBox={`0 0 ${tamano} ${tamano}`}
          className="rotate-[-90deg] size-full"
        >
          {/* Círculo de fondo / Track estático */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-muted/30 dark:stroke-muted/20"
            fill="transparent"
          />

          {/* Disco / Arco animado continuo (Time-Timer) */}
          <circle
            key={etapaActual?.id ?? "sin-etapa"}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            stroke={estaPausado ? "#eab308" : colorFase.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              // El reloj avanza cada 1 s: una transición lineal de 1 s hace el giro continuo
              transition: estaPausado ? "none" : "stroke-dashoffset 1s linear, stroke 0.5s ease",
              filter: `drop-shadow(0px 0px 8px ${estaPausado ? "#eab308" : colorFase.stroke})`,
            }}
          />
        </svg>

        {/* Contenido Central: Tiempo Digital y Detalles */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {etapaActual?.icono && (
            <div
              className={`mb-2 p-2.5 rounded-2xl ${
                categoriaInfo?.colorBg || "bg-primary/10"
              } transition-transform hover:scale-110`}
            >
              <IconoRutina
                nombre={etapaActual.icono}
                className={`${esFullscreen ? "size-8 sm:size-10" : "size-7"} ${
                  categoriaInfo?.colorText || "text-primary"
                }`}
              />
            </div>
          )}

          {/* Número Digital Grande */}
          <div
            style={esFullscreen ? { fontSize: "clamp(2.25rem, min(9vh, 11vw), 6rem)", lineHeight: 1 } : undefined}
            className={`font-mono font-bold tracking-tight tabular-nums select-none ${
              esFullscreen ? "" : "text-4xl sm:text-5xl"
            } ${
              estaPausado
                ? "text-amber-500 animate-pulse"
                : fase === "rojo"
                ? "text-rose-500 animate-pulse"
                : "text-foreground"
            }`}
          >
            {formatearSegundos(restanteSeg)}
          </div>

          {/* Etiqueta de estado */}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
            {estaPausado ? "Temporizador en Pausa" : "Tiempo Restante"}
          </span>

          {/* Título de la etapa actual */}
          <div
            className={`mt-2 font-bold text-foreground truncate ${
              esFullscreen
                ? "max-w-[44vh] text-lg sm:text-2xl"
                : "max-w-[240px] sm:max-w-[320px] text-sm sm:text-base"
            }`}
          >
            {etapaActual ? etapaActual.titulo : "Descanso general"}
          </div>

          {/* Horario de la etapa */}
          {etapaActual && (
            <span
              className={`font-mono text-muted-foreground mt-0.5 ${
                esFullscreen ? "text-sm" : "text-xs"
              }`}
            >
              {etapaActual.horaInicio} – {etapaActual.horaFin} ({etapaActual.duracionMin} min)
            </span>
          )}
        </div>
      </div>

      {/* Etapa anterior y siguiente */}
      {(etapaAnterior || proximaEtapa) && (
        <div className="w-full max-w-md mt-4 space-y-1.5">
          {etapaAnterior && (
            <div className="flex items-center justify-between rounded-2xl bg-muted/25 px-4 py-2 text-xs border border-border/40">
              <div className="flex items-center gap-2.5 text-muted-foreground truncate">
                <span className="font-bold text-foreground">Anterior:</span>
                <IconoRutina nombre={etapaAnterior.icono} className="size-4 text-muted-foreground" />
                <span className="truncate">{etapaAnterior.titulo}</span>
              </div>
              <span className="font-mono text-muted-foreground shrink-0 font-medium ml-2">
                {etapaAnterior.horaInicio}
              </span>
            </div>
          )}
          {proximaEtapa && (
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-2.5 text-xs border border-border/50">
              <div className="flex items-center gap-2.5 text-muted-foreground truncate">
                <span className="font-bold text-foreground">Siguiente:</span>
                <IconoRutina nombre={proximaEtapa.icono} className="size-4 text-primary" />
                <span className="truncate">{proximaEtapa.titulo}</span>
              </div>
              <span className="font-mono text-muted-foreground shrink-0 font-medium ml-2">
                a las {proximaEtapa.horaInicio}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controles de la rutina: volver, pausar, +5 min, avanzar */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6 w-full max-w-lg">
        {onRetrocederEtapa && (
          <Button
            variant="outline"
            size={esFullscreen ? "lg" : "sm"}
            onClick={onRetrocederEtapa}
            disabled={!puedeRetroceder || !etapaActual}
            className="h-10 px-3.5 gap-1.5 rounded-xl font-semibold"
            title={
              etapaAnterior
                ? `Volver a «${etapaAnterior.titulo}»: se retoma ahora (hasta 15 min) y el resto del día se corre`
                : "Es la primera etapa del día"
            }
          >
            <SkipBack className="size-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
        )}

        {onTogglePausa && (
          <Button
            variant={estaPausado ? "default" : "outline"}
            size={esFullscreen ? "lg" : "sm"}
            onClick={onTogglePausa}
            className={`h-10 px-4 gap-2 rounded-xl font-bold transition-all ${
              estaPausado ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30" : ""
            }`}
          >
            {estaPausado ? (
              <>
                <Play className="size-4 fill-current" />
                <span>Reanudar</span>
              </>
            ) : (
              <>
                <Pause className="size-4" />
                <span>Pausar</span>
              </>
            )}
          </Button>
        )}

        {onExtenderTiempo && (
          <Button
            variant="outline"
            size={esFullscreen ? "lg" : "sm"}
            onClick={onExtenderTiempo}
            disabled={!etapaActual}
            className="h-10 px-3.5 gap-1.5 rounded-xl font-semibold"
            title="Añadir 5 minutos a la etapa y desplazar el día"
          >
            <Plus className="size-4" />
            <span>+5 min</span>
          </Button>
        )}

        {onAvanzarEtapa && (
          <Button
            variant="secondary"
            size={esFullscreen ? "lg" : "sm"}
            onClick={onAvanzarEtapa}
            disabled={!puedeAvanzar || !etapaActual}
            className="h-10 px-3.5 gap-1.5 rounded-xl font-semibold"
            title={
              proximaEtapa
                ? `Terminar esta etapa ahora y pasar a «${proximaEtapa.titulo}»`
                : "Es la última etapa del día"
            }
          >
            <span className="hidden sm:inline">Siguiente</span>
            <SkipForward className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );

  // Si está en pantalla completa, usar createPortal para salir de cualquier contenedor
  if (esFullscreen && typeof document !== "undefined") {
    return createPortal(contenido, document.body);
  }

  return contenido;
}
