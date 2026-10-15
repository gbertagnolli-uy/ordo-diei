"use client";

// Propio de Ordo: cronómetro para una actividad fuera de pantalla. «Empezar» guarda la hora de inicio (sigue contando aunque se
// cierre la pantalla); «Parar» devuelve inicio y fin para registrar la actividad con las horas ya medidas.

import { useEffect, useState, useSyncExternalStore } from "react";
import { Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMantenerActivo } from "@/hooks/useInactividad";
import { formatoReloj } from "@/lib/homeschooling/temporizador";

const CLAVE = "hs_cronometro_actividad";

const leer = (): number | null => {
  try {
    const v = Number(localStorage.getItem(CLAVE));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
};

const EVENTO = "hs-cronometro";
const suscribir = (cb: () => void) => {
  window.addEventListener(EVENTO, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener("storage", cb);
  };
};

export default function Cronometro({ onParar }: { onParar: (inicio: Date, fin: Date) => void }) {
  // La hora de inicio vive en localStorage; en el servidor no hay cronómetro corriendo
  const inicio = useSyncExternalStore(suscribir, leer, () => null);
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    if (!inicio) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [inicio]);

  useMantenerActivo("homeschooling-cronometro", !!inicio);

  const empezar = () => {
    const t = Date.now();
    try {
      localStorage.setItem(CLAVE, String(t));
    } catch {
      /* sin almacenamiento: el cronómetro sigue mientras la pantalla esté abierta */
    }
    window.dispatchEvent(new Event(EVENTO));
  };

  const parar = () => {
    if (!inicio) return;
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      /* nada que limpiar */
    }
    const fin = Date.now();
    window.dispatchEvent(new Event(EVENTO));
    onParar(new Date(inicio), new Date(Math.max(fin, inicio + 60000)));
  };

  return inicio ? (
    <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-2" role="timer" aria-label="Cronómetro de actividad">
      <Timer className="size-5 text-primary" />
      <span className="text-lg font-semibold text-foreground tabular-nums">{formatoReloj(((ahora || inicio) - inicio) / 1000)}</span>
      <Button size="sm" onClick={parar}>
        <Square /> Parar y registrar
      </Button>
    </div>
  ) : (
    <Button variant="outline" onClick={empezar}>
      <Timer /> Cronometrar
    </Button>
  );
}
