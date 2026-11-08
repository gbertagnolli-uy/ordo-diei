"use client";
// Diario (lane 272, rehecho en la lane 288): calendario del mes. Cada día muestra la portada, el ánimo, el contador de entradas y una etiqueta, según las opciones.
// Portado de vendor/Daily_You/lib/widgets/{vertical_calendar,entry_day_cell}.dart (Demizo/Daily_You@7cc237d: portada con el número encima, ánimo en la esquina,
// «99+», etiqueta o contador superpuesto), de vendor/moodiary/.../presentation/calendar/calendar_page.dart (ZhuJHua/moodiary@2c552dd: seis filas fijas, título con
// la cuenta del mes, volver a hoy, franja de color de la categoría) y de vendor/storypad/lib/views/calendar/mood (theachoem/storypad@a76825e: volver a tocar el día
// quita la selección y deja ver todo el mes).
import { useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPCIONES_CALENDARIO, celdasDelMes, contenidoDeCelda, moverMes, textoContador, type DiaCalendario, type OpcionesCalendario } from "@/lib/diario/calendario";
import { nivelDe, nombreDeNivel } from "@/lib/diario/escala";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { fondoDe, GlifoAnimo, useEscala } from "./EscalaAnimo";
import { MESES } from "./estadisticas/controles";
import { IconoEtiqueta } from "./etiquetas/iconos";

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

export { moverMes };

function Celda({ fecha, dia, seleccionada, hoy, futuro, opciones, catalogo, onDia }: { fecha: string; dia: DiaCalendario | undefined; seleccionada: boolean; hoy: boolean; futuro: boolean; opciones: OpcionesCalendario; catalogo: Catalogo | null; onDia: (f: string) => void }) {
  const escala = useEscala();
  const numero = Number(fecha.slice(8));
  const nivel = dia?.animo ? nivelDe(escala, dia.animo) : null;
  const etiqueta = opciones.etiqueta !== null ? (catalogo?.etiquetas.find((e) => e.id === opciones.etiqueta) ?? null) : null;
  const contenido = dia ? contenidoDeCelda(dia, etiqueta ? opciones : { ...opciones, etiqueta: null }, etiqueta?.tipo === "contador") : null;
  const categoria = dia?.categoriaId != null ? catalogo?.categorias.find((c) => c.id === dia.categoriaId) : undefined;
  const conPortada = contenido?.fondo === "portada" && dia?.portada;
  const colorNumero = conPortada ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" : hoy && !seleccionada ? "font-bold text-primary" : "";

  const etiquetaPuesta = etiqueta && dia?.etiqueta ? (
    <span className="inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-full bg-background px-1 text-[10px] leading-none font-bold shadow-sm" style={{ color: etiqueta.color ?? undefined }}>
      <IconoEtiqueta icono={etiqueta.icono} tipoIcono={etiqueta.tipoIcono} color={etiqueta.color} tamano={11} />
      {etiqueta.tipo === "contador" && dia.etiqueta.valor !== null && <span className="max-w-8 truncate">{dia.etiqueta.valor}</span>}
    </span>
  ) : null;

  return (
    <button
      type="button"
      disabled={futuro}
      aria-pressed={seleccionada}
      aria-label={`${numero}${dia ? `, ${dia.cantidad} ${dia.cantidad === 1 ? "entrada" : "entradas"}${nivel ? `, ánimo ${nombreDeNivel(nivel)}` : ""}` : ""}`}
      title={dia?.titulo || undefined}
      onClick={() => onDia(fecha)}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg text-sm transition",
        dia ? "bg-secondary text-secondary-foreground" : "hover:bg-muted",
        seleccionada && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
        seleccionada && !dia && "bg-primary text-primary-foreground hover:bg-primary",
        futuro && "opacity-30",
      )}
    >
      {conPortada && (
        // eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload
        <img src={dia!.portada!} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}
      {conPortada && <span aria-hidden className="absolute inset-0 bg-black/25" />}
      {contenido?.centro === "animo" && nivel ? (
        <span className="relative flex size-8 items-center justify-center rounded-full bg-background">
          <GlifoAnimo nivel={nivel} tamano={22} />
        </span>
      ) : contenido?.centro === "etiqueta" && etiquetaPuesta ? (
        <span className="relative">{etiquetaPuesta}</span>
      ) : (
        <span className={cn("relative", colorNumero)}>{numero}</span>
      )}
      {dia && dia.cantidad > 1 ? (
        <span className="absolute right-0.5 bottom-0.5 flex size-5 items-center justify-center rounded-full bg-background text-[10px] font-bold text-foreground shadow-sm">{textoContador(dia.cantidad)}</span>
      ) : (
        contenido?.esquinaAnimo &&
        nivel && (
          <span className="absolute right-0.5 bottom-0.5 flex size-5 items-center justify-center rounded-full bg-background shadow-sm">
            <GlifoAnimo nivel={nivel} tamano={13} />
          </span>
        )
      )}
      {contenido?.esquinaEtiqueta && etiquetaPuesta && <span className="absolute top-0.5 right-0.5">{etiquetaPuesta}</span>}
      {/* Sin ánimo visible en la celda, un punto del color del nivel (el calendario de siempre) */}
      {dia && !conPortada && !contenido?.esquinaAnimo && contenido?.centro !== "animo" && (
        <span className={cn("absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full", nivel ? fondoDe(nivel).className : "bg-foreground/40")} style={nivel ? fondoDe(nivel).style : undefined} />
      )}
      {categoria && <span aria-hidden className="absolute bottom-0 left-1 h-1 w-3 rounded-full" style={{ backgroundColor: categoria.color ?? "var(--muted-foreground)" }} />}
    </button>
  );
}

