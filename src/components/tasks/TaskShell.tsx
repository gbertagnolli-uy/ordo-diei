"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Hourglass,
  ListTodo,
  Menu,
  Network,
  PanelRight,
  Plus,
  Timer,
  History,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelInfo } from "@/lib/levelUtils";
import { HistoryView } from "@/components/dashboard/HistoryView";
import { FamilyTree } from "@/components/dashboard/FamilyTree";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { SchedulePanel } from "./SchedulePanel";
import { Avatar, CountBadge, StatusBadge } from "./primitives";
import {
  CoResponsableMap,
  TaskGroup,
  checklistProgress,
  formatDue,
  formatDuration,
  pointsLabel,
  isDueToday,
  isLate,
  sortTasks,
  statusInfo,
  taskGroup,
} from "./taskUtils";

type Section = TaskGroup | "today" | "late" | "history" | "family";
type Filter = "all" | "points" | "checklist";

const NAV: { heading: string; items: { id: Section; label: string; icon: React.ElementType }[] }[] = [
  {
    heading: "Mis tareas",
    items: [
      { id: "todo", label: "Por hacer", icon: ListTodo },
      { id: "progress", label: "En curso", icon: Timer },
      { id: "review", label: "En revisión", icon: Hourglass },
      { id: "done", label: "Completadas", icon: CheckCircle2 },
      { id: "archived", label: "No realizadas", icon: XCircle },
    ],
  },
  {
    heading: "Atajos",
    items: [
      { id: "today", label: "Para hoy", icon: CalendarCheck },
      { id: "late", label: "Atrasadas", icon: AlarmClock },
    ],
  },
  {
    heading: "Hogar",
    items: [
      { id: "history", label: "Historial", icon: History },
      { id: "family", label: "Jerarquía familiar", icon: Network },
    ],
  },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "points", label: "Con puntos" },
  { id: "checklist", label: "Con checklist" },
];

const ROLE_LABEL: Record<string, string> = { Padre: "Padre", Madre: "Madre", Hijo: "Hijo", Hija: "Hija" };

