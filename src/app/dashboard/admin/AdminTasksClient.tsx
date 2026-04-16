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

  return (
    <div className="flex flex-col flex-1">
      <ParentReviewPanel tasks={tasks} />

      <div className="flex flex-col flex-1 bg-[var(--surface-container-lowest)] rounded-md elevation-ambient border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] overflow-hidden">
      {/* TOOLBAR */}
      <div className="bg-[var(--surface-container-low)] p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] flex justify-between items-center sm:px-8">
        <h2 className="font-headline text-2xl text-[var(--on-surface)]">Centro de Operaciones</h2>
        <div className="flex bg-[var(--surface-container)] p-1 rounded-md">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${viewMode === "calendar" ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] shadow-[0_1px_2px_rgba(80,35,0,0.06)]" : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"}`}
          >
            <CalendarIcon className="w-4 h-4" /> <span className="hidden sm:inline">Calendario</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${viewMode === "table" ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] shadow-[0_1px_2px_rgba(80,35,0,0.06)]" : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"}`}
          >
            <TableIcon className="w-4 h-4" /> <span className="hidden sm:inline">Tabla Detalles</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 relative">
        {viewMode === "calendar" && (
          <div className="h-[650px] font-sans text-[var(--on-surface)]">
            <style dangerouslySetInnerHTML={{__html: `
              .rbc-calendar { border: none !important; }
              .rbc-header { padding: 10px 0; font-family: var(--newsreader), serif; font-weight: 700; color: var(--on-surface-variant); border-bottom: 1px solid var(--outline) !important; }
              .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid var(--outline); border-radius: 6px; overflow: hidden; background-color: var(--surface-container-lowest); }
              .rbc-today { background-color: var(--surface-container-low); }
              .rbc-event { padding: 2px 4px !important; cursor: pointer; }
              .rbc-btn-group button { color: var(--on-surface-variant); border-color: var(--outline); font-family: var(--noto-serif), serif; }
              .rbc-btn-group button.rbc-active { background-color: var(--primary); color: var(--on-primary); border-color: var(--primary); box-shadow: none !important; }
              .dark .rbc-header { color: var(--on-surface-variant); border-color: var(--outline) !important; }
              .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: var(--outline); }
              .dark .rbc-today { background-color: var(--surface-container-low); }
              .dark .rbc-btn-group button { color: var(--on-surface-variant); border-color: var(--outline); }
            `}} />
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
          <div className="overflow-x-auto w-full custom-scrollbar pb-6 rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] text-sm tracking-wider uppercase font-title font-bold">
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">ID</th>
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Tarea</th>
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Asignado(s)</th>
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Estado</th>
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Recurrencia</th>
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Ejecución Real</th>
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Pts Reales</th>
                  <th className="p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-[var(--on-surface)] font-body bg-[var(--surface-container-lowest)]">
                {groupedTasks.map(t => (
                  <tr key={t.id} onClick={() => setSelectedTask(t)} className="cursor-pointer border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] hover:bg-[var(--surface-container-low)] transition-colors">
                    <td className="p-4 text-[var(--on-surface-variant)] text-sm">
                      #{t.id}
                      {t._isGrouped && <span className="ml-1 text-xs text-[var(--warning)] font-bold" title="Tarea grupal">👥</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-title text-[var(--on-surface)]">{t.titulo}</span>
                        <span className="text-xs text-[var(--on-surface-variant)] line-clamp-1 mt-0.5">{t.descripcion || "Sin descripción"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {t._assignees.map((a: any, i: number) => (
                          <div key={a.id || i} className="flex items-center gap-1" title={a.nombre}>
                            {a.fotoUrl ?
                              <img src={a.fotoUrl} className="w-6 h-6 rounded-full object-cover ghost-border" /> :
                              <div className="w-6 h-6 rounded-full bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] text-[var(--primary)] text-xs flex items-center justify-center font-bold font-title">{a.nombre?.charAt(0)}</div>
                            }
                          </div>
                        ))}
                        {t._assignees.length === 1 && <span className="whitespace-nowrap ml-1 text-sm font-title mt-0.5">{t._assignees[0]?.nombre || "N/A"}</span>}
                        {t._assignees.length > 1 && <span className="text-xs text-[var(--primary)] font-bold ml-1">({t._assignees.length})</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                        t.estado === "Completada" || t.estado === "Aprobada" ? "bg-[color-mix(in-srgb,var(--success)_10%,transparent)] text-[var(--success)]" : 
                        t.estado === "Vencida" || t.estado === "Expirada" ? "bg-[color-mix(in-srgb,var(--error)_10%,transparent)] text-[var(--error)]" : 
                        t.estado === "Esperando_Aprobacion" ? "bg-[color-mix(in-srgb,var(--secondary)_10%,transparent)] text-[var(--secondary)]" :
                        "bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] text-[var(--primary)]"
                      }`}>
                        {t.estado.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-title">
                      {t.tipoRecurrencia === "Unica" ? <span className="text-[var(--on-surface-variant)]">Única</span> : <span className="flex items-center gap-1 text-[var(--primary)] font-bold"><Repeat className="w-3 h-3"/> {t.tipoRecurrencia}</span>}
                    </td>
                    <td className="p-4 text-sm">
                      {t.tiempoRealEjecucionSeg !== null ? (
                        <span className="flex items-center gap-1 text-[var(--secondary)]"><Clock className="w-4 h-4"/> {t.tiempoRealEjecucionSeg}s</span>
                      ) : "-"}
                    </td>
                    <td className="p-4 text-sm">
                      {t.puntosGanadosPerdidos !== null ? (
                        <span className={t.puntosGanadosPerdidos > 0 ? "text-[var(--success)] font-bold" : "text-[var(--error)] font-bold"}>
                          {t.puntosGanadosPerdidos > 0 ? "+" : ""}{t.puntosGanadosPerdidos}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={deletingId !== null}
                        onClick={() => handleDelete(t.id, t.grupoTareaId)}
                        className="text-[var(--error)] hover:opacity-80 text-xs font-bold px-3 py-1.5 border border-[color-mix(in-srgb,var(--error)_30%,transparent)] rounded-md hover:bg-[color-mix(in-srgb,var(--error)_5%,transparent)] transition-colors disabled:opacity-50"
                      >
                        {deletingId === t.id ? "..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length === 0 && (
              <div className="p-16 text-center text-[var(--on-surface-variant)] flex flex-col items-center gap-2 font-bold font-title text-lg">
                <HelpCircle className="w-12 h-12 text-[var(--outline)]" /> No hay tareas registradas en el sistema global.
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT TASK MODAL — uses unified TaskForm */}
      {selectedTask && (
        <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Editar Misión">
          <TaskForm
            users={users}
            task={selectedTask}
            isModal={true}
            onSuccess={() => window.location.reload()}
          />
        </Modal>
      )}
      </div>
    </div>
  );
}
