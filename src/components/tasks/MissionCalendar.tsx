"use client";

import { useMemo, useState } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./mission-calendar.css";
import { Repeat, X } from "lucide-react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { DIFICULTADES, DIFICULTAD_INFO, type Dificultad } from "@/lib/recompensaTarea";
import {
  proyectarEventosCalendario,
  type TipoTareaFiltro,
  type RecurrenciaFiltro,
  type RecompensaFiltro,
} from "@/lib/proyeccionCalendario";

moment.locale("es");
const localizer = momentLocalizer(moment);

export function MissionCalendar({
  tasks,
  users = [],
  onSelect,
}: {
  tasks: any[];
  users?: any[];
  onSelect: (task: any) => void;
}) {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());

  // Filtros solicitados
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [dificultad, setDificultad] = useState<Dificultad | "todas">("todas");
  const [tipoTarea, setTipoTarea] = useState<TipoTareaFiltro>("todas");
  const [recurrencia, setRecurrencia] = useState<RecurrenciaFiltro>("todas");
  const [recompensa, setRecompensa] = useState<RecompensaFiltro>("todas");

  const usersList = useMemo(() => {
    if (users && users.length > 0) return users;
    const map = new Map<number, any>();
    for (const t of tasks) {
      if (t.asignado && t.asignado.id) {
        map.set(Number(t.asignado.id), t.asignado);
      }
    }
    return Array.from(map.values());
  }, [users, tasks]);

  const hayFiltrosActivos =
    usuarioId !== null ||
    dificultad !== "todas" ||
    tipoTarea !== "todas" ||
    recurrencia !== "todas" ||
    recompensa !== "todas";

  const limpiarFiltros = () => {
    setUsuarioId(null);
    setDificultad("todas");
    setTipoTarea("todas");
    setRecurrencia("todas");
    setRecompensa("todas");
  };

  const calendarRange = useMemo(() => {
    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    return { start, end };
  }, [date]);

  const events = useMemo(() => {
    return proyectarEventosCalendario(tasks, usersList, calendarRange.start, calendarRange.end, {
      usuarioId,
      dificultad,
      tipoTarea,
      recurrencia,
      recompensa,
    });
  }, [tasks, usersList, calendarRange, usuarioId, dificultad, tipoTarea, recurrencia, recompensa]);

  // Mismos colores por estado que el original
  const eventPropGetter = (event: any) => {
    const task = event.resource;
    let color = "var(--primary)";
    if (task.estado === "Completada" || task.estado === "Aprobada") color = "var(--success)";
    if (task.estado === "Vencida" || task.estado === "Expirada") color = "var(--error)";
    if (task.estado === "Esperando_Aprobacion") color = "var(--warning)";
    return { style: { backgroundColor: color } };
  };

  const CustomEvent = ({ event }: any) => {
    const task = event.resource;
    return (
      <div className="flex items-center gap-1 text-[11px] leading-tight px-1 py-0.5 font-semibold text-white overflow-hidden w-full h-full">
        {task.asignado?.fotoUrl ? (
          <img
            src={task.asignado.fotoUrl}
            alt="Avatar"
            className="w-4 h-4 rounded-full flex-shrink-0 border border-white/50 object-cover"
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 text-[9px]">
            {task.asignado?.nombre?.charAt(0) ?? "?"}
          </div>
        )}
        <span className="truncate">{event.title}</span>
        {task.asignado?.nombre && (
          <span className="text-[10px] text-white/80 shrink-0 font-normal">
            ({task.asignado.nombre})
          </span>
        )}
        {task.rotacionConfig ? (
          <span title="Rotativa">
            <Repeat className="w-3 h-3 text-white/90 flex-shrink-0" />
          </span>
        ) : task.tipoRecurrencia && task.tipoRecurrencia !== "Unica" ? (
          <span title="Recurrente">
            <Repeat className="w-3 h-3 text-white/80 flex-shrink-0" />
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs">
      {/* Barra de filtros */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <NativeSelect
          aria-label="Filtrar por persona"
          value={usuarioId === null ? "todas" : String(usuarioId)}
          onChange={(e) => setUsuarioId(e.target.value === "todas" ? null : Number(e.target.value))}
          className="w-full text-xs"
        >
          <NativeSelectOption value="todas">Persona: Todas</NativeSelectOption>
          {usersList.map((u) => (
            <NativeSelectOption key={u.id} value={String(u.id)}>
              {u.nombre} {u.rolFamiliar ? `(${u.rolFamiliar})` : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrar por dificultad"
          value={dificultad}
          onChange={(e) => setDificultad(e.target.value as Dificultad | "todas")}
          className="w-full text-xs"
        >
          <NativeSelectOption value="todas">Dificultad: Todas</NativeSelectOption>
          {DIFICULTADES.map((d) => (
            <NativeSelectOption key={d} value={d}>
              {DIFICULTAD_INFO[d].etiqueta}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrar por tipo de tarea"
          value={tipoTarea}
          onChange={(e) => setTipoTarea(e.target.value as TipoTareaFiltro)}
          className="w-full text-xs"
        >
          <NativeSelectOption value="todas">Tipo: Todas</NativeSelectOption>
          <NativeSelectOption value="rotativa">Rotativas</NativeSelectOption>
          <NativeSelectOption value="grupal">Grupales</NativeSelectOption>
          <NativeSelectOption value="individual">Individuales</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrar por recurrencia"
          value={recurrencia}
          onChange={(e) => setRecurrencia(e.target.value as RecurrenciaFiltro)}
          className="w-full text-xs"
        >
          <NativeSelectOption value="todas">Recurrencia: Todas</NativeSelectOption>
          <NativeSelectOption value="recurrente">Recurrentes</NativeSelectOption>
          <NativeSelectOption value="unica">No recurrentes (Únicas)</NativeSelectOption>
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrar por recompensa"
          value={recompensa}
          onChange={(e) => setRecompensa(e.target.value as RecompensaFiltro)}
          className="w-full text-xs"
        >
          <NativeSelectOption value="todas">Recompensa: Todas</NativeSelectOption>
          <NativeSelectOption value="con_recompensa">Con recompensas</NativeSelectOption>
          <NativeSelectOption value="sin_recompensa">Sin recompensas</NativeSelectOption>
        </NativeSelect>
      </div>

      {hayFiltrosActivos && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{events.length} {events.length === 1 ? "misión visible" : "misiones visibles"} en el período</span>
          <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="h-6 px-2 text-xs">
            <X className="size-3" /> Limpiar filtros
          </Button>
        </div>
      )}

      <div className="mission-calendar h-[calc(100svh-19rem-var(--notice-h,0px))] min-h-[460px]">
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
          onSelectEvent={(e: any) => {
            const res = e.resource;
            const base = res?.parentTaskId ? tasks.find((t) => t.id === res.parentTaskId) : null;
            onSelect(base ?? res);
          }}
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
    </div>
  );
}
