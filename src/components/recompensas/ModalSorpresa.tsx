"use client";

// Apertura del premio sorpresa: el regalo 3D gira cada vez más rápido, explota en confites y
// aparece el premio en texto. Se abre al reclamar; `resultado` llega cuando el servidor acreditó todo.
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import confetti from "canvas-confetti";
import { Coins, Flame, Gift, Layers, Sparkles, Ticket, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { URL_COFRE, URL_REGALO } from "./modelos";
import { Spinner } from "@/components/ui/spinner";

const Regalo3D = dynamic(() => import("./Regalo3D"), { ssr: false });

export type TipoSorpresa = "regalo" | "cofre" | "reconocimiento";

export type ResultadoSorpresa = { lineas: string[]; pendienteEntrega: boolean };

const COLORES = ["#f59e0b", "#fbbf24", "#38bdf8", "#f472b6", "#34d399", "#a78bfa"];

/** Icono según de qué es el premio (las líneas llegan ya como texto) */
function iconoDe(linea: string): LucideIcon {
  if (/^vale/i.test(linea)) return Ticket;
  if (/\bpuntos?\b/i.test(linea)) return Coins;
  if (/\bxp\b/i.test(linea)) return Zap;
  if (/incienso/i.test(linea)) return Flame;
  if (/fragmento|carta/i.test(linea)) return Layers;
  return Gift;
}

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
  tipo = "regalo",
  resultado,
  onCerrar,
}: {
  tipo?: TipoSorpresa;
  /** Comportamiento que originó el premio; null = modal cerrado */
  titulo: string | null;
  resultado: ResultadoSorpresa | null;
  onCerrar: () => void;
}) {
  const reducida = !!useReducedMotion();
  const [revelado, setRevelado] = useState(false);
  const abierto = titulo !== null;
  const confitesHechos = useRef(false);
  // Los premios se muestran de a uno, como las cartas de un sobre
  const [paso, setPaso] = useState(0);

  // Cada apertura empieza de cero
  useEffect(() => {
    if (abierto) {
      setRevelado(false);
      setPaso(0);
      confitesHechos.current = false;
    }
  }, [abierto, titulo]);

  const explotar = () => {
    if (confitesHechos.current) return;
    confitesHechos.current = true;
    setRevelado(true);
    lluviaDeConfites(reducida);
  };

  // El reconocimiento no tiene objeto 3D: al llegar el resultado se abre ya con los confites
  const sinObjeto3D = tipo === "reconocimiento";
  useEffect(() => {
    if (sinObjeto3D && abierto && resultado && !confitesHechos.current) {
      confitesHechos.current = true;
      setRevelado(true);
      lluviaDeConfites(reducida);
    }
  }, [sinObjeto3D, abierto, resultado, reducida]);

  const lineas = resultado?.lineas.length ? resultado.lineas : ["Un abrazo de tus papás"];
  const ultimo = paso >= lineas.length - 1;
  const Icono = iconoDe(lineas[Math.min(paso, lineas.length - 1)]);

  const siguiente = () => {
    setPaso((p) => p + 1);
    lluviaDeConfites(reducida); // cada premio explota con sus propios confites
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
            <div className="h-72 w-full">{abierto && !sinObjeto3D && <Regalo3D url={tipo === "cofre" ? URL_COFRE : URL_REGALO} listo={!!resultado} reducida={reducida} onExplotar={explotar} />}</div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Spinner className="size-3.5" /> {tipo === "cofre" ? "Abriendo tu cofre sorpresa…" : tipo === "reconocimiento" ? "Abriendo tu reconocimiento…" : "Abriendo tu premio sorpresa…"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-amber-500" /> {titulo}
              </p>
              <h2 className="font-heading text-2xl font-semibold">¡Ganaste!</h2>
              {lineas.length > 1 && (
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Premio {paso + 1} de {lineas.length}
                </p>
              )}
            </div>
            <motion.div
              key={paso}
              initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              {sinObjeto3D && paso === 0 ? (
                <Image src="/premios/medalla.webp" alt="" width={56} height={56} unoptimized className="h-14 w-auto object-contain" />
              ) : (
                <Icono className="size-10" />
              )}
            </motion.div>
            <motion.p
              key={`t${paso}`}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="w-full rounded-xl border bg-card px-4 py-4 font-heading text-xl font-medium text-balance"
            >
              {lineas[Math.min(paso, lineas.length - 1)]}
            </motion.p>
            {ultimo && resultado?.pendienteEntrega && (
              <p className="text-sm text-muted-foreground">Tus papás ya lo ven y te lo van a entregar.</p>
            )}
            <Button onClick={ultimo ? onCerrar : siguiente} className="w-full">
              {ultimo ? "¡Genial!" : "Siguiente premio"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
