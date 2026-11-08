"use client";

// Marco global de /dashboard (lane 280): barra superior con el botón de colapsar la barra lateral y las migas,
// y el padding del contenido. Ninguna página tiene que acordarse de ponerlos.
// - Las migas salen de la URL (rutasDashboard.ts). Una página puede cambiar el título o sumar botones con
//   <PageHeader>, que se dibuja dentro de esta barra por portal.
// - El padding lo pone este marco salvo en las pantallas de SIN_PADDING.

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { llevaPadding, migasDeRuta, type MigaRuta } from "./rutasDashboard";

type Ranuras = { titulo: HTMLElement | null; secciones: HTMLElement | null };
const RanurasBarra = createContext<Ranuras>({ titulo: null, secciones: null });

/** Dónde dibuja <PageHeader> su contenido (null fuera del marco o antes de montar). */
export const useRanurasBarra = () => useContext(RanurasBarra);

export function MarcoDashboard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [titulo, setTitulo] = useState<HTMLElement | null>(null);
  const [secciones, setSecciones] = useState<HTMLElement | null>(null);

  return (
    <RanurasBarra.Provider value={{ titulo, secciones }}>
      <header className="group/barra sticky top-0 z-20 flex shrink-0 flex-col border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 print:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          {/* Migas automáticas: se ocultan cuando la página manda las suyas */}
          <Migas {...migasDeRuta(pathname)} className="group-has-[[data-titulo-pagina]]/barra:hidden" />
          <div ref={setTitulo} className="contents" />
        </div>
        <div ref={setSecciones} className="empty:hidden" />
      </header>
      {/* pb-24: lugar para el Dock en todas las pantallas */}
      <div className={cn("flex flex-1 flex-col pb-24 print:p-0", llevaPadding(pathname) && "px-4 pt-4 sm:px-6 sm:pt-6")}>{children}</div>
    </RanurasBarra.Provider>
  );
}

/** Breadcrumb «Grupo › Título» de la barra (el grupo se oculta en el celular). */
export function Migas({ group, groupHref, title, subtitle, className }: MigaRuta & { subtitle?: string; className?: string }) {
  return (
    <Breadcrumb className={cn("min-w-0 flex-1", className)}>
      <BreadcrumbList className="flex-nowrap">
        {group && (
          <>
            <BreadcrumbItem className="hidden md:block">
              {groupHref ? (
                <Link href={groupHref} className="transition-colors hover:text-foreground">
                  {group}
                </Link>
              ) : (
                group
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate font-medium">{title}</BreadcrumbPage>
        </BreadcrumbItem>
        {subtitle && <li className="hidden truncate pl-2 text-xs text-muted-foreground lg:block">{subtitle}</li>}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
