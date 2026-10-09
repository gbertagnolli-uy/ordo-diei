"use client";

import { useState } from "react";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Table as TableIcon, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";

moment.locale('es');
const localizer = momentLocalizer(moment);

export function UserCalendarTable({ tasks }: { tasks: any[] }) {
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [calendarView, setCalendarView] = useState<"month"|"week"|"agenda">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

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
        borderRadius: "6px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }
    };
  };

  return (
    <div className="flex flex-col flex-1 bg-[var(--surface-container-lowest)] rounded-md elevation-ambient border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] overflow-hidden mt-8">
      <div className="bg-[var(--surface-container-low)] p-4 border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] flex justify-between items-center sm:px-8">
        <h2 className="text-xl font-headline font-bold text-[var(--on-surface)] flex items-center gap-2">
           <CalendarIcon className="w-5 h-5" /> Mi Agenda de Misiones
        </h2>
        <div className="flex bg-[var(--surface-container)] p-1 rounded-md">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-title font-bold transition-all ${viewMode === "calendar" ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] elevation-ambient" : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"}`}
          >
            <CalendarIcon className="w-4 h-4" /> <span className="hidden sm:inline">Calendario</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-title font-bold transition-all ${viewMode === "table" ? "bg-[var(--surface-container-lowest)] text-[var(--primary)] elevation-ambient" : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"}`}
          >
            <TableIcon className="w-4 h-4" /> <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 relative">
        {viewMode === "calendar" && (
          <div className="h-[500px] font-sans dark:text-white">
            <style dangerouslySetInnerHTML={{__html: `
              .rbc-calendar { border: none !important; }
              .rbc-header { padding: 10px 0; font-weight: 700; color: var(--on-surface); border-bottom: 2px solid var(--outline-variant) !important; }
              .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid var(--outline-variant); border-radius: 6px; overflow: hidden; }
              .rbc-today { background-color: var(--surface-container-low); }
              .rbc-event { padding: 2px 4px !important; }
              .rbc-btn-group button { color: var(--on-surface-variant); border-color: var(--outline-variant); }
              .rbc-btn-group button.rbc-active { background-color: var(--primary); color: white; border-color: var(--primary); }
              .dark .rbc-header { color: var(--on-surface); border-color: var(--outline-variant) !important; }
              .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: var(--outline-variant); }
              .dark .rbc-today { background-color: var(--surface-container-low); }
              .dark .rbc-btn-group button { color: var(--on-surface-variant); border-color: var(--outline-variant); }
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
                noEventsInRange: 'No hay misiones programadas.'
              }}
            />
          </div>
        )}

        {viewMode === "table" && (
          <div className="overflow-x-auto w-full custom-scrollbar pb-6 rounded-md border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] bg-[var(--surface-container-low)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] text-sm tracking-wider uppercase font-title font-bold border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
                  <th className="p-4">Misión</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Previsión</th>
                </tr>
              </thead>
              <tbody className="text-[var(--on-surface)] font-body font-medium bg-[var(--surface-container-lowest)]">
                {tasks.map(t => (
                  <tr key={t.id} className="border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)]">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-headline font-bold text-[var(--on-surface)]">{t.titulo}</span>
                        <span className="text-xs text-[var(--on-surface-variant)] font-normal">{t.descripcion || "Sin descripción"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-title font-bold whitespace-nowrap ${
                        t.estado === "Aprobada" || t.estado === "Completada" ? "bg-[color-mix(in-srgb,var(--success)_10%,transparent)] text-[var(--success)]" : 
                        t.estado === "Esperando_Aprobacion" ? "bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] text-[var(--warning)]" :
                        t.estado === "Vencida" || t.estado === "Expirada" ? "bg-[color-mix(in-srgb,var(--error)_10%,transparent)] text-[var(--error)]" :
                        "bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] text-[var(--primary)]"
                      }`}>
                        {t.estado.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-[var(--on-surface-variant)] text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> 
                          {t.fechaVencimiento ? new Date(t.fechaVencimiento).toLocaleDateString() : "Sin fecha"}
                        </div>
                        {t.horaEjecucion && (
                          <span className="text-xs font-bold text-[var(--error)] ml-5 font-title">
                            Límite: {new Date(t.horaEjecucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
