"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ETIQUETAS_TIEMPO } from "@/lib/liturgia/colores";
import { hoyISO, moverFecha } from "@/lib/liturgia/cliente";
import type { FilaDia } from "@/lib/liturgia/repositorio";
import type { EstadoLectura } from "./useLectura";
import type { VersionLiturgica } from "@/lib/liturgia/tipos";
import { ColorLiturgicoPunto } from "./ColorLiturgicoPunto";
import { SelectorVersion } from "./SelectorVersion";

type Props = {
  /** Nombre latino de la pantalla («Breviarium») y su castellano debajo. */
  titulo: string;
  subtitulo?: string;
  version: VersionLiturgica;
  onVersion: (v: VersionLiturgica) => void;
  notaMisal?: boolean;
  /** Pantallas con fecha: navegación ‹ hoy › y calendario. Sin `fecha`, solo título y versión. */
  fecha?: string;
  onFecha?: (iso: string) => void;
  dia?: EstadoLectura<FilaDia>;
};

const aDate = (iso: string) => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));

/** Cabecera común de las pantallas de liturgia: título, versión, fecha y qué se celebra (SPEC §9.2). */
export function CabeceraLiturgica({ titulo, subtitulo, version, onVersion, notaMisal, fecha, onFecha, dia }: Props) {
  const fechaLarga = fecha
    ? aDate(fecha).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
          {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
        <SelectorVersion version={version} onChange={onVersion} notaMisal={notaMisal} />
      </div>

      {fecha && onFecha && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => onFecha(moverFecha(fecha, -1))} aria-label="Día anterior">
            <ChevronLeft />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 first-letter:uppercase">
                <CalendarDays />
                {fechaLarga}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={es}
                selected={aDate(fecha)}
                defaultMonth={aDate(fecha)}
                onSelect={(d) => d && onFecha(hoyISO(d))}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon-sm" onClick={() => onFecha(moverFecha(fecha, 1))} aria-label="Día siguiente">
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onFecha(hoyISO())} disabled={fecha === hoyISO()}>
            Hoy
          </Button>
        </div>
      )}

      {dia && <DiaCelebrado dia={dia} />}
    </header>
  );
}

function DiaCelebrado({ dia }: { dia: EstadoLectura<FilaDia> }) {
  if (dia.estado === "cargando") {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }
  if (dia.estado === "no-generado") {
    return <p className="text-sm text-muted-foreground">Este día todavía no se generó.</p>;
  }
  if (dia.estado === "error") {
    return <p className="text-sm text-destructive">No se pudo cargar el día: {dia.mensaje}</p>;
  }
  const d = dia.datos;
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-2 font-heading text-lg font-semibold leading-snug">
        <ColorLiturgicoPunto color={d.color} className="size-3.5" />
        <span lang="la">{d.titulo}</span>
      </p>
      {d.tituloEs && <p className="pl-[1.375rem] text-sm text-muted-foreground" lang="es">{d.tituloEs}</p>}
      <p className="pl-[1.375rem] text-xs text-muted-foreground">
        {d.rango} · {ETIQUETAS_TIEMPO[d.tiempo] ?? d.tiempo}
      </p>
      {d.lineas.length > 0 && (
        <ul className="pl-[1.375rem] text-xs text-muted-foreground">
          {d.lineas.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
