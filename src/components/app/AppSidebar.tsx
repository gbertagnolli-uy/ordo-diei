"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlarmClock,
  BookMarked,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CircleDot,
  CheckCircle2,
  Gift,
  GraduationCap,
  History,
  Hourglass,
  Layers,
  ListTodo,
  Music,
  Network,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Sparkles,
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

/** Pantallas de la liturgia (SPEC liturgia §8): nombre latino en el menú, castellano en el tooltip. */
export const NAV_LITURGIA: { href: string; label: string; tooltip: string; icon: LucideIcon }[] = [
  { href: "/dashboard/liturgia", label: "Calendarium", tooltip: "Calendario litúrgico", icon: CalendarDays },
  { href: "/dashboard/liturgia/breviarium", label: "Breviarium", tooltip: "Breviario", icon: BookOpen },
  { href: "/dashboard/liturgia/missale", label: "Missale", tooltip: "Misal", icon: BookMarked },
  { href: "/dashboard/liturgia/proprium-de-tempore", label: "Proprium de Tempore", tooltip: "Propio del Tiempo", icon: CalendarRange },
  { href: "/dashboard/liturgia/proprium-sanctorum", label: "Proprium Sanctorum", tooltip: "Propio de los Santos", icon: Sparkles },
  { href: "/dashboard/liturgia/ordinarium", label: "Ordinarium", tooltip: "Ordinario", icon: ScrollText },
  { href: "/dashboard/liturgia/psalterium", label: "Psalterium", tooltip: "Salterio", icon: Music },
  { href: "/dashboard/liturgia/rosarium", label: "Rosarium", tooltip: "Rosario", icon: CircleDot },
];

export type SectionId = "todo" | "progress" | "review" | "done" | "today" | "late" | "history" | "family";

export const NAV: { heading: string; items: { id: SectionId; label: string; icon: LucideIcon }[] }[] = [
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
  /** Cartas por reclamar: fiesta, cumpleaños, bienvenida o un grado alcanzado */
  hayEventosCartas?: boolean;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = pathname === "/dashboard" ? sectionFromParams(params) : null;
  const esPadre = currentUser?.rolFamiliar === "Padre" || currentUser?.rolFamiliar === "Madre";
  const enAdmin = !!pathname && ["/dashboard/admin", "/dashboard/tasks/new", "/dashboard/users", "/dashboard/premios", "/dashboard/cartas/admin", "/dashboard/admin/tienda"].some((r) => pathname.startsWith(r));

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
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard/horarios" || pathname === "/dashboard/rutina"}
                tooltip="Horarios y Rutina"
              >
                <Link href="/dashboard/horarios">
                  <CalendarClock />
                  <span>Horarios</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
              <SidebarMenuButton asChild isActive={pathname?.startsWith("/dashboard/homeschooling")} tooltip="Estudio">
                <Link href="/dashboard/homeschooling">
                  <GraduationCap />
                  <span>Estudio</span>
                </Link>
              </SidebarMenuButton>
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
          <SidebarGroupLabel>Liturgia</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_LITURGIA.map(({ href, label, tooltip, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  // El Calendarium es la raíz del grupo: solo activo en su ruta exacta.
                  isActive={href === "/dashboard/liturgia" ? pathname === href : pathname?.startsWith(href)}
                  tooltip={tooltip}
                >
                  <Link href={href}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
                <SidebarMenuBadge className="size-2 p-0 rounded-full bg-amber-500 animate-pulse" title="Cartas para reclamar" />
              )}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname?.startsWith("/dashboard/tienda")} tooltip="Tienda">
                <Link href="/dashboard/tienda">
                  <ShoppingCart />
                  <span>Tienda</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {esPadre && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={enAdmin} tooltip="Panel de administración">
                  <Link href="/dashboard/admin">
                    <ShieldCheck />
                    <span>Panel de administración</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
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
