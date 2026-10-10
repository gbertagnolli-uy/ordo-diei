"use client";

import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { nivelDe, xpTotal } from "@/lib/niveles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  const level = nivelDe(xpTotal(user));

  return (
    <motion.button
      type="button"
      onClick={() => openModal("USER_STATS", user)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="group relative z-10 flex flex-col items-center rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative">
        <Avatar className={`size-20 ring-4 ring-background shadow-md sm:size-24 ${isParent ? "ring-offset-2 ring-offset-primary/30" : ""}`}>
          <AvatarImage src={user.fotoUrl ?? undefined} alt={user.nombre} className="object-cover" />
          <AvatarFallback className={`font-heading text-3xl font-bold ${isParent ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {user.nombre.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Estado de tareas */}
        <span className="absolute -top-1 -left-1 z-20 flex size-8 items-center justify-center rounded-full border bg-card shadow-sm [&_svg]:size-5">
          {getBadge(user.tareasAsignadas)}
        </span>

        {user.moodEmoji && (
          <span className="absolute -top-1 -right-1 z-20 flex size-8 items-center justify-center rounded-full border bg-card text-base shadow-sm">
            {user.moodEmoji}
          </span>
        )}
      </div>

      <Card className="-mt-3 min-w-44 items-center gap-2 px-4 pt-5 pb-3 transition-colors group-hover:border-primary/40">
        <span className="font-heading text-lg font-semibold leading-none">{user.nombre}</span>
        <Badge variant={isParent ? "default" : "secondary"} className="h-5 text-[10px] uppercase tracking-wide">
          {level.title} · Lvl {level.level}
        </Badge>
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground tabular-nums">
          {user.streakDays && user.streakDays > 0 ? <span title={`Racha: ${user.streakDays} días`}>🔥 {user.streakDays}</span> : null}
          <span title="Estrellas">⭐ {user.stars || 0}</span>
          <span title="Puntos Acumulados">🏆 {user.puntosAcumulados || 0}</span>
        </div>
        {user.completionPercentage !== undefined && (
          <Progress
            value={user.completionPercentage}
            title={`Nivel Completitud Tareas: ${user.completionPercentage}%`}
            className={`h-1.5 w-full ${user.completionPercentage >= 90 ? "[&>[data-slot=progress-indicator]]:bg-[var(--success)]" : ""}`}
          />
        )}
      </Card>
    </motion.button>
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
                <div className="absolute top-[45%] left-full w-12 sm:w-24 border-t-2 border-border -z-10" />
             )}
          </div>
        ))}

        {/* Tronco Central bajando a los Hijos */}
        {parents.length > 0 && children.length > 0 && (
          <div className="absolute top-[85%] left-1/2 -mt-2 w-[2px] h-16 sm:h-20 bg-border -translate-x-1/2 -z-10" />
        )}
      </div>

      {/* Nivel 2: Hijos */}
      {children.length > 0 && (
        <div className="flex flex-col items-center relative mt-12 sm:mt-16 gap-12 sm:gap-16 w-full">
          {/* Tronco principal bajando por todas las filas si hay múltiples */}
          {children.length > 3 && (
             <div className="absolute top-0 left-1/2 w-[2px] bg-border -translate-x-1/2 -z-20" style={{ height: 'calc(100% - 150px)' }} />
          )}

          {chunkArray(children, 3).map((group, rowIndex) => (
            <div key={rowIndex} className="flex justify-center relative w-full max-w-4xl mx-auto">
              
              {/* Rama Horizontal Superior para conectar a los hijos en su respectiva fila */}
              {group.length > 1 && (
                <div className="absolute top-[-24px] sm:top-[-32px] left-0 w-full flex justify-center -z-10">
                  <div 
                    className="h-[2px] bg-border" 
                    style={{ 
                      width: `${((group.length - 1) / group.length) * 100}%`
                    }}
                  />
                  {/* Pequeñas líneas verticales bajando a cada hijo */}
                  {group.map((_, idx) => (
                    <div 
                      key={idx} 
                      className="absolute top-0 w-[2px] h-6 sm:h-8 bg-border"
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
                   <div className="w-[2px] h-8 sm:h-12 bg-border -z-10 mb-[-1px]" />
                   <Node user={child} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {parents.length === 0 && children.length === 0 && (
        <div className="text-muted-foreground text-center italic mt-10">
          Aún no hay usuarios en la familia.
        </div>
      )}
    </div>
  );
}
