"use client";

// Propio de Ordo: variante de «Hoy aprendo» con dos tarjetas enormes — PRIMERO (la lección actual, con la barra del tiempo
// estimado) y DESPUÉS (lo que eligieron los padres). Al terminar PRIMERO se atenúa y DESPUÉS pasa al frente.

import { Camera, CheckCircle2, Clock, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiaHoy } from "@/lib/homeschooling/servidor/hoy";
import TemporizadorLeccion from "./TemporizadorLeccion";

export default function PrimeroDespues({ dias, recompensa, onAbrir, onFoto }: { dias: DiaHoy[]; recompensa: string | null; onAbrir: (d: DiaHoy) => void; onFoto?: (d: DiaHoy) => void }) {
  const actual = dias.find((d) => d.estado !== "hecha") ?? null;
  const terminado = !actual && dias.length > 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl border-2 p-6 transition-opacity ${terminado ? "opacity-50" : "border-primary bg-primary/5"}`}>
        <p className="text-sm font-bold tracking-widest text-primary">PRIMERO</p>
        {terminado ? (
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-success">
            <CheckCircle2 className="size-7" /> ¡Terminaste!
          </p>
        ) : actual ? (
          <div className="mt-2 space-y-3">
            <p className="text-3xl leading-tight font-bold text-foreground">{actual.recurso.titulo}</p>
            <p className="text-lg text-muted-foreground">
              {actual.materia.nombre} · {actual.rango}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> {actual.minutosEstimados} min
            </p>
            <TemporizadorLeccion key={actual.diaId} minutos={actual.minutosEstimados} />
            <div className="flex gap-2">
              <Button size="lg" className="h-14 flex-1 text-lg" onClick={() => onAbrir(actual)}>
                Empezar
              </Button>
              {onFoto && (
                <Button size="lg" variant="outline" className="h-14 w-14 shrink-0" aria-label="Sacar una foto de mi trabajo" onClick={() => onFoto(actual)}>
                  <Camera />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xl text-muted-foreground">Hoy no hay nada para estudiar.</p>
        )}
      </div>

      <div className={`rounded-3xl border-2 p-6 transition-all ${terminado ? "border-success bg-success/10" : "opacity-70"}`}>
        <p className="text-sm font-bold tracking-widest text-success">DESPUÉS</p>
        <p className="mt-2 flex items-center gap-3 text-3xl leading-tight font-bold text-foreground">
          <Gift className="size-8 shrink-0 text-success" /> {recompensa || "¡Un descanso!"}
        </p>
      </div>
    </div>
  );
}
