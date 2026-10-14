"use client";

// Propio de Ordo: reproductor del visor con react-player (YouTube y Vimeo con la misma API) para leer el tiempo y pausar
// en los checkpoints. Es una guía pedagógica, no una barrera: la barrera real es la nota del servidor.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { proximoCheckpoint } from "@/lib/homeschooling/quiz";
import { api } from "@/lib/homeschooling/roost/services/http";
import CheckpointOverlay, { type PreguntaCheckpoint } from "./CheckpointOverlay";

const SEGUNDOS_ATRAS = 30;

export default function ReproductorLeccion({ leccionId, src, titulo, tieneCheckpoints }: { leccionId: number; src: string; titulo: string; tieneCheckpoints: boolean }) {
  const player = useRef<HTMLVideoElement>(null);
  const [checkpoints, setCheckpoints] = useState<PreguntaCheckpoint[]>([]);
  const [respondidos, setRespondidos] = useState<Set<number>>(new Set());
  const [abierto, setAbierto] = useState<PreguntaCheckpoint | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);

  useEffect(() => {
    // El visor remonta este componente por lección (key), así que el estado arranca limpio
    if (!tieneCheckpoints) return;
    let vigente = true;
    api<PreguntaCheckpoint[]>(`/api/homeschooling/lecciones/${leccionId}/preguntas?tipo=checkpoint`)
      .then((c) => vigente && setCheckpoints(c))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [leccionId, tieneCheckpoints]);

  const segundos = useMemo(() => checkpoints.map((c) => c.segundoVideo).filter((s): s is number => s !== null), [checkpoints]);

  const alAvanzar = useCallback(() => {
    const t = player.current?.currentTime ?? 0;
    if (abierto) return;
    const toca = proximoCheckpoint(t, segundos, respondidos);
    if (toca === null) return;
    player.current?.pause();
    setReproduciendo(false);
    setAbierto(checkpoints.find((c) => c.segundoVideo === toca) ?? null);
  }, [abierto, segundos, respondidos, checkpoints]);

  const seguir = () => {
    if (abierto?.segundoVideo != null) setRespondidos((r) => new Set(r).add(abierto.segundoVideo as number));
    setAbierto(null);
    setReproduciendo(true);
  };

  const volver = () => {
    if (player.current) player.current.currentTime = Math.max(0, (abierto?.segundoVideo ?? player.current.currentTime) - SEGUNDOS_ATRAS);
    setAbierto(null);
    setReproduciendo(true);
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
      <ReactPlayer
        ref={player}
        src={src}
        title={titulo}
        controls
        playing={reproduciendo}
        width="100%"
        height="100%"
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        onTimeUpdate={alAvanzar}
      />
      {abierto && <CheckpointOverlay leccionId={leccionId} pregunta={abierto} onAcierto={seguir} onFallo={volver} />}
    </div>
  );
}