export function CalendarioAnimo({
  mes,
  dias,
  cantidadMes,
  seleccionado,
  hoy,
  opciones = OPCIONES_CALENDARIO,
  catalogo = null,
  onDia,
  onMes,
  onHoy,
  onAbrirSelector,
  onOpciones,
  onAnio,
}: {
  mes: string;
  dias: Record<string, DiaCalendario>;
  /** Entradas del mes (con el filtro de etiqueta aplicado), para el título. */
  cantidadMes: number;
  /** `null` = ningún día: la lista muestra todo el mes. */
  seleccionado: string | null;
  hoy: string;
  opciones?: OpcionesCalendario;
  catalogo?: Catalogo | null;
  onDia: (fecha: string) => void;
  onMes: (mes: string) => void;
  onHoy?: () => void;
  onAbrirSelector?: () => void;
  onOpciones?: () => void;
  onAnio?: () => void;
}) {
  // moodiary calendar_page `animateToPage`: la grilla entra desde el lado hacia el que se cambió de mes (estado derivado de la prop, sin efectos)
  const [mesPrevio, setMesPrevio] = useState(mes);
  const [direccion, setDireccion] = useState<"sig" | "ant" | null>(null);
  if (mesPrevio !== mes) {
    setDireccion(mes > mesPrevio ? "sig" : "ant");
    setMesPrevio(mes);
  }
  const [y, m] = mes.split("-").map(Number);
  const celdas = celdasDelMes(mes);

  return (
    <section aria-label="Calendario" className="rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-1">
        <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => onMes(moverMes(mes, -1))}>
          <ChevronLeft />
        </Button>
        <button type="button" onClick={onAbrirSelector} disabled={!onAbrirSelector} className="min-w-0 flex-1 rounded-md px-1 py-1 text-center hover:bg-muted disabled:hover:bg-transparent" aria-label={`${MESES[m - 1]} ${y}: elegir otro mes`}>
          <h2 className="truncate font-medium capitalize">
            {MESES[m - 1]} {y}
          </h2>
          <p className="text-xs text-muted-foreground">
            {cantidadMes} {cantidadMes === 1 ? "entrada" : "entradas"}
          </p>
        </button>
        <Button variant="ghost" size="icon" aria-label="Mes siguiente" disabled={moverMes(mes, 1) > hoy.slice(0, 7)} onClick={() => onMes(moverMes(mes, 1))}>
          <ChevronRight />
        </Button>
      </div>
      {(onHoy || onAnio || onOpciones) && (
        <div className="mb-2 flex items-center justify-end gap-1">
          {onHoy && (
            <Button variant="ghost" size="sm" onClick={onHoy}>
              <CalendarCheck /> Hoy
            </Button>
          )}
          {onAnio && (
            <Button variant="ghost" size="sm" onClick={onAnio}>
              <LayoutGrid /> Año
            </Button>
          )}
          {onOpciones && (
            <Button variant="ghost" size="icon-sm" aria-label="Qué se ve en el calendario" onClick={onOpciones}>
              <SlidersHorizontal />
            </Button>
          )}
        </div>
      )}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DIAS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div key={mes} className={cn("mt-1 grid grid-cols-7 gap-1", direccion === "sig" && "diario-mes-sig", direccion === "ant" && "diario-mes-ant")}>
        {celdas.map((f, i) =>
          f === null ? (
            <span key={`h${i}`} aria-hidden className="aspect-square" />
          ) : (
            <Celda key={f} fecha={f} dia={dias[f]} seleccionada={f === seleccionado} hoy={f === hoy} futuro={f > hoy} opciones={opciones} catalogo={catalogo} onDia={onDia} />
          ),
        )}
      </div>
    </section>
  );
}
