"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Calendar,
  Sunset,
  UserPlus,
  Gift,
  FileText,
  Trophy,
  Sun,
  Moon,
  LogOut,
  KeyRound,
} from "lucide-react";
import { FloatingDock, DockItem } from "@/components/ui/floating-dock";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useModalStore } from "@/store/modalStore";
import { toast } from "@/lib/toast";

export function MainDock({
  currentUser,
  allUsers = [],
}: {
  currentUser: any;
  allUsers?: any[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const logoutState = useAuthStore((s) => s.logout);
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { openModal } = useModalStore();

  const isAdmin =
    currentUser?.rolFamiliar === "Padre" || currentUser?.rolFamiliar === "Madre";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logoutState();
    router.push("/");
  };

  const handleSimularDia = async () => {
    if (
      !confirm(
        "¿Deseas simular que ha pasado 1 día completo? Esto vencerá tareas atrasadas y regenerará las recurrentes."
      )
    )
      return;
    const res = await fetch("/api/cron", { method: "POST" });
    if (res.ok) {
      toast.success("¡El Tiempo Avanzó! Se regeneraron las tareas recurrentes.");
      window.location.reload();
    }
  };

  const dockItems: DockItem[] = [
    ...(isAdmin
      ? [
          {
            title: "Nueva Tarea",
            icon: <Plus className="w-5 h-5 text-[var(--primary)]" />,
            href: "/dashboard/tasks/new",
            active: pathname === "/dashboard/tasks/new",
          },
          {
            title: "Agenda Master",
            icon: <Calendar className="w-5 h-5" />,
            href: "/dashboard/admin",
            active: pathname === "/dashboard/admin",
          },
          {
            title: "Nuevo Miembro",
            icon: <UserPlus className="w-5 h-5 text-[var(--success)]" />,
            href: "/dashboard/users/new",
            active: pathname === "/dashboard/users/new",
          },
          {
            title: "Restablecer PIN",
            icon: <KeyRound className="w-5 h-5" />,
            href: "/dashboard/users/pines",
            active: pathname === "/dashboard/users/pines",
          },
          {
            title: "Premios Familiares",
            icon: <Gift className="w-5 h-5 text-[var(--secondary)]" />,
            href: "/dashboard/premios",
            active: pathname === "/dashboard/premios",
          },
          {
            title: "Simular Día (Cron)",
            icon: <Sunset className="w-5 h-5 text-[var(--error)]" />,
            onClick: handleSimularDia,
          },
        ]
      : []),
    {
      title: "Tabla de Líderes",
      icon: <Trophy className="w-5 h-5 text-[var(--secondary)]" />,
      onClick: () => openModal("LEADERBOARD", { users: allUsers }),
    },
    {
      title: "Reglas del Hogar",
      icon: <FileText className="w-5 h-5" />,
      href: "/dashboard/rules",
      active: pathname === "/dashboard/rules",
    },
    {
      title: darkMode ? "Modo Claro" : "Modo Oscuro",
      icon: darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />,
      onClick: toggleDarkMode,
    },
    {
      title: "Cerrar Sesión",
      icon: <LogOut className="w-5 h-5 text-[var(--error)]" />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 pointer-events-none flex justify-center px-4">
      <div className="pointer-events-auto">
        <FloatingDock
          items={dockItems}
          desktopClassName="elevation-ambient"
          mobileClassName="fixed bottom-6 right-6"
        />
      </div>
    </div>
  );
}
