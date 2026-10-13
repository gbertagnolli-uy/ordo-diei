"use client";

// Apertura del premio sorpresa: el regalo 3D gira cada vez más rápido, explota en confites y
// aparece el premio en texto. Se abre al reclamar; `resultado` llega cuando el servidor acreditó todo.
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

const Regalo3D = dynamic(() => import("./Regalo3D"), { ssr: false });

export type ResultadoSorpresa = { lineas: string[]; pendienteEntrega: boolean };

const COLORES = ["#f59e0b", "#fbbf24", "#38bdf8", "#f472b6", "#34d399", "#a78bfa"];

/** Varias explosiones de confites desde distintos puntos */
function lluviaDeConfites(reducida: boolean) {
  if (reducida) return confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: COLORES, disableForReducedMotion: false });
  const rafagas = 7;
  for (let i = 0; i < rafagas; i++) {
    setTimeout(() => {
      confetti({
        particleCount: i === 0 ? 140 : 70,
        spread: i === 0 ? 360 : 80,
        startVelocity: i === 0 ? 45 : 35,
        ticks: 90,
        origin: i === 0 ? { x: 0.5, y: 0.45 } : { x: 0.15 + Math.random() * 0.7, y: 0.3 + Math.random() * 0.3 },
        colors: COLORES,
        zIndex: 200,
      });
    }, i * 380);
  }
}

export function ModalSorpresa({
  titulo,
  resultado,
  onCerrar,
}: {
  /** Comportamiento que originó el premio; null = modal cerrado */
  titulo: string | null;
  resultado: ResultadoSorpresa | null;
  onCerrar: () => void;
}) {
  const reducida = !!useReducedMotion();
  const [revelado, setRevelado] = useState(false);
  const abierto = titulo !== null;
  const confitesHechos = useRef(false);

  // Cada apertura empieza de cero
  useEffect(() => {
    if (abierto) {
      setRevelado(false);
      confitesHechos.current = false;
    }
  }, [abierto, titulo]);

  const explotar = () => {
    if (confitesHechos.current) return;
    confitesHechos.current = true;
    setRevelado(true);
    lluviaDeConfites(reducida);
  };

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && revelado && onCerrar()}>
      <DialogContent
        showCloseButton={revelado}
        onInteractOutside={(e) => !revelado && e.preventDefault()}
        onEscapeKeyDown={(e) => !revelado && e.preventDefault()}
        className="overflow-hidden sm:max-w-md"
      >
        <DialogTitle className="sr-only">Premio sorpresa</DialogTitle>
        <DialogDescription className="sr-only">Abriendo tu premio sorpresa: {titulo}</DialogDescription>

        {!revelado ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="h-72 w-full">{abierto && <Regalo3D listo={!!resultado} reducida={reducida} onExplotar={explotar} />}</div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Spinner className="size-3.5" /> Abriendo tu premio sorpresa…
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <motion.div
              initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <Gift className="size-8" />
            </motion.div>
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-amber-500" /> {titulo}
              </p>
              <h2 className="font-heading text-2xl font-semibold">¡Ganaste!</h2>
            </div>
            <ul className="w-full space-y-2">
              {(resultado?.lineas.length ? resultado.lineas : ["Un abrazo de tus papás"]).map((l, i) => (
                <motion.li
                  key={i}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.12 }}
                  className="rounded-xl border bg-card px-4 py-3 font-heading text-lg font-medium"
                >
                  {l}
                </motion.li>
              ))}
            </ul>
            {resultado?.pendienteEntrega && (
              <p className="text-sm text-muted-foreground">Tus papás ya lo ven y te lo van a entregar.</p>
            )}
            <Button onClick={onCerrar} className="w-full">
              ¡Genial!
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
