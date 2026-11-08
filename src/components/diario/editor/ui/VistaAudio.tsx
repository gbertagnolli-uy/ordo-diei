"use client";
// Portado de vendor/moodiary/editor/src/ui/nodes/AudioNodeView.tsx (ZhuJHua/moodiary@2c552dd)
// Sin traducción de nombres a URLs: el `src` ya es la URL del audio. Lane 294.
import { useRef, type CSSProperties } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Pause, Play } from "lucide-react";
import { formatearTiempo } from "@/lib/diario/adjuntos";
import { useControlesMedia } from "./useControlesMedia";

export default function VistaAudio({ node, selected }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : undefined;
  const nombre = (node.attrs.name as string | null) || "Audio";
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playing, duration, sliderValue, toggle, seekTo, endSeek } = useControlesMedia(audioRef);
  const progreso = duration > 0 ? Math.min(100, (sliderValue / duration) * 100) : 0;

  return (
    <NodeViewWrapper className={`md-block md-audio${selected ? " is-selected" : ""}`} data-block-node="" contentEditable={false}>
      <div className="md-block__body md-audio__card">
        <button type="button" className="md-audio__play" aria-label={playing ? "Pausar" : "Reproducir"} onClick={toggle}>
          {playing ? <Pause /> : <Play />}
        </button>
        <div className="md-audio__main">
          <span className="md-audio__name">{nombre}</span>
          <div className="md-audio__row">
            <input
              className="md-range"
              style={{ "--progress": `${progreso}%` } as CSSProperties}
              type="range"
              min={0}
              max={duration || 0}
              step="any"
              value={sliderValue}
              aria-label="Progreso del audio"
              onChange={(e) => seekTo(Number(e.currentTarget.value))}
              onPointerUp={(e) => endSeek(Number(e.currentTarget.value))}
              onPointerCancel={(e) => endSeek(Number(e.currentTarget.value))}
              onKeyUp={(e) => endSeek(Number(e.currentTarget.value))}
            />
            <span className="md-audio__time">
              {formatearTiempo(sliderValue)} / {formatearTiempo(duration)}
            </span>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </NodeViewWrapper>
  );
}
