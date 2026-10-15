"use client";

import React from "react";
import { Bell, Check, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EtapaRutina } from "@/lib/rutina/tipos";

interface BarraAlarmaActivaProps {
  etapa: EtapaRutina | null;
  onCerrar: () => void;
  onPosponer: (minutos: number) => void;
}

const OPCIONES_POSPONER = [5, 10, 15, 30];

/**
 * Aviso flotante al comenzar una etapa: título, horario y dos acciones.
 * "Posponer" corre el resto del día (solo hoy); "Listo" descarta el aviso.
 */
export function BarraAlarmaActiva({ etapa, onCerrar, onPosponer }: BarraAlarmaActivaProps) {
  if (!etapa) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-card/95 py-2.5 pl-3 pr-2.5 shadow-lg shadow-black/10 ring-1 ring-amber-500/10 backdrop-blur-xl">
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Bell className="size-4 fill-current" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500 animate-ping" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold leading-tight text-foreground">
            <span className="truncate">{etapa.titulo}</span>
          </p>
          <p className="font-mono text-[11px] leading-tight text-muted-foreground">
            {etapa.horaInicio} – {etapa.horaFin}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1 rounded-lg px-2 text-xs font-medium"
              title="Posponer esta etapa y todas las siguientes de hoy"
            >
              <Clock className="size-3.5 text-amber-500" />
              <span className="hidden sm:inline">Posponer</span>
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[10001] w-48 rounded-xl p-1">
            <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
              Correr los horarios de hoy
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {OPCIONES_POSPONER.map((min) => (
              <DropdownMenuItem
                key={min}
                onClick={() => onPosponer(min)}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium"
              >
                <Clock className="mr-2 size-3.5 text-amber-500" />
                +{min} minutos
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          onClick={onCerrar}
          className="h-8 shrink-0 gap-1 rounded-lg bg-amber-600 px-2.5 text-xs font-semibold text-white hover:bg-amber-700"
        >
          <Check className="size-3.5 stroke-[2.5]" />
          Listo
        </Button>
      </div>
    </div>
  );
}