// Réplica de React Bits Pro "App Shell 4": tres columnas con panel de contexto.
export function TaskShell({
  tasks,
  coResponsables,
  currentUser,
  isAdmin,
  family,
  initialSection = "todo",
}: {
  tasks: any[];
  coResponsables: CoResponsableMap;
  currentUser: any;
  isAdmin: boolean;
  family: { parents: any[]; children: any[] };
  initialSection?: Section;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>(initialSection);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // null = valor por defecto según pantalla: abierto en escritorio, cerrado (drawer) en móvil
  const [panelPref, setPanelPref] = useState<boolean | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const isWide = () => window.matchMedia("(min-width: 1024px)").matches;
  const panelInline = panelPref ?? true;
  const panelDrawer = panelPref ?? false;
  const setPanelOpen = (open: boolean) => setPanelPref(open);
  const togglePanel = () => setPanelPref(!(panelPref ?? isWide()));

  const counts = useMemo(() => {
    const c: Record<string, number> = { todo: 0, progress: 0, review: 0, done: 0, archived: 0, today: 0, late: 0 };
    for (const t of tasks) {
      c[taskGroup(t)]++;
      if (isDueToday(t)) c.today++;
      if (isLate(t)) c.late++;
    }
    return c;
  }, [tasks]);

  const isTaskSection = section !== "history" && section !== "family";

  const visible = useMemo(() => {
    if (!isTaskSection) return [];
    let list = tasks.filter((t) =>
      section === "today" ? isDueToday(t) : section === "late" ? isLate(t) : taskGroup(t) === section
    );
    if (filter === "points") list = list.filter((t) => t.generaPuntosYRecompensa);
    if (filter === "checklist") list = list.filter((t) => t.isChecklist);
    return sortTasks(list, section === "done" || section === "archived" ? section : null);
  }, [tasks, section, filter, isTaskSection]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const navGroup = NAV.find((g) => g.items.some((i) => i.id === section))!;
  const navItem = navGroup.items.find((i) => i.id === section)!;

  const goTo = (id: Section) => {
    setSection(id);
    setNavOpen(false);
    // Mantener ?view= para que historial/familia se puedan enlazar desde el Dock
    router.replace(id === "history" || id === "family" ? `/dashboard?view=${id}` : "/dashboard", { scroll: false });
  };

  const selectTask = (task: any) => {
    setSelectedId(task.id);
    setPanelOpen(true);
  };

  const level = getLevelInfo(currentUser?.puntosAcumulados || 0);
  const totalToday = counts.todo + counts.progress + counts.review + counts.done;
  const doneToday = counts.review + counts.done;

  const sidebar = (
    <>
      <div className="flex items-center gap-3 px-4 h-14 shrink-0">
        <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center font-display text-sm">OD</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--on-surface)] truncate">Ordo Diei</p>
          <p className="text-[11px] text-[var(--on-surface-variant)] truncate">Tareas de la familia</p>
        </div>
      </div>

      <nav aria-label="Secciones de tareas" className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {NAV.map((group) => (
          <div key={group.heading}>
            <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">{group.heading}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.id === section;
                const Icon = item.icon;
                const count = counts[item.id];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => goTo(item.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold"
                          : "text-[var(--on-surface)] hover:bg-[var(--surface-container)]"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", active ? "" : "text-[var(--on-surface-variant)]")} aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                      {count !== undefined && count > 0 && <CountBadge value={count} active={active} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar user={currentUser} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--on-surface)] truncate">{currentUser?.nombre}</p>
            <p className="text-[11px] text-[var(--on-surface-variant)] truncate">
              Nivel {level.level} · {ROLE_LABEL[currentUser?.rolFamiliar] ?? ""}
            </p>
          </div>
        </div>
        {totalToday > 0 && (
          <div className="mt-3 px-1" title="Tareas entregadas sobre el total">
            <div className="flex justify-between text-[11px] text-[var(--on-surface-variant)] mb-1">
              <span>Progreso</span>
              <span className="tabular-nums">{doneToday}/{totalToday}</span>
            </div>
            <div className="h-1 rounded-full bg-[var(--surface-container-high)] overflow-hidden">
              <div className="h-full bg-[var(--success)] transition-all duration-500" style={{ width: `${Math.round((doneToday / totalToday) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </>
  );

  const panel = selected ? (
    <TaskDetailPanel key={selected.id} task={selected} coResponsables={coResponsables[selected.id] || []} onBack={() => setSelectedId(null)} />
  ) : (
    <SchedulePanel tasks={tasks} onSelect={selectTask} onClose={() => setPanelOpen(false)} />
  );

  return (
    <div className="mx-auto max-w-[1600px] px-3 sm:px-6 py-4">
      <div className="relative flex h-[calc(100dvh-12.5rem-var(--notice-h,0px))] min-h-[520px] overflow-hidden rounded-2xl bg-[var(--surface-container-lowest)] border border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] elevation-ambient">
        {/* Columna 1: navegación de secciones */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[var(--surface-container-low)] border-r border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)]">
          {sidebar}
        </aside>

        {navOpen && (
          <div className="md:hidden absolute inset-0 z-30 flex">
            <aside className="w-64 flex flex-col bg-[var(--surface-container-low)] border-r border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] shadow-xl">{sidebar}</aside>
            <button type="button" aria-label="Cerrar navegación" className="flex-1 bg-[color-mix(in-srgb,var(--tertiary)_30%,transparent)]" onClick={() => setNavOpen(false)} />
          </div>
        )}

        {/* Columna 2: contenido */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center gap-2 px-4 sm:px-5 h-14 border-b border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] shrink-0">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Abrir navegación"
              aria-expanded={navOpen}
              className="md:hidden p-1.5 -ml-1.5 rounded-md text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav aria-label="Ruta" className="flex-1 min-w-0">
              <ol className="flex items-center gap-1.5 text-sm">
                <li className="text-[var(--on-surface-variant)] hidden sm:block">{navGroup.heading}</li>
                <li aria-hidden="true" className="text-[var(--on-surface-variant)] hidden sm:block">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="min-w-0">
                  <h1 aria-current="page" className="font-display text-base text-[var(--on-surface)] truncate">{navItem.label}</h1>
                </li>
              </ol>
            </nav>
            {isTaskSection && (
              <button
                type="button"
                onClick={togglePanel}
                aria-label="Panel de agenda"
                aria-pressed={panelInline}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  panelInline ? "bg-[var(--surface-container)] text-[var(--primary)]" : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
                )}
              >
                <PanelRight className="w-5 h-5" />
              </button>
            )}
          </header>

          {isTaskSection ? (
            <>
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 shrink-0">
                <div className="relative flex-1 min-w-0">
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={filter === f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                          "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                          filter === f.id
                            ? "bg-[var(--on-surface)] text-[var(--surface)]"
                            : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container)]"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {isAdmin && (
                  <Link
                    href="/dashboard/tasks/new"
                    aria-label="Nueva tarea"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold hover:bg-[var(--primary-container)] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nueva tarea</span>
                  </Link>
                )}
              </div>

              <main className="relative flex-1 min-h-0 overflow-y-auto">
                {visible.length === 0 ? (
                  <EmptyState section={section} />
                ) : (
                  <TaskTable tasks={visible} selectedId={selectedId} onSelect={selectTask} />
                )}
              </main>
            </>
          ) : (
            <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
              {section === "history" ? <HistoryView /> : <FamilyTree {...family} />}
            </main>
          )}
        </div>

        {/* Columna 3: panel de contexto */}
        {isTaskSection && (
          <>
            <aside
              aria-label={selected ? "Detalle de la tarea" : "Agenda"}
              className={cn(
                "hidden lg:block shrink-0 overflow-hidden border-l border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] transition-[width,opacity] duration-300",
                panelInline ? "w-80 opacity-100" : "w-0 opacity-0 border-l-0"
              )}
            >
              <div className="w-80 h-full">{panelInline && panel}</div>
            </aside>
            {panelDrawer && (
              <div className="lg:hidden absolute inset-0 z-30 flex justify-end">
                <button type="button" aria-label="Cerrar panel" className="flex-1 bg-[color-mix(in-srgb,var(--tertiary)_30%,transparent)]" onClick={() => setPanelOpen(false)} />
                <aside className="w-full max-w-sm h-full bg-[var(--surface-container-lowest)] border-l border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)] shadow-xl">
                  {panel}
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TaskTable({ tasks, selectedId, onSelect }: { tasks: any[]; selectedId: number | null; onSelect: (t: any) => void }) {
  return (
    <>
      <table className="hidden sm:table w-full text-sm">
        <caption className="sr-only">Lista de tareas</caption>
        <thead className="sticky top-0 z-10 bg-[var(--surface-container-lowest)]">
          <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--on-surface-variant)] border-b border-[color-mix(in-srgb,var(--outline-variant)_25%,transparent)]">
            <th scope="col" className="font-semibold px-5 py-2.5">Tarea</th>
            <th scope="col" className="font-semibold px-3 py-2.5 hidden xl:table-cell">Tiempo</th>
            <th scope="col" className="font-semibold px-3 py-2.5">Estado</th>
            <th scope="col" className="font-semibold px-3 py-2.5">Vence</th>
            <th scope="col" className="font-semibold px-5 py-2.5 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const status = statusInfo(task);
            const checklist = checklistProgress(task);
            const active = task.id === selectedId;
            return (
              <tr
                key={task.id}
                onClick={() => onSelect(task)}
                className={cn(
                  "cursor-pointer border-b border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] transition-colors",
                  active ? "bg-[color-mix(in-srgb,var(--primary)_8%,transparent)]" : "hover:bg-[var(--surface-container-low)]"
                )}
              >
                <td className="px-5 py-3 max-w-0 w-full">
                  <button type="button" className="block w-full text-left truncate font-medium text-[var(--on-surface)] focus:outline-none" onClick={(e) => { e.stopPropagation(); onSelect(task); }}>
                    {task.titulo}
                  </button>
                  {task.isChecklist && checklist.total > 0 && (
                    <span className="text-[11px] text-[var(--on-surface-variant)] tabular-nums">Checklist {checklist.done}/{checklist.total}</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-[var(--on-surface-variant)] hidden xl:table-cell">{formatDuration(task.tiempoEjecucionEstimadoSeg || 0)}</td>
                <td className="px-3 py-3"><StatusBadge label={status.label} color={status.color} /></td>
                <td className={cn("px-3 py-3 whitespace-nowrap tabular-nums", isLate(task) ? "text-[var(--error)] font-medium" : "text-[var(--on-surface-variant)]")}>
                  {formatDue(task) ?? <span aria-label="Sin fecha">—</span>}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-semibold whitespace-nowrap text-[var(--secondary)]">
                  {task.generaPuntosYRecompensa ? pointsLabel(task) : <span className="text-[var(--on-surface-variant)] font-normal">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="sm:hidden divide-y divide-[color-mix(in-srgb,var(--outline-variant)_20%,transparent)]">
        {tasks.map((task) => {
          const status = statusInfo(task);
          return (
            <li key={task.id}>
              <button type="button" onClick={() => onSelect(task)} className="w-full text-left px-4 py-3.5 active:bg-[var(--surface-container-low)]">
                <p className="font-medium text-[var(--on-surface)]">{task.titulo}</p>
                <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <div className="flex gap-1">
                    <dt className="sr-only">Estado</dt>
                    <dd><StatusBadge label={status.label} color={status.color} /></dd>
                  </div>
                  <div className="flex gap-1 text-[var(--on-surface-variant)]">
                    <dt>Vence</dt>
                    <dd className={cn("tabular-nums", isLate(task) && "text-[var(--error)] font-medium")}>{formatDue(task) ?? "—"}</dd>
                  </div>
                  {task.generaPuntosYRecompensa && (
                    <div className="flex gap-1 text-[var(--on-surface-variant)]">
                      <dt>Pts</dt>
                      <dd className="font-semibold text-[var(--secondary)] tabular-nums">{pointsLabel(task)}</dd>
                    </div>
                  )}
                </dl>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

const EMPTY: Partial<Record<Section, { title: string; body: string; img: string }>> = {
  todo: { title: "¡Día libre!", body: "No tienes tareas pendientes. ¡Excelente trabajo!", img: "/relaxing.svg" },
  today: { title: "Nada para hoy", body: "Hoy no vence ninguna tarea.", img: "/relaxing.svg" },
  late: { title: "Todo al día", body: "No tienes tareas atrasadas.", img: "/winners-animate.svg" },
};

function EmptyState({ section }: { section: Section }) {
  const e = EMPTY[section];
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
      {e ? <img src={e.img} alt="" className="w-44 h-44 mb-4 opacity-90" /> : <CircleDashed className="w-10 h-10 mb-3 text-[var(--on-surface-variant)]" />}
      <p className="font-display text-xl text-[var(--on-surface)]">{e?.title ?? "Sin tareas"}</p>
      <p className="mt-1 text-sm text-[var(--on-surface-variant)]">{e?.body ?? "No hay tareas en esta sección."}</p>
    </div>
  );
}
