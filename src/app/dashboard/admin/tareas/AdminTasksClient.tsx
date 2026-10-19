"use client";

import { useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Table as TableIcon,
  Calendar as CalendarIcon,
  Repeat,
  Clock,
  HelpCircle,
  Plus,
  ListChecks,
  Trash2,
  Users,
  Trophy,
  Gift,
  ArrowUpDown,
  Search,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import TaskForm from "@/components/dashboard/TaskForm";
import "@/components/tasks/mission-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { SelectorNivel } from "@/components/SelectorNivel";
import { DIFICULTADES, DIFICULTAD_DEFAULT, DIFICULTAD_INFO, esDificultad, type Dificultad } from "@/lib/recompensaTarea";
import { describirRotacion, normalizarRotacionConfig } from "@/lib/rotacionTarea";
import { toast } from "@/lib/toast";
import {
  filtrarYOrdenarTareas,
  groupTasksForTable,
  type FiltroChecklist,
  type FiltroRecurrencia,
  type OrdenTareas,
} from "./filtrosTareas";

moment.locale("es");
const localizer = momentLocalizer(moment);

const COLORES_DIFICULTAD = {
  claro: ["#2D6A2E", "#557224", "#7C7A1A", "#A48210", "#B27809", "#A55C06", "#984103", "#8B2500"],
  oscuro: ["#6AAF6A", "#85AD61", "#A0AB59", "#BBA950", "#CB9E4A", "#CE8947", "#D17543", "#D46040"],
};
const NIVELES_DIFICULTAD = DIFICULTADES.map((d) => ({ valor: d, etiqueta: DIFICULTAD_INFO[d].etiqueta }));

type BulkModalType = null | "assignees" | "dueDate" | "dueTime" | "difficulty" | "reward" | "delete";

export function AdminTasksClient({ tasks, users }: { tasks: any[]; users: any[] }) {
  // Vista de lista (tabla) como vista principal predeterminada
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "agenda">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filtros y ordenamiento
  const [personaId, setPersonaId] = useState<number | null>(null);
  const [dificultadFiltro, setDificultadFiltro] = useState<Dificultad | "todas">("todas");
  const [checklistFiltro, setChecklistFiltro] = useState<FiltroChecklist>("todas");
  const [recurrenciaFiltro, setRecurrenciaFiltro] = useState<FiltroRecurrencia>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<OrdenTareas>("vencimiento_asc");

  // Selección múltiple y acciones en masa
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkModal, setBulkModal] = useState<BulkModalType>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Estados de formularios de edición en masa
  const [bulkUserIds, setBulkUserIds] = useState<number[]>([]);
  const [bulkFecha, setBulkFecha] = useState("");
  const [bulkHora, setBulkHora] = useState("");
  const [bulkDificultad, setBulkDificultad] = useState<Dificultad>(DIFICULTAD_DEFAULT);
  const [bulkRecompensa, setBulkRecompensa] = useState(true);
  const [bulkSorpresa, setBulkSorpresa] = useState(false);

  const groupedTasks = useMemo(() => groupTasksForTable(tasks), [tasks]);

  const filteredTasks = useMemo(
    () =>
      filtrarYOrdenarTareas(groupedTasks, {
        personaId,
        dificultad: dificultadFiltro,
        checklist: checklistFiltro,
        recurrencia: recurrenciaFiltro,
        busqueda,
        orden,
      }),
    [groupedTasks, personaId, dificultadFiltro, checklistFiltro, recurrenciaFiltro, busqueda, orden]
  );

  // Eventos del calendario también respetan los filtros activos
  const filteredRawTasks = useMemo(
    () =>
      filtrarYOrdenarTareas(tasks, {
        personaId,
        dificultad: dificultadFiltro,
        checklist: checklistFiltro,
        recurrencia: recurrenciaFiltro,
        busqueda,
        orden,
      }),
    [tasks, personaId, dificultadFiltro, checklistFiltro, recurrenciaFiltro, busqueda, orden]
  );

  const miembrosDe = (t: any): number[] => {
    const rot = normalizarRotacionConfig(t.rotacionConfig);
    if (rot) return rot.responsablesIds;
    return [
      ...new Set<number>(
        (t.grupoTareaId ? tasks.filter((g) => g.grupoTareaId === t.grupoTareaId) : [t]).map((g) => g.asignadoId)
      ),
    ];
  };

  const visibleIds = useMemo(() => filteredTasks.map((t) => t.id as number), [filteredTasks]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hayFiltrosActivos =
    personaId !== null ||
    dificultadFiltro !== "todas" ||
    checklistFiltro !== "todas" ||
    recurrenciaFiltro !== "todas" ||
    busqueda.trim() !== "";

  const limpiarFiltros = () => {
    setPersonaId(null);
    setDificultadFiltro("todas");
    setChecklistFiltro("todas");
    setRecurrenciaFiltro("todas");
    setBusqueda("");
  };

  const events = filteredRawTasks.map((t) => {
    let start = new Date(t.fechaVencimiento || new Date());
    let end = new Date(start);
    let allDay = true;

    if (t.horaEjecucion) {
      start = new Date(t.horaEjecucion);
      end = new Date(start.getTime() + t.tiempoEjecucionEstimadoSeg * 1000);
      allDay = false;
    }

    return { id: t.id, title: t.titulo, start, end, allDay, resource: t };
  });

  const CustomEvent = ({ event }: any) => {
    const task = event.resource;
    return (
      <div className="flex items-center gap-1 text-[11px] leading-tight px-1 py-0.5 font-semibold text-white overflow-hidden w-full h-full">
        {task.asignado?.fotoUrl ? (
          <img
            src={task.asignado.fotoUrl}
            alt="Avatar"
            className="w-4 h-4 rounded-full flex-shrink-0 border border-white/50"
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 text-[9px]">
            {task.asignado?.nombre.charAt(0)}
          </div>
        )}
        <span className="truncate">{event.title}</span>
        {task.tipoRecurrencia !== "Unica" && (
          <span title="Recurrente">
            <Repeat className="w-3 h-3 text-white/80 flex-shrink-0" />
          </span>
        )}
      </div>
    );
  };

  const eventPropGetter = (event: any) => {
    const task = event.resource;
    let backgroundColor = "var(--primary)";
    if (task.estado === "Completada" || task.estado === "Aprobada") backgroundColor = "var(--success)";
    if (task.estado === "Vencida" || task.estado === "Expirada") backgroundColor = "var(--error)";
    if (task.estado === "Esperando_Aprobacion") backgroundColor = "var(--warning)";

    return {
      style: {
        backgroundColor,
        border: "none",
        borderRadius: "4px",
        boxShadow: "0 1px 2px rgba(80,35,0,0.1)",
        cursor: "pointer",
      },
    };
  };

  const handleDelete = async (taskId: number, grupoTareaId?: string | null) => {
    const msg = grupoTareaId
      ? "¿Eliminar esta tarea y todas sus copias de co-responsables?"
      : "¿Estás seguro de que deseas eliminar esta tarea?";
    if (!confirm(msg)) return;

    setDeletingId(taskId);
    try {
      const url = grupoTareaId ? `/api/tasks/${taskId}?grupoTareaId=${grupoTareaId}` : `/api/tasks/${taskId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        toast.error("Error al eliminar la tarea");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const ejecutarAccionEnMasa = async (payload: Record<string, any>) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], ...payload }),
      });
      if (res.ok) {
        toast.success("Cambios aplicados a las tareas seleccionadas");
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "No se pudo aplicar la acción en masa");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setBulkLoading(false);
    }
  };

  const statusVariant = (estado: string) =>
    estado === "Completada" || estado === "Aprobada"
      ? "var(--success)"
      : estado === "Vencida" || estado === "Expirada"
      ? "var(--error)"
      : estado === "Esperando_Aprobacion"
      ? "var(--secondary)"
      : "var(--primary)";

  const formatVencimiento = (t: any) => {
    const fechaStr = t.fechaVencimiento
      ? new Date(t.fechaVencimiento).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })
      : null;
    const horaStr = t.horaEjecucion
      ? new Date(t.horaEjecucion).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
      : null;
    if (fechaStr && horaStr) return `${fechaStr} · ${horaStr}`;
    return fechaStr || horaStr || "Sin fecha";
  };

  const formatMinutos = (seg?: number | null) => {
    if (!seg || seg <= 0) return "-";
    const min = Math.round(seg / 60);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card className="flex-1 gap-0 py-0">
        <CardHeader className="flex flex-col gap-4 border-b py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Tareas de la familia</CardTitle>
              <Badge variant="secondary" className="tabular-nums">
                {filteredTasks.length}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => setCreatingTask(true)}>
                <Plus /> Nueva tarea
              </Button>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as "table" | "calendar")}
                aria-label="Vista"
              >
                <ToggleGroupItem value="table" className="gap-1.5 px-2.5">
                  <TableIcon /> <span className="hidden sm:inline">Lista</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="calendar" className="gap-1.5 px-2.5">
                  <CalendarIcon /> <span className="hidden sm:inline">Calendario</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Barra de filtros y ordenamiento */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar tarea..."
                aria-label="Buscar tarea"
                className="pl-8"
              />
            </div>

            <NativeSelect
              aria-label="Filtrar por persona"
              value={personaId === null ? "todas" : String(personaId)}
              onChange={(e) => setPersonaId(e.target.value === "todas" ? null : Number(e.target.value))}
              className="w-full"
            >
              <NativeSelectOption value="todas">Persona: Todas</NativeSelectOption>
              {users.map((u) => (
                <NativeSelectOption key={u.id} value={String(u.id)}>
                  {u.nombre} ({u.rolFamiliar})
                </NativeSelectOption>
              ))}
            </NativeSelect>

            <NativeSelect
              aria-label="Filtrar por dificultad"
              value={dificultadFiltro}
              onChange={(e) => setDificultadFiltro(e.target.value as Dificultad | "todas")}
              className="w-full"
            >
              <NativeSelectOption value="todas">Dificultad: Todas</NativeSelectOption>
              {DIFICULTADES.map((d) => (
                <NativeSelectOption key={d} value={d}>
                  {DIFICULTAD_INFO[d].etiqueta}
                </NativeSelectOption>
              ))}
            </NativeSelect>

            <NativeSelect
              aria-label="Filtrar por checklist"
              value={checklistFiltro}
              onChange={(e) => setChecklistFiltro(e.target.value as FiltroChecklist)}
              className="w-full"
            >
              <NativeSelectOption value="todas">Checklist: Todas</NativeSelectOption>
              <NativeSelectOption value="con">Con checklist</NativeSelectOption>
              <NativeSelectOption value="sin">Sin checklist</NativeSelectOption>
            </NativeSelect>

            <NativeSelect
              aria-label="Filtrar por recurrencia"
              value={recurrenciaFiltro}
              onChange={(e) => setRecurrenciaFiltro(e.target.value as FiltroRecurrencia)}
              className="w-full"
            >
              <NativeSelectOption value="todas">Recurrencia: Todas</NativeSelectOption>
              <NativeSelectOption value="recurrente">Recurrentes</NativeSelectOption>
              <NativeSelectOption value="unica">No recurrentes (Únicas)</NativeSelectOption>
            </NativeSelect>

            <NativeSelect
              aria-label="Ordenar tareas"
              value={orden}
              onChange={(e) => setOrden(e.target.value as OrdenTareas)}
              className="w-full"
            >
              <NativeSelectOption value="vencimiento_asc">Ordenar: Vencimiento (próximas)</NativeSelectOption>
              <NativeSelectOption value="vencimiento_desc">Ordenar: Vencimiento (lejanas)</NativeSelectOption>
              <NativeSelectOption value="tiempo_asc">Ordenar: Tiempo (menor a mayor)</NativeSelectOption>
              <NativeSelectOption value="tiempo_desc">Ordenar: Tiempo (mayor a menor)</NativeSelectOption>
            </NativeSelect>
          </div>

          {hayFiltrosActivos && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Mostrando {filteredTasks.length} de {groupedTasks.length} tareas</span>
              <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="h-7 px-2 text-xs">
                <X className="size-3.5" /> Limpiar filtros
              </Button>
            </div>
          )}

          {/* Barra de acciones en masa cuando hay tareas seleccionadas */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge className="tabular-nums">{selectedIds.size}</Badge>
                <span>{selectedIds.size === 1 ? "tarea seleccionada" : "tareas seleccionadas"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  className="h-7 px-2 text-xs text-muted-foreground"
                >
                  Deseleccionar
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkUserIds([]);
                    setBulkModal("assignees");
                  }}
                >
                  <Users className="size-3.5" /> Asignación
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkFecha("");
                    setBulkModal("dueDate");
                  }}
                >
                  <CalendarIcon className="size-3.5" /> Fecha límite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkHora("");
                    setBulkModal("dueTime");
                  }}
                >
                  <Clock className="size-3.5" /> Hora límite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkDificultad(DIFICULTAD_DEFAULT);
                    setBulkModal("difficulty");
                  }}
                >
                  <Trophy className="size-3.5" /> Dificultad
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkRecompensa(true);
                    setBulkSorpresa(false);
                    setBulkModal("reward");
                  }}
                >
                  <Gift className="size-3.5" /> Recompensa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkModal("delete")}
                  className="text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Eliminar ({selectedIds.size})
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="relative flex-1 p-4 sm:p-6">
          {viewMode === "table" && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        aria-label="Seleccionar todas las tareas visibles"
                        checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Asignado(s)</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => setOrden(orden === "tiempo_asc" ? "tiempo_desc" : "tiempo_asc")}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        Tiempo <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => setOrden(orden === "vencimiento_asc" ? "vencimiento_desc" : "vencimiento_asc")}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        Vencimiento <ArrowUpDown className="size-3" />
                      </button>
                    </TableHead>
                    <TableHead>Recurrencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="pr-4 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((t) => {
                    const isSelected = selectedIds.has(t.id);
                    const tieneChecklist =
                      Boolean(t.isChecklist) || (Array.isArray(t.checklistItems) && t.checklistItems.length > 0);
                    return (
                      <TableRow
                        key={t.id}
                        data-state={isSelected ? "selected" : undefined}
                        onClick={() => setSelectedTask(t)}
                        className="cursor-pointer"
                      >
                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label={`Seleccionar ${t.titulo}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOne(t.id)}
                          />
                        </TableCell>
                        <TableCell className="max-w-72">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium">{t.titulo}</span>
                            {tieneChecklist && (
                              <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[11px]" title="Con checklist">
                                <ListChecks className="size-3 text-[var(--success)]" />
                                {Array.isArray(t.checklistItems) && t.checklistItems.length > 0
                                  ? t.checklistItems.length
                                  : ""}
                              </Badge>
                            )}
                            {!t.generaPuntosYRecompensa && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[11px] text-muted-foreground">
                                Sin pts
                              </Badge>
                            )}
                            {t.isSurpriseEligible && (
                              <span title="Genera recompensa sorpresa" className="text-xs">
                                🎁
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {t.descripcion || "Sin descripción"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <AvatarGroup>
                              {t._assignees.map((a: any, i: number) => (
                                <Avatar key={a.id || i} className="size-6" title={a.nombre}>
                                  <AvatarImage src={a.fotoUrl ?? undefined} alt={a.nombre} className="object-cover" />
                                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                    {a.nombre?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </AvatarGroup>
                            {t._assignees.length === 1 && (
                              <span className="text-sm whitespace-nowrap">{t._assignees[0]?.nombre || "N/A"}</span>
                            )}
                            {t._assignees.length > 1 && (
                              <span className="text-xs font-medium text-primary">({t._assignees.length})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {esDificultad(t.dificultad) ? (
                            <Badge variant="outline" className="text-xs">
                              {DIFICULTAD_INFO[t.dificultad as Dificultad].etiqueta}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Media</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-3.5" /> {formatMinutos(t.tiempoEjecucionEstimadoSeg)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap tabular-nums">
                          {formatVencimiento(t)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(() => {
                            const rot = normalizarRotacionConfig(t.rotacionConfig);
                            if (rot) {
                              const desc = describirRotacion(rot) ?? "Rotativa";
                              return (
                                <span className="flex items-center gap-1 font-medium text-primary" title={desc}>
                                  <Repeat className="size-3 shrink-0" /> {desc}
                                </span>
                              );
                            }
                            if (t.tipoRecurrencia === "Unica") {
                              return <span className="text-muted-foreground">Única</span>;
                            }
                            return (
                              <span className="flex items-center gap-1 font-medium text-primary">
                                <Repeat className="size-3" /> {t.tipoRecurrencia.replace("_", " ")}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ background: statusVariant(t.estado) }}
                            />
                            {t.estado.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletingId !== null}
                            onClick={() => handleDelete(t.id, t.grupoTareaId)}
                            className="text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            {deletingId === t.id ? "..." : "Eliminar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredTasks.length === 0 && (
                <Empty className="py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HelpCircle />
                    </EmptyMedia>
                    <EmptyTitle>
                      {tasks.length === 0
                        ? "No hay tareas registradas en el sistema global."
                        : "Ninguna tarea coincide con los filtros seleccionados."}
                    </EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          )}

          {viewMode === "calendar" && (
            <div className="mission-calendar h-[650px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={["month", "week", "agenda"]}
                view={calendarView}
                onView={(cv: any) => setCalendarView(cv)}
                date={currentDate}
                onNavigate={(d: any) => setCurrentDate(d)}
                onSelectEvent={(event) => setSelectedTask(event.resource)}
                components={{ event: CustomEvent }}
                eventPropGetter={eventPropGetter}
                messages={{
                  allDay: "Todo el día",
                  previous: "Anterior",
                  next: "Siguiente",
                  today: "Hoy",
                  month: "Mensual",
                  week: "Semanal",
                  day: "Diaria",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Misión",
                  noEventsInRange: "No hay misiones programadas en esta franja.",
                }}
              />
            </div>
          )}
        </CardContent>

        {/* CREATE TASK MODAL — uses unified TaskForm */}
        {creatingTask && (
          <Modal isOpen={creatingTask} onClose={() => setCreatingTask(false)} title="Nueva tarea">
            <TaskForm users={users} isModal={true} onSuccess={() => window.location.reload()} />
          </Modal>
        )}

        {/* EDIT TASK MODAL — uses unified TaskForm */}
        {selectedTask && (
          <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Editar Misión">
            <TaskForm
              users={users}
              task={{ ...selectedTask, asignadoIds: miembrosDe(selectedTask) }}
              isModal={true}
              onSuccess={() => window.location.reload()}
            />
          </Modal>
        )}

        {/* BULK MODALS */}
        {bulkModal === "assignees" && (
          <Modal isOpen onClose={() => setBulkModal(null)} title={`Editar asignación (${selectedIds.size})`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (bulkUserIds.length === 0) {
                  toast.error("Selecciona al menos una persona");
                  return;
                }
                void ejecutarAccionEnMasa({ action: "assignees", asignadoIds: bulkUserIds });
              }}
              className="space-y-4"
            >
              <FieldSet>
                <FieldLegend variant="label" className="flex items-center gap-2">
                  <Users className="size-4 text-primary" /> Asignar las tareas seleccionadas a:
                </FieldLegend>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  value={bulkUserIds.map(String)}
                  className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  {users.map((u) => (
                    <ToggleGroupItem
                      key={u.id}
                      value={String(u.id)}
                      onClick={() =>
                        setBulkUserIds((prev) =>
                          prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }
                      className="h-auto justify-start gap-3 rounded-lg! border px-3 py-2.5 data-[state=on]:border-primary data-[state=on]:bg-primary/5"
                    >
                      <Avatar className="size-8">
                        <AvatarImage src={u.fotoUrl ?? undefined} alt={u.nombre} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {u.nombre.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 text-left">
                        <span className="block truncate text-sm font-medium">{u.nombre}</span>
                        <span className="block text-xs text-muted-foreground">{u.rolFamiliar}</span>
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldSet>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkModal(null)} disabled={bulkLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={bulkLoading}>
                  {bulkLoading ? "Guardando..." : "Aplicar asignación"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {bulkModal === "dueDate" && (
          <Modal isOpen onClose={() => setBulkModal(null)} title={`Editar fecha límite (${selectedIds.size})`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!bulkFecha) {
                  toast.error("Elegí una fecha límite");
                  return;
                }
                void ejecutarAccionEnMasa({ action: "dueDate", fecha: bulkFecha });
              }}
              className="space-y-4"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="bulk-fecha">Nueva fecha límite</FieldLabel>
                  <Input
                    id="bulk-fecha"
                    type="date"
                    required
                    value={bulkFecha}
                    onChange={(e) => setBulkFecha(e.target.value)}
                  />
                  <FieldDescription>
                    Se actualizará la fecha de vencimiento conservando la hora límite de cada tarea.
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkModal(null)} disabled={bulkLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={bulkLoading}>
                  {bulkLoading ? "Guardando..." : "Aplicar fecha"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {bulkModal === "dueTime" && (
          <Modal isOpen onClose={() => setBulkModal(null)} title={`Editar hora límite (${selectedIds.size})`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!bulkHora) {
                  toast.error("Elegí una hora límite");
                  return;
                }
                void ejecutarAccionEnMasa({ action: "dueTime", hora: bulkHora });
              }}
              className="space-y-4"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="bulk-hora">Nueva hora límite</FieldLabel>
                  <Input
                    id="bulk-hora"
                    type="time"
                    required
                    value={bulkHora}
                    onChange={(e) => setBulkHora(e.target.value)}
                  />
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkModal(null)} disabled={bulkLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={bulkLoading}>
                  {bulkLoading ? "Guardando..." : "Aplicar hora"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {bulkModal === "difficulty" && (
          <Modal isOpen onClose={() => setBulkModal(null)} title={`Editar dificultad (${selectedIds.size})`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ejecutarAccionEnMasa({ action: "difficulty", dificultad: bulkDificultad });
              }}
              className="space-y-4"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="bulk-dificultad">Nueva dificultad</FieldLabel>
                  <SelectorNivel
                    id="bulk-dificultad"
                    niveles={NIVELES_DIFICULTAD}
                    valor={bulkDificultad}
                    onChange={setBulkDificultad}
                    colores={COLORES_DIFICULTAD}
                    ariaLabel="Nueva dificultad para las tareas seleccionadas"
                  />
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkModal(null)} disabled={bulkLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={bulkLoading}>
                  {bulkLoading ? "Guardando..." : "Aplicar dificultad"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {bulkModal === "reward" && (
          <Modal isOpen onClose={() => setBulkModal(null)} title={`Editar recompensas (${selectedIds.size})`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ejecutarAccionEnMasa({
                  action: "reward",
                  generaRecompensa: bulkRecompensa,
                  isSurpriseEligible: bulkRecompensa ? bulkSorpresa : false,
                });
              }}
              className="space-y-4"
            >
              <FieldGroup>
                <Field orientation="horizontal" className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex-1">
                    <FieldLabel htmlFor="bulk-recompensa">¿Genera puntos y recompensa?</FieldLabel>
                    <FieldDescription>
                      Si está activo, al aprobar la tarea suma puntos, experiencia y racha.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="bulk-recompensa"
                    checked={bulkRecompensa}
                    onCheckedChange={(v) => {
                      setBulkRecompensa(v);
                      if (!v) setBulkSorpresa(false);
                    }}
                  />
                </Field>

                {bulkRecompensa && (
                  <Field orientation="horizontal" className="rounded-lg border bg-muted/40 p-4">
                    <Checkbox
                      id="bulk-sorpresa"
                      checked={bulkSorpresa}
                      onCheckedChange={(v) => setBulkSorpresa(v === true)}
                    />
                    <FieldLabel htmlFor="bulk-sorpresa" className="flex items-center gap-2 text-secondary">
                      <Gift className="size-4" /> ¿Genera recompensas sorpresa al completarse?
                    </FieldLabel>
                  </Field>
                )}
              </FieldGroup>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkModal(null)} disabled={bulkLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={bulkLoading}>
                  {bulkLoading ? "Guardando..." : "Aplicar cambios"}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {bulkModal === "delete" && (
          <Modal isOpen onClose={() => setBulkModal(null)} title={`Eliminar tareas (${selectedIds.size})`}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Estás seguro de que querés eliminar las <strong>{selectedIds.size}</strong> tareas seleccionadas (y
                sus copias de co-responsables si son grupales)? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBulkModal(null)} disabled={bulkLoading}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={bulkLoading}
                  onClick={() => void ejecutarAccionEnMasa({ action: "delete" })}
                >
                  {bulkLoading ? "Eliminando..." : "Eliminar tareas"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </Card>
    </div>
  );
}
