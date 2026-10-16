"use client";

import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  Check,
  Gift,
  Lock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ETAPAS } from "@/lib/habitos/catalogo";
import { nivelDe, xpTotal, TITULOS } from "@/lib/niveles";
import type { EstadoHabito } from "@/lib/habitos/server";
import { HabitoIcon } from "@/components/habitos/HabitoIcon";
import { PerfilResumen } from "./PerfilResumen";
import { AvisosPush } from "@/components/engagement/AvisosPush";
import { GraficoAnimo, type RegistroAnimoItem } from "./GraficoAnimo";

export interface PremioItem {
  id: number;
  estado: string;
  fechaEntrega: Date | string;
  premio: {
    id: number;
    titulo: string;
    cantidad: number;
  };
}

interface PerfilViewProps {
  usuario: {
    id: number;
    nombre: string;
    rolFamiliar: string;
    fotoUrl?: string | null;
    moodEmoji?: string | null;
    puntosAcumulados?: number | null;
    experienciaHabitos?: number | null;
    availablePoints?: number | null;
    stars?: number | null;
    surprises?: number | null;
    streakDays?: number | null;
    totalTasksCompleted?: number | null;
    completionPercentage?: number | null;
  };
  habitos: EstadoHabito[];
  premios: PremioItem[];
  animo: RegistroAnimoItem[];
  esPropio: boolean;
}

export function PerfilView({ usuario, habitos, premios, animo, esPropio }: PerfilViewProps) {
  const totalXp = xpTotal(usuario);
  const infoNivel = nivelDe(totalXp);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Componente principal de resumen (Cabecera, estadísticas, logros) */}
      <PerfilResumen usuario={usuario} habitos={habitos} puedeEditarFoto={esPropio} />

      <GraficoAnimo registros={animo} nombre={usuario.nombre} esPropio={esPropio} />

      {esPropio && <AvisosPush modo="perfil" />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hábitos activos */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="font-heading text-lg">Hábitos en curso</CardTitle>
              <CardDescription>
                Rutina diaria, oración y constancia de {esPropio ? "tu camino" : usuario.nombre}.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/habitos">
                Mis hábitos <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {habitos.length === 0 ? (
              <Empty className="border rounded-lg py-8">
                <EmptyMedia variant="icon">
                  <Sparkles className="size-4" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Sin hábitos activos</EmptyTitle>
                  <EmptyDescription>
                    {esPropio
                      ? "Elegí uno o dos hábitos del catálogo para comenzar a sumar constancia."
                      : `${usuario.nombre} todavía no tiene hábitos adoptados.`}
                  </EmptyDescription>
                </EmptyHeader>
                {esPropio && (
                  <Button size="sm" asChild className="mt-2">
                    <Link href="/dashboard/habitos">Elegir hábitos</Link>
                  </Button>
                )}
              </Empty>
            ) : (
              <div className="divide-y rounded-lg border">
                {habitos.map((h) => {
                  const constanciaPct = Math.round(h.constancia * 100);
                  return (
                    <div
                      key={h.habitoId}
                      className="flex items-center justify-between gap-3 p-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                          <HabitoIcon name={h.icono} className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{h.nombre}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Paso {h.paso} de {h.pasos} · {h.pasoActual.titulo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {ETAPAS[h.etapa]}
                        </Badge>
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            constanciaPct >= 80
                              ? "text-[var(--success)]"
                              : constanciaPct >= 60
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {constanciaPct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premios entregados */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Premios y reconocimientos</CardTitle>
            <CardDescription>
              Premios familiares alcanzados por buen desempeño y constancia.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {premios.length === 0 ? (
              <Empty className="border rounded-lg py-8">
                <EmptyMedia variant="icon">
                  <Gift className="size-4" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Sin premios entregados aún</EmptyTitle>
                  <EmptyDescription>
                    Cumplí las metas de tareas y mantén la rutina para recibir reconocimientos.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Premio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {premios.map((p) => {
                      const fechaStr =
                        typeof p.fechaEntrega === "string"
                          ? p.fechaEntrega
                          : p.fechaEntrega.toISOString();
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.premio.titulo}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={p.estado === "Entregado" ? "secondary" : "outline"}
                              className={
                                p.estado === "Entregado"
                                  ? "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success)] text-[11px]"
                                  : "text-[11px]"
                              }
                            >
                              {p.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                            {format(new Date(fechaStr), "d 'de' MMMM", { locale: es })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Camino de niveles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg">Camino de virtudes y niveles</CardTitle>
          <CardDescription>
            La constancia en las pequeñas cosas forma la columna del carácter cristiano.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TITULOS.map((t) => {
              const alcanzado = infoNivel.level >= t.nivel;
              const esActual = infoNivel.level >= t.nivel && (!TITULOS.find((nxt) => nxt.nivel > t.nivel && infoNivel.level >= nxt.nivel));

              return (
                <div
                  key={t.nivel}
                  className={`flex flex-col items-center justify-between rounded-lg border p-3 text-center transition-all ${
                    esActual
                      ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                      : alcanzado
                      ? "border-border bg-card text-foreground"
                      : "border-dashed bg-muted/20 opacity-50 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Nivel {t.nivel}
                    </span>
                    {alcanzado && !esActual && <Check className="size-3 text-[var(--success)]" />}
                    {!alcanzado && <Lock className="size-3 text-muted-foreground" />}
                  </div>
                  <div className="font-heading font-bold text-sm my-1">{t.titulo}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {Math.pow(t.nivel - 1, 2) * 100} XP
                  </div>
                  {esActual && (
                    <Badge variant="default" className="mt-1 text-[9px] py-0 px-1.5">
                      Actual
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
