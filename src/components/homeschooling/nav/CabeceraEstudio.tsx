"use client";

// Propio de Ordo: cabecera común de todas las páginas de Estudio — botón del menú lateral, migas de pan y una barra de
// pestañas para moverse entre las secciones (el padre y el hijo ven las suyas). Sticky y oculta al imprimir.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, CalendarOff, Brain, CalendarRange, Camera, ChevronLeft, ChevronRight, ClipboardCheck, Compass, FileBarChart, GraduationCap, HeartHandshake, LayoutDashboard, Library, Megaphone, NotebookPen, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import CampanaAvisos from "@/components/homeschooling/comunidad/CampanaAvisos";
import BotonMensajes from "@/components/homeschooling/mensajes/BotonMensajes";
import BuscadorEstudio from "./BuscadorEstudio";

const RAIZ = "/dashboard/homeschooling";

type Pestana = { href: string; etiqueta: string; icono: LucideIcon; exacta?: boolean; insignia?: "revision" };

const PADRE: Pestana[] = [
  { href: RAIZ, etiqueta: "Panel", icono: LayoutDashboard, exacta: true },
  { href: `${RAIZ}/muro`, etiqueta: "Familia", icono: Megaphone },
  { href: `${RAIZ}/plan`, etiqueta: "Plan", icono: CalendarDays },
  { href: `${RAIZ}/semana`, etiqueta: "Semana", icono: CalendarRange },
  { href: `${RAIZ}/revision`, etiqueta: "Revisión", icono: ClipboardCheck, insignia: "revision" },
  { href: `${RAIZ}/libreta`, etiqueta: "Libreta", icono: NotebookPen },
  { href: `${RAIZ}/lectura`, etiqueta: "Lectura", icono: Library },
  { href: `${RAIZ}/memoria`, etiqueta: "Memoria", icono: Brain },
  { href: `${RAIZ}/portafolio`, etiqueta: "Portafolio", icono: Camera },
  { href: `${RAIZ}/horas`, etiqueta: "Actividades", icono: Compass },
  { href: `${RAIZ}/reportes`, etiqueta: "Reportes", icono: FileBarChart },
  { href: `${RAIZ}/neurodivergencia`, etiqueta: "Apoyos", icono: HeartHandshake },
  { href: `${RAIZ}/dias-sin-clase`, etiqueta: "Días sin clase", icono: CalendarOff },
];

const HIJO: Pestana[] = [
  { href: RAIZ, etiqueta: "Hoy", icono: GraduationCap, exacta: true },
  { href: `${RAIZ}/muro`, etiqueta: "Familia", icono: Megaphone },
  { href: `${RAIZ}/lectura`, etiqueta: "Lectura", icono: Library },
  { href: `${RAIZ}/memoria`, etiqueta: "Memoria", icono: Brain },
  { href: `${RAIZ}/portafolio`, etiqueta: "Portafolio", icono: Camera },
  { href: `${RAIZ}/horas`, etiqueta: "Actividades", icono: Compass },
  { href: `${RAIZ}/reportes`, etiqueta: "Reportes", icono: FileBarChart },
];

export default function CabeceraEstudio({ esPadre, pendientes }: { esPadre: boolean; pendientes: number }) {
  const ruta = usePathname() ?? "";
  const router = useRouter();
  const pestanas = esPadre ? PADRE : HIJO;
  // Una materia o un curso cuelgan del Panel (o de «Hoy», para el hijo)
  const activa = (p: Pestana) => (p.exacta ? ruta === p.href || ruta.startsWith(`${RAIZ}/materias`) : ruta === p.href || ruta.startsWith(`${p.href}/`));
  const actual = pestanas.find(activa);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 print:hidden">
      <div className="flex h-12 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" aria-label="Atrás" title="Atrás" onClick={() => router.back()}>
            <ChevronLeft />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Adelante" title="Adelante" onClick={() => router.forward()}>
            <ChevronRight />
          </Button>
        </div>
        <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link href={RAIZ} className="font-medium text-muted-foreground hover:text-foreground">
            Estudio
          </Link>
          {actual && !(actual.exacta && ruta === RAIZ) && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="truncate font-medium text-foreground">{ruta.startsWith(`${RAIZ}/materias`) ? "Materias" : actual.etiqueta}</span>
            </>
          )}
        </nav>
        <BuscadorEstudio />
        <BotonMensajes />
        <CampanaAvisos />
      </div>
      <nav aria-label="Secciones de Estudio" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
        {pestanas.map((p) => {
          const Icono = p.icono;
          const on = activa(p);
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={on ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                on ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icono className="size-4" />
              {p.etiqueta}
              {p.insignia === "revision" && pendientes > 0 && (
                <span className="ml-0.5 rounded-full bg-warning px-1.5 text-xs leading-5 font-semibold text-[var(--on-warning)] tabular-nums">{pendientes}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
