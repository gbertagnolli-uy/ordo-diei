"use client";

import React from "react";
import { Bell, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EtapaRutina } from "@/lib/rutina/tipos";
import { IconoRutina } from "./IconoRutina";

interface BarraAlarmaActivaProps {
  etapa: EtapaRutina | null;
  onCerrar: () => void;
  onExtender?: () => void;
}

export function BarraAlarmaActiva({
  etapa,
  onCerrar,
  onExtender,
}: BarraAlarmaActivaProps) {
  if (!etapa) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/40 bg-card/95 shadow-2xl backdrop-blur-md ring-4 ring-amber-500/20">
        <div className="flex items-center gap-3 truncate">
          <div className="size-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 animate-bounce">
            <Bell className="size-5 fill-current" />
          </div>
          <div className="truncate">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              ¡Comienza nueva etapa! ({etapa.horaInicio})
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-sm truncate text-foreground">
              <IconoRutina nombre={etapa.icono} className="size-4 text-primary shrink-0" />
              <span className="truncate">{etapa.titulo}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onExtender && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExtender}
              className="h-8 text-xs px-2.5 rounded-xl"
              title="Añadir 5 minutos a la etapa anterior"
            >
              <Plus className="size-3.5 mr-1" />
              +5 min
            </Button>
          )}

          <Button
            size="sm"
            onClick={onCerrar}
            className="h-8 text-xs px-3 rounded-xl gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            <Check className="size-3.5" />
            ¡Listo!
          </Button>

          <button
            type="button"
            onClick={onCerrar}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
