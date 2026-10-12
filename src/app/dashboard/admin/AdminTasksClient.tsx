"use client";

import { useState } from "react";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Table as TableIcon, Calendar as CalendarIcon, Repeat, Clock, HelpCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ParentReviewPanel } from "@/components/dashboard/ParentReviewPanel";
import TaskForm from "@/components/dashboard/TaskForm";
import "@/components/tasks/mission-calendar.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

moment.locale('es');
const localizer = momentLocalizer(moment);

// Group tasks by grupoTareaId for the table view
function groupTasksForTable(tasks: any[]) {
  const grouped: any[] = [];
  const seenGroups = new Set<string>();

  for (const t of tasks) {
    if (t.grupoTareaId) {
      if (seenGroups.has(t.grupoTareaId)) continue;
      seenGroups.add(t.grupoTareaId);
      // Find all tasks in this group
      const groupTasks = tasks.filter(gt => gt.grupoTareaId === t.grupoTareaId);
      const assignees = groupTasks.map(gt => gt.asignado).filter(Boolean);
      grouped.push({
        ...t,
        _isGrouped: true,
        _groupTasks: groupTasks,
        _assignees: assignees,
      });
    } else {
      grouped.push({ ...t, _isGrouped: false, _groupTasks: [t], _assignees: [t.asignado].filter(Boolean) });
    }
  }
  return grouped;
}

