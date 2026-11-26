"use client";

import { Calendar, dateFnsLocalizer, type EventProps, type EventPropGetter, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/components/tasks/mission-calendar.css";
import type { ComponentType } from "react";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

export interface EventoCalendarioAdmin {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- los registros de tareas del calendario legado todavía usan DTO sin tipado estricto
  resource?: any;
}

interface AdminTasksCalendarProps {
  events: EventoCalendarioAdmin[];
  calendarView: "month" | "week" | "agenda";
  onView: (cv: View) => void;
  currentDate: Date;
  onNavigate: (d: Date) => void;
  onSelectEvent: (event: EventoCalendarioAdmin) => void;
  eventComponent: ComponentType<EventProps<EventoCalendarioAdmin>>;
  eventPropGetter: EventPropGetter<EventoCalendarioAdmin>;
}

export default function AdminTasksCalendar({
  events,
  calendarView,
  onView,
  currentDate,
  onNavigate,
  onSelectEvent,
  eventComponent,
  eventPropGetter,
}: AdminTasksCalendarProps) {
  return (
    <div className="mission-calendar h-[650px]">
      <Calendar<EventoCalendarioAdmin>
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "agenda"]}
        view={calendarView}
        onView={onView}
        date={currentDate}
        onNavigate={onNavigate}
        onSelectEvent={onSelectEvent}
        components={{ event: eventComponent }}
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
  );
}
