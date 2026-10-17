"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Flame,
  Gift,
  Star,
  Trophy,
  CheckCircle2,
  Lock,
  Loader2,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nivelDe, xpTotal, TITULOS, badgeDeNivel } from "@/lib/niveles";
import { evaluarLogros, type CategoriaLogro } from "@/lib/logros";
import type { EstadoHabito } from "@/lib/habitos/server";
import { LogroIcon } from "./LogroIcon";
import { subirImagen } from "@/lib/subirImagen";


interface PerfilResumenProps {
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
  habitos?: EstadoHabito[];
  enlaceCompleto?: boolean;
  puedeEditarFoto?: boolean;
  onCerrarModal?: () => void;
}

export function PerfilResumen({
  usuario,
  habitos: habitosIniciales,
  enlaceCompleto = false,
  puedeEditarFoto = false,
  onCerrarModal,
}: PerfilResumenProps) {
  const router = useRouter();
  const inputFoto = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  async function cambiarFoto(file: File) {
    setSubiendo(true);
    setErrorFoto(null);
    try {
      await subirImagen(file, "/api/users/foto");
      router.refresh();
    } catch (e) {
      setErrorFoto(e instanceof Error ? e.message : "No se pudo guardar la foto");
    } finally {
      setSubiendo(false);
      if (inputFoto.current) inputFoto.current.value = "";
    }
  }

  const [habitosCargados, setHabitosCargados] = useState<EstadoHabito[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");

  const habitos = habitosIniciales ?? habitosCargados;

  useEffect(() => {
    if (habitosIniciales !== undefined) return;

    let cancelado = false;
    fetch(`/api/habitos?usuarioId=${usuario.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelado && data?.estados?.[0]?.habitos) {
          setHabitosCargados(data.estados[0].habitos);
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [usuario.id, habitosIniciales]);

  const [cartasUsuario, setCartasUsuario] = useState<Array<{ desbloqueada: boolean; rareza?: string; grado?: number }>>([]);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/cartas")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelado && data?.cartas) {
          setCartasUsuario(data.cartas);
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, []);

  const totalXp = xpTotal(usuario);
  const infoNivel = nivelDe(totalXp);

  // Próximo título en la escalera
  const proximoTitulo = TITULOS.find((t) => t.nivel > infoNivel.level);
  const puntosParaProximoTitulo = proximoTitulo
    ? Math.max(0, Math.pow(proximoTitulo.nivel - 1, 2) * 100 - totalXp)
    : 0;

  const todosLogros = evaluarLogros({
    usuario,
    habitos,
    cartas: cartasUsuario,
  });

  const logrosFiltrados =
    categoriaFiltro === "todas"
      ? todosLogros
      : todosLogros.filter((l) => l.categoria === (categoriaFiltro as CategoriaLogro));

  const totalObtenidos = todosLogros.filter((l) => l.obtenido).length;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Cabecera con Avatar, Nivel y Anillo */}
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <Avatar className="size-20 ring-4 ring-background shadow-md sm:size-24">
                <AvatarImage src={usuario.fotoUrl ?? undefined} alt={usuario.nombre} className="object-cover" />
                <AvatarFallback className="font-heading text-2xl font-bold bg-primary text-primary-foreground sm:text-3xl">
                  {usuario.nombre.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {puedeEditarFoto && (
                <>
                  <input
                    ref={inputFoto}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) cambiarFoto(f);
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute -right-1 -top-1 size-7 rounded-full shadow-md"
                    aria-label="Cambiar foto de perfil"
                    disabled={subiendo}
                    onClick={() => inputFoto.current?.click()}
                  >
                    {subiendo ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  </Button>
                </>
              )}
              {usuario.moodEmoji && (
                <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border bg-card text-base shadow-sm">
                  {usuario.moodEmoji}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left">
              {errorFoto && <p className="mb-1 text-xs text-destructive">{errorFoto}</p>}
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h2 className="font-heading text-2xl font-bold">{usuario.nombre}</h2>
                <Badge variant="secondary" className="text-xs">
                  {usuario.rolFamiliar}
                </Badge>
              </div>
              <p className="font-serif text-lg text-primary font-semibold mt-0.5">
                {infoNivel.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {proximoTitulo ? (
                  <>Faltan <span className="font-semibold text-foreground tabular-nums">{puntosParaProximoTitulo} XP</span> para {proximoTitulo.titulo} (Nivel {proximoTitulo.nivel})</>
                ) : (
                  <>¡Máximo título alcanzado!</>
                )}
              </p>
            </div>
          </div>

          {/* Badge del nivel, barra de progreso y XP */}
          <div className="flex w-full max-w-48 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badgeDeNivel(infoNivel.level)}
              alt={`Badge del nivel ${infoNivel.level}`}
              className="size-28 object-contain"
            />
            <Progress value={infoNivel.progressPercentage} className="h-2 w-full" />
            <span className="text-sm font-semibold tabular-nums">{totalXp} XP</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {infoNivel.progressPercentage}% al Nivel {infoNivel.level + 1}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Lo ganado (Grilla de estadísticas) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Estadísticas y experiencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-foreground">
                {usuario.availablePoints ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Puntos disponibles</div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-foreground">
                {usuario.puntosAcumulados ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Puntos tareas</div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-primary">
                +{usuario.experienciaHabitos ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">XP de hábitos</div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-foreground flex items-center justify-center gap-1">
                <Flame className="size-4 text-orange-500 fill-orange-500" />
                {usuario.streakDays ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Días de racha</div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-foreground flex items-center justify-center gap-1">
                <Star className="size-4 text-secondary fill-secondary" />
                {usuario.stars ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Estrellas</div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-foreground flex items-center justify-center gap-1">
                <Gift className="size-4 text-primary" />
                {usuario.surprises ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Sorpresas</div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-foreground">
                {usuario.totalTasksCompleted ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Tareas completadas</div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-center">
              <div className="text-xl font-bold tabular-nums text-foreground flex items-center justify-center gap-1">
                <Trophy className="size-4 text-amber-500" />
                {totalXp}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">XP Total acumulada</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Logros con filtro */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-base">
              Logros ({totalObtenidos} de {todosLogros.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Medallas por tareas, constancia, oración y virtudes cotidianas.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={categoriaFiltro} onValueChange={setCategoriaFiltro} className="w-full">
            <TabsList className="w-full flex-wrap justify-start h-auto gap-1 p-1">
              <TabsTrigger value="todas" className="text-xs">
                Todas ({todosLogros.length})
              </TabsTrigger>
              <TabsTrigger value="habitos" className="text-xs">
                Hábitos
              </TabsTrigger>
              <TabsTrigger value="oracion" className="text-xs">
                Oración
              </TabsTrigger>
              <TabsTrigger value="tareas" className="text-xs">
                Tareas
              </TabsTrigger>
              <TabsTrigger value="constancia" className="text-xs">
                Constancia
              </TabsTrigger>
              <TabsTrigger value="nivel" className="text-xs">
                Nivel
              </TabsTrigger>
              <TabsTrigger value="cartas" className="text-xs">
                Cartas
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {logrosFiltrados.map((logro) => (
              <div
                key={logro.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  logro.obtenido
                    ? "bg-card border-border shadow-xs"
                    : "bg-muted/30 border-dashed opacity-65"
                }`}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
                    logro.obtenido
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <LogroIcon name={logro.icono} className="size-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{logro.titulo}</span>
                    {logro.obtenido ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[10px] py-0 bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success)]"
                      >
                        <CheckCircle2 className="size-3" /> Obtenido
                      </Badge>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
                        <Lock className="size-3" />
                        {logro.valorActual} / {logro.meta}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {logro.descripcion}
                  </p>
                  {!logro.obtenido && (
                    <div className="mt-2">
                      <Progress value={Math.round(logro.progreso * 100)} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botón ver perfil completo para el modal */}
      {enlaceCompleto && (
        <div className="flex justify-end pt-2">
          <Button asChild onClick={onCerrarModal}>
            <Link href={`/dashboard/perfil?usuarioId=${usuario.id}`}>
              <ExternalLink className="size-4" /> Ver perfil completo
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
