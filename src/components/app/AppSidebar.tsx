"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlarmClock,
  CalendarCheck,
  CheckCircle2,
  Gift,
  History,
  Hourglass,
  Layers,
  ListTodo,
  Network,
  Sprout,
  Timer,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import { isDueToday, isLate, taskGroup } from "@/components/tasks/taskUtils";

export type SectionId = "todo" | "progress" | "review" | "done" | "today" | "late" | "history" | "family";

export const NAV: { heading: string; items: { id: SectionId; label: string; icon: React.ElementType }[] }[] = [
  {
    heading: "Mis tareas",
    items: [
      { id: "todo", label: "Por hacer", icon: ListTodo },
      { id: "progress", label: "En curso", icon: Timer },
      { id: "review", label: "En revisión", icon: Hourglass },
      { id: "done", label: "Completadas", icon: CheckCircle2 },
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

export function sectionFromParams(params: URLSearchParams | null): SectionId {
  const s = params?.get("s") ?? params?.get("view");
  return NAV.flatMap((g) => g.items).some((i) => i.id === s) ? (s as SectionId) : "todo";
}

export function sectionHref(id: SectionId) {
  return id === "todo" ? "/dashboard" : `/dashboard?s=${id}`;
}

export function AppSidebar({
  currentUser,
  tasks,
  habitosPendientes,
  premiosPendientes,
  hayEventosCartas,
}: {
  currentUser: { id?: number; nombre?: string; rolFamiliar?: string; fotoUrl?: string | null } | null | Record<string, unknown>;
  tasks: Array<{ id: number; estado?: string; timerStartedAt?: string | null; fechaVencimiento?: string | null; horaEjecucion?: string | null; asignadoId?: number }>;
  /** Hábitos programados hoy sin registrar */
  habitosPendientes?: number | null;
  /** Premios por reclamar y, para padres, reclamos de la familia por entregar */
  premiosPendientes?: number | null;
  /** Fiesta o cumpleaños con regalo de cartas sin reclamar hoy */
  hayEventosCartas?: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = pathname === "/dashboard" ? sectionFromParams(params) : null;

  const counts = useMemo(() => {
    const c: Partial<Record<SectionId, number>> = { todo: 0, progress: 0, review: 0, done: 0, today: 0, late: 0 };
    for (const t of tasks) {
      const g = taskGroup(t);
      c[g]! += 1;
      if (g === "progress") c.todo! += 1; // "Por hacer" incluye las que están en curso
      if (isDueToday(t)) c.today! += 1;
      if (isLate(t)) c.late! += 1;
    }
    return c;
  }, [tasks]);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Ordo Diei">
              <Link href="/dashboard">
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-heading text-sm font-bold">
                  OD
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Ordo Diei</span>
                  <Clock />
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Rutina</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/habitos"} tooltip="Mis hábitos">
                <Link href="/dashboard/habitos">
                  <Sprout />
                  <span>Mis hábitos</span>
                </Link>
              </SidebarMenuButton>
              {!!habitosPendientes && <SidebarMenuBadge className="tabular-nums">{habitosPendientes}</SidebarMenuBadge>}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/mis-premios"} tooltip="Mis premios">
                <Link href="/dashboard/mis-premios">
                  <Gift />
                  <span>Mis premios</span>
                </Link>
              </SidebarMenuButton>
              {!!premiosPendientes && <SidebarMenuBadge className="tabular-nums">{premiosPendientes}</SidebarMenuBadge>}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Colección</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith("/dashboard/cartas")} tooltip="Cartas católicas">
                <Link href="/dashboard/cartas">
                  <Layers />
                  <span>Cartas</span>
                </Link>
              </SidebarMenuButton>
              {hayEventosCartas && (
                <SidebarMenuBadge className="size-2 p-0 rounded-full bg-amber-500 animate-pulse" title="Eventos festivos disponibles" />
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {NAV.map((group) => (
          <SidebarGroup key={group.heading}>
            <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const count = counts[item.id];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={active === item.id} tooltip={item.label}>
                      <Link href={sectionHref(item.id)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {!!count && <SidebarMenuBadge className="tabular-nums">{count}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={currentUser} tasks={tasks} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// Reloj con segundos (estaba en el Header original)
function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="truncate font-mono text-xs text-sidebar-foreground/60 tabular-nums">{time}</span>;
}
