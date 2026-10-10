"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { useState } from "react";
import { Check, X, Clock, User, AlertCircle } from "lucide-react";

export function ParentReviewPanel({ tasks }: { tasks: any[] }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const waitingTasks = tasks.filter(t => t.estado === "Esperando_Aprobacion");

  if (waitingTasks.length === 0) return null;

  const handleAction = async (taskId: number, action: "approve" | "reject") => {
    setLoadingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/${action}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.leveledUp) {
          // Store level up info in sessionStorage so it survives reload
          sessionStorage.setItem("levelUpNotification", JSON.stringify({
            userName: data.userName,
            newLevel: data.newLevel
          }));
        }
        window.location.reload();
      } else {
        alert(`Error al ${action === "approve" ? "aprobar" : "rechazar"} la tarea`);
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setLoadingId(null);
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
          <div key={task.id}>
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
                <Button variant="ghost" disabled={loadingId !== null} onClick={() => handleAction(task.id, "reject")} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <X /> {loadingId === task.id ? "..." : "Rechazar"}
                </Button>
                <Button disabled={loadingId !== null} onClick={() => handleAction(task.id, "approve")} className="bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]">
                  <Check /> {loadingId === task.id ? "..." : "Aprobar"}
                </Button>
              </ItemActions>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </Card>
  );
}
