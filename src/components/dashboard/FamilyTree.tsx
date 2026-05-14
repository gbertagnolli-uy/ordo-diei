"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getLevelInfo } from "@/lib/levelUtils";

interface Tarea {
  estado: string;
  fechaVencimiento: string | null;
  horaEjecucion: string | null;
}

interface Usuario {
  id: number;
  nombre: string;
  rolFamiliar: string;
  puntosAcumulados: number;
  fotoUrl: string | null;
  tareasAsignadas?: Tarea[];
  stars?: number;
  completionPercentage?: number;
  moodEmoji?: string | null;
  streakDays?: number;
}

interface Props {
  parents: Usuario[];
  children: Usuario[];
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function getBadge(tareas: Tarea[] = []) {
  if (tareas.length === 0) {
    return <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-white" />;
  }

  const isVencida = (t: Tarea) => t.estado === "Vencida";
  if (tareas.some(isVencida)) {
    return <AlertCircle className="w-7 h-7 text-rose-500 fill-white drop-shadow-md animate-pulse" />;
  }

  // Si tiene tareas próximas a vencer HOY (y ninguna vencida)
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const venceHoy = (t: Tarea) => {
    if (["Completada", "Aprobada", "Esperando_Aprobacion", "Expirada"].includes(t.estado)) return false;
    let limit;
    if (t.horaEjecucion) limit = new Date(t.horaEjecucion);
    else if (t.fechaVencimiento) limit = new Date(t.fechaVencimiento);
    
    if (!limit) return false;
    const limitDate = new Date(limit);
    limitDate.setHours(0, 0, 0, 0);
    return limitDate.getTime() === hoy.getTime();
  };

  if (tareas.some(venceHoy)) {
    return <AlertTriangle className="w-6 h-6 text-amber-500 fill-white" />;
  }

  return <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-white" />;
}

import { useModalStore } from "@/store/modalStore";

function Node({ user, isParent = false }: { user: Usuario, isParent?: boolean }) {
  const { openModal } = useModalStore();

  return (
    <motion.div 
      onClick={() => openModal("USER_STATS", user)}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center group cursor-pointer relative z-10"
    >
      <div className={`relative rounded-md p-1 bg-[var(--surface-container)] border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] elevation-ambient transition-all group-hover:scale-105 group-hover:bg-[var(--surface-container-high)]`}>
        <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden ${isParent ? 'bg-[var(--primary)] text-[var(--on-primary)]' : 'bg-[var(--secondary)] text-[var(--on-secondary)]'} flex items-center justify-center elevation-ambient shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]`}>
          {user.fotoUrl ? (
             <img src={user.fotoUrl} alt={user.nombre} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-display font-bold">{user.nombre.charAt(0).toUpperCase()}</span>
          )}
        </div>
        
        {/* Mood Emoji */}
        {user.moodEmoji && (
          <div className="absolute -top-2 -right-2 z-30 bg-[var(--surface-container-lowest)] rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-[var(--outline-variant)] text-lg elevation-ambient transition-transform group-hover:scale-110">
            {user.moodEmoji}
          </div>
        )}
        
        {/* Badge Notification */}
        <div className="absolute -top-2 -left-2 z-20 bg-[var(--surface-container-low)] rounded-full p-1 shadow-md border border-[var(--outline-variant)] elevation-ambient">
           {getBadge(user.tareasAsignadas)}
        </div>
      </div>
      
      <div className="mt-4 flex flex-col items-center bg-[var(--surface-container-lowest)] px-4 py-3 rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_20%,transparent)] elevation-ambient transition-colors group-hover:bg-[var(--surface-container-low)] min-w-[140px]">
        <span className="font-display font-bold text-[var(--on-surface)] text-lg">{user.nombre}</span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest font-title border ${isParent ? 'bg-[color-mix(in-srgb,var(--primary)_8%,transparent)] text-[var(--primary)] border-[var(--primary)]' : 'bg-[color-mix(in-srgb,var(--secondary)_8%,transparent)] text-[var(--secondary)] border-[var(--secondary)]'}`}>
            {getLevelInfo(user.puntosAcumulados || 0).title} (Lvl {getLevelInfo(user.puntosAcumulados || 0).level})
          </span>
          {user.streakDays && user.streakDays > 0 ? (
             <span className="text-xs text-orange-500 font-bold ml-1 drop-shadow-sm flex items-center gap-1" title={`Racha: ${user.streakDays} días`}>
               🔥 {user.streakDays}
             </span>
          ) : null}
          <span className="text-sm font-bold text-[var(--secondary)] ml-1 drop-shadow-sm" title="Estrellas">
             ⭐ {user.stars || 0}
          </span>
          <span className="text-xs font-bold text-[var(--primary)] ml-1" title="Puntos Acumulados">
             🏆 {user.puntosAcumulados || 0}
          </span>
        </div>
        {user.completionPercentage !== undefined && (
          <div className="w-full mt-3 bg-[var(--surface-container-high)] h-1.5 rounded-sm overflow-hidden ghost-border" title={`Nivel Completitud Tareas: ${user.completionPercentage}%`}>
            <div 
              className={`h-full transition-all duration-1000 ${user.completionPercentage >= 90 ? 'bg-[var(--success)] shadow-[0_0_8px_rgba(var(--success-rgb),0.3)]' : 'bg-[var(--primary)] shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]'}`} 
              style={{ width: `${user.completionPercentage}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function FamilyTree({ parents, children }: Props) {
  return (
    <div className="flex flex-col items-center w-full overflow-x-auto pb-12 pt-4">
      
      {/* Nivel 1: Padres */}
      <div className="flex justify-center gap-12 sm:gap-24 relative">
        {parents.map((parent, index) => (
          <div key={parent.id} className="relative flex flex-col items-center">
             <Node user={parent} isParent={true} />
             {/* Línea horizontal si hay más de 1 padre */}
             {parents.length > 1 && index === 0 && (
                <div className="absolute top-[45%] left-full w-12 sm:w-24 border-t-2 border-[var(--outline)] -z-10 opacity-30" />
             )}
          </div>
        ))}

        {/* Tronco Central bajando a los Hijos */}
        {parents.length > 0 && children.length > 0 && (
          <div className="absolute top-[85%] left-1/2 -mt-2 w-[2px] h-16 sm:h-20 bg-[var(--outline)] -translate-x-1/2 -z-10 opacity-30" />
        )}
      </div>

      {/* Nivel 2: Hijos */}
      {children.length > 0 && (
        <div className="flex flex-col items-center relative mt-12 sm:mt-16 gap-12 sm:gap-16 w-full">
          {/* Tronco principal bajando por todas las filas si hay múltiples */}
          {children.length > 3 && (
             <div className="absolute top-0 left-1/2 w-[2px] bg-[var(--outline)] -translate-x-1/2 -z-20 opacity-30" style={{ height: 'calc(100% - 150px)' }} />
          )}

          {chunkArray(children, 3).map((group, rowIndex) => (
            <div key={rowIndex} className="flex justify-center relative w-full max-w-4xl mx-auto">
              
              {/* Rama Horizontal Superior para conectar a los hijos en su respectiva fila */}
              {group.length > 1 && (
                <div className="absolute top-[-24px] sm:top-[-32px] left-0 w-full flex justify-center -z-10">
                  <div 
                    className="h-[2px] bg-[var(--outline)] opacity-30" 
                    style={{ 
                      width: `${((group.length - 1) / group.length) * 100}%`
                    }}
                  />
                  {/* Pequeñas líneas verticales bajando a cada hijo */}
                  {group.map((_, idx) => (
                    <div 
                      key={idx} 
                      className="absolute top-0 w-[2px] h-6 sm:h-8 bg-[var(--outline)] opacity-30"
                      style={{
                        left: `${(100 / (group.length * 2)) * (2 * idx + 1)}%`
                      }}
                    />
                  ))}
                </div>
              )}

              {group.map(child => (
                <div key={child.id} className="flex flex-col items-center relative flex-1 px-2 sm:px-6">
                   {/* Tallo Vertical hacia el hijo */}
                   <div className="w-[2px] h-8 sm:h-12 bg-[var(--outline)] -z-10 mb-[-1px] opacity-30" />
                   <Node user={child} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {parents.length === 0 && children.length === 0 && (
        <div className="text-[var(--on-surface-variant)] text-center italic mt-10 font-body">
          Aún no hay usuarios en la familia.
        </div>
      )}
    </div>
  );
}
