"use client";
import { useEffect, useState } from "react";
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
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const inv = setInterval(updateTime, 1000);
    return () => clearInterval(inv);
  }, []);

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
        <button className="p-2 hover:bg-[color-mix(in-srgb,var(--primary)_5%,transparent)] rounded-md transition-colors text-[var(--on-surface-variant)]">
          <Menu className="w-6 h-6" />
        </button>
        <div className="font-mono text-xl font-bold text-[var(--primary)] tracking-wider bg-[color-mix(in-srgb,var(--primary)_6%,transparent)] px-3 py-1 rounded-md">
          {time}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* DARK MODE TOGGLE */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-[color-mix(in-srgb,var(--primary)_5%,transparent)] transition-colors text-[var(--on-surface-variant)]"
          title={darkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-[var(--on-primary)] font-semibold rounded-md transition-colors shadow-[inset_0_0.5px_0_rgba(118,91,5,0.3)]"
              title="Panel Master / Agenda Automática"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleSimularDia}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--error)] hover:bg-[var(--error-container)] text-[var(--on-error)] font-semibold rounded-md transition-colors"
              title="Avanzar el Tiempo (Cron)"
            >
              <Sunset className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/dashboard/users/new')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--success)] hover:bg-[var(--success-container)] text-[var(--on-success)] font-semibold rounded-md transition-colors"
              title="Añadir Miembro"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/dashboard/premios')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[color-mix(in-srgb,var(--warning)_15%,transparent)] hover:bg-[color-mix(in-srgb,var(--warning)_20%,transparent)] text-[var(--warning)] font-semibold rounded-md transition-colors border border-[color-mix(in-srgb,var(--warning)_30%,transparent)]"
              title="Premios Sorpresa"
            >
              <Gift className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/dashboard/tasks/new')}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-container)] text-[var(--on-primary)] font-semibold rounded-md transition-colors shadow-[inset_0_0.5px_0_rgba(118,91,5,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Tarea</span>
            </button>
          </>
        )}

        <button
          onClick={() => router.push('/dashboard/rules')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[color-mix(in-srgb,var(--warning)_8%,transparent)] hover:bg-[color-mix(in-srgb,var(--warning)_12%,transparent)] text-[var(--warning)] font-semibold rounded-md transition-colors border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]"
        >
          <FileText className="w-5 h-5" />
          <span>Reglas</span>
        </button>

        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            if (params.get("view") === "history") {
              router.push("/dashboard");
            } else {
              router.push("/dashboard?view=history");
            }
          }}
          className={`hidden sm:flex items-center gap-2 px-4 py-2 font-semibold rounded-md transition-colors border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] ${
            typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view") === "history"
              ? "bg-[var(--primary)] text-[var(--on-primary)]"
              : "bg-[color-mix(in-srgb,var(--primary)_4%,transparent)] hover:bg-[color-mix(in-srgb,var(--primary)_8%,transparent)] text-[var(--primary)]"
          }`}
        >
          <History className="w-5 h-5" />
          <span>Historial</span>
        </button>

        <button
          onClick={() => openModal("LEADERBOARD", { users: allUsers })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)] hover:bg-[var(--secondary-container)] text-[var(--on-secondary)] font-semibold rounded-md transition-colors shadow-[inset_0_0.5px_0_rgba(255,255,255,0.15)] active:scale-[0.97]"
          title="Ver Tabla de Líderes"
        >
          <Trophy className="w-5 h-5 fill-[var(--on-secondary)]" />
          <span className="hidden md:inline">Ranking</span>
        </button>

        <div className="relative group flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95" title="Actualizar Estado">
          {currentUser && (
            <div className="hidden sm:flex flex-col items-end mr-2">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-[var(--primary)]">Nivel {getLevelInfo(currentUser.puntosAcumulados || 0).level}</span>
                 {currentUser.streakDays > 0 && (
                   <span className="text-xs text-orange-500 font-bold flex items-center gap-1" title="Racha actual">
                     🔥 {currentUser.streakDays}
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
            <div className="hidden sm:flex flex-col items-end mr-1" onClick={handleLogout} title="Cerrar Sesión">
               <span className="text-xs font-bold text-[var(--primary)] hover:underline">Nivel {getLevelInfo(currentUser.puntosAcumulados || 0).level}</span>
               {currentUser.streakDays > 0 && (
                 <span className="text-xs text-orange-500 font-bold flex items-center gap-1">
                   🔥 {currentUser.streakDays}
                 </span>
               )}
            </div>
          )}

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
