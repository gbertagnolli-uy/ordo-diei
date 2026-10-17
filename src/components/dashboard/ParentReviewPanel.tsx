"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock, User, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import { SwipeRow } from "@/components/SwipeRow";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ParentReviewPanel({ tasks }: { tasks: any[] }) {
  const router = useRouter();
  // Tareas ya resueltas: desaparecen al instante, sin esperar a que la página se actualice
  const [resolved, setResolved] = useState<Set<number>>(new Set());
  const waitingTasks = tasks.filter(t => t.estado === "Esperando_Aprobacion" && !resolved.has(t.id));

  if (waitingTasks.length === 0) return null;

  const handleAction = async (taskId: number, action: "approve" | "reject") => {
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
            left={{ label: "Aprobar", icon: <Check className="size-5" />, color: "var(--success)", onColor: "var(--on-success)", onCommit: () => handleAction(task.id, "approve") }}
            right={{ label: "Rechazar", icon: <X className="size-5" />, color: "var(--destructive)", onColor: "#fff", onCommit: () => handleAction(task.id, "reject") }}
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
              </ItemContent>
              <ItemActions className="self-end sm:self-center">
                <Button variant="ghost" onClick={() => handleAction(task.id, "reject")} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <X /> Rechazar
                </Button>
                <Button onClick={() => handleAction(task.id, "approve")} className="bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]">
                  <Check /> Aprobar
                </Button>
              </ItemActions>
            </Item>
          </SwipeRow>
        ))}
      </ItemGroup>
    </Card>
  );
}
