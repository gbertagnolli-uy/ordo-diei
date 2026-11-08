"use client";

// Propio de Ordo: cabecera común de todas las páginas de Estudio — migas de pan, atrás/adelante, buscador, mensajes,
// avisos y una fila de pestañas para moverse entre las secciones (el padre y el hijo ven las suyas). Desde la lane 280
// se dibuja dentro de la barra global de /dashboard (sticky y oculta al imprimir).

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CalendarDays, CalendarOff, Brain, CalendarRange, Camera, ChevronLeft, ChevronRight, ClipboardCheck, Compass, FileBarChart, GraduationCap, HeartHandshake, LayoutDashboard, Library, Megaphone, NotebookPen, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import CampanaAvisos from "@/components/homeschooling/comunidad/CampanaAvisos";
import BotonMensajes from "@/components/homeschooling/mensajes/BotonMensajes";
import BuscadorEstudio from "./BuscadorEstudio";

const RAIZ = "/dashboard/homeschooling";

type Pestana = { href: string; etiqueta: string; icono: LucideIcon; exacta?: boolean; insignia?: "revision" };

const PADRE: Pestana[] = [
  { href: RAIZ, etiqueta: "Panel", icono: LayoutDashboard, exacta: true },
  { href: `${RAIZ}/materias`, etiqueta: "Materias", icono: BookOpen },
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
  // Para el padre, «Materias» tiene pestaña propia; para el hijo, una materia o curso cuelga de «Hoy»
  const activa = (p: Pestana) =>
    p.exacta
      ? ruta === p.href || (!esPadre && ruta.startsWith(`${RAIZ}/materias`))
      : ruta === p.href || ruta.startsWith(`${p.href}/`);
  const actual = pestanas.find(activa);

  // En el panel de Estudio solo «Estudio»; en una sección, «Estudio › Sección»
  const enSeccion = actual && !(actual.exacta && ruta === RAIZ);
  const titulo = enSeccion ? (ruta.startsWith(`${RAIZ}/materias`) ? "Materias" : actual.etiqueta) : "Estudio";

  // La barra (botón del menú lateral y migas) es la global de /dashboard (lane 280): acá van el título,
  // los botones de Estudio y las pestañas como segunda fila de esa barra.
  return (
    <PageHeader
      group={enSeccion ? "Estudio" : undefined}
      groupHref={enSeccion ? RAIZ : undefined}
      title={titulo}
      secciones={
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
      }
    >
      <div className="flex items-center">
        <Button variant="ghost" size="icon-sm" aria-label="Atrás" title="Atrás" onClick={() => router.back()}>
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Adelante" title="Adelante" onClick={() => router.forward()}>
          <ChevronRight />
        </Button>
      </div>
      <BuscadorEstudio />
      <BotonMensajes />
      <CampanaAvisos />
    </PageHeader>
  );
}
