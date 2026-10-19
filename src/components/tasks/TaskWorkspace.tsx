"use client";

import type { LucideIcon } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Columns3, List, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/app/PageHeader";
import { NAV, SectionId, sectionFromParams } from "@/components/app/AppSidebar";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { HistoryView } from "@/components/dashboard/HistoryView";
import { FamilyTree } from "@/components/dashboard/FamilyTree";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { SchedulePanel } from "./SchedulePanel";
import { TaskBoard } from "./TaskBoard";
import { TaskTable } from "./TaskTable";
import { MissionCalendar } from "./MissionCalendar";
import { CoResponsableMap, isActionable, isDueToday, isLate, sortTasks, taskGroup } from "./taskUtils";

type Filter = "all" | "points" | "checklist";
type Layout = "list" | "board" | "calendar";

const GROUP_SECTIONS: SectionId[] = ["todo", "progress", "review", "done"];

const WIDE = "(min-width: 1024px)";
function useIsWide() {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(WIDE); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(WIDE).matches,
    () => true
  );
}

// Saludo según la hora, como en el MyTasksBoard original
function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "¡Buenos días, a brillar!";
  if (hour < 18) return "¡Buenas tardes, a darle con todo!";
  return "¡Buenas noches, último esfuerzo!";
}

// Espacio de trabajo de /dashboard: lista (App Shell 4), tablero (Kanban 4) o calendario (hijos),
// con panel de contexto a la derecha. La sección la elige la barra lateral vía ?s=.
export function TaskWorkspace({
  tasks,
  coResponsables,
  isAdmin,
  family,
  currentUserId,
}: {
  tasks: any[];
  coResponsables: CoResponsableMap;
  isAdmin: boolean;
  family: { parents: any[]; children: any[] };
  currentUserId?: number;
}) {
  const section = sectionFromParams(useSearchParams());
  const [filter, setFilter] = useState<Filter>("all");
  const [layout, setLayout] = useState<Layout>("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // null = por defecto según pantalla: abierto en escritorio, cerrado (sheet) en móvil
  const [panelPref, setPanelPref] = useState<boolean | null>(null);

  const isTaskSection = section !== "history" && section !== "family";
  const isBoard = isTaskSection && layout === "board";
  const isCalendar = isTaskSection && layout === "calendar";

  const visible = useMemo(() => {
    if (!isTaskSection) return [];
    // En tablero y calendario cada estado tiene su lugar: solo aplican atajos y filtros
    const spread = isBoard || isCalendar;
    let list = tasks.filter((t) =>
      section === "today" ? isDueToday(t, currentUserId)
        : section === "late" ? isLate(t)
        : spread ? true
        : section === "todo" ? (isActionable(t) && (!t.rotacionConfig || isDueToday(t, currentUserId)))
        : taskGroup(t) === section
    );
    if (filter === "points") list = list.filter((t) => t.generaPuntosYRecompensa);
    if (filter === "checklist") list = list.filter((t) => t.isChecklist);
    return sortTasks(list, section === "done" ? "done" : null);
  }, [tasks, section, filter, isTaskSection, isBoard, isCalendar, currentUserId]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;
  const group = NAV.find((g) => g.items.some((i) => i.id === section))!;
  const item = group.items.find((i) => i.id === section)!;
  const spreadTitle = GROUP_SECTIONS.includes(section) && (isBoard ? "Tablero" : isCalendar ? "Calendario" : null);

  const isWide = useIsWide();
  // Escritorio: panel fijo a la derecha (abierto por defecto). Móvil: Sheet (cerrado por defecto).
  const panelInline = isWide && (panelPref ?? true);
  const panelSheet = !isWide && (panelPref ?? false);

  const selectTask = (task: any) => {
    setSelectedId(task.id);
    setPanelPref(true);
  };

  const panel = selected ? (
    <TaskDetailPanel key={selected.id} task={selected} coResponsables={coResponsables[selected.id] || []} onBack={() => setSelectedId(null)} />
  ) : (
    <SchedulePanel tasks={tasks} currentUserId={currentUserId} onSelect={selectTask} onClose={() => setPanelPref(false)} />
  );

  const layouts: [Layout, string, LucideIcon][] = [
    ["list", "Lista", List],
    ["board", "Tablero", Columns3],
    ["calendar", "Calendario", CalendarDays],
  ];

  return (
    <>
      <PageHeader group={group.heading} title={spreadTitle || item.label} subtitle={isTaskSection ? greeting() : undefined}>
        {isTaskSection && (
          <>
            <ToggleGroup type="single" variant="outline" size="sm" value={layout} onValueChange={(v) => v && setLayout(v as Layout)} aria-label="Vista">
              {layouts.map(([id, label, Icon]) => (
                <ToggleGroupItem key={id} value={id} aria-label={label} className="gap-1.5 px-2.5">
                  <Icon />
                  <span className="hidden sm:inline">{label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Panel de agenda"
                  aria-pressed={panelInline || panelSheet}
                  onClick={() => setPanelPref(!(panelInline || panelSheet))}
                  className={cn((panelInline || panelSheet) && "bg-muted text-primary")}
                >
                  <PanelRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agenda</TooltipContent>
            </Tooltip>
          </>
        )}
      </PageHeader>

      {isTaskSection ? (
        <div className="flex h-[calc(100svh-10.5rem-var(--notice-h,0px))] min-h-[480px]">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 px-4 py-3">
              <ToggleGroup type="single" size="sm" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} aria-label="Filtrar" className="overflow-x-auto">
                <ToggleGroupItem value="all" className="px-3">Todas</ToggleGroupItem>
                <ToggleGroupItem value="points" className="px-3">Con puntos</ToggleGroupItem>
                <ToggleGroupItem value="checklist" className="px-3">Con checklist</ToggleGroupItem>
              </ToggleGroup>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                {visible.length} {visible.length === 1 ? "tarea" : "tareas"}
              </span>
            </div>

            <div className={cn("relative min-h-0 flex-1", isBoard ? "overflow-hidden" : "overflow-y-auto")}>
              {isCalendar ? (
                <div className="px-4 pb-4">
                  <MissionCalendar
                    tasks={visible}
                    users={[...(family?.parents || []), ...(family?.children || [])]}
                    onSelect={selectTask}
                  />
                </div>
              ) : isBoard ? (
                <TaskBoard tasks={visible} coResponsables={coResponsables} selectedId={selectedId} onSelect={selectTask} isParent={isAdmin} />
              ) : visible.length === 0 ? (
                <EmptyState section={section} />
              ) : (
                <TaskTable tasks={visible} selectedId={selectedId} onSelect={selectTask} />
              )}
            </div>
          </div>

          <aside
            aria-label={selected ? "Detalle de la tarea" : "Agenda"}
            className={cn(
              "hidden shrink-0 overflow-hidden border-l transition-[width,opacity] duration-300 lg:block",
              panelInline ? "w-80 opacity-100" : "w-0 border-l-0 opacity-0"
            )}
          >
            <div className="h-full w-80">{panelInline && panel}</div>
          </aside>
          <Sheet open={panelSheet} onOpenChange={(open) => setPanelPref(open)}>
            <SheetContent side="right" className="w-full p-0 sm:max-w-sm" showCloseButton={false}>
              <SheetTitle className="sr-only">{selected ? "Detalle de la tarea" : "Agenda"}</SheetTitle>
              {panel}
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          {section === "history" ? <HistoryView /> : <FamilyTree {...family} />}
        </div>
      )}
    </>
  );
}

const EMPTY: Partial<Record<SectionId, { title: string; body: string; img: string }>> = {
  todo: { title: "¡Día libre!", body: "No tienes tareas pendientes o las has terminado todas. ¡Excelente trabajo!", img: "/relaxing.svg" },
  today: { title: "Nada para hoy", body: "Hoy no vence ninguna tarea.", img: "/relaxing.svg" },
  late: { title: "Todo al día", body: "No tienes tareas atrasadas.", img: "/winners-animate.svg" },
};

function EmptyState({ section }: { section: SectionId }) {
  const e = EMPTY[section] ?? { title: "Sin tareas", body: "No hay tareas en esta sección.", img: "/relaxing.svg" };
  return (
    <Empty className="h-full border-0">
      <EmptyHeader>
        <EmptyMedia>
          <img src={e.img} alt="" className="size-36 opacity-90" />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-xl">{e.title}</EmptyTitle>
        <EmptyDescription>{e.body}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
