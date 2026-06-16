"use client";

import { useModalStore } from "@/store/modalStore";
import { Modal } from "@/components/ui/Modal";
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, Save, Info, Trophy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { getLevelInfo } from "@/lib/levelUtils";
import { HistoryModal } from "./HistoryModal";
import { LeaderboardModal } from "./LeaderboardModal";
import confetti from "canvas-confetti";

import { MoodSelector } from "./MoodSelector";


function LevelUpPopup({ data, onClose }: { data: any; onClose: () => void }) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF8C00']
    });
  }, []);

  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="text-6xl mb-4 animate-bounce">🌟</div>
      <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
        ¡Nivel {data?.level}!
      </h3>
      <p className="text-2xl font-display font-bold text-[var(--warning)] mb-4">
        {data?.title}
      </p>
      <p className="text-[var(--on-surface-variant)] text-lg mb-6 font-body">
        ¡Increíble trabajo! Has acumulado suficientes puntos para subir de nivel.
      </p>
      <button
        onClick={onClose}
        className="btn-primary w-full py-4 text-lg shadow-lg"
      >
        ¡Genial!
      </button>
    </div>
  );
}

export function ModalManager() {
  const { isOpen, type, data, closeModal, openModal } = useModalStore();

  useEffect(() => {
    // Check for level up notification from previous page load
    const levelUpInfo = sessionStorage.getItem("levelUpNotification");
    if (levelUpInfo) {
      sessionStorage.removeItem("levelUpNotification");
      const info = JSON.parse(levelUpInfo);
      setTimeout(() => {
        openModal("LEVEL_UP", info);
      }, 500); // Small delay to let the page load
    }
  }, [openModal]);

  useEffect(() => {
    if (isOpen && (type === "TASK_SUCCESS" || type === "LEVEL_UP")) {
      confetti({
        particleCount: type === "LEVEL_UP" ? 200 : 100,
        spread: type === "LEVEL_UP" ? 100 : 70,
        origin: { y: 0.6 }
      });
    }
    if (isOpen && type === "SURPRISE_AWARD") {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF8C00']
      });
    }
  }, [isOpen, type]);

  return (
    <>
      {type === "USER_STATS" && (
        <Modal isOpen={isOpen} onClose={closeModal} title={`Estatus de ${data?.nombre}`}>
          <UserStatsPopup user={data} />
        </Modal>
      )}

      {type === "RULES" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="Constitución Familiar" width="lg">
          <RulesPopup />
        </Modal>
      )}

      {type === "LEVEL_UP" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Subiste de Nivel!">
          <div className="flex flex-col items-center text-center py-6">
            <img
              src="/winners-animate.svg"
              alt="¡Subiste de Nivel!"
              className="w-48 h-48 mb-6 drop-shadow-xl animate-bounce"
            />
            <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
              ¡Nivel {data?.level}!
            </h3>
            <p className="text-[var(--on-surface-variant)] text-xl mb-4 font-body font-bold">
              Nuevo Rango: <span className="text-[var(--primary)]">{data?.title}</span>
            </p>
            <p className="text-[var(--on-surface-variant)] text-md mb-6 px-4">
              ¡Tu esfuerzo está dando frutos! Sigue completando tareas para alcanzar el siguiente rango.
            </p>
            <button
              onClick={closeModal}
              className="btn-primary w-full py-4 text-lg shadow-lg"
            >
              ¡A seguir subiendo!
            </button>
          </div>
        </Modal>
      )}

      {type === "TASK_SUCCESS" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Misión Cumplida!">
          <div className="flex flex-col items-center text-center py-6">
            <img 
              src="/done-animate.svg" 
              alt="¡Buen trabajo!" 
              className="w-48 h-48 mb-6 drop-shadow-xl"
            />
            <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
              ¡Buen trabajo!
            </h3>

            {data?.puntos > 0 && (
              <div className="text-4xl font-display font-bold text-[var(--warning)] mb-4 animate-bounce">
                +{data.puntos} Pts
              </div>
            )}

            <p className="text-[var(--on-surface-variant)] text-lg mb-2 font-body px-4">
              {data?.mensaje || "Has completado la tarea con éxito."}
            </p>

            {data?.isHappyHour && (
              <div className="bg-[color-mix(in-srgb,var(--primary)_15%,transparent)] border border-[color-mix(in-srgb,var(--primary)_30%,transparent)] rounded-md px-4 py-2 flex items-center gap-2 mb-4 animate-bounce">
                <span className="text-2xl">🍹</span>
                <span className="text-[var(--primary)] font-bold text-lg">
                  ¡Bonus Happy Hour! (+50%)
                </span>
              </div>
            )}

            {data?.isNewStreak && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-md px-4 py-2 flex items-center gap-2 mb-2 animate-pulse">
                <span className="text-2xl">🔥</span>
                <span className="text-orange-500 font-bold text-lg">
                  ¡Racha de {data?.streakDays} Días!
                </span>
              </div>
            )}

            {data?.bonuses && data.bonuses.length > 0 && (
              <div className="bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] border border-[color-mix(in-srgb,var(--primary)_20%,transparent)] rounded-md px-4 py-2 flex flex-col items-center gap-1 mb-2">
                <span className="text-[var(--primary)] font-bold text-sm uppercase tracking-wider">Bonos Aplicados</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {data.bonuses.map((bono: string, i: number) => (
                    <span key={i} className="bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold px-2 py-1 rounded-full">
                      {bono}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {data?.surpriseWon && (
              <div className="bg-[color-mix(in-srgb,var(--success)_10%,transparent)] border border-[color-mix(in-srgb,var(--success)_20%,transparent)] rounded-md px-4 py-2 flex items-center gap-2 mb-6 animate-bounce">
                <span className="text-2xl">🎁</span>
                <span className="text-[var(--success)] font-bold text-lg">
                  ¡Encontraste una Sorpresa Misteriosa!
                </span>
              </div>
            )}
            
            <div className="bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] border border-[color-mix(in-srgb,var(--warning)_20%,transparent)] rounded-md px-8 py-4 flex items-center gap-3 mt-4">
              <span className="text-4xl">⭐</span>
              <div className="text-left">
                <div className="text-[var(--warning)] font-headline font-bold text-2xl">
                  +{data?.puntos || 0} Puntos
                </div>
                <div className="text-[var(--warning)] opacity-80 text-sm font-title font-bold uppercase tracking-wider">
                  Saldo Bloqueado
                </div>
              </div>

              {/* Detailed Gamification Breakdown */}
              {(data?.basePoints > 0 || data?.streakBonus > 0 || data?.speedBonus > 0 || data?.checklistBonus > 0) && (
                <div className="flex flex-col gap-2 mt-1 text-sm">
                  {data?.basePoints > 0 && (
                    <div className="flex justify-between items-center text-[var(--warning)] font-medium">
                      <span>✓ Base por dificultad</span>
                      <span>+{data.basePoints}</span>
                    </div>
                  )}
                  {data?.streakBonus > 0 && (
                    <div className="flex justify-between items-center text-orange-500 font-bold">
                      <span>🔥 Bono de racha</span>
                      <span>+{data.streakBonus}</span>
                    </div>
                  )}
                  {data?.speedBonus > 0 && (
                    <div className="flex justify-between items-center text-blue-500 font-bold">
                      <span>⚡ Bono de velocidad</span>
                      <span>+{data.speedBonus}</span>
                    </div>
                  )}
                  {data?.checklistBonus > 0 && (
                    <div className="flex justify-between items-center text-[var(--success)] font-bold">
                      <span>📝 Bono checklist perfecto</span>
                      <span>+{data.checklistBonus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="btn-primary mt-2 w-full max-w-sm py-4 text-lg font-bold tracking-widest uppercase shadow-[0_4px_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_6px_20px_rgba(var(--primary-rgb),0.4)]"
            >
              ¡A seguir así!
            </button>
          </div>
        </Modal>
      )}

      {type === "LEVEL_UP" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🌟 ¡Subida de Nivel!">
          <div className="flex flex-col items-center text-center py-6">
            <img
              src="/winners-animate.svg"
              alt="¡Sube de Nivel!"
              className="w-48 h-48 mb-6 drop-shadow-xl animate-bounce"
            />
            <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
              ¡Felicidades!
            </h3>

            <p className="text-[var(--on-surface-variant)] text-lg mb-4 font-body px-4">
              ¡<span className="font-bold text-[var(--primary)]">{data?.userName}</span> acaba de alcanzar el nivel <span className="font-bold text-[var(--warning)]">{data?.newLevel}</span>!
            </p>

            <button onClick={closeModal} className="btn-primary mt-4 w-full py-4 text-lg shadow-lg">
              ¡Increíble!
            </button>
          </div>
        </Modal>
      )}

      {type === "HISTORY" && (
        <HistoryModal isOpen={isOpen} onClose={closeModal} />
      )}

      {type === "LEADERBOARD" && (
        <LeaderboardModal 
          isOpen={isOpen} 
          onClose={closeModal} 
          users={data?.users || []} 
        />
      )}

      {type === "SURPRISE_AWARD" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Felicidades!" width="md">
          <SurpriseAwardPopup data={data} onClose={closeModal} />
        </Modal>
      )}

      {type === "LEVEL_UP" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Subiste de Nivel!" width="md">
          <LevelUpPopup data={data} onClose={closeModal} />
        </Modal>
      )}

      {type === "MOOD_SELECTOR" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="¿Cómo te sientes hoy?">
          <div className="py-4">
             <MoodSelector
                currentMood={data?.user?.moodEmoji}
                isOwnProfile={true}
             />
             <div className="mt-6 flex justify-center">
               <button onClick={closeModal} className="btn-secondary px-8">
                 Cerrar
               </button>
             </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function UserStatsPopup({ user }: { user: any }) {
  if (!user) return null;

  const tareas = user.tareasAsignadas || [];
  
  if (tareas.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 font-medium">
        No tiene tareas asignadas en este momento.
      </div>
    );
  }

  const getIcon = (estado: string, fechaLímite: string) => {
    if (["Completada", "Aprobada", "Esperando_Aprobacion"].includes(estado)) return <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />;
    if ( estado === "Expirada") return <AlertCircle className="w-5 h-5 text-[var(--outline)] opacity-50" />;
    if (estado === "Vencida") return <AlertCircle className="w-5 h-5 text-[var(--error)]" />;
    if (estado === "En_progreso") return <Clock className="w-5 h-5 text-[var(--primary)]" />;
    
    // Pendiente, revisamos si vence hoy
    if (fechaLímite) {
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      const limit = new Date(fechaLímite);
      limit.setHours(0,0,0,0);
      if (limit.getTime() === hoy.getTime()) return <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />;
    }
    return <Clock className="w-5 h-5 text-[var(--outline)]" />;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Nivel y Progreso */}
      <div className="bg-[var(--surface-container)] p-4 rounded-md border border-[color-mix(in-srgb,var(--primary)_20%,transparent)] relative overflow-hidden">
         <div className="flex justify-between items-end mb-2 relative z-10">
           <div>
             <div className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">Nivel {getLevelInfo(user.puntosAcumulados || 0).level}</div>
             <div className="text-xl font-headline font-bold text-[var(--primary)]">{getLevelInfo(user.puntosAcumulados || 0).title}</div>
           </div>
           <div className="text-right">
             <div className="text-sm font-bold text-[var(--on-surface)]">{user.puntosAcumulados || 0} pts</div>
             <div className="text-xs text-[var(--on-surface-variant)]">Faltan {getLevelInfo(user.puntosAcumulados || 0).pointsToNextLevel} pts</div>
           </div>
         </div>
         <div className="w-full h-3 bg-[var(--surface-container-high)] rounded-full overflow-hidden relative z-10" title={`${getLevelInfo(user.puntosAcumulados || 0).progressPercentage}% al siguiente nivel`}>
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-1000 ease-out"
              style={{ width: `${getLevelInfo(user.puntosAcumulados || 0).progressPercentage}%` }}
            />
         </div>
         <div className="absolute -right-4 -bottom-4 opacity-10">
            <Trophy className="w-24 h-24" />
         </div>
      </div>

      {/* Puntos y Explicación */}
      <div className="flex justify-between items-center gap-4 bg-[var(--surface-container)] p-4 rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
        <div className="flex flex-col items-center flex-1" title="Puntos disponibles para gastar o que suman a tu ranking.">
          <span className="text-2xl font-display text-[var(--success)]">{user.availablePoints || 0}</span>
          <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase mt-1 flex items-center gap-1 text-center">
             Puntos Disponibles <Info className="w-3 h-3" />
          </span>
        </div>
        <div className="w-px h-10 bg-[var(--outline-variant)] opacity-50"></div>
        <div className="flex flex-col items-center flex-1" title="Puntos de tareas que están en revisión por un administrador. ¡Pronto serán tuyos!">
          <span className="text-2xl font-display text-[var(--warning)]">{user.lockedPoints || 0}</span>
          <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase mt-1 flex items-center gap-1 text-center">
             Puntos Bloqueados <Info className="w-3 h-3" />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
      {/* Sección de Logros Resumidos e Insignias */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--primary)_20%,transparent)] relative group">
          <div className="text-[var(--primary)] font-bold text-2xl">{user.totalTasksCompleted || 0}</div>
          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Tareas de por Vida</div>
          {user.totalTasksCompleted >= 50 ? (
            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-300 to-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">Veterano</div>
          ) : user.totalTasksCompleted >= 10 ? (
            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-blue-300 to-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">Aplicado</div>
          ) : user.totalTasksCompleted >= 1 ? (
             <div className="absolute -top-2 -right-2 bg-gradient-to-br from-green-300 to-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">Primeros Pasos</div>
          ) : null}
        </div>
        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--secondary)_20%,transparent)] relative group">
          <div className="text-orange-500 font-bold text-2xl flex items-center justify-center gap-1">
            🔥 {user.streakDays || 0}
          </div>
          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Racha Actual</div>
           {user.streakDays >= 7 ? (
            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-400 to-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">Imparable</div>
          ) : user.streakDays >= 3 ? (
            <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-300 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">En Racha</div>
          ) : null}
        </div>
        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-yellow-500/20">
          <div className="text-yellow-500 font-bold text-2xl flex items-center justify-center gap-1">
            ⭐ {user.stars || 0}
          </div>
          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Estrellas</div>
        </div>
        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-purple-500/20">
          <div className="text-purple-500 font-bold text-2xl flex items-center justify-center gap-1">
            🎁 {user.surprises || 0}
          </div>
          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Sorpresas</div>
        </div>
      </div>

      {/* Badges Dinámicos */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {(user.totalTasksCompleted || 0) >= 1 && (
          <span className="px-3 py-1 bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] text-[var(--primary)] text-xs font-bold rounded-full border border-[color-mix(in-srgb,var(--primary)_30%,transparent)] flex items-center gap-1">
             <span className="text-sm">🌱</span> Primer Paso
          </span>
        )}
        {(user.totalTasksCompleted || 0) >= 50 && (
          <span className="px-3 py-1 bg-[color-mix(in-srgb,var(--secondary)_10%,transparent)] text-[var(--secondary)] text-xs font-bold rounded-full border border-[color-mix(in-srgb,var(--secondary)_30%,transparent)] flex items-center gap-1">
             <span className="text-sm">🛠️</span> Trabajador
          </span>
        )}
        {(user.totalTasksCompleted || 0) >= 200 && (
          <span className="px-3 py-1 bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] text-[var(--warning)] text-xs font-bold rounded-full border border-[color-mix(in-srgb,var(--warning)_30%,transparent)] flex items-center gap-1">
             <span className="text-sm">⚙️</span> Máquina
          </span>
        )}
        {(user.streakDays || 0) >= 7 && (
          <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-full border border-orange-500/30 flex items-center gap-1">
             <span className="text-sm">🔥</span> En Llamas
          </span>
        )}
      </div>

      {/* Insignias Dinámicas */}
      <div className="bg-[var(--surface-container-low)] rounded-md p-3 border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] mb-2">
        <div className="text-xs font-bold text-[var(--on-surface)] uppercase tracking-wider mb-2">Insignias Destacadas</div>
        <div className="flex flex-wrap gap-2">
          {user.totalTasksCompleted > 0 ? (
            <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
              🌱 Novato ({user.totalTasksCompleted})
            </span>
          ) : null}
          {user.totalTasksCompleted >= 10 ? (
            <span className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
              🌟 10 Tareas
            </span>
          ) : null}
          {user.totalTasksCompleted >= 50 ? (
            <span className="bg-purple-500/10 text-purple-600 border border-purple-500/20 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
              🏆 Maestro (50+)
            </span>
          ) : null}
          {user.streakDays >= 3 ? (
            <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
              🔥 Imparable ({user.streakDays}d)
            </span>
          ) : null}
          {user.streakDays >= 7 ? (
            <span className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
              ⚡ Súper Racha
            </span>
          ) : null}
          {user.totalTasksCompleted === 0 && user.streakDays === 0 ? (
            <span className="text-xs text-[var(--on-surface-variant)] italic">Aún no hay insignias. ¡Empieza hoy!</span>
          ) : null}
        </div>
      </div>

      {/* Logros Desbloqueados (Badges) */}
      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mb-1 mt-2">Logros Desbloqueados</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(user.totalTasksCompleted >= 1) && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] border border-[color-mix(in-srgb,var(--primary)_30%,transparent)] px-2 py-1 rounded-full text-xs font-bold text-[var(--primary)]" title="Completaste tu primera tarea">
            🌱 Primer Paso
          </div>
        )}
        {(user.totalTasksCompleted >= 10) && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--secondary)_10%,transparent)] border border-[color-mix(in-srgb,var(--secondary)_30%,transparent)] px-2 py-1 rounded-full text-xs font-bold text-[var(--secondary)]" title="Completaste 10 tareas">
            🚀 En Ascenso
          </div>
        )}
        {(user.totalTasksCompleted >= 100) && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] border border-[color-mix(in-srgb,var(--warning)_30%,transparent)] px-2 py-1 rounded-full text-xs font-bold text-[var(--warning)]" title="Completaste 100 tareas">
            💯 Centurión
          </div>
        )}
        {(user.streakDays >= 7) && (
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded-full text-xs font-bold text-orange-500" title="Mantuvo racha por 7 días seguidos">
            🔥 Imparable
          </div>
        )}
        {(user.surprises && user.surprises > 0) && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--success)_10%,transparent)] border border-[color-mix(in-srgb,var(--success)_30%,transparent)] px-2 py-1 rounded-full text-xs font-bold text-[var(--success)]" title={`Encontró ${user.surprises} sorpresas`}>
            🎁 Afortunado ({user.surprises})
          </div>
        )}
      </div>

      <div className="bg-[var(--surface-container-low)] rounded-md p-3 mb-2 border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
        <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider mb-2 text-center">Insignias</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {user.totalTasksCompleted >= 10 && (
            <span className="px-2 py-1 bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] text-[var(--primary)] text-xs font-bold rounded-full border border-[color-mix(in-srgb,var(--primary)_20%,transparent)]" title="Completaste tus primeras 10 tareas">🥉 Misión 10</span>
          )}
          {user.totalTasksCompleted >= 50 && (
            <span className="px-2 py-1 bg-[color-mix(in-srgb,var(--secondary)_10%,transparent)] text-[var(--secondary)] text-xs font-bold rounded-full border border-[color-mix(in-srgb,var(--secondary)_20%,transparent)]" title="Completaste 50 tareas">🥈 Misión 50</span>
          )}
          {user.totalTasksCompleted >= 100 && (
            <span className="px-2 py-1 bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] text-[var(--warning)] text-xs font-bold rounded-full border border-[color-mix(in-srgb,var(--warning)_20%,transparent)]" title="¡Increíble! 100 tareas completadas">🥇 Misión 100</span>
          )}
          {user.streakDays >= 3 && (
            <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-full border border-orange-500/20" title="Racha de 3 días">🔥 Fuego x3</span>
          )}
          {user.streakDays >= 7 && (
            <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20" title="¡Una semana sin fallar!">🚀 Imparable x7</span>
          )}
          {user.totalTasksCompleted < 10 && user.streakDays < 3 && (
            <span className="text-xs text-slate-400 italic">Sigue completando tareas para ganar insignias...</span>
          )}
        </div>
      </div>

      {/* Insignias Dinámicas */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {(user.totalTasksCompleted || 0) >= 10 && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] border border-[color-mix(in-srgb,var(--primary)_20%,transparent)] rounded-full px-3 py-1 text-xs font-bold text-[var(--primary)]" title="Francotirador: Completaste 10+ tareas">
            🎯 Francotirador
          </div>
        )}
        {(user.streakDays || 0) >= 3 && (
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-xs font-bold text-orange-600" title="Imparable: Racha de 3+ días">
            🔥 Imparable
          </div>
        )}
        {getLevelInfo(user.puntosAcumulados || 0).level >= 5 && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] border border-[color-mix(in-srgb,var(--warning)_20%,transparent)] rounded-full px-3 py-1 text-xs font-bold text-[var(--warning)]" title="Estrella Naciente: Alcanzaste el Nivel 5+">
            🌟 Estrella Naciente
          </div>
        )}
      </div>

      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mb-[-8px]">Tareas Asignadas</div>

      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
      {tareas.map((t: any) => (
        <div key={t.id} className="flex items-center gap-3 p-3 bg-[var(--surface-container-low)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] rounded-md hover:bg-[var(--surface-container-lowest)] ghost-border transition-colors">
          {getIcon(t.estado, t.horaEjecucion || t.fechaVencimiento)}
          <div className="flex-1 min-w-0">
            <span className={`font-headline font-bold block ${["Completada", "Aprobada", "Esperando_Aprobacion", "Expirada"].includes(t.estado) ? "text-[var(--on-surface-variant)] line-through" : "text-[var(--on-surface)]"}`}>
              {t.titulo}
            </span>
            <div className="flex items-center gap-2 text-xs font-body text-[var(--on-surface-variant)] mt-0.5">
              {t.fechaVencimiento && (
                <span>{new Date(t.fechaVencimiento).toLocaleDateString()}</span>
              )}
              {t.horaEjecucion && (
                <span className="font-title font-bold text-[var(--error)]">
                  {new Date(t.horaEjecucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      </div>
      </div>
    </div>
  );
}

function RulesPopup() {
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.rolFamiliar === "Padre" || currentUser?.rolFamiliar === "Madre";
  
  const [rules, setRules] = useState("Cargando...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/rules/get").then(res => res.json()).then(data => {
       if(data.reglas) setRules(data.reglas);
       else setRules("1. Sé respetuoso.\n2. Cumple tus deberes a tiempo.");
    });
  }, []);

  const handleSave = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textoEstricto: rules }),
      });
      if (res.ok) alert("Reglas guardadas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isAdmin ? (
         <textarea 
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            className="w-full h-80 bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-4 outline-none text-[var(--on-surface)] font-body text-lg leading-loose resize-none inkpot"
         />
      ) : (
         <div className="w-full h-80 bg-[var(--surface-container-low)] rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] p-4 overflow-y-auto text-[var(--on-surface)] font-body text-lg leading-loose whitespace-pre-wrap input-glass">
            {rules}
         </div>
      )}
      {isAdmin && (
         <button onClick={handleSave} disabled={loading} className="btn-primary ml-auto flex items-center gap-2">
            <Save className="w-5 h-5"/> {loading ? "Guardando..." : "Guardar Reglas"}
         </button>
      )}
   </div>
  );
}

