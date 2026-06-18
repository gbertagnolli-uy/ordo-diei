"use client";

import { useEffect, useState } from 'react';

export function NoticeBar() {
  const [timeLeft, setTimeLeft] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [messageType, setMessageType] = useState<"morning" | "afternoon" | "evening" | "warning" | "happyhour" | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const limit = new Date();
      limit.setHours(22, 0, 0, 0);

      const hour = now.getHours();

      // Activar happyHour si son entre las 17:00 y las 19:00
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
      }
      // Activar warning solo si son entre las 20:00 y las 22:00
      else if (hour >= 20 && hour < 22) {
        setIsVisible(true);
        setMessageType("warning");
        const diff = limit.getTime() - now.getTime();
        
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else if (hour >= 17 && hour < 19) {
         setIsVisible(true);
         setMessageType("happyhour");
      } else if (hour >= 6 && hour < 10) {
         setIsVisible(true);
         setMessageType("morning");
      } else if (hour >= 13 && hour < 15) {
         setIsVisible(true);
         setMessageType("afternoon");
      } else if (hour >= 15 && hour < 18) {
         setIsVisible(true);
         setMessageType("evening");
      } else {
        setIsVisible(false);
        setMessageType(null);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  if (messageType === "happyhour") {
    return (
      <div className="fixed top-0 left-0 w-full z-[100] bg-[var(--secondary-container)] text-[var(--on-secondary-container)] p-2 font-headline font-bold text-center elevation-ambient animate-pulse tracking-wide shadow-md border-b border-[var(--secondary)]">
        🎉 ¡HAPPY HOUR ACTIVA! Termina tus tareas ahora y gana un 20% más de puntos. Termina en [{timeLeft}]
      </div>
    );
  }

  if (messageType === "warning") {
    return (
      <div className="fixed top-0 left-0 w-full z-[100] bg-[var(--error)] text-[var(--on-error)] p-2 font-headline font-bold text-center elevation-ambient animate-pulse tracking-wide">
        ⚠️ Te quedan [{timeLeft}] para terminar o corregir tus tareas de hoy y no perder tu racha diaria!
      </div>
    );
  }

  if (messageType === "morning") {
    return (
      <div className="fixed top-0 left-0 w-full z-[100] bg-[var(--success-container)] text-[var(--on-success-container)] p-2 font-headline font-bold text-center elevation-ambient shadow-md border-b border-[var(--success)]">
        🌅 ¡Buenos días! Un nuevo día para brillar y ganar puntos. ¡A por todas!
      </div>
    );
  }

  if (messageType === "afternoon") {
    return (
      <div className="fixed top-0 left-0 w-full z-[100] bg-[var(--secondary-container)] text-[var(--on-secondary-container)] p-2 font-headline font-bold text-center elevation-ambient shadow-md border-b border-[var(--secondary)]">
        ☀️ ¡Buenas tardes! ¿Cómo vas con tus tareas? Sigue así, ¡tú puedes!
      </div>
    );
  }



  return null;
}
