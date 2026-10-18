"use client";

import { useModalStore } from "@/store/modalStore";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2, Flame, Gift, Save, Sparkles, Star } from "lucide-react";
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { useAuthStore } from "@/store/authStore";
import { PerfilResumen } from "@/components/perfil/PerfilResumen";
import { HistoryModal } from "./HistoryModal";
import { LeaderboardModal } from "./LeaderboardModal";
import { Confetti, type ConfettiRef } from "@/registry/magicui/confetti";
import { MoodSelector } from "./MoodSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EscenaCompanero } from "@/components/engagement/EscenaCompanero";
import type { BienvenidaDiariaDatos } from "@/lib/engagement/companeroServidor";
import { toast } from "@/lib/toast";
import { badgeDeNivel, PUNTOS_SUBIR_NIVEL, tituloDeNivel } from "@/lib/niveles";


// Único confeti de la app (MagicUI). Los popups lo disparan vía contexto.
const GOLD = ['#FFD700', '#FFA500', '#FF8C00'];
const HABITO_POPUP = (nombre = "este hábito") => ({
  ascenso: { titulo: "¡Un paso más!", texto: `Tu constancia con ${nombre} dio fruto. Desde mañana, este es tu nuevo paso.` },
  completo: { titulo: `¡${nombre} completado!`, texto: `Completaste la escalera de ${nombre}. El hábito está formado: ahora a sostenerlo.` },
  regreso: { titulo: "¡Qué bueno que volviste!", texto: "Volver es lo más importante. Retomamos desde aquí, sin culpa." },
  libro: { titulo: "¡Terminaste el libro!", texto: "Ganaste un premio: pedir un libro nuevo. Reclamalo en Mis premios y contale a tus papás cuál querés." },
});
const CelebrateContext = createContext<(opts?: Parameters<ConfettiRef["fire"]>[0]) => void>(() => {});

