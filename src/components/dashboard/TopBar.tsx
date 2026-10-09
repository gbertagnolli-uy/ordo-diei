"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Flame, Star, Gift } from "lucide-react";
import { useModalStore } from "@/store/modalStore";
import { getLevelInfo } from "@/lib/levelUtils";

// Barra superior fija. La navegación y las acciones globales viven en el MainDock;
// aquí solo queda identidad, hora y el estado del usuario (nivel, racha, ánimo).
export function TopBar({ currentUser }: { currentUser: any }) {
  const [time, setTime] = useState("");
  const { openModal } = useModalStore();
  const prevLevelRef = useRef(0);

  useEffect(() => {
    // Subida de nivel ocurrida desde la última visita
    if (currentUser) {
      const currentLevel = getLevelInfo(currentUser.puntosAcumulados || 0).level;
      const lastSeenLevel = localStorage.getItem(`lastSeenLevel_${currentUser.id}`);

      if (lastSeenLevel && currentLevel > parseInt(lastSeenLevel)) {
        openModal("LEVEL_UP", { level: currentLevel, title: getLevelInfo(currentUser.puntosAcumulados || 0).title });
      }
      localStorage.setItem(`lastSeenLevel_${currentUser.id}`, currentLevel.toString());
    }

    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const inv = setInterval(updateTime, 1000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    if (currentUser?.puntosAcumulados !== undefined) {
      const currentLevel = getLevelInfo(currentUser.puntosAcumulados).level;
      if (prevLevelRef.current !== 0 && currentLevel > prevLevelRef.current) {
        openModal("LEVEL_UP", { level: currentLevel, title: getLevelInfo(currentUser.puntosAcumulados).title });
      }
      prevLevelRef.current = currentLevel;
    }
  }, [currentUser?.puntosAcumulados, openModal]);

  const level = getLevelInfo(currentUser?.puntosAcumulados || 0);

  return (
    <header className="fixed top-0 inset-x-0 h-14 z-50 vellum-glass border-b border-[color-mix(in-srgb,var(--outline-variant)_20%,transparent)] flex items-center justify-between px-4 sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center font-display text-sm">
          OD
        </span>
        <span className="font-display text-lg tracking-tight text-[var(--on-surface)] hidden sm:inline">Ordo Diei</span>
        <span className="font-mono text-xs text-[var(--on-surface-variant)] tabular-nums">{time}</span>
      </Link>

      {currentUser && (
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold text-[var(--on-surface-variant)]">
            {currentUser.streakDays > 0 && (
              <span className="flex items-center gap-1" title="Racha actual">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> {currentUser.streakDays}
              </span>
            )}
            {currentUser.stars > 0 && (
              <span className="flex items-center gap-1" title="Estrellas">
                <Star className="w-3.5 h-3.5 text-[var(--secondary)]" /> {currentUser.stars}
              </span>
            )}
            {currentUser.surprises > 0 && (
              <span className="flex items-center gap-1" title="Sorpresas">
                <Gift className="w-3.5 h-3.5 text-[var(--primary)]" /> {currentUser.surprises}
              </span>
            )}
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1" title={`${level.progressPercentage}% al siguiente nivel`}>
            <span className="text-xs font-bold text-[var(--primary)] leading-none">Nivel {level.level}</span>
            <div className="w-20 h-1 bg-[var(--surface-container-high)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${level.progressPercentage}%` }} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal("MOOD_SELECTOR", { user: currentUser })}
            className="relative"
            aria-label="Cambiar estado de ánimo"
          >
            <span className="block w-9 h-9 rounded-full overflow-hidden ring-2 ring-[color-mix(in-srgb,var(--primary)_40%,transparent)] hover:ring-[var(--primary)] transition-all bg-[var(--surface-container)]">
              {currentUser.fotoUrl ? (
                <img src={currentUser.fotoUrl} alt={currentUser.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full bg-[var(--primary)] flex items-center justify-center text-[var(--on-primary)] font-bold">
                  {currentUser.nombre?.charAt(0)}
                </span>
              )}
            </span>
            {currentUser.moodEmoji && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--surface-container-lowest)] rounded-full flex items-center justify-center text-xs shadow-sm border border-[var(--outline-variant)]">
                {currentUser.moodEmoji}
              </span>
            )}
          </button>
        </div>
      )}
    </header>
  );
}
