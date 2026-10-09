"use client";

import { useState } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./mission-calendar.css";

moment.locale("es");
const localizer = momentLocalizer(moment);

// "Mi Agenda de Misiones" del original (react-big-calendar, vistas mes/semana/agenda, semana por defecto).
// La vista de tabla que tenía el original es la vista Lista del espacio de trabajo.
export function MissionCalendar({ tasks, onSelect }: { tasks: any[]; onSelect: (task: any) => void }) {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());

  const events = tasks.map((t) => {
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

  // Mismos colores por estado que el original
  const eventPropGetter = (event: any) => {
    const task = event.resource;
    let color = "var(--primary)";
    if (task.estado === "Completada" || task.estado === "Aprobada") color = "var(--success)";
    if (task.estado === "Vencida" || task.estado === "Expirada") color = "var(--error)";
    if (task.estado === "Esperando_Aprobacion") color = "var(--warning)";
    return { style: { backgroundColor: color } };
  };

  return (
    <div className="mission-calendar h-[calc(100svh-15rem-var(--notice-h,0px))] min-h-[420px] rounded-xl border bg-card p-3">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "agenda"]}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        scrollToTime={new Date(1970, 0, 1, 7)}
        onSelectEvent={(e: any) => onSelect(e.resource)}
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
          noEventsInRange: "No hay misiones programadas.",
        }}
      />
    </div>
  );
}
