"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronsUpDown, Flame, Gift, Smile, Star, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useModalStore } from "@/store/modalStore";
import { nivelDe, xpTotal } from "@/lib/niveles";
import { taskGroup } from "@/components/tasks/taskUtils";

const ROLE_LABEL: Record<string, string> = { Padre: "Padre", Madre: "Madre", Hijo: "Hijo", Hija: "Hija" };

// Menú del usuario: identidad, nivel, racha, progreso diario y estado de ánimo (antes en el Header).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function NavUser({ user, tasks }: { user: any; tasks: any[] }) {
  const { isMobile } = useSidebar();
  const { openModal } = useModalStore();
  const level = nivelDe(xpTotal(user));
  const prevLevelRef = useRef(0);

  // Subida de nivel desde la última visita (lógica original del Header)
  useEffect(() => {
    if (!user) return;
    const current = nivelDe(xpTotal(user));
    const currentLevel = current.level;
    const lastSeenLevel = localStorage.getItem(`lastSeenLevel_${user.id}`);
    if (lastSeenLevel) {
      if (currentLevel > parseInt(lastSeenLevel)) {
        openModal("LEVEL_UP", { level: currentLevel, title: current.title });
        localStorage.setItem(`lastSeenLevel_${user.id}`, currentLevel.toString());
      }
    } else {
      localStorage.setItem(`lastSeenLevel_${user.id}`, currentLevel.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    const current = nivelDe(xpTotal(user));
    const currentLevel = current.level;
    if (prevLevelRef.current !== 0 && currentLevel > prevLevelRef.current) {
      openModal("LEVEL_UP", { level: currentLevel, title: current.title });
    }
    prevLevelRef.current = currentLevel;
  }, [user, openModal]);

  // Progreso diario (MyTasksBoard original): entregadas / total, 100 % si no hay tareas
  const done = tasks.filter((t) => taskGroup(t) === "review" || taskGroup(t) === "done").length;
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 100;

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <span className="relative">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.fotoUrl ?? undefined} alt={user.nombre} className="object-cover" />
                  <AvatarFallback className="rounded-lg">{user.nombre?.charAt(0)}</AvatarFallback>
                </Avatar>
                {user.moodEmoji && (
                  <span className="absolute -right-1.5 -bottom-1 text-[11px] leading-none">{user.moodEmoji}</span>
                )}
              </span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.nombre}</span>
                <span className="truncate text-xs text-sidebar-foreground/75">
                  Nivel {level.level} · {user.rolFamiliar ? (ROLE_LABEL[user.rolFamiliar] ?? "") : ""}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 py-1">
                <Avatar className="size-9 rounded-lg">
                  <AvatarImage src={user.fotoUrl ?? undefined} alt={user.nombre} className="object-cover" />
                  <AvatarFallback className="rounded-lg">{user.nombre?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">{user.nombre}</span>
                  <span className="truncate text-xs text-muted-foreground">{level.title}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-3 gap-1 px-2 py-1.5 text-center">
              <Stat icon={<Flame className="size-3.5 text-orange-500" />} value={user.streakDays || 0} label="Racha" />
              <Stat icon={<Star className="size-3.5 text-secondary" />} value={user.stars || 0} label="Estrellas" />
              <Stat icon={<Gift className="size-3.5 text-primary" />} value={user.surprises || 0} label="Sorpresas" />
            </div>
            <div className="space-y-3 px-2 py-2">
              <Meter label={`Nivel ${level.level}`} hint={`${level.progressPercentage}% al siguiente`} value={level.progressPercentage} />
              <Meter label="Progreso diario" hint={`${done}/${tasks.length}`} value={progress} />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/perfil">
                  <UserRound /> Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openModal("MOOD_SELECTOR", { user })}>
                <Smile /> Estado de ánimo
                {user.moodEmoji && <span className="ml-auto">{user.moodEmoji}</span>}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-md bg-muted px-1 py-1.5">
      <div className="flex items-center justify-center gap-1 text-sm font-semibold tabular-nums text-foreground">{icon}{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Meter({ label, hint, value }: { label: string; hint: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">{hint}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}
