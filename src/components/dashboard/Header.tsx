"use client";
import { useEffect, useState, useRef } from "react";
import { Menu, FileText, Plus, UserPlus, Sunset, Calendar as CalendarIcon, Moon, Sun, History, Trophy, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useModalStore } from "@/store/modalStore";
import { getLevelInfo } from "@/lib/levelUtils";

export function Header({ currentUser, allUsers = [] }: { currentUser: any, allUsers?: any[] }) {
  const [time, setTime] = useState("");
  const router = useRouter();
  const logoutState = useAuthStore(s => s.logout);
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { openModal } = useModalStore();

  useEffect(() => {
    // Check for Level Up
    if (currentUser) {
      const currentLevel = getLevelInfo(currentUser.puntosAcumulados || 0).level;
      const lastSeenLevel = localStorage.getItem(`lastSeenLevel_${currentUser.id}`);

      if (lastSeenLevel) {
        if (currentLevel > parseInt(lastSeenLevel)) {
          openModal("LEVEL_UP", { level: currentLevel, title: getLevelInfo(currentUser.puntosAcumulados || 0).title });
          localStorage.setItem(`lastSeenLevel_${currentUser.id}`, currentLevel.toString());
        }
      } else {
        localStorage.setItem(`lastSeenLevel_${currentUser.id}`, currentLevel.toString());
      }
    }

    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const inv = setInterval(updateTime, 1000);
    return () => clearInterval(inv);
  }, []);

  const prevLevelRef = useRef(0);

  useEffect(() => {
    if (currentUser?.puntosAcumulados !== undefined) {
      const currentLevel = getLevelInfo(currentUser.puntosAcumulados).level;

      if (prevLevelRef.current !== 0 && currentLevel > prevLevelRef.current) {
        // Level up!
        const { title } = getLevelInfo(currentUser.puntosAcumulados);
        openModal("LEVEL_UP", { level: currentLevel, title });
      }

      prevLevelRef.current = currentLevel;
    }
  }, [currentUser?.puntosAcumulados, openModal]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logoutState();
    router.push("/");
  };

  const handleSimularDia = async () => {
    if (!confirm("¿Deseas simular que ha pasado 1 día completo? Esto vencerá tareas atrasadas y regenerará las recurrentes.")) return;
    const res = await fetch("/api/cron", { method: "POST" });
    if (res.ok) {
      alert("¡El Tiempo Avanzó! Se regeneraron las tareas recurrentes y se vencieron las viejas.");
      window.location.reload();
    }
  };

  const isAdmin = currentUser?.rolFamiliar === "Padre" || currentUser?.rolFamiliar === "Madre";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 vellum-glass border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-xl tracking-tight text-[var(--primary)]">
            Ordo Diei
          </span>
        </div>
        <div className="font-mono text-sm sm:text-base font-bold text-[var(--primary)] tracking-wider bg-[color-mix(in-srgb,var(--primary)_6%,transparent)] px-3 py-1 rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
          {time}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* DARK MODE TOGGLE */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-[color-mix(in-srgb,var(--primary)_8%,transparent)] transition-colors text-[var(--on-surface-variant)]"
          title={darkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
        </button>

        <button
          onClick={() => openModal("LEADERBOARD", { users: allUsers })}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--secondary-container)] text-[var(--on-secondary)] font-semibold text-xs rounded-md transition-colors shadow-[inset_0_0.5px_0_rgba(255,255,255,0.15)] active:scale-[0.97]"
          title="Ver Tabla de Líderes"
        >
          <Trophy className="w-4 h-4 fill-[var(--on-secondary)]" />
          <span>Ranking</span>
        </button>

        <div className="relative group flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95" title="Actualizar Estado">
          {currentUser && (
            <div className="hidden sm:flex flex-col items-end mr-2" onClick={handleLogout} title="Cerrar Sesión">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-[var(--primary)] hover:underline">Nivel {getLevelInfo(currentUser.puntosAcumulados || 0).level}</span>
                 {currentUser.streakDays > 0 && (
                   <span className="text-xs text-orange-500 font-bold flex items-center gap-1" title="Racha actual">
                     🔥 {currentUser.streakDays}
                   </span>
                 )}
                 {currentUser.stars > 0 && (
                   <span className="text-xs text-yellow-500 font-bold flex items-center gap-1" title="Estrellas">
                     ⭐ {currentUser.stars}
                   </span>
                 )}
                 {currentUser.surprises > 0 && (
                   <span className="text-xs text-purple-500 font-bold flex items-center gap-1" title="Sorpresas">
                     🎁 {currentUser.surprises}
                   </span>
                 )}
               </div>
               {/* Progress bar below level */}
               <div className="w-24 h-1.5 bg-[var(--surface-container-high)] rounded-full mt-1 overflow-hidden" title={`${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}% al siguiente nivel`}>
                 <div
                   className="h-full bg-[var(--primary)] transition-all duration-500"
                   style={{ width: `${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}%` }}
                 />
               </div>
            </div>
          )}

          <div className="hidden sm:flex flex-col items-end mr-1 cursor-pointer" onClick={handleLogout} title="Cerrar Sesión">
             <span className="text-xs font-bold text-[var(--primary)] hover:underline">Salir</span>
          </div>

          <div className="relative" onClick={() => openModal("MOOD_SELECTOR", { user: currentUser })}>
            <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] overflow-hidden elevation-ambient bg-[var(--surface-container)] hover:ring-2 hover:ring-[var(--primary)] transition-all">
               {currentUser?.fotoUrl ? (
                 <img src={currentUser.fotoUrl} alt="Yo" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-[var(--primary)] flex items-center justify-center text-[var(--on-primary)] font-bold">
                   {currentUser?.nombre?.charAt(0)}
                 </div>
               )}
            </div>

            {currentUser?.moodEmoji && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--surface-container-lowest)] rounded-full flex items-center justify-center text-xs shadow-sm border border-[var(--outline-variant)]">
                {currentUser.moodEmoji}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
