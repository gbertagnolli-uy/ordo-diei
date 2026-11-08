"use client";
// Portado de vendor/moodiary/editor/src/ui/hooks/use-media.ts (ZhuJHua/moodiary@2c552dd)
// Lane 294. Mismos controles (reproducir, silenciar, adelantar arrastrando sin pelear con `timeupdate`); `formatTime` vive en `lib/diario/adjuntos.ts`.
import { useEffect, useRef, useState, type RefObject } from "react";

export interface ControlesMedia {
  playing: boolean;
  duration: number;
  muted: boolean;
  dragging: boolean;
  sliderValue: number;
  toggle(): void;
  toggleMute(): void;
  seekTo(seconds: number): void;
  endSeek(seconds: number): void;
}

export function useControlesMedia(mediaRef: RefObject<HTMLMediaElement | null>): ControlesMedia {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const draggingRef = useRef(false);
  const calculandoRef = useRef(false);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      if (!draggingRef.current) setCurrent(el.currentTime);
    };
    // Un audio grabado con MediaRecorder puede decir `Infinity` de duración: se ignora y se espera al próximo evento
    const onMeta = () => {
      setDuration(Number.isFinite(el.duration) ? el.duration : 0);
      // El webm de MediaRecorder no trae la duración: se salta al final una vez para que el navegador la calcule y se vuelve al principio
      if (el.duration === Infinity && !calculandoRef.current) {
        calculandoRef.current = true;
        const volver = () => {
          el.removeEventListener("timeupdate", volver);
          el.currentTime = 0;
        };
        el.addEventListener("timeupdate", volver);
        el.currentTime = 1e101;
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
    };
    const onVolume = () => setMuted(el.muted);
    const eventos: Array<[string, EventListener]> = [
      ["play", onPlay],
      ["pause", onPause],
      ["timeupdate", onTime],
      ["loadedmetadata", onMeta],
      ["durationchange", onMeta],
      ["ended", onEnded],
      ["volumechange", onVolume],
    ];
    for (const [nombre, fn] of eventos) el.addEventListener(nombre, fn);
    onMeta();
    onVolume();
    return () => {
      el.pause();
      for (const [nombre, fn] of eventos) el.removeEventListener(nombre, fn);
    };
  }, [mediaRef]);

  return {
    playing,
    duration,
    muted,
    dragging,
    sliderValue: dragging ? dragValue : current,
    toggle() {
      const el = mediaRef.current;
      if (!el) return;
      if (el.paused) el.play().catch(() => {});
      else el.pause();
    },
    toggleMute() {
      const el = mediaRef.current;
      if (el) el.muted = !el.muted;
    },
    seekTo(segundos) {
      draggingRef.current = true;
      setDragging(true);
      setDragValue(segundos);
      const el = mediaRef.current;
      if (el) el.currentTime = segundos;
    },
    endSeek(segundos) {
      const el = mediaRef.current;
      if (el) el.currentTime = segundos;
      setCurrent(segundos);
      draggingRef.current = false;
      setDragging(false);
    },
  };
}
