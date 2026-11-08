"use client";
// Portado de vendor/moodiary/editor/src/ui/nodes/VideoNodeView.tsx (ZhuJHua/moodiary@2c552dd)
// Cambios (lane 294): el `src` ya es la URL; sin póster ni fondo desenfocado (el navegador muestra el primer cuadro con `preload="metadata"`);
// la pantalla completa es la del navegador en lugar del reproductor nativo de Flutter (`videoFullscreen`).
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatearTiempo } from "@/lib/diario/adjuntos";
import { useControlesMedia } from "./useControlesMedia";

const PROPORCION_MIN = 4 / 5;
const PROPORCION_MAX = 16 / 9;
const OCULTAR_CONTROLES_MS = 3000;

type VideoConPantallaCompleta = HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitRequestFullscreen?: () => void };

export default function VistaVideo({ node, selected }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : undefined;
  const ancho = typeof node.attrs.widthPercent === "number" ? node.attrs.widthPercent : null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const { playing, duration, muted, sliderValue, dragging, toggle, toggleMute, seekTo, endSeek } = useControlesMedia(videoRef);

  const [proporcion, setProporcion] = useState<number | null>(null);
  const marco = proporcion === null ? PROPORCION_MAX : Math.min(PROPORCION_MAX, Math.max(PROPORCION_MIN, proporcion));

  function alCargarMetadatos() {
    const el = videoRef.current;
    if (el && el.videoWidth > 0 && el.videoHeight > 0) setProporcion(el.videoWidth / el.videoHeight);
  }

  const [controlesVisibles, setControlesVisibles] = useState(true);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  function limpiarTemporizador() {
    if (temporizador.current !== undefined) {
      clearTimeout(temporizador.current);
      temporizador.current = undefined;
    }
  }
  // En el evento play/pause `playing` todavía trae el valor anterior: quien llama lo pasa explícito
  function mantenerControles(reproduciendo = playing) {
    setControlesVisibles(true);
    limpiarTemporizador();
    if (reproduciendo) temporizador.current = setTimeout(() => setControlesVisibles(false), OCULTAR_CONTROLES_MS);
  }
  function alTocarImagen() {
    if (controlesVisibles) {
      if (playing) {
        setControlesVisibles(false);
        limpiarTemporizador();
      }
      return;
    }
    mantenerControles();
  }
  useEffect(() => limpiarTemporizador, []);

  function pantallaCompleta() {
    const el = videoRef.current as VideoConPantallaCompleta | null;
    if (!el) return;
    mantenerControles();
    // iPhone no deja poner un <video> en pantalla completa con la API estándar
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
    else el.webkitRequestFullscreen?.();
  }

  const pista = useRef<HTMLDivElement>(null);
  const porcentaje = duration > 0 ? Math.min(100, Math.max(0, (sliderValue / duration) * 100)) : 0;

  function tiempoEnPuntero(e: PointerEvent): number | null {
    const el = pista.current;
    if (!el || !(duration > 0)) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return null;
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * duration;
  }
  function alBajar(e: PointerEvent) {
    const en = tiempoEnPuntero(e);
    if (en === null) return;
    pista.current?.setPointerCapture(e.pointerId);
    seekTo(en);
    mantenerControles();
  }
  function alMover(e: PointerEvent) {
    if (!dragging) return;
    const en = tiempoEnPuntero(e);
    if (en === null) return;
    seekTo(en);
    mantenerControles();
  }
  function alSoltar(e: PointerEvent) {
    if (!dragging) return;
    endSeek(tiempoEnPuntero(e) ?? sliderValue);
    mantenerControles();
  }

  return (
    <NodeViewWrapper className={`md-block md-video${selected ? " is-selected" : ""}`} style={ancho ? { width: `${ancho}%` } : undefined} data-block-node="" contentEditable={false}>
      <div className="md-block__body md-video__frame" style={{ "--video-ratio": String(marco) } as CSSProperties}>
        <video
          ref={videoRef}
          className="md-video__el"
          src={src}
          preload="metadata"
          playsInline
          onLoadedMetadata={alCargarMetadatos}
          onPlay={() => mantenerControles(true)}
          onPause={() => mantenerControles(false)}
          onEnded={() => mantenerControles(false)}
          onClick={alTocarImagen}
        />
        <div className={`md-video__bar${controlesVisibles ? "" : " is-hidden"}`} onPointerDown={() => mantenerControles()}>
          <button className="md-video__key" type="button" aria-label={playing ? "Pausar" : "Reproducir"} onClick={toggle}>
            {playing ? <Pause /> : <Play />}
          </button>
          <div
            ref={pista}
            className={`md-video__track${dragging ? " is-pressed" : ""}`}
            role="slider"
            aria-label="Progreso del video"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(sliderValue)}
            aria-valuetext={`${formatearTiempo(sliderValue)} / ${formatearTiempo(duration)}`}
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
          >
            <span className="md-video__rail" />
            <span className="md-video__fill" style={{ width: `${porcentaje}%` }} />
            <span className="md-video__thumb" style={{ left: `${porcentaje}%` }} />
          </div>
          <span className="md-video__time">
            <span className="md-video__time-pos">{formatearTiempo(sliderValue)}</span>
            <span className="md-video__time-sep">/</span>
            <span className="md-video__time-dur">{formatearTiempo(duration)}</span>
          </span>
          <button className="md-video__key" type="button" aria-label={muted ? "Activar sonido" : "Silenciar"} onClick={toggleMute}>
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <button className="md-video__key" type="button" aria-label="Pantalla completa" onClick={pantallaCompleta}>
            <Maximize />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
