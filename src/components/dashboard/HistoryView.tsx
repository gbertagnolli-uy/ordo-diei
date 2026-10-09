"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, Star, Gift, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export function HistoryView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "rewards">("tasks");

  useEffect(() => {
    setLoading(true);
    fetch("/api/users/history")
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Empty className="py-24">
        <EmptyHeader>
          <EmptyMedia><Spinner className="size-8 text-primary" /></EmptyMedia>
          <EmptyDescription>Cargando tu historial...</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!data) {
    return (
      <Empty className="border border-destructive/30 bg-destructive/5 py-16">
        <EmptyHeader>
          <EmptyTitle className="text-destructive">Error cargando el historial.</EmptyTitle>
        </EmptyHeader>
        <Button variant="link" asChild><Link href="/dashboard">Volver al Dashboard</Link></Button>
      </Empty>
    );
  }

  const stats = [
    { label: "Estrellas totales", value: data.stats?.stars || 0, icon: Star, tone: "text-[var(--warning)]" },
    { label: "Pts disponibles", value: data.stats?.availablePoints || 0, icon: CheckCircle2, tone: "text-[var(--success)]" },
    { label: "Cofres sorpresa", value: data.stats?.surprises || 0, icon: Gift, tone: "text-primary" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((st) => (
          <Card key={st.label} className="gap-1 py-5">
            <CardHeader className="px-5">
              <CardDescription className="flex items-center gap-2">
                <st.icon className={`size-4 ${st.tone}`} /> {st.label}
              </CardDescription>
              <CardTitle className={`text-3xl font-semibold tabular-nums ${st.tone}`}>{st.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "tasks" | "rewards")}>
        <TabsList>
          <TabsTrigger value="tasks">Misiones completadas ({data.completedTasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="rewards">Logros y recompensas ({data.historial?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-2">
          {data.completedTasks?.length > 0 ? (
            <ItemGroup className="gap-2">
              {data.completedTasks.map((t: any) => (
                <Item key={t.id} variant="outline" className="bg-card">
                  <ItemMedia variant="icon" className={t.estado === "Aprobada" ? "text-[var(--success)]" : "text-[var(--warning)]"}>
                    <CheckCircle2 />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-sm">{t.titulo}</ItemTitle>
                    <ItemDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <Badge variant="outline" className="h-5">{t.estado}</Badge>
                      <span>{t.fechaCompletado ? new Date(t.fechaCompletado).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}</span>
                      {t.tiempoRealEjecucionSeg != null && (
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {Math.floor(t.tiempoRealEjecucionSeg / 60)}m {t.tiempoRealEjecucionSeg % 60}s</span>
                      )}
                    </ItemDescription>
                  </ItemContent>
                  {t.puntosGenerados > 0 && (
                    <ItemActions>
                      <Badge variant="secondary" className="tabular-nums">+{t.puntosGenerados} pts</Badge>
                    </ItemActions>
                  )}
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Empty className="border py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon"><History /></EmptyMedia>
                <EmptyTitle>No hay misiones completadas</EmptyTitle>
                <EmptyDescription>¡Comienza tu primera misión hoy mismo!</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="mt-2">
          {data.historial?.length > 0 ? (
            <ItemGroup className="gap-2">
              {data.historial.map((h: any) => (
                <Item key={h.id} variant="outline" className="bg-card">
                  <ItemMedia variant="icon" className="text-primary"><Clock /></ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-sm">{h.tarea?.titulo || "Cambio de Estado"}</ItemTitle>
                    <ItemDescription className="text-xs">
                      Estado: <span className="font-medium text-foreground">{h.estadoAnterior || "—"}</span> → <span className="font-medium text-primary">{h.estadoNuevo}</span>
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="text-xs text-muted-foreground tabular-nums">
                    {h.timestamp && new Date(h.timestamp).toLocaleDateString("es-ES")}
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Empty className="border py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon"><Gift /></EmptyMedia>
                <EmptyTitle>Sin historial de recompensas</EmptyTitle>
                <EmptyDescription>Sigue cumpliendo misiones para ganar premios.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
