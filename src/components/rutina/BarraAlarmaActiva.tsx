"use client";

import React from "react";
import { Bell, Check, Clock, X, ChevronDown, Sparkles } from "lucide-react";
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
import { IconoRutina } from "./IconoRutina";

interface BarraAlarmaActivaProps {
  etapa: EtapaRutina | null;
  onCerrar: () => void;
  onPosponer: (minutos: number) => void;
  onSilenciar?: () => void;
  sonidoHabilitado?: boolean;
}

export function BarraAlarmaActiva({
  etapa,
  onCerrar,
  onPosponer,
  onSilenciar,
  sonidoHabilitado = true,
}: BarraAlarmaActivaProps) {
  if (!etapa) return null;

  const cat = CATEGORIAS_INFO[etapa.categoria] || CATEGORIAS_INFO.estudio;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-6 duration-300">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-card/95 p-4 shadow-2xl backdrop-blur-xl ring-4 ring-amber-500/15">
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-12 -right-12 size-36 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Lado izquierdo: Icono y datos de la etapa */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="relative size-11 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Bell className="size-5 fill-current animate-bounce" />
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-amber-500 animate-ping" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] h-5 px-2 font-bold uppercase tracking-wider"
                >
                  ¡Nueva Etapa!
                </Badge>
                <span className="text-xs font-mono font-bold text-foreground">
                  {etapa.horaInicio} – {etapa.horaFin}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-foreground truncate flex items-center gap-1.5">
                <IconoRutina nombre={etapa.icono || cat.defaultIcon} className="size-4 text-primary shrink-0" />
                <span className="truncate">{etapa.titulo}</span>
              </h3>

              {etapa.descripcion && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {etapa.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Lado derecho: Acciones de inicio y posposición */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Botón desplegable de Posponer con cascada */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5 rounded-xl text-xs font-semibold gap-1 border-border/80 hover:border-amber-500/50"
                  title="Posponer esta y todas las etapas subsiguientes del día"
                >
                  <Clock className="size-3.5 text-amber-500" />
                  <span>Posponer</span>
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-2xl z-[10001]">
                <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1">
                  Mover horario del día:
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { min: 5, label: "+5 min (en cascada)" },
                  { min: 10, label: "+10 min (en cascada)" },
                  { min: 15, label: "+15 min (en cascada)" },
                  { min: 30, label: "+30 min (en cascada)" },
                ].map((opt) => (
                  <DropdownMenuItem
                    key={opt.min}
                    onClick={() => onPosponer(opt.min)}
                    className="cursor-pointer text-xs font-medium rounded-xl py-2 px-2.5"
                  >
                    <Clock className="size-3.5 mr-2 text-amber-500" />
                    <span>{opt.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botón Principal: Comenzar / Listo */}
            <Button
              size="sm"
              onClick={onCerrar}
              className="h-9 px-3.5 rounded-xl gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/25"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>¡Comenzar!</span>
            </Button>

            {/* Cerrar X */}
            <button
              type="button"
              onClick={onCerrar}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Descartar aviso"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
