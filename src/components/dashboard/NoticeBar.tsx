"use client";

import { useEffect, useState } from 'react';

export function NoticeBar() {
  const [timeLeft, setTimeLeft] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const limit = new Date();
      limit.setHours(22, 0, 0, 0);

      // Activar solo si son entre las 20:00 y las 22:00
      if (now.getHours() >= 20 && now.getHours() < 22) {
        setIsVisible(true);
        const diff = limit.getTime() - now.getTime();
        
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        
        // Formato 00:00:00
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setIsVisible(false);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] bg-[var(--error)] text-[var(--on-error)] p-2 font-headline font-bold text-center elevation-ambient animate-pulse tracking-wide">
      ⚠️ Te quedan [{timeLeft}] para terminar o corregir tus tareas de hoy
    </div>
  );
}
