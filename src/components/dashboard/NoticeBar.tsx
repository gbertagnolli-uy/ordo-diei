"use client";

import { useEffect, useState } from 'react';

export function NoticeBar() {
  const [timeLeft, setTimeLeft] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [messageType, setMessageType] = useState<string | null>(null);

  useEffect(() => {
        const calculateTime = () => {
      const now = new Date();
      const limit = new Date();
      limit.setHours(22, 0, 0, 0);

      const hour = now.getHours();

      // Clear previous
      setIsVisible(false);
      setMessageType(null);
      setTimeLeft("");

      if (hour >= 17 && hour < 19) {
        setIsVisible(true);
        setMessageType("happyhour");
        const limitHH = new Date();
        limitHH.setHours(19, 0, 0, 0);
        const diff = limitHH.getTime() - now.getTime();

        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else if (hour >= 20 && hour < 22) {
        setIsVisible(true);
        setMessageType("warning");
        const diff = limit.getTime() - now.getTime();
        
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else if (hour >= 6 && hour < 12) {
         setIsVisible(true);
         setMessageType("morning");
      } else if (hour >= 13 && hour < 17) {
         setIsVisible(true);
         setMessageType("afternoon");
      } else if (hour >= 22 || hour < 6) {
         setIsVisible(true);
         setMessageType("evening");
      } else if (hour >= 17 && hour < 19) {
        setMessageType("happyhour");
      } else {
        setIsVisible(false);
        setMessageType(null);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Altura visible de la barra, para que el App Shell se ajuste y no quede bajo el Dock
  useEffect(() => {
    const alto = ["notice-bar", "premio-banner"].reduce((n, id) => n + (document.getElementById(id)?.offsetHeight ?? 0), 0);
    document.documentElement.style.setProperty("--notice-h", `${alto}px`);
  });

  if (!isVisible) return null;

  if (messageType === ("happyhour" as any)) {
    return (
      <div id="notice-bar" role="status" className="flex w-full items-center justify-center gap-2 border-b border-[color-mix(in_srgb,var(--secondary)_25%,transparent)] bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] px-4 py-2 text-center text-sm font-medium text-[var(--secondary)]">
        🎉 ¡HAPPY HOUR ACTIVA! Termina tus tareas ahora y gana un 20% más de puntos. Termina en [{timeLeft}]
      </div>
    );
  }

  if (messageType === "warning") {
    return (
      <div id="notice-bar" role="status" className="flex w-full items-center justify-center gap-2 border-b border-[color-mix(in_srgb,var(--error)_25%,transparent)] bg-[color-mix(in_srgb,var(--error)_10%,transparent)] px-4 py-2 text-center text-sm font-medium text-[var(--error)]">
        ⚠️ Te quedan [{timeLeft}] para terminar o corregir tus tareas de hoy y no perder tu racha diaria!
      </div>
    );
  }

  if (messageType === "morning") {
    return (
      <div id="notice-bar" role="status" className="flex w-full items-center justify-center gap-2 border-b border-[color-mix(in_srgb,var(--success)_25%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-2 text-center text-sm font-medium text-[var(--success)]">
        🌅 ¡Buenos días! Un nuevo día para brillar y ganar puntos. ¡A por todas!
      </div>
    );
  }

  if (messageType === "afternoon") {
    return (
      <div id="notice-bar" role="status" className="flex w-full items-center justify-center gap-2 border-b border-[color-mix(in_srgb,var(--secondary)_25%,transparent)] bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] px-4 py-2 text-center text-sm font-medium text-[var(--secondary)]">
        ☀️ ¡Buenas tardes! ¿Cómo vas con tus tareas? Sigue así, ¡tú puedes!
      </div>
    );
  }

  if (messageType === ("happyhour" as any)) {
    return (
      <div id="notice-bar" role="status" className="flex w-full items-center justify-center gap-2 border-b border-[color-mix(in_srgb,var(--on-surface-variant)_25%,transparent)] bg-[color-mix(in_srgb,var(--on-surface-variant)_10%,transparent)] px-4 py-2 text-center text-sm font-medium text-[var(--on-surface-variant)]">
        🌙 ¡Buenas noches! Un gran día termina, prepara todo para mañana.
      </div>
    );
  }

  return null;
}
