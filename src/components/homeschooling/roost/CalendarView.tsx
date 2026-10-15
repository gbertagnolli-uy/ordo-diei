"use client";

// Portado de vendor/roost/src/components/calendar/CalendarView.tsx (msrbuilds/roost@492af47).
// Cambios: localizer date-fns en español (semana desde el lunes), withDragAndDrop, sin <style> con hex
// (clase mission-calendar con tokens), desacoplado de EventDetails/EventForm/services (todo por props).

import { useState } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import type { SlotInfo, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "@/components/tasks/mission-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

const MENSAJES = {
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
  event: "Lección",
  noEventsInRange: "No hay clases programadas.",
};

export interface EventoCalendario<T = unknown> {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: T;
}

// El addon de arrastre tipa los eventos como `object`; los genéricos se resuelven en el componente.
const Calendario = withDragAndDrop<EventoCalendario>(BigCalendar);

export interface CalendarViewProps<T = unknown> {
  events: EventoCalendario<T>[];
  eventPropGetter?: (evento: EventoCalendario<T>) => { style?: React.CSSProperties; className?: string };
  onSelectEvent?: (evento: EventoCalendario<T>) => void;
  onSelectSlot?: (slot: SlotInfo) => void;
  onEventDrop?: (args: EventInteractionArgs<EventoCalendario<T>>) => void;
  draggableAccessor?: (evento: EventoCalendario<T>) => boolean;
  views?: View[];
  defaultView?: View;
  className?: string;
}

export default function CalendarView<T = unknown>({
  events,
  eventPropGetter,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  draggableAccessor,
  views = ["month", "week", "agenda"],
  defaultView = "month",
  className = "",
}: CalendarViewProps<T>) {
  const [view, setView] = useState<View>(defaultView);
  const [date, setDate] = useState(new Date());

  return (
    <div className={`mission-calendar min-h-[420px] rounded-xl border bg-card p-3 ${className}`}>
      <Calendario
        localizer={localizer}
        culture="es"
        events={events as EventoCalendario[]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%", minHeight: 400 }}
        selectable={!!onSelectSlot}
        onSelectEvent={onSelectEvent as ((e: EventoCalendario) => void) | undefined}
        onSelectSlot={onSelectSlot}
        onEventDrop={onEventDrop as ((a: EventInteractionArgs<EventoCalendario>) => void) | undefined}
        draggableAccessor={(draggableAccessor as ((e: EventoCalendario) => boolean) | undefined) ?? (() => false)}
        resizable={false}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventPropGetter as ((e: EventoCalendario) => { style?: React.CSSProperties }) | undefined}
        views={views}
        messages={MENSAJES}
      />
    </div>
  );
}
