"use client";

import React from "react";
import { Check, Bell, BellOff, Edit2, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EtapaRutina, CATEGORIAS_INFO } from "@/lib/rutina/tipos";
import { IconoRutina } from "./IconoRutina";

interface EtapaCardProps {
  etapa: EtapaRutina;
  esActiva: boolean;
  esProxima: boolean;
  esPasada: boolean;
  estaCompletada?: boolean;
  onToggleCompletada?: (id: string) => void;
  onEditar?: (etapa: EtapaRutina) => void;
  esPadre?: boolean;
}

export function EtapaCard({
  etapa,
  esActiva,
  esProxima,
  esPasada,
  estaCompletada = false,
  onToggleCompletada,
  onEditar,
  esPadre = false,
}: EtapaCardProps) {
  const cat = CATEGORIAS_INFO[etapa.categoria] || CATEGORIAS_INFO.estudio;

  return (
    <div
      className={`group relative flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 ${
        esActiva
          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20"
          : esProxima
          ? "border-amber-400/60 bg-amber-500/5 shadow-sm"
          : estaCompletada
          ? "border-emerald-500/30 bg-emerald-500/5 opacity-80"
          : esPasada
          ? "border-border/60 bg-card/60 opacity-60"
          : "border-border bg-card/90 hover:border-primary/40 hover:bg-card"
      }`}
    >
      {/* Checkbox de cumplimiento rápido */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => onToggleCompletada && onToggleCompletada(etapa.id)}
          className={`size-6 rounded-lg flex items-center justify-center border transition-all ${
            estaCompletada
              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
              : esActiva
              ? "border-primary/60 hover:bg-primary/10"
              : "border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/40"
          }`}
          title={estaCompletada ? "Desmarcar" : "Marcar como cumplido hoy"}
        >
          {estaCompletada && <Check className="size-4 stroke-[2.5]" />}
        </button>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {/* Horario */}
          <span className="font-mono text-xs font-bold tracking-tight text-foreground flex items-center gap-1">
            <Clock className="size-3 text-muted-foreground" />
            {etapa.horaInicio} – {etapa.horaFin}
          </span>

          {/* Duración */}
          <span className="text-[11px] text-muted-foreground font-medium">
            ({etapa.duracionMin} min)
          </span>

          {/* Estado badges */}
          {esActiva && (
            <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-2 animate-pulse font-semibold">
              ¡Ahora!
            </Badge>
          )}

          {esProxima && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300 text-[10px] h-5 px-2">
              Próxima
            </Badge>
          )}

          {/* Categoría badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cat.borderColor} ${cat.colorBg} ${cat.colorText}`}
          >
            <IconoRutina nombre={etapa.icono || cat.defaultIcon} className="size-3" />
            {cat.label}
          </span>

          {/* Indicador de Alarma Sonora */}
          {etapa.alarmaSonora ? (
            <span title="Alarma sonora activada para esta etapa">
              <Bell className="size-3 text-amber-500" />
            </span>
          ) : (
            <span title="Sin alarma sonora" className="opacity-40">
              <BellOff className="size-3 text-muted-foreground" />
            </span>
          )}
        </div>

        {/* Título de la etapa */}
        <h4
          className={`text-sm font-semibold tracking-tight leading-snug transition-colors ${
            estaCompletada ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {etapa.titulo}
        </h4>

        {/* Descripción (si existe) */}
        {etapa.descripcion && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {etapa.descripcion}
          </p>
        )}
      </div>

      {/* Botón de edición para padres */}
      {esPadre && onEditar && (
        <div className="shrink-0 pt-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditar(etapa)}
            className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
            title="Editar horario o detalles de esta etapa"
          >
            <Edit2 className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  );
}