export function AdminTasksClient({ tasks, users }: { tasks: any[], users: any[] }) {
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [calendarView, setCalendarView] = useState<"month"|"week"|"agenda">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const groupedTasks = groupTasksForTable(tasks);
  const miembrosDe = (t: any): number[] => [...new Set<number>(
    (t.grupoTareaId ? tasks.filter(g => g.grupoTareaId === t.grupoTareaId) : [t]).map(g => g.asignadoId)
  )];

  const events = tasks.map(t => {
    let start = new Date(t.fechaVencimiento || new Date());
    let end = new Date(start);
    let allDay = true;

    if (t.horaEjecucion) {
      start = new Date(t.horaEjecucion);
      end = new Date(start.getTime() + (t.tiempoEjecucionEstimadoSeg * 1000));
      allDay = false;
    }

    return { id: t.id, title: t.titulo, start, end, allDay, resource: t };
  });

  const CustomEvent = ({ event }: any) => {
    const task = event.resource;
    return (
      <div className="flex items-center gap-1 text-[11px] leading-tight px-1 py-0.5 font-semibold text-white overflow-hidden w-full h-full">
        {task.asignado?.fotoUrl ? (
          <img src={task.asignado.fotoUrl} alt="Avatar" className="w-4 h-4 rounded-full flex-shrink-0 border border-white/50" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 text-[9px]">
            {task.asignado?.nombre.charAt(0)}
          </div>
        )}
        <span className="truncate">{event.title}</span>
        {task.tipoRecurrencia !== "Unica" && <span title="Recurrente"><Repeat className="w-3 h-3 text-white/80 flex-shrink-0" /></span>}
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
        cursor: "pointer"
      }
    };
  };

  const handleDelete = async (taskId: number, grupoTareaId?: string | null) => {
    const msg = grupoTareaId 
      ? "¿Eliminar esta tarea y todas sus copias de co-responsables?"
      : "¿Estás seguro de que deseas eliminar esta tarea?";
    if (!confirm(msg)) return;
    
    setDeletingId(taskId);
    try {
      const url = grupoTareaId 
        ? `/api/tasks/${taskId}?grupoTareaId=${grupoTareaId}`
        : `/api/tasks/${taskId}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Error al eliminar la tarea");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  const statusVariant = (estado: string) =>
    estado === "Completada" || estado === "Aprobada" ? "var(--success)"
      : estado === "Vencida" || estado === "Expirada" ? "var(--error)"
      : estado === "Esperando_Aprobacion" ? "var(--secondary)"
      : "var(--primary)";

  return (
    <div className="flex flex-1 flex-col">
      <ParentReviewPanel tasks={tasks} />

      <Card className="flex-1 gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-4">
          <CardTitle className="text-base">Centro de Operaciones</CardTitle>
          <ToggleGroup type="single" variant="outline" size="sm" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} aria-label="Vista">
            <ToggleGroupItem value="calendar" className="gap-1.5 px-2.5"><CalendarIcon /> <span className="hidden sm:inline">Calendario</span></ToggleGroupItem>
            <ToggleGroupItem value="table" className="gap-1.5 px-2.5"><TableIcon /> <span className="hidden sm:inline">Tabla Detalles</span></ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>

        <CardContent className="relative flex-1 p-4 sm:p-6">
          {viewMode === "calendar" && (
            <div className="mission-calendar h-[650px]">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={['month', 'week', 'agenda']}
                view={calendarView}
                onView={(cv: any) => setCalendarView(cv)}
                date={currentDate}
                onNavigate={(d: any) => setCurrentDate(d)}
                onSelectEvent={(event) => setSelectedTask(event.resource)}
                components={{ event: CustomEvent }}
                eventPropGetter={eventPropGetter}
                messages={{
                  allDay: 'Todo el día',
                  previous: 'Anterior',
                  next: 'Siguiente',
                  today: 'Hoy',
                  month: 'Mensual',
                  week: 'Semanal',
                  day: 'Diaria',
                  agenda: 'Agenda',
                  date: 'Fecha',
                  time: 'Hora',
                  event: 'Misión',
                  noEventsInRange: 'No hay misiones programadas en esta franja.'
                }}
              />
            </div>
          )}

          {viewMode === "table" && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-4">ID</TableHead>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Asignado(s)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Recurrencia</TableHead>
                    <TableHead>Ejecución Real</TableHead>
                    <TableHead>Pts Reales</TableHead>
                    <TableHead className="pr-4 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTasks.map(t => (
                    <TableRow key={t.id} onClick={() => setSelectedTask(t)} className="cursor-pointer">
                      <TableCell className="pl-4 text-muted-foreground tabular-nums">
                        #{t.id}
                        {t._isGrouped && <span className="ml-1" title="Tarea grupal">👥</span>}
                      </TableCell>
                      <TableCell className="max-w-72">
                        <div className="truncate font-medium">{t.titulo}</div>
                        <div className="truncate text-xs text-muted-foreground">{t.descripcion || "Sin descripción"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <AvatarGroup>
                            {t._assignees.map((a: any, i: number) => (
                              <Avatar key={a.id || i} className="size-6" title={a.nombre}>
                                <AvatarImage src={a.fotoUrl ?? undefined} alt={a.nombre} className="object-cover" />
                                <AvatarFallback className="bg-primary/10 text-xs text-primary">{a.nombre?.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ))}
                          </AvatarGroup>
                          {t._assignees.length === 1 && <span className="text-sm whitespace-nowrap">{t._assignees[0]?.nombre || "N/A"}</span>}
                          {t._assignees.length > 1 && <span className="text-xs font-medium text-primary">({t._assignees.length})</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1.5">
                          <span className="size-1.5 rounded-full" style={{ background: statusVariant(t.estado) }} />
                          {t.estado.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.tipoRecurrencia === "Unica" ? <span className="text-muted-foreground">Única</span> : <span className="flex items-center gap-1 font-medium text-primary"><Repeat className="size-3" /> {t.tipoRecurrencia}</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.tiempoRealEjecucionSeg !== null ? (
                          <span className="flex items-center gap-1 text-secondary tabular-nums"><Clock className="size-3.5" /> {t.tiempoRealEjecucionSeg}s</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {t.puntosGanadosPerdidos !== null ? (
                          <span className={t.puntosGanadosPerdidos > 0 ? "font-medium text-[var(--success)]" : "font-medium text-destructive"}>
                            {t.puntosGanadosPerdidos > 0 ? "+" : ""}{t.puntosGanadosPerdidos}
                          </span>
                        ) : "-"}
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
                  ))}
                </TableBody>
              </Table>
              {tasks.length === 0 && (
                <Empty className="py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><HelpCircle /></EmptyMedia>
                    <EmptyTitle>No hay tareas registradas en el sistema global.</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          )}
        </CardContent>

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
      </Card>
    </div>
  );
}
