"use client";
import { Trophy, Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function LeaderboardModal({ users, isOpen, onClose }: { users: any[], isOpen: boolean, onClose: () => void }) {
  // Sort users by: 1. completionPercentage, 2. stars, 3. puntosAcumulados
  const sortedUsers = [...users].sort((a, b) => {
    // Principal: completionPercentage
    const diff1 = (b.completionPercentage || 0) - (a.completionPercentage || 0);
    if (diff1 !== 0) return diff1;
    // Secundario: stars
    const diff2 = (b.stars || 0) - (a.stars || 0);
    if (diff2 !== 0) return diff2;
    // Terciario: puntos
    return (b.puntosAcumulados || 0) - (a.puntosAcumulados || 0);
  });

  const getTrophy = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏆 Tabla de Líderes" width="lg">
      <div className="flex flex-col gap-6 py-2">
        <p className="text-[var(--on-surface-variant)] text-center font-body px-4">
          ¡Esfuérzate para ser el mejor! El ranking se basa principalmente en el porcentaje de tareas completadas con éxito.
        </p>

        {/* Visual Podium */}
        <div className="flex justify-center items-end gap-2 sm:gap-4 px-4 pt-12 pb-6">
          {/* 2nd Place */}
          {sortedUsers[1] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#C0C0C0] overflow-hidden elevation-ambient bg-[var(--surface-container)]">
                  {sortedUsers[1].fotoUrl ? (
                    <img src={sortedUsers[1].fotoUrl} alt={sortedUsers[1].nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#C0C0C0]/20 flex items-center justify-center text-[#C0C0C0] font-bold text-2xl">
                      {sortedUsers[1].nombre.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  2DO
                </div>
              </div>
              <span className="font-title font-bold text-[var(--on-surface)] text-sm truncate w-full text-center">{sortedUsers[1].nombre}</span>
              <div className="w-full bg-[color-mix(in-srgb,var(--secondary)_15%,transparent)] h-20 sm:h-24 rounded-t-md border-x border-t border-[var(--outline-variant)] flex flex-col items-center justify-center">
                 <span className="text-xl font-display text-[var(--secondary)]">{sortedUsers[1].completionPercentage}%</span>
                 <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase mt-0.5">{sortedUsers[1].puntosAcumulados} pts</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {sortedUsers[0] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[140px] -translate-y-4">
               <Trophy className="w-8 h-8 text-[#FFD700] mb-1 animate-bounce" fill="#FFD700" />
               <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#FFD700] overflow-hidden shadow-[0_0_25px_rgba(255,215,0,0.3)] bg-[var(--surface-container)]">
                  {sortedUsers[0].fotoUrl ? (
                    <img src={sortedUsers[0].fotoUrl} alt={sortedUsers[0].nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold text-3xl">
                      {sortedUsers[0].nombre.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  1RO
                </div>
              </div>
              <span className="font-title font-bold text-[var(--on-surface)] text-base truncate w-full text-center">{sortedUsers[0].nombre}</span>
              <div className="w-full bg-[color-mix(in-srgb,var(--primary)_20%,transparent)] h-28 sm:h-36 rounded-t-md border-x border-t border-[var(--primary)] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                 <span className="text-2xl font-display text-[var(--primary)]">{sortedUsers[0].completionPercentage}%</span>
                 <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase mt-0.5">{sortedUsers[0].puntosAcumulados} pts</span>
                 <div className="flex gap-1 mt-1">
                   <Star className="w-3 h-3 fill-[var(--secondary)] text-[var(--secondary)]" />
                   <Star className="w-3 h-3 fill-[var(--secondary)] text-[var(--secondary)]" />
                   <Star className="w-3 h-3 fill-[var(--secondary)] text-[var(--secondary)]" />
                 </div>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {sortedUsers[2] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#CD7F32] overflow-hidden elevation-ambient bg-[var(--surface-container)]">
                  {sortedUsers[2].fotoUrl ? (
                    <img src={sortedUsers[2].fotoUrl} alt={sortedUsers[2].nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#CD7F32]/20 flex items-center justify-center text-[#CD7F32] font-bold text-2xl">
                      {sortedUsers[2].nombre.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  3RO
                </div>
              </div>
              <span className="font-title font-bold text-[var(--on-surface)] text-sm truncate w-full text-center">{sortedUsers[2].nombre}</span>
              <div className="w-full bg-[color-mix(in-srgb,var(--warning)_15%,transparent)] h-16 sm:h-20 rounded-t-md border-x border-t border-[var(--outline-variant)] flex flex-col items-center justify-center">
                 <span className="text-lg font-display text-[var(--warning)]">{sortedUsers[2].completionPercentage}%</span>
                 <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase mt-0.5">{sortedUsers[2].puntosAcumulados} pts</span>
              </div>
            </div>
          )}

        </div>

        <div className="overflow-x-auto rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] elevation-ambient transition-colors w-full">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-[var(--surface-container-low)]">
              <tr>
                <th className="px-3 py-4 text-[10px] font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest text-center">Pos</th>
                <th className="px-3 py-4 text-[10px] font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">Usuario</th>
                <th className="px-3 py-4 text-[10px] font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest text-center">🔥</th>
                <th className="px-3 py-4 text-[10px] font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest text-center">⭐</th>
                <th className="px-3 py-4 text-[10px] font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest text-center">🏆 Pts</th>
                <th className="px-3 py-4 text-[10px] font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest text-center">🎁</th>
                <th className="px-3 py-4 text-[10px] font-title font-bold text-[var(--on-surface-variant)] uppercase tracking-widest text-right whitespace-nowrap">% Éxito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-lowest)]">
              {sortedUsers.map((user, index) => {
                const trophy = getTrophy(index);
                return (
                  <tr key={user.id} className={`${index === 0 ? 'bg-[color-mix(in-srgb,var(--secondary)_10%,transparent)]' : ''} hover:bg-[var(--surface-container-low)] transition-colors`}>
                    <td className="px-3 py-4 text-center">
                      <div className="flex justify-center items-center">
                        {trophy ? (
                          <span className="text-2xl drop-shadow-sm">{trophy}</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md font-bold font-title text-sm bg-[var(--surface-container)] text-[var(--on-surface-variant)]">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md ghost-border overflow-hidden elevation-ambient flex-shrink-0">
                          {user.fotoUrl ? (
                            <img src={user.fotoUrl} alt={user.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[var(--primary)] flex items-center justify-center text-[var(--on-primary)] font-headline font-bold">
                              {user.nombre.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                           <span className="font-title font-bold text-[var(--on-surface)] truncate max-w-[120px]">{user.nombre}</span>
                           <span className="text-[10px] text-[var(--primary)] uppercase tracking-wider font-bold">Lvl {Math.floor(Math.sqrt((user.puntosAcumulados || 0)/100))+1}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center font-bold text-orange-500">{user.streakDays || 0}</td>
                    <td className="px-3 py-4 text-center font-bold text-[var(--secondary)]">{user.stars}</td>
                    <td className="px-3 py-4 text-center font-bold text-[var(--primary)]">{user.puntosAcumulados}</td>
                    <td className="px-3 py-4 text-center font-bold text-[var(--error)]">{user.surprises}</td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold font-title ${
                          user.completionPercentage >= 90 ? 'text-[var(--success)]' :
                          user.completionPercentage >= 70 ? 'text-[var(--secondary)]' : 'text-[var(--error)]'
                        }`}>
                          {user.completionPercentage}%
                        </span>
                        <div className="w-16 bg-[var(--surface-container-high)] h-1.5 rounded-sm overflow-hidden ghost-border">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              user.completionPercentage >= 90 ? 'bg-[var(--success)]' :
                              user.completionPercentage >= 70 ? 'bg-[var(--secondary)]' : 'bg-[var(--error)]'
                            }`}
                            style={{ width: `${user.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button 
          onClick={onClose}
          className="btn-primary mt-2 w-full justify-center py-4 text-sm tracking-widest uppercase"
        >
          ¡Cerrar con Orgullo!
        </button>
      </div>
    </Modal>
  );
}
