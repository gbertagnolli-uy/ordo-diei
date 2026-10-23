"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Camera, Check, Clock, ListChecks, Pause, Play, Repeat, Star, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChecklistModal } from "@/components/dashboard/ChecklistModal";
import { cn } from "@/lib/utils";
import { describirRotacion, normalizarRotacionConfig } from "@/lib/rotacionTarea";
import { fotoPruebaPendiente, pideFotoPrueba } from "@/lib/tareas/fotoPrueba";
import { FotoPruebaTarea } from "./FotoPruebaTarea";
import { useTaskActions } from "./useTaskActions";
import {
  CoResponsable,
  checklistProgress,
  formatClock,
  formatDue,
  formatDuration,
  isActionable,
  isLate,
  isUrgent,
  pointsLabel,
  statusInfo,
} from "./taskUtils";
import { StatusBadge, Avatar } from "./primitives";

const RECURRENCIA: Record<string, string> = {
  Unica: "Única",
  Diaria: "Diaria",
  Semanal: "Semanal",
  Mensual_Fecha: "Mensual",
  Mensual_Ordinal: "Mensual",
};

// Ficha de la tarea seleccionada en el panel de contexto (lista y tablero).
export function TaskDetailPanel({
  task,
  coResponsables = [],
  onBack,
}: {
  task: any;
  coResponsables?: CoResponsable[];
  onBack: () => void;
}) {
  const actions = useTaskActions(task);
  const router = useRouter();
  const [confirm, setConfirm] = useState<null | "finish" | "finishDirect" | "notDone">(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [fotoSubida, setFotoSubida] = useState<{ tareaId: number; base: string | null; url: string } | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(false);
  const canAct = isActionable(task);
  const checklist = checklistProgress(task);
  const status = statusInfo(task);
  const rotacion = normalizarRotacionConfig(task.rotacionConfig);
  // La foto recién subida se muestra al instante; cuando el servidor confirma (o la borra), manda su valor
  const fotoServidor = task.fotoPruebaUrl ?? null;
  const fotoUrl =
    fotoSubida && fotoSubida.tareaId === task.id && fotoSubida.base === fotoServidor
      ? fotoSubida.url
      : fotoServidor;
  const faltaFoto = fotoPruebaPendiente({ requiereFotoPrueba: task.requiereFotoPrueba, fotoPruebaUrl: fotoUrl });
  const muestraFoto = pideFotoPrueba({ requiereFotoPrueba: task.requiereFotoPrueba, fotoPruebaUrl: fotoUrl });

  const openConfirm = (kind: "finish" | "finishDirect" | "notDone") => {
    actions.pauseForConfirm();
    setConfirm(kind);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 px-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft /> Agenda
        </Button>
        <div className="flex items-center gap-1.5 pr-2">
          {rotacion && (
            <Badge variant="outline" className="h-5 gap-1 text-primary border-primary/40">
              <Repeat className="size-3" /> Turno de hoy
            </Badge>
          )}
          {muestraFoto && (
            <Badge variant="outline" className="h-5 gap-1" title="Tarea con foto de prueba">
              <Camera className="size-3" />
            </Badge>
          )}
          {isUrgent(task) && !isLate(task) && <Badge variant="secondary" className="h-5">Urgente</Badge>}
          <StatusBadge label={status.label} color={status.color} />
        </div>
      </div>
      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          <div>
            <h2 className="font-heading text-xl leading-snug">{task.titulo}</h2>
            {task.descripcion && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{task.descripcion}</p>}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Meta icon={<Clock />} label="Estimado" value={formatDuration(task.tiempoEjecucionEstimadoSeg || 0)} />
            <Meta icon={<CalendarClock />} label="Vence" value={formatDue(task, true) ?? "Sin fecha"} />
            <Meta icon={<Star />} label="Puntos" value={task.generaPuntosYRecompensa ? pointsLabel(task) : "No suma"} />
            <Meta
              icon={<Repeat />}
              label={rotacion ? "Rotación" : "Repite"}
              value={(rotacion ? describirRotacion(rotacion) : null) ?? (RECURRENCIA[task.tipoRecurrencia] ?? "Única")}
            />
          </dl>

          {coResponsables.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {rotacion ? "Compañeros de rotación" : "Co-responsables"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {coResponsables.map((cr) => (
                  <Badge key={cr.id} variant="outline" className="h-6 gap-1.5 pl-0.5">
                    <Avatar user={cr} size="xs" /> {cr.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {task.isChecklist && checklist.total > 0 && (
            <button type="button" onClick={() => setChecklistOpen(true)} className="block w-full text-left">
              <Card className="gap-2 py-3 transition-colors hover:border-success">
                <CardContent className="px-3.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ListChecks className="size-4 text-success" /> Checklist
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{checklist.done}/{checklist.total}</span>
                  </div>
                  <Progress value={checklist.pct} className="mt-2.5 h-1.5" />
                </CardContent>
              </Card>
            </button>
          )}

          {muestraFoto && (
            <FotoPruebaTarea
              tareaId={task.id}
              url={fotoUrl}
              puedeEditar={canAct && Boolean(task.requiereFotoPrueba)}
              onSubida={(url) => {
                setFotoSubida({ tareaId: task.id, base: fotoServidor, url });
                router.refresh();
              }}
              onVer={() => setFotoAmpliada(true)}
            />
          )}

          {canAct && (
            <Card className="py-4">
              <CardContent className="space-y-3 px-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {actions.isOvertime ? "¡Tiempo excedido!" : actions.fueIniciada ? "Tiempo restante" : "Duración estimada"}
                    </p>
                    <p
                      className={cn(
                        "font-mono text-3xl font-semibold tabular-nums tracking-tight",
                        actions.isOvertime ? "text-destructive" : actions.isPlaying ? "text-success" : "text-foreground"
                      )}
                    >
                      {formatClock(actions.remaining)}
                    </p>
                  </div>
                  <Button variant={actions.isPlaying ? "secondary" : "default"} onClick={actions.togglePlay}>
                    {actions.isPlaying ? <Pause /> : <Play />}
                    {actions.isPlaying ? "Pausar" : actions.fueIniciada ? "Reanudar" : "Iniciar"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {actions.fueIniciada
                    ? "Tarea iniciada: al presionar Finalizar recibís el 100% de los puntos."
                    : "Iniciá la tarea antes de hacerla y luego presioná Finalizar para ganar el 100% de los puntos (si solo la marcás como realizada otorga el 80%)."}
                </p>
              </CardContent>
            </Card>
          )}

          {task.estado === "Esperando_Aprobacion" && (
            <Card className="py-3">
              <CardContent className="px-4 text-sm">
                <p className="text-muted-foreground">Los puntos están bloqueados hasta que se apruebe.</p>
                <p className="mt-1 font-medium text-secondary tabular-nums">Saldo bloqueado: +{task.puntosGenerados || 0} pts</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {canAct && (
        <>
          <Separator />
          <div className="flex shrink-0 flex-wrap gap-2 p-3">
            {actions.fueIniciada ? (
              <Button
                className="flex-1 bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]"
                disabled={faltaFoto}
                title={faltaFoto ? "Subí la foto de prueba para poder completar la tarea" : undefined}
                onClick={() => openConfirm("finish")}
              >
                <Check /> Finalizar (100% pts)
              </Button>
            ) : (
              <>
                <Button className="flex-1" onClick={actions.togglePlay}>
                  <Play /> Iniciar tarea
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={faltaFoto}
                  onClick={() => openConfirm("finishDirect")}
                  title={faltaFoto ? "Subí la foto de prueba para poder completar la tarea" : "Marcar como realizada sin haber iniciado el cronómetro (otorga 80% de los puntos)"}
                >
                  <Check /> Marcar realizada (80%)
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => openConfirm("notDone")}
              className="hover:border-destructive hover:text-destructive"
              aria-label="No realizada"
            >
              <X /> No realizada
            </Button>
          </div>
          {faltaFoto && (
            <p className="px-3 pb-3 text-xs text-muted-foreground">
              Subí la foto de prueba para poder marcar la tarea como completada.
            </p>
          )}
        </>
      )}

      <Modal
        isOpen={confirm === "finish" || confirm === "finishDirect"}
        onClose={() => setConfirm(null)}
        title={confirm === "finishDirect" ? "¿Marcar tarea como realizada?" : "¿Finalizar la tarea?"}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          {fotoUrl ? (
            <button type="button" onClick={() => setFotoAmpliada(true)} className="w-full" aria-label="Ver la foto de prueba en grande">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fotoUrl} alt="Foto de prueba de la tarea" className="mx-auto max-h-44 rounded-lg border object-cover" />
            </button>
          ) : (
            <img src="/time-machine-animate.svg" alt="Time Machine" className="mb-2 size-48 drop-shadow-sm" />
          )}
          {confirm === "finishDirect" ? (
            <p className="text-base leading-relaxed text-muted-foreground">
              Como no iniciaste el cronómetro antes de hacerla, marcarla directamente como realizada otorga el{" "}
              <strong className="text-foreground">80% de los puntos</strong>. Si recién vas a hacerla, podés iniciarla ahora para ganar el{" "}
              <strong className="text-foreground">100%</strong>.
            </p>
          ) : (
            <p className="text-lg leading-relaxed text-muted-foreground">
              ¡Excelente! Iniciaste y realizaste la tarea, por lo que vas a recibir el{" "}
              <strong className="text-foreground">100% de los puntos</strong> al aprobarse.
            </p>
          )}
          <div className="mt-4 flex w-full gap-3">
            {confirm === "finishDirect" ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={actions.loading}
                  onClick={() => {
                    setConfirm(null);
                    void actions.togglePlay();
                  }}
                >
                  <Play /> Iniciar ahora (100%)
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={actions.loading}
                  onClick={async () => {
                    if (await actions.finishTask("realizada_directa")) setConfirm(null);
                  }}
                >
                  {actions.loading ? "Evaluando..." : "Marcar realizada (80%)"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="lg" className="flex-1" disabled={actions.loading} onClick={() => setConfirm(null)}>
                  Voy a revisar
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={actions.loading}
                  onClick={async () => {
                    if (await actions.finishTask("iniciada_finalizada")) setConfirm(null);
                  }}
                >
                  {actions.loading ? "Evaluando..." : "Sí, finalizar (100%)"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirm === "notDone"} onClose={() => setConfirm(null)} title="¿No la hiciste?">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/cross-animate.svg" alt="Cancel" className="mb-2 size-32 opacity-80" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <p className="text-lg leading-relaxed text-muted-foreground">
            Si marcas la tarea como &quot;No Realizada&quot;, esta se archivará sin otorgarte puntos. <br />¿Estás seguro?
          </p>
          <div className="mt-4 flex w-full gap-3">
            <Button variant="outline" size="lg" className="flex-1" disabled={actions.loading} onClick={() => setConfirm(null)}>
              Mejor la hago
            </Button>
            <Button variant="destructive" size="lg" className="flex-1" disabled={actions.loading} onClick={async () => { if (await actions.markAsNotDone()) setConfirm(null); }}>
              {actions.loading ? "Cargando..." : "Sí, no la hice"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={fotoAmpliada} onClose={() => setFotoAmpliada(false)} title="Foto de prueba" width="lg">
        {fotoUrl && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl} alt="Foto de prueba de la tarea" className="max-h-[75vh] w-auto rounded-lg object-contain" />
          </div>
        )}
      </Modal>

      {task.isChecklist && (
        <ChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} taskId={task.id} taskTitle={task.titulo} />
      )}
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon} {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
