"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Play,
  Eye,
  ArrowLeft,
  Search,
  Filter,
  Users,
  ListOrdered,
  CheckSquare,
  Check,
  Flame,
  Trophy,
  AlertCircle,
  X,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Particles } from "@/components/ui/particles";
import {
  calcularEstadisticasAgenda,
  filtrarTareasAgenda,
  agruparTareasPorMiembro,
  type AgendaTaskItem,
  type AgendaUser,
} from "./agendaUtils";

export type { AgendaTaskItem, AgendaUser };

interface Props {
  initialUsers: AgendaUser[];
  tasks: AgendaTaskItem[];
  fechaTexto: string;
}

export function AgendaDashboardClient({ initialUsers, tasks, fechaTexto }: Props) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState<string>("");
  const [vista, setVista] = useState<"miembros" | "lista">("miembros");
  const [tareaSeleccionada, setTareaSeleccionada] = useState<AgendaTaskItem | null>(null);

  // Estadísticas globales de hoy
  const stats = useMemo(() => calcularEstadisticasAgenda(tasks), [tasks]);

  // Contadores por usuario para hoy
  const conteoPorUsuario = useMemo(() => {
    const map = new Map<number, { total: number; completadas: number }>();
    for (const u of initialUsers) {
      map.set(u.id, { total: 0, completadas: 0 });
    }
    for (const t of tasks) {
      for (const a of t.asignados) {
        const prev = map.get(a.id) || { total: 0, completadas: 0 };
        const esComp = t.estado === "Completada" || t.estado === "Aprobada";
        map.set(a.id, {
          total: prev.total + 1,
          completadas: prev.completadas + (esComp ? 1 : 0),
        });
      }
    }
    return map;
  }, [tasks, initialUsers]);

  // Tareas filtradas
  const tareasFiltradas = useMemo(() => {
    return filtrarTareasAgenda(tasks, {
      userId: selectedUserId,
      estado: selectedEstado,
      busqueda,
    });
  }, [tasks, selectedUserId, selectedEstado, busqueda]);

  // Agrupadas por miembro
  const miembrosConTareas = useMemo(() => {
    return agruparTareasPorMiembro(initialUsers, tareasFiltradas, selectedUserId);
  }, [initialUsers, tareasFiltradas, selectedUserId]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Aprobada":
      case "Completada":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1 font-medium">
            <CheckCircle2 className="size-3" /> Hecha
          </Badge>
        );
      case "Esperando_Aprobacion":
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1 font-medium">
            <Eye className="size-3" /> En revisión
          </Badge>
        );
      case "En_progreso":
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 gap-1 font-medium">
            <Play className="size-3" /> En curso
          </Badge>
        );
      case "Vencida":
        return (
          <Badge variant="destructive" className="gap-1 font-medium">
            <AlertCircle className="size-3" /> Atrasada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-white/10 text-muted-foreground gap-1 font-medium">
            <Clock className="size-3" /> Pendiente
          </Badge>
        );
    }
  };

  const getDificultadBadge = (dif?: string) => {
    if (!dif) return null;
    const colores: Record<string, string> = {
      Facil: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
      Media: "text-amber-400 border-amber-500/20 bg-amber-500/10",
      Dificil: "text-orange-400 border-orange-500/20 bg-orange-500/10",
      Ardua: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    };
    return (
      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${colores[dif] || "text-muted-foreground"}`}>
        {dif}
      </span>
    );
  };

  const formatearTiempo = (seg?: number) => {
    if (!seg || seg <= 0) return null;
    const m = Math.round(seg / 60);
    return `${m} min`;
  };

  const formatearHora = (horaIso?: string | null) => {
    if (!horaIso) return null;
    try {
      const d = new Date(horaIso);
      return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  };

  return (
    <div className="dark min-h-screen bg-[radial-gradient(ellipse_at_top,#26180f_0%,#140f0c_50%,#090605_100%)] text-foreground flex flex-col">
      <Particles className="absolute inset-0 pointer-events-none" quantity={60} ease={80} color="#C9A84C" />

      {/* Barra superior del Dashboard */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                title="Volver a la pantalla de acceso"
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
            </Link>

            <div className="h-5 w-px bg-white/10" />

            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <CalendarDays className="size-4" />
                </span>
                <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent">
                  Agenda del Día
                </h1>
              </div>
              <p className="text-xs text-muted-foreground capitalize">{fechaTexto}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle de vistas */}
            <div className="flex items-center rounded-lg border border-white/10 bg-card/60 p-0.5">
              <button
                onClick={() => setVista("miembros")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  vista === "miembros"
                    ? "bg-amber-500/20 text-amber-200 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Vista en columnas por miembro"
              >
                <Users className="size-3.5" />
                <span className="hidden md:inline">Por Miembros</span>
              </button>
              <button
                onClick={() => setVista("lista")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  vista === "lista"
                    ? "bg-amber-500/20 text-amber-200 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Vista cronológica / lista unificada"
              >
                <ListOrdered className="size-3.5" />
                <span className="hidden md:inline">Lista del Día</span>
              </button>
            </div>

            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-amber-500/30 text-xs text-amber-200 hover:bg-amber-500/10"
              >
                <LogIn className="size-3.5 text-amber-400" />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Banner de Resumen / Estadísticas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <Card className="border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Tareas del Día</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-heading">{stats.total}</span>
              <span className="text-xs text-amber-400 font-semibold">{stats.pct}% completas</span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </Card>

          <Card className="border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="size-3 text-amber-400" /> Pendientes
            </span>
            <span className="text-2xl font-bold font-heading mt-1">{stats.pendientes}</span>
            <span className="text-[11px] text-muted-foreground">Por iniciar</span>
          </Card>

          <Card className="border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Play className="size-3 text-sky-400" /> En curso
            </span>
            <span className="text-2xl font-bold font-heading mt-1">{stats.enProgreso}</span>
            <span className="text-[11px] text-muted-foreground">Con cronómetro o activas</span>
          </Card>

          <Card className="border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Eye className="size-3 text-amber-300" /> En revisión
            </span>
            <span className="text-2xl font-bold font-heading mt-1">{stats.enRevision}</span>
            <span className="text-[11px] text-muted-foreground">Esperan aprobación</span>
          </Card>

          <Card className="col-span-2 sm:col-span-4 lg:col-span-1 border-white/10 bg-card/40 backdrop-blur-md p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-400" /> Completadas
            </span>
            <span className="text-2xl font-bold font-heading mt-1 text-emerald-400">{stats.completadas}</span>
            <span className="text-[11px] text-emerald-500/80 font-medium">¡Gran avance hoy!</span>
          </Card>
        </div>

        {/* Fila de Selector Rápido de Miembros (Avatares) */}
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Seleccionar miembro para filtrar
            </span>
            {selectedUserId !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUserId(null)}
                className="h-6 text-xs text-amber-400 hover:text-amber-300 px-2"
              >
                Ver todos
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Opción Todos */}
            <button
              onClick={() => setSelectedUserId(null)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selectedUserId === null
                  ? "bg-amber-500/20 border border-amber-500/50 text-amber-200 shadow-md shadow-amber-950/20"
                  : "bg-muted/40 border border-white/5 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs">
                TODOS
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold leading-tight">Toda la familia</p>
                <p className="text-[10px] text-muted-foreground">{stats.total} tareas hoy</p>
              </div>
            </button>

            {/* Avatares de miembros */}
            {initialUsers.map((u) => {
              const conteo = conteoPorUsuario.get(u.id) || { total: 0, completadas: 0 };
              const isSelected = selectedUserId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(isSelected ? null : u.id)}
                  title={`Ver tareas de ${u.nombre}`}
                  aria-label={`Ver tareas de ${u.nombre}`}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? "bg-amber-500/25 border border-amber-500/60 shadow-lg shadow-amber-950/30 scale-105"
                      : "bg-muted/30 border border-white/5 hover:bg-muted/60 hover:border-white/10"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="size-10 ring-2 ring-white/10 group-hover:ring-amber-400/60 transition-all">
                      <AvatarImage src={u.fotoUrl ?? undefined} alt={u.nombre} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-[#C4956A] to-[#703607] text-sm font-bold text-white">
                        {u.nombre.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {u.emojiPodio && (
                      <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-card text-[9px] border border-white/20">
                        {u.emojiPodio}
                      </span>
                    )}
                  </div>

                  <div className="text-left">
                    <p className={`text-xs font-semibold leading-tight ${isSelected ? "text-amber-100" : "text-foreground"}`}>
                      {u.nombre}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {conteo.completadas}/{conteo.total} hechas
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Filtros secundarios y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {(
              [
                { id: "todas", label: "Todas" },
                { id: "pendientes", label: "Pendientes" },
                { id: "en_revision", label: "En revisión" },
                { id: "completadas", label: "Completadas" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedEstado(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedEstado === f.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar en la agenda..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-9 pl-9 text-xs bg-card/60 border-white/10 rounded-xl"
            />
          </div>
        </div>

        {/* Contenido principal según la vista seleccionada */}
        {tareasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground gap-3 rounded-2xl border border-dashed border-white/10 bg-card/20">
            <CalendarDays className="size-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">No hay tareas programadas para hoy con estos filtros.</p>
            {(selectedUserId !== null || selectedEstado !== "todas" || busqueda) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUserId(null);
                  setSelectedEstado("todas");
                  setBusqueda("");
                }}
                className="text-xs"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : vista === "miembros" ? (
          /* Vista por Columnas / Secciones de Miembros */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
            {miembrosConTareas.map(({ usuario, tareas }) => (
              <Card
                key={usuario.id}
                className="flex flex-col border-white/10 bg-card/50 backdrop-blur-md shadow-xl overflow-hidden"
              >
                {/* Cabecera del Miembro */}
                <CardHeader className="border-b border-white/5 bg-white/[0.02] p-4 flex flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="size-11 ring-2 ring-primary/40">
                        <AvatarImage src={usuario.fotoUrl ?? undefined} alt={usuario.nombre} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-[#C4956A] to-[#703607] text-base font-bold text-white">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {usuario.emojiPodio && (
                        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-card text-[10px] border border-white/20">
                          {usuario.emojiPodio}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base font-heading font-bold">{usuario.nombre}</CardTitle>
                      <CardDescription className="text-xs">
                        {tareas.filter((t) => t.estado === "Completada" || t.estado === "Aprobada").length}/
                        {tareas.length} completadas
                      </CardDescription>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs font-semibold tabular-nums border-white/10">
                    {tareas.length} {tareas.length === 1 ? "tarea" : "tareas"}
                  </Badge>
                </CardHeader>

                <CardContent className="p-3 space-y-3">
                  {tareas.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-6 italic">
                      Sin tareas asignadas para hoy.
                    </p>
                  ) : (
                    tareas.map((task) => (
                      <motion.div
                        key={`${task.id}-${usuario.id}`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setTareaSeleccionada(task)}
                        className="cursor-pointer group flex flex-col gap-2 rounded-xl border border-white/5 bg-background/50 p-3.5 shadow-sm transition-all hover:border-amber-500/40 hover:bg-background/80 hover:shadow-md hover:shadow-amber-950/20"
                      >
                        {/* Estado y Responsables (SOLO AVATARES) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">{getEstadoBadge(task.estado)}</div>

                          {/* AVATAR DE RESPONSABLES DE LA TAREA ESE DÍA (SIN NOMBRES) */}
                          <div className="flex -space-x-2 items-center" title="Responsables de la tarea">
                            {task.asignados.map((asig) => (
                              <Avatar
                                key={asig.id}
                                className="size-6 ring-2 ring-background border border-amber-500/40"
                                title={`Responsable: ${asig.nombre}`}
                                aria-label={`Responsable: ${asig.nombre}`}
                              >
                                <AvatarImage src={asig.fotoUrl || undefined} alt={asig.nombre} />
                                <AvatarFallback className="text-[9px] bg-primary/20 text-primary-foreground font-bold">
                                  {asig.nombre.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>

                        {/* Título de la tarea */}
                        <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-amber-200 transition-colors line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Descripción breve si existe */}
                        {task.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{task.descripcion}</p>
                        )}

                        {/* Metadatos inferiores */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                          {task.dificultad && getDificultadBadge(task.dificultad)}

                          {task.tiempoEstimadoSeg && task.tiempoEstimadoSeg > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatearTiempo(task.tiempoEstimadoSeg)}
                            </span>
                          )}

                          {task.horaEjecucion && (
                            <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                              {formatearHora(task.horaEjecucion)}
                            </span>
                          )}

                          {task.checklistItems && task.checklistItems.length > 0 && (
                            <span className="flex items-center gap-1 ml-auto text-muted-foreground">
                              <CheckSquare className="size-3" />
                              {task.checklistItems.filter((i) => i.completado).length}/{task.checklistItems.length}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Vista de Lista Cronológica / Unificada */
          <div className="space-y-3">
            {tareasFiltradas.map((task) => (
              <motion.div
                key={task.id}
                whileHover={{ scale: 1.005 }}
                onClick={() => setTareaSeleccionada(task)}
                className="cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-card/50 backdrop-blur-md gap-3 shadow-md hover:border-amber-500/40 hover:bg-card/80 transition-all"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Avatares de los responsables (SIN NOMBRES) */}
                  <div className="flex -space-x-2 shrink-0 items-center">
                    {task.asignados.map((asig) => (
                      <Avatar
                        key={asig.id}
                        className="size-9 ring-2 ring-card border border-amber-500/40 shadow-sm"
                        title={`Responsable: ${asig.nombre}`}
                        aria-label={`Responsable: ${asig.nombre}`}
                      >
                        <AvatarImage src={asig.fotoUrl || undefined} alt={asig.nombre} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-[#C4956A] to-[#703607] text-white font-bold">
                          {asig.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-heading text-sm sm:text-base font-semibold text-foreground group-hover:text-amber-200 transition-colors truncate">
                        {task.title}
                      </h4>
                      {task.dificultad && getDificultadBadge(task.dificultad)}
                    </div>
                    {task.descripcion && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.descripcion}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {task.horaEjecucion && (
                    <span className="text-xs text-amber-400 font-medium">
                      {formatearHora(task.horaEjecucion)}
                    </span>
                  )}
                  {task.tiempoEstimadoSeg && task.tiempoEstimadoSeg > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatearTiempo(task.tiempoEstimadoSeg)}
                    </span>
                  )}
                  {getEstadoBadge(task.estado)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalle de Tarea */}
      <AnimatePresence>
        {tareaSeleccionada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-card p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setTareaSeleccionada(null)}
                className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getEstadoBadge(tareaSeleccionada.estado)}
                  {tareaSeleccionada.dificultad && getDificultadBadge(tareaSeleccionada.dificultad)}
                </div>

                <h3 className="font-heading text-xl font-bold text-foreground">
                  {tareaSeleccionada.title}
                </h3>

                {tareaSeleccionada.descripcion && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {tareaSeleccionada.descripcion}
                  </p>
                )}

                {/* Sección Responsables (Con Avatares) */}
                <div className="rounded-xl border border-white/10 bg-muted/20 p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Responsables para hoy
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {tareaSeleccionada.asignados.map((asig) => (
                      <div key={asig.id} className="flex items-center gap-2.5">
                        <Avatar className="size-10 ring-2 ring-primary/40">
                          <AvatarImage src={asig.fotoUrl || undefined} alt={asig.nombre} />
                          <AvatarFallback className="bg-gradient-to-br from-[#C4956A] to-[#703607] font-bold text-white">
                            {asig.nombre.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{asig.nombre}</p>
                          <p className="text-[10px] text-muted-foreground">{asig.rolFamiliar}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist si existe */}
                {tareaSeleccionada.checklistItems && tareaSeleccionada.checklistItems.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Pasos de la tarea ({tareaSeleccionada.checklistItems.filter((i) => i.completado).length}/{tareaSeleccionada.checklistItems.length})
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {tareaSeleccionada.checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2.5 rounded-lg border p-2 text-xs transition-colors ${
                            item.completado
                              ? "border-emerald-500/20 bg-emerald-500/5 text-muted-foreground line-through"
                              : "border-white/5 bg-background/50 text-foreground"
                          }`}
                        >
                          <div
                            className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                              item.completado
                                ? "border-emerald-400 bg-emerald-500/20 text-emerald-400"
                                : "border-white/20"
                            }`}
                          >
                            {item.completado && <Check className="size-3" />}
                          </div>
                          <span>{item.titulo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pie con botón de acceso */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {tareaSeleccionada.puntosGenerados ? (
                      <span className="text-amber-400 font-semibold">+{tareaSeleccionada.puntosGenerados} puntos</span>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTareaSeleccionada(null)}
                    >
                      Cerrar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/")}
                      className="gap-1.5 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                    >
                      <LogIn className="size-3.5" />
                      Ingresar para completar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
