"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock, User, AlertCircle, Camera } from "lucide-react";
import { toast } from "@/lib/toast";
import { SwipeRow } from "@/components/SwipeRow";
import { Modal } from "@/components/ui/Modal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ParentReviewPanel({ tasks }: { tasks: any[] }) {
  const router = useRouter();
  // Tareas ya resueltas: desaparecen al instante, sin esperar a que la página se actualice
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const waitingTasks = tasks.filter(t => t.estado === "Esperando_Aprobacion" && !resolved.has(t.id));

  if (waitingTasks.length === 0) return null;

  const handleAction = async (task: any, action: "approve" | "reject") => {
    // El servidor también lo verifica; acá evitamos que la fila desaparezca para volver a aparecer
    if (action === "approve" && task.requiereFotoPrueba && !task.fotoPruebaUrl) {
      toast.error("Falta la foto de prueba", "El asignado debe subirla antes de aprobar la tarea.");
      return;
    }
    const taskId = task.id;
    const setHidden = (hidden: boolean) =>
      setResolved(prev => {
        const next = new Set(prev);
        if (hidden) next.add(taskId); else next.delete(taskId);
        return next;
      });

    setHidden(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/${action}`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      } else {
        setHidden(false);
        toast.error(`Error al ${action === "approve" ? "aprobar" : "rechazar"} la tarea`);
      }
    } catch {
      setHidden(false);
      toast.error("Error de conexión");
    }
  };

  return (
    <Card className="mb-6 gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4 text-primary" /> Tareas Pendientes de Revisión ({waitingTasks.length})
        </CardTitle>
        <Badge>Action Required</Badge>
      </CardHeader>
      <ItemGroup className="gap-0 divide-y">
        {waitingTasks.map((task) => (
          <SwipeRow
            key={task.id}
            left={{ label: "Aprobar", icon: <Check className="size-5" />, color: "var(--success)", onColor: "var(--on-success)", onCommit: () => handleAction(task, "approve") }}
            right={{ label: "Rechazar", icon: <X className="size-5" />, color: "var(--destructive)", onColor: "#fff", onCommit: () => handleAction(task, "reject") }}
          >
            <Item className="flex-col items-start rounded-none px-6 py-3 sm:flex-row sm:items-center">
              <ItemMedia>
                <Avatar className="size-10 rounded-lg">
                  <AvatarImage src={task.asignado?.fotoUrl ?? undefined} alt={task.asignado?.nombre} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary"><User className="size-5" /></AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-base">{task.titulo}</ItemTitle>
                <ItemDescription className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="font-medium text-primary">{task.asignado?.nombre}</span>
                  <span>•</span>
                  <span className="font-medium text-[var(--warning)]">💰 {task.puntosGenerados} Pts</span>
                </ItemDescription>
                {task.retroalimentacionAlgoritmo && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground italic">
                    <AlertCircle className="size-3" /> {task.retroalimentacionAlgoritmo}
                  </p>
                )}
                {task.fotoPruebaUrl ? (
                  <button
                    type="button"
                    onClick={() => setFotoAmpliada(task.fotoPruebaUrl)}
                    className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/40 p-1.5 pr-3 text-xs font-medium transition-colors hover:border-primary"
                    aria-label={`Ver la foto de prueba de ${task.titulo}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={task.fotoPruebaUrl} alt="Foto de prueba" className="size-14 rounded-md object-cover" />
                    <span className="flex items-center gap-1 text-primary">
                      <Camera className="size-3.5" /> Ver foto de prueba
                    </span>
                  </button>
                ) : task.requiereFotoPrueba ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--warning)]">
                    <Camera className="size-3.5" /> Falta la foto de prueba
                  </p>
                ) : null}
              </ItemContent>
              <ItemActions className="self-end sm:self-center">
                <Button variant="ghost" onClick={() => handleAction(task, "reject")} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <X /> Rechazar
                </Button>
                <Button onClick={() => handleAction(task, "approve")} className="bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]">
                  <Check /> Aprobar
                </Button>
              </ItemActions>
            </Item>
          </SwipeRow>
        ))}
      </ItemGroup>

      <Modal isOpen={Boolean(fotoAmpliada)} onClose={() => setFotoAmpliada(null)} title="Foto de prueba" width="lg">
        {fotoAmpliada && (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoAmpliada} alt="Foto de prueba de la tarea" className="max-h-[75vh] w-auto rounded-lg object-contain" />
          </div>
        )}
      </Modal>
    </Card>
  );
}
