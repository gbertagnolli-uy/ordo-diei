"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  Plus,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EtapaRutina, CATEGORIAS_INFO } from "@/lib/rutina/tipos";
import { formatearSegundos, formatearTiempoHumano } from "@/lib/rutina/calculadorHorarios";
import { IconoRutina } from "./IconoRutina";
import { TipoSonidoRutina } from "@/lib/rutina/audioRutina";

interface TemporizadorDiscoProps {
  etapaActual: EtapaRutina | null;
  proximaEtapa: EtapaRutina | null;
  restanteSeg: number;
  totalSeg: number;
  porcentajeRestante: number;
  fase: "verde" | "ambar" | "rojo";
  estaPausado?: boolean;
  onTogglePausa?: () => void;
  onExtenderTiempo?: () => void;
  onAvanzarEtapa?: () => void;
  esFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  sonidoHabilitado: boolean;
  onToggleSonido: () => void;
  tipoSonido: TipoSonidoRutina;
  onChangeTipoSonido: (tipo: TipoSonidoRutina) => void;
  volumen: number;
  onChangeVolumen: (vol: number) => void;
  onProbarSonido: () => void;
}

export function TemporizadorDisco({
  etapaActual,
  proximaEtapa,
  restanteSeg,
  totalSeg,
  porcentajeRestante,
  fase,
  estaPausado = false,
  onTogglePausa,
  onExtenderTiempo,
  onAvanzarEtapa,
  esFullscreen = false,
  onToggleFullscreen,
  sonidoHabilitado,
  onToggleSonido,
  tipoSonido,
  onChangeTipoSonido,
  volumen,
  onChangeVolumen,
  onProbarSonido,
}: TemporizadorDiscoProps) {
  const [mostrarAjustesAudio, setMostrarAjustesAudio] = useState(false);

  // Dimensiones del disco SVG
  const tamano = esFullscreen ? 360 : 280;
  const strokeWidth = esFullscreen ? 18 : 14;
  const center = tamano / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;

  // Offset del círculo: representa la proporción de tiempo que RESTA (Time-Timer)
  const ratioRestante = Math.max(0, Math.min(1, porcentajeRestante / 100));
  const strokeDashoffset = circumference * (1 - ratioRestante);

  // Paleta armónica según fase
  const colorFase =
    fase === "rojo"
      ? {
          stroke: "#f43f5e", // Rose 500
          glow: "rgba(244, 63, 94, 0.35)",
          badgeBg: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
          texto: "¡Últimos minutos!",
        }
      : fase === "ambar"
      ? {
          stroke: "#f59e0b", // Amber 500
          glow: "rgba(245, 158, 11, 0.25)",
          badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          texto: "Tiempo medio",
        }
      : {
          stroke: "#10b981", // Emerald 500
          glow: "rgba(16, 185, 129, 0.25)",
          badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          texto: "En curso",
        };

  const categoriaInfo = etapaActual ? CATEGORIAS_INFO[etapaActual.categoria] : null;

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-3xl border bg-card/85 p-6 shadow-xl backdrop-blur-md transition-all duration-300 ${
        esFullscreen
          ? "fixed inset-0 z-50 rounded-none border-none p-10 bg-background/95"
          : "w-full max-w-xl mx-auto"
      }`}
      style={{
        boxShadow: `0 10px 30px -10px ${colorFase.glow}`,
      }}
    >
      {/* Barra superior de estado / Controles rápidos */}
      <div className="flex w-full items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {etapaActual ? (
            <Badge
              variant="outline"
              className={`px-3 py-1 font-medium transition-colors ${colorFase.badgeBg}`}
            >
              <span className="relative flex size-2 mr-2">
                <span
                  className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                    fase === "rojo" ? "bg-rose-400" : "bg-emerald-400"
                  }`}
                />
                <span
                  className={`relative inline-flex size-2 rounded-full ${
                    fase === "rojo" ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
              </span>
              {estaPausado ? "Pausado" : colorFase.texto}
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

        <div className="flex items-center gap-1.5">
          {/* Menú de sonido y alarmas */}
          <DropdownMenu open={mostrarAjustesAudio} onOpenChange={setMostrarAjustesAudio}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:text-foreground"
                title="Configuración de audio de la alarma"
              >
                {sonidoHabilitado ? <Volume2 className="size-4" /> : <VolumeX className="size-4 text-rose-500" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3 space-y-3">
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

              <Button
                variant="secondary"
                size="sm"
                className="w-full h-8 text-xs font-medium"
                onClick={onProbarSonido}
              >
                <Sparkles className="size-3.5 mr-1.5" />
                Probar sonido ahora
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Toggle Fullscreen / Modo Kiosk */}
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onToggleFullscreen}
              title={esFullscreen ? "Salir de pantalla completa" : "Modo Enfoque Pantalla Completa"}
            >
              {esFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Temporizador Circular Central */}
      <div className="relative my-2 flex items-center justify-center">
        <svg
          width={tamano}
          height={tamano}
          viewBox={`0 0 ${tamano} ${tamano}`}
          className="rotate-[-90deg] transition-transform duration-500 ease-out"
        >
          {/* Círculo de fondo / Track sutil */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-muted/30 dark:stroke-muted/20"
            fill="transparent"
          />

          {/* Disco / Arco coloreado de cuenta regresiva (Time-Timer) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            stroke={colorFase.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease",
              filter: `drop-shadow(0px 0px 8px ${colorFase.stroke})`,
            }}
          />
        </svg>

        {/* Contenido Central: Tiempo Digital y Detalles */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          {etapaActual?.icono && (
            <div
              className={`mb-1 p-2 rounded-2xl ${
                categoriaInfo?.colorBg || "bg-primary/10"
              } transition-transform hover:scale-110`}
            >
              <IconoRutina
                nombre={etapaActual.icono}
                className={`${esFullscreen ? "size-8" : "size-6"} ${
                  categoriaInfo?.colorText || "text-primary"
                }`}
              />
            </div>
          )}

          {/* Número Digital Grande */}
          <div
            className={`font-mono font-bold tracking-tight tabular-nums select-none ${
              esFullscreen ? "text-6xl" : "text-4xl sm:text-5xl"
            } ${fase === "rojo" && !estaPausado ? "text-rose-500 animate-pulse" : "text-foreground"}`}
          >
            {formatearSegundos(restanteSeg)}
          </div>

          {/* Etiqueta de tiempo */}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">
            {estaPausado ? "Temporizador en Pausa" : "Tiempo Restante"}
          </span>

          {/* Título de la etapa actual */}
          <div className="mt-2 max-w-[200px] sm:max-w-[240px] truncate text-sm font-semibold text-foreground">
            {etapaActual ? etapaActual.titulo : "Descanso general"}
          </div>

          {/* Horario de la etapa */}
          {etapaActual && (
            <span className="text-[11px] font-mono text-muted-foreground">
              {etapaActual.horaInicio} – {etapaActual.horaFin} ({etapaActual.duracionMin} min)
            </span>
          )}
        </div>
      </div>

      {/* Siguiente Etapa Preview */}
      {proximaEtapa && (
        <div className="w-full mt-4 flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2 text-xs border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground truncate">
            <span className="font-semibold text-foreground">Siguiente:</span>
            <IconoRutina nombre={proximaEtapa.icono} className="size-3.5 text-primary" />
            <span className="truncate">{proximaEtapa.titulo}</span>
          </div>
          <span className="font-mono text-muted-foreground shrink-0 font-medium ml-2">
            a las {proximaEtapa.horaInicio}
          </span>
        </div>
      )}

      {/* Botones de Control de la Rutina */}
      <div className="flex items-center justify-center gap-2 mt-5 w-full">
        {onTogglePausa && (
          <Button
            variant={estaPausado ? "default" : "outline"}
            size="sm"
            onClick={onTogglePausa}
            className="h-9 px-3 gap-1.5 rounded-xl font-medium"
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
            size="sm"
            onClick={onExtenderTiempo}
            className="h-9 px-3 gap-1.5 rounded-xl font-medium"
            title="Añadir 5 minutos al bloque actual"
          >
            <Plus className="size-4" />
            <span>+5 min</span>
          </Button>
        )}

        {onAvanzarEtapa && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAvanzarEtapa}
            className="h-9 px-3 gap-1.5 rounded-xl font-medium"
            title="Pasar a la siguiente etapa de la rutina"
          >
            <SkipForward className="size-4" />
            <span className="hidden sm:inline">Siguiente</span>
          </Button>
        )}
      </div>
    </div>
  );
}