export function ModalManager({ bienvenidaHoy }: { bienvenidaHoy?: BienvenidaDiariaDatos | null }) {
  const { isOpen, type, data, closeModal, openModal } = useModalStore();
  const confettiRef = useRef<ConfettiRef>(null);
  const celebrate = useCallback((opts?: Parameters<ConfettiRef["fire"]>[0]) => {
    // Modo relajado (Homeschooling H6): sin confeti en ninguna celebración
    if (document.documentElement.dataset.relajado) return;
    confettiRef.current?.fire(opts);
  }, []);

  useEffect(() => {
    if (!bienvenidaHoy) return;
    const storageKey = `bienvenida_vista_${bienvenidaHoy.usuarioId}_${bienvenidaHoy.fecha}`;
    try {
      if (localStorage.getItem(storageKey) === "1") return;
      localStorage.setItem(storageKey, "1");
    } catch {
      // Si localStorage no está disponible, se muestra igual y el servidor lo persiste
    }
    fetch("/api/companero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "bienvenida" }),
    }).catch(() => {});
    openModal("DAILY_WELCOME", bienvenidaHoy);
  }, [bienvenidaHoy, openModal]);

  useEffect(() => {
    // Check for level up notification from previous page load
    const levelUpInfo = sessionStorage.getItem("levelUpNotification");
    if (levelUpInfo) {
      sessionStorage.removeItem("levelUpNotification");
      const info = JSON.parse(levelUpInfo);
      setTimeout(() => {
        if (useModalStore.getState().type === "DAILY_WELCOME") return;
        openModal("LEVEL_UP", info);
      }, 500); // Small delay to let the page load
    }
  }, [openModal]);

  useEffect(() => {
    if (!isOpen) return;
    if (type === "TASK_SUCCESS") celebrate({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    if (type === "LEVEL_UP") celebrate({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: GOLD });
    if (type === "SURPRISE_AWARD") celebrate({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: GOLD });
    if (type === "ORACION" || type === "HABITO") celebrate(data?.tipo === "regreso" ? { particleCount: 60, spread: 60, origin: { y: 0.6 } } : { particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: GOLD });
  }, [isOpen, type, data?.tipo, celebrate]);

  return (
    <CelebrateContext.Provider value={celebrate}>
      <Confetti ref={confettiRef} manualstart className="fixed inset-0 z-[60] size-full pointer-events-none" />

      {type === "USER_STATS" && (
        <Modal isOpen={isOpen} onClose={closeModal} title={`Estatus de ${data?.nombre}`} width="lg">
          <PerfilResumen usuario={data} enlaceCompleto onCerrarModal={closeModal} />
        </Modal>
      )}

      {type === "RULES" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="Constitución Familiar" width="lg">
          <RulesPopup />
        </Modal>
      )}

      {type === "LEVEL_UP" && (() => {
        const lvl = Number(data?.level ?? data?.newLevel ?? 1);
        const badgeSrc = data?.badgeUrl ?? badgeDeNivel(lvl);
        const titulo = data?.title ?? tituloDeNivel(lvl);
        const puntosRegalo = Number(data?.puntosRegalo ?? PUNTOS_SUBIR_NIVEL);
        return (
          <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Subiste de Nivel!">
            <div className="flex flex-col items-center text-center py-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badgeSrc}
                alt={`Insignia del nivel ${lvl}`}
                className="size-36 mb-4 object-contain drop-shadow-xl"
              />
              <p className="text-[var(--on-surface-variant)] text-xl mb-4 font-body font-bold">
                Nuevo Rango: <span className="text-[var(--primary)]">{titulo}</span>
              </p>
              <div className="bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--warning)_20%,transparent)] rounded-md px-6 py-3 flex items-center gap-3 mb-5">
                <span className="text-3xl" aria-hidden>⭐</span>
                <div className="text-left">
                  <div className="text-[var(--warning)] font-headline font-bold text-2xl tabular-nums">
                    +{puntosRegalo} Puntos
                  </div>
                  <div className="text-[var(--warning)] opacity-80 text-xs font-title font-bold uppercase tracking-wider">
                    Regalo por subir de nivel
                  </div>
                </div>
              </div>
              <p className="text-[var(--on-surface-variant)] text-md mb-6 px-4">
                ¡Tu esfuerzo está dando frutos! Seguí completando tareas y hábitos para alcanzar el siguiente rango.
              </p>
              <Button size="lg" onClick={closeModal} className="w-full">
                ¡A seguir subiendo!
              </Button>
            </div>
          </Modal>
        );
      })()}

      {(type === "ORACION" || type === "HABITO") && (() => {
        const popup = HABITO_POPUP(data?.habito || "este hábito")[data?.tipo as "ascenso" | "completo" | "regreso" | "libro"] ?? {
          titulo: "¡Felicitaciones!",
          texto: "Seguí adelante con tu constancia.",
        };
        return (
          <Modal isOpen={isOpen} onClose={closeModal} title={popup.titulo}>
            <div className="flex flex-col items-center text-center py-6">
              <img src={data?.tipo === "regreso" ? "/done-animate.svg" : "/winners-animate.svg"} alt="" className="w-40 h-40 mb-6 drop-shadow-xl" />
              <h3 className="text-2xl font-heading font-bold text-[var(--on-surface)] mb-2">{data?.habito}</h3>
              {data?.paso && <p className="text-[var(--primary)] text-lg font-bold mb-3">{data.paso}</p>}
              <p className="text-[var(--on-surface-variant)] mb-6 px-4">{popup.texto}</p>
              <Button size="lg" onClick={closeModal} className="w-full">
                {data?.categoria === "oracion" ? "Amén" : "¡Genial!"}
              </Button>
            </div>
          </Modal>
        );
      })()}

      {type === "TASK_SUCCESS" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Misión Cumplida!">
          <div className="flex flex-col items-center text-center py-6">
            {typeof document !== "undefined" && document.documentElement.dataset.relajado && (
              <div className="mb-2 text-6xl text-[var(--success)]" aria-hidden>✓</div>
            )}
            <img 
              src="/done-animate.svg" 
              alt="¡Buen trabajo!" 
              className="w-48 h-48 mb-6 drop-shadow-xl"
            />
            <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
              ¡Buen trabajo!
            </h3>

            {data?.puntos > 0 && (
              <div className="text-4xl font-display font-bold text-[var(--warning)] mb-2 animate-bounce">
                +{data.puntos} Pts
              </div>
            )}

            {(data?.porcentajePuntos === 100 || data?.porcentajePuntos === 80) && (
              <div className="mb-3">
                <span
                  className={
                    data.porcentajePuntos === 100
                      ? "inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--success)_15%,transparent)] border border-[color-mix(in_srgb,var(--success)_35%,transparent)] px-3 py-1 text-xs font-bold text-[var(--success)]"
                      : "inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] border border-[color-mix(in_srgb,var(--warning)_35%,transparent)] px-3 py-1 text-xs font-bold text-[var(--warning)]"
                  }
                >
                  {data.porcentajePuntos === 100
                    ? "⏱️ 100% de puntos (iniciada y finalizada)"
                    : "✓ 80% de puntos (marcada como realizada)"}
                </span>
              </div>
            )}

            <p className="text-[var(--on-surface-variant)] text-lg mb-2 font-body px-4">
              {data?.mensaje || "Has completado la tarea con éxito."}
            </p>

            {data?.isHappyHour && (
              <div className="bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] rounded-md px-4 py-2 flex items-center gap-2 mb-4 animate-bounce">
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
              <div className="bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--primary)_20%,transparent)] rounded-md px-4 py-2 flex flex-col items-center gap-1 mb-2">
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
              <div className="bg-[color-mix(in_srgb,var(--success)_10%,transparent)] border border-[color-mix(in_srgb,var(--success)_20%,transparent)] rounded-md px-4 py-2 flex items-center gap-2 mb-6 animate-bounce">
                <span className="text-2xl">🎁</span>
                <span className="text-[var(--success)] font-bold text-lg">
                  ¡Encontraste una Sorpresa Misteriosa!
                </span>
              </div>
            )}
            
            <div className="bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--warning)_20%,transparent)] rounded-md px-8 py-4 flex items-center gap-3 mt-4">
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
              {(data?.basePoints > 0 || data?.streakBonus > 0 || data?.speedBonus > 0 || data?.checklistBonus > 0 || data?.rankingBonus > 0) && (
                <div className="flex flex-col gap-2 mt-1 text-sm">
                  {data?.basePoints > 0 && (
                    <div className="flex justify-between items-center text-[var(--warning)] font-medium gap-2">
                      <span>✓ Base por dificultad</span>
                      <span>+{data.basePoints}</span>
                    </div>
                  )}
                  {data?.streakBonus > 0 && (
                    <div className="flex justify-between items-center text-orange-500 font-bold gap-2">
                      <span>🔥 Bono de racha</span>
                      <span>+{data.streakBonus}</span>
                    </div>
                  )}
                  {data?.speedBonus > 0 && (
                    <div className="flex justify-between items-center text-blue-500 font-bold gap-2">
                      <span>⚡ Bono de velocidad</span>
                      <span>+{data.speedBonus}</span>
                    </div>
                  )}
                  {data?.checklistBonus > 0 && (
                    <div className="flex justify-between items-center text-[var(--success)] font-bold gap-2">
                      <span>📝 Bono checklist perfecto</span>
                      <span>+{data.checklistBonus}</span>
                    </div>
                  )}
                  {data?.rankingBonus > 0 && (
                    <div className="flex justify-between items-center text-[var(--primary)] font-bold gap-2">
                      <span>{data?.emojiPodio ?? "🏆"} Acelerador #{data?.puestoRanking} (+{data?.aceleradorRankingPct}%)</span>
                      <span>+{data.rankingBonus}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button size="lg" onClick={() => window.location.reload()} className="mt-6 w-full max-w-sm">
              ¡A seguir así!
            </Button>
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

      {type === "MOOD_SELECTOR" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="¿Cómo te sientes hoy?">
          <div className="py-4">
             <MoodSelector
                currentMood={data?.user?.moodEmoji}
                isOwnProfile={true}
             />
             <div className="mt-6 flex justify-center">
               <Button variant="outline" onClick={closeModal} className="px-8">
                 Cerrar
               </Button>
             </div>
          </div>
        </Modal>
      )}

      {type === "DAILY_WELCOME" && data && (
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          title={`✨ ¡Bienvenido de vuelta, ${data.quien}!`}
          width="md"
        >
          <BienvenidaDiariaPopup data={data as BienvenidaDiariaDatos} onClose={closeModal} />
        </Modal>
      )}
    </CelebrateContext.Provider>
  );
}

function BienvenidaDiariaPopup({ data, onClose }: { data: BienvenidaDiariaDatos; onClose: () => void }) {
  const celebrate = useContext(CelebrateContext);
  const [mostrarPremios, setMostrarPremios] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setMostrarPremios(true);
      celebrate({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: GOLD });
    }, 450);
    return () => clearTimeout(t);
  }, [celebrate]);

  const { companero, quien, rachaApp, diasJuntos, puntos, xp, hitoHoy } = data;

  return (
    <div className="flex flex-col items-center text-center py-2 space-y-4">
      {/* 1. El compañero saluda y felicita por volver */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full rounded-xl border bg-muted/30 p-4 text-left">
        <EscenaCompanero
          personaje={companero.personaje}
          pose={companero.pose}
          equipados={companero.equipados}
          marco={companero.marco}
          quien={quien}
          className="w-28 sm:w-32 shrink-0 shadow-sm"
        />
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-heading text-lg font-bold text-foreground">
              {companero.nombre}
            </span>
            <Badge variant="default" className="gap-1">
              <Flame className="size-3.5" />
              Racha en la app: {rachaApp} {rachaApp === 1 ? "día" : "días"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {diasJuntos} {diasJuntos === 1 ? "día juntos" : "días juntos"}
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground italic">
            «{companero.saludo}»
          </p>
          <p className="text-sm text-muted-foreground">
            {companero.felicitacion}
          </p>
        </div>
      </div>

      {/* 2. Enseguida se muestran los premios por haber ingresado hoy */}
      <div
        className={`w-full space-y-3 transition-all duration-500 ${
          mostrarPremios ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center justify-center gap-1.5">
          <Sparkles className="size-3.5" />
          Premios por tu primer ingreso de hoy
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-2xl font-headline font-bold text-primary tabular-nums">
              <Sparkles className="size-5" /> +{xp} XP
            </div>
            <span className="text-xs font-medium text-muted-foreground mt-0.5">
              Experiencia ganada
            </span>
          </div>

          <div className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-2xl font-headline font-bold text-[var(--warning)] tabular-nums">
              <Star className="size-5 fill-current" /> +{puntos} Puntos
            </div>
            <span className="text-xs font-medium text-muted-foreground mt-0.5">
              Puntos disponibles
            </span>
          </div>
        </div>

        {hitoHoy && (
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--success)]">
            <Gift className="size-4 shrink-0" />
            <span>
              ¡Alcanzaste el hito «{hitoHoy.titulo}»! Tenés un premio sorpresa en Mis premios.
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <CheckCircle2 className="size-3.5 text-[var(--success)]" />
          Registrado en tu perfil · 1 vez por día
        </p>
      </div>

      <Button size="lg" onClick={onClose} className="w-full">
        ¡Gracias, a empezar el día!
      </Button>
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
      if (res.ok) toast.success("Reglas guardadas.");
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
            className="w-full h-80 bg-[var(--surface-container-low)] rounded-lg border border-[color-mix(in_srgb,var(--outline-variant)_30%,transparent)] p-4 outline-none text-foreground font-body text-lg leading-loose resize-none inkpot"
         />
      ) : (
         <div className="w-full h-80 bg-[var(--surface-container-low)] rounded-lg border border-[color-mix(in_srgb,var(--outline-variant)_30%,transparent)] p-4 overflow-y-auto text-foreground font-body text-lg leading-loose whitespace-pre-wrap input-glass">
            {rules}
         </div>
      )}
      {isAdmin && (
         <Button onClick={handleSave} disabled={loading} className="ml-auto">
            <Save /> {loading ? "Guardando..." : "Guardar Reglas"}
         </Button>
      )}
   </div>
  );
}

interface SurpriseAwardData {
  entregaId?: number;
  cantidad?: number;
  titulo?: string;
  premio?: {
    titulo?: string;
  };
}

function SurpriseAwardPopup({ data, onClose }: { data: SurpriseAwardData | null; onClose: () => void }) {
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

  const celebrate = useContext(CelebrateContext);
  useEffect(() => {
    if (showReward) celebrate({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: GOLD });
  }, [showReward, celebrate]);

  if (showReward) {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <img 
          src="/pot-of-gold-animate.svg" 
          alt="¡Premio!" 
          className="w-40 h-40 mb-6 drop-shadow-xl animate-bounce"
        />
        <h3 className="text-3xl font-headline font-bold text-foreground mb-2">
          ¡Ganaste!
        </h3>
        <p className="text-4xl font-display font-bold text-[var(--warning)] mb-4">
          {data?.cantidad} {data?.titulo}
        </p>
        <div className="bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--warning)_20%,transparent)] rounded-lg px-8 py-4 flex items-center gap-3 mb-6">
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
        <Button size="lg" onClick={onClose} className="mt-4 w-full">
          ¡Genial!
        </Button>
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
      <h3 className="text-2xl font-headline font-bold text-foreground mb-6">
        ¡Ganaste un premio sorpresa!
      </h3>
      <Button size="lg" onClick={handleDiscover} disabled={loading} className="w-full">
        {loading ? "Cargando..." : "Descubrir premio"}
      </Button>
    </div>
  );
}