function SurpriseAwardPopup({ data, onClose }: { data: any; onClose: () => void }) {
  const [showReward, setShowReward] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDiscover = useCallback(async () => {
    if (!data?.entregaId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/premios/entregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entregaId: data.entregaId }),
      });
      if (res.ok) {
        setShowReward(true);
      }
    } finally {
      setLoading(false);
    }
  }, [data?.entregaId]);

  useEffect(() => {
    if (showReward) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF8C00']
      });
    }
  }, [showReward]);

  if (showReward) {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <img 
          src="/pot-of-gold-animate.svg" 
          alt="¡Premio!" 
          className="w-40 h-40 mb-6 drop-shadow-xl animate-bounce"
        />
        <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
          ¡Ganaste!
        </h3>
        <p className="text-4xl font-display font-bold text-[var(--warning)] mb-4">
          {data.cantidad} {data.titulo}
        </p>
        <div className="bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] border border-[color-mix(in-srgb,var(--warning)_20%,transparent)] rounded-md px-8 py-4 flex items-center gap-3 mb-6">
          <span className="text-4xl">⭐</span>
          <div className="text-left">
            <div className="text-[var(--warning)] font-headline font-bold text-2xl">
              +10 Estrellas
            </div>
            <div className="text-[var(--warning)] opacity-80 text-sm font-title font-bold uppercase tracking-wider">
              Recompensa surpresa
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="btn-primary mt-4 w-full py-4 text-lg shadow-lg"
        >
          ¡Genial!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-6">
      <img 
        src="/winners-animate.svg" 
        alt="¡Felicidades!" 
        className="w-48 h-48 mb-6 drop-shadow-xl"
      />
      <h3 className="text-2xl font-headline font-bold text-[var(--on-surface)] mb-6">
        ¡Ganaste un premio sorpresa!
      </h3>
      <button 
        onClick={handleDiscover}
        disabled={loading}
        className="btn-primary w-full py-4 text-lg shadow-lg"
      >
        {loading ? "Cargando..." : "Descubrir premio"}
      </button>
    </div>
  );
}
