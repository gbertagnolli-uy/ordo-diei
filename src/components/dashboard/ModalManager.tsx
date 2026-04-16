"use client";

import { useModalStore } from "@/store/modalStore";
import { Modal } from "@/components/ui/Modal";
import { Clock, CheckCircle2, AlertTriangle, AlertCircle, Save } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { HistoryModal } from "./HistoryModal";
import { LeaderboardModal } from "./LeaderboardModal";

export function ModalManager() {
  const { isOpen, type, data, closeModal } = useModalStore();

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
            <p className="text-[var(--on-surface-variant)] text-lg mb-6 font-body">
              {data?.mensaje || "Has completado la tarea con éxito."}
            </p>
            
            <div className="bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] border border-[color-mix(in-srgb,var(--warning)_20%,transparent)] rounded-md px-8 py-4 flex items-center gap-3">
              <span className="text-4xl">⭐</span>
              <div className="text-left">
                <div className="text-[var(--warning)] font-headline font-bold text-2xl">
                  +{data?.puntos || 0} Puntos
                </div>
                <div className="text-[var(--warning)] opacity-80 text-sm font-title font-bold uppercase tracking-wider">
                  Saldo Bloqueado
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="btn-primary mt-8 w-full py-4 text-lg shadow-lg"
            >
              ¡Genial!
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
    <div className="flex flex-col gap-2">
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
