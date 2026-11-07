"use client";

// Cronómetro de la tarea en curso (lane 264, Plane #21): modal grande al iniciar y ventana flotante
// abajo a la derecha en cualquier pantalla de /dashboard. La tarea en curso la manda el layout (servidor).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Maximize2, Minimize2, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useModalStore } from "@/store/modalStore";
import { useCronometroStore } from "@/store/cronometroStore";
import { formatClock } from "./taskUtils";
import { completarTarea } from "./completarTarea";

export type TareaEnCurso = {
  id: number;
  titulo: string;
  timerStartedAt: string;
  tiempoAcumuladoTimer: number;
  tiempoEjecucionEstimadoSeg: number;
  requiereFotoPrueba: boolean;
  fotoPruebaUrl: string | null;
};

export function CronometroTarea({ tarea }: { tarea: TareaEnCurso | null }) {
  const router = useRouter();
  const { openModal } = useModalStore();
  const grandeId = useCronometroStore((s) => s.grandeId);
  const abrirGrande = useCronometroStore((s) => s.abrirGrande);
  const minimizar = useCronometroStore((s) => s.minimizar);
  const [ahora, setAhora] = useState(() => Date.now());
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!tarea) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tarea]);

  if (!tarea) return null;

  const transcurrido = tarea.tiempoAcumuladoTimer + Math.max(0, Math.floor((ahora - Date.parse(tarea.timerStartedAt)) / 1000));
  const restante = tarea.tiempoEjecucionEstimadoSeg - transcurrido;
  const excedido = restante < 0;
  const grande = grandeId === tarea.id;

  async function pausar() {
    if (!tarea) return;
    setOcupado(true);
    try {
      await fetch(`/api/tasks/${tarea.id}/timer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
      minimizar();
      router.refresh();
    } catch {
      toast.error("No se pudo pausar. Revisá tu conexión.");
    } finally {
      setOcupado(false);
    }
  }

  async function finalizar() {
    if (!tarea) return;
    if (tarea.requiereFotoPrueba && !tarea.fotoPruebaUrl) {
      minimizar();
      toast.info("Subí la foto de prueba para finalizar");
      router.push("/dashboard?s=progress");
      return;
    }
    setOcupado(true);
    const r = await completarTarea(tarea.id, transcurrido, "iniciada_finalizada");
    setOcupado(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    minimizar();
    openModal("TASK_SUCCESS", r.exito);
    router.refresh();
  }

  const reloj = (
    <span suppressHydrationWarning className={cn("font-mono font-semibold tabular-nums tracking-tight", excedido ? "text-destructive" : "text-success")}>
      {formatClock(restante)}
    </span>
  );

  if (grande) {
    return (
      <Modal isOpen onClose={minimizar} title={tarea.titulo} width="sm">
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm text-muted-foreground">{excedido ? "¡Tiempo excedido!" : "Tiempo restante"}</p>
          <div className="text-6xl">{reloj}</div>
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1" disabled={ocupado} onClick={pausar}>
              <Pause /> Pausar
            </Button>
            <Button className="flex-1 bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]" disabled={ocupado} onClick={finalizar}>
              <Check /> Finalizar
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={minimizar}>
            <Minimize2 /> Minimizar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <div
      role="region"
      aria-label="Tarea en curso"
      className="fixed right-4 bottom-24 z-50 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg print:hidden"
    >
      <button type="button" onClick={() => abrirGrande(tarea.id)} className="flex w-full items-start gap-2 text-left" aria-label="Abrir el cronómetro en grande">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{tarea.titulo}</span>
          <span className="block text-2xl">{reloj}</span>
        </span>
        <Maximize2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" disabled={ocupado} onClick={pausar}>
          <Pause /> Pausar
        </Button>
        <Button size="sm" className="flex-1 bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]" disabled={ocupado} onClick={finalizar}>
          <Check /> Finalizar
        </Button>
      </div>
    </div>
  );
}
