"use client";

// Propio de Ordo: reloj visual de una lección para Primero/Después — un anillo que se vacía del verde al rojo, sin sonidos
// ni parpadeos (apto para el modo relajado). El tiempo estimado sale de la Tarea; el niño lo inicia, lo pausa y lo reinicia.
// (El TemporizadorDisco de la rutina está atado a las etapas de la rutina; esto es lo mínimo que necesita una lección.)

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMantenerActivo } from "@/hooks/useInactividad";
import { arco, faseDe, formatoReloj, segundosRestantes } from "@/lib/homeschooling/temporizador";

const COLOR = { verde: "var(--success)", ambar: "var(--warning)", rojo: "var(--destructive)" } as const;
const R = 44;

export default function TemporizadorLeccion({ minutos }: { minutos: number }) {
  const totalSeg = Math.max(1, minutos) * 60;
  const [transcurrido, setTranscurrido] = useState(0);
  const [corriendo, setCorriendo] = useState(false);
  const base = useRef({ inicio: 0, acumulado: 0 });

  useMantenerActivo("homeschooling-temporizador", corriendo);

  useEffect(() => {
    if (!corriendo) return;
    const id = setInterval(() => setTranscurrido(base.current.acumulado + (Date.now() - base.current.inicio) / 1000), 500);
    return () => clearInterval(id);
  }, [corriendo]);

  const restante = segundosRestantes(totalSeg, transcurrido);
  const ratio = restante / totalSeg;
  const { largo, total } = arco(ratio, R);

  const alternar = () => {
    if (corriendo) {
      base.current.acumulado += (Date.now() - base.current.inicio) / 1000;
      setCorriendo(false);
    } else {
      base.current.inicio = Date.now();
      setCorriendo(true);
    }
  };

  const reiniciar = () => {
    base.current = { inicio: 0, acumulado: 0 };
    setTranscurrido(0);
    setCorriendo(false);
  };

  return (
    <div className="flex items-center gap-4" role="timer" aria-label={`Quedan ${formatoReloj(restante)}`}>
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <circle cx="50" cy="50" r={R} fill="none" stroke={COLOR[faseDe(ratio)]} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${largo} ${total}`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground tabular-nums">{formatoReloj(restante)}</span>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="lg" variant="outline" onClick={alternar} disabled={restante === 0}>
          {corriendo ? <Pause /> : <Play />} {corriendo ? "Pausar" : transcurrido > 0 ? "Seguir" : "Empezar el reloj"}
        </Button>
        {transcurrido > 0 && (
          <Button type="button" size="lg" variant="ghost" onClick={reiniciar} aria-label="Reiniciar el reloj">
            <RotateCcw />
          </Button>
        )}
      </div>
    </div>
  );
}
