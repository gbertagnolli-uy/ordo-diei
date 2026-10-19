"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { FileText, Trophy, Sun, Moon, LogOut, ShoppingCart } from "lucide-react";
import { FloatingDock, DockItem } from "@/components/ui/floating-dock";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useModalStore } from "@/store/modalStore";
import { ajusteDe, useCompaneroFlotanteStore } from "@/store/companeroFlotanteStore";
import { ImagenConRespaldo } from "@/components/engagement/ImagenConRespaldo";
import { rutaDePose } from "@/components/engagement/EscenaCompanero";
import { datosDePersonaje, type Personaje, type Pose } from "@/lib/engagement/companero";

/** Lo que el Dock necesita para mostrar la foto del compañero cuando está oculto */
export type CompaneroDock = { usuarioId: number; nombre: string; personaje: Personaje; pose: Pose };

export function MainDock({
  currentUser,
  allUsers = [],
  companero = null,
}: {
  currentUser: any;
  allUsers?: any[];
  companero?: CompaneroDock | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const logoutState = useAuthStore((s) => s.logout);
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { openModal } = useModalStore();
  const listoFlotante = useCompaneroFlotanteStore((s) => s.listo);
  const companeroOculto = useCompaneroFlotanteStore((s) => (companero ? ajusteDe(s.ajustes, companero.usuarioId).oculto : false));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logoutState();
    router.push("/");
  };

  const dockItems: DockItem[] = [
    // El compañero se ocultó arrastrándolo hacia abajo: su foto en un botón redondo lo vuelve a traer
    ...(companero && listoFlotante && companeroOculto
      ? [
          {
            title: `Mostrar a ${companero.nombre}`,
            redondo: true,
            icon: (
              <ImagenConRespaldo
                srcs={[rutaDePose(companero.personaje, companero.pose), rutaDePose(companero.personaje, "neutral")]}
                alt=""
                className="size-full origin-top scale-[1.6] object-cover object-top"
                respaldo={<span aria-hidden className="text-2xl">{datosDePersonaje(companero.personaje).emoji}</span>}
              />
            ),
            onClick: () => useCompaneroFlotanteStore.getState().mostrar(companero.usuarioId),
          } satisfies DockItem,
        ]
      : []),
    {
      title: "Tabla de Líderes",
      icon: <Trophy className="w-5 h-5 text-[var(--secondary)]" />,
      onClick: () => openModal("LEADERBOARD", { users: allUsers }),
    },
    {
      title: "Tienda",
      icon: <ShoppingCart className="w-5 h-5 text-[var(--primary)]" />,
      href: "/dashboard/tienda",
      active: !!pathname && pathname.startsWith("/dashboard/tienda"),
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
    <div className="fixed bottom-6 inset-x-0 z-50 pointer-events-none flex justify-center px-4 print:hidden">
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
