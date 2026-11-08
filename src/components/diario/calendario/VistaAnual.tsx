"use client";
// Diario (lane 288): vista del año — años con su cantidad de entradas, resumen, mapa de calor y los doce meses. Portado de
// vendor/moodiary/.../presentation/calendar/calendar_page.dart (`_YearGrid`, `_YearMonthCard`) y mobile/lib/app/me/me_page.dart (tarjeta del mapa de calor, racha)
// (ZhuJHua/moodiary@2c552dd) y de vendor/storypad/lib/views/home/years (theachoem/storypad@a76825e: lista de años con la cantidad de entradas de cada uno).
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aniosConEntradas, cantidadDelMes, cantidadPorMes, cantidadUltimoAnio, celdasDelMes, diasEscritos, semanasEntre, type DiaEscrito } from "@/lib/diario/calendario";
import { nivelDe } from "@/lib/diario/escala";
import { calcularRachas } from "@/lib/diario/estadisticas";
import type { TipoDiario } from "@/lib/diario/reglas";
import { cn } from "@/lib/utils";
import { colorDe, useEscala } from "../EscalaAnimo";
import { Segmentos, usePreferencia, MESES, fechaLarga } from "../estadisticas/controles";
import { useEstadisticas } from "../estadisticas/useEstadisticas";
import { esModoCalor, LeyendaCalor, MapaCalor, type ModoCalor } from "./MapaCalor";

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

function MesMini({ mes, cantidad, dias, hoy, onAbrir }: { mes: string; cantidad: number; dias: ReadonlyMap<string, DiaEscrito>; hoy: string; onAbrir: (mes: string) => void }) {
  const escala = useEscala();
  const futuro = mes > hoy.slice(0, 7);
  return (
    <button
      type="button"
      disabled={futuro}
      onClick={() => onAbrir(mes)}
      aria-label={`${MESES[Number(mes.slice(5)) - 1]}: ${cantidad} ${cantidad === 1 ? "entrada" : "entradas"}`}
      className={cn("flex flex-col gap-1 rounded-xl border bg-card p-2 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40", mes === hoy.slice(0, 7) && "border-primary")}
    >
      <span className="flex items-baseline justify-between gap-1">
        <span className="text-sm font-semibold capitalize">{MESES[Number(mes.slice(5)) - 1].slice(0, 3)}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">[{cantidad}]</span>
      </span>
      <span aria-hidden className="grid grid-cols-7 text-center text-[9px] text-muted-foreground/70">
        {DIAS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </span>
      <span aria-hidden className="grid grid-cols-7 text-center text-[10px] leading-[14px] tabular-nums">
        {celdasDelMes(mes).map((f, i) => {
          if (f === null) return <span key={`h${i}`} />;
          const d = dias.get(f);
          const nivel = d?.animo != null ? nivelDe(escala, Math.min(5, Math.max(1, Math.round(d.animo)))) : null;
          return (
            <span key={f} className={cn("relative", f === hoy ? "font-bold text-primary" : d ? "font-semibold" : "text-muted-foreground/70")}>
              {Number(f.slice(8))}
              {d && <span className="absolute -bottom-px left-1/2 size-[3px] -translate-x-1/2 rounded-full" style={{ backgroundColor: nivel ? colorDe(nivel) : "var(--foreground)" }} />}
            </span>
          );
        })}
      </span>
    </button>
  );
}

export function VistaAnual({
  tipo,
  hoy,
  version,
  anioInicial,
  onVolver,
  onElegirMes,
  onIrADia,
}: {
  tipo: TipoDiario;
  hoy: string;
  version: number;
  anioInicial?: number;
  onVolver: () => void;
  /** Abre el mes en el calendario; `conEntradas` = todos los días con entradas, para elegir el día al llegar. */
  onElegirMes: (mes: string, conEntradas: ReadonlySet<string>) => void;
  onIrADia: (fecha: string) => void;
}) {
  const escala = useEscala();
  const datos = useEstadisticas(tipo, version);
  const anioHoy = Number(hoy.slice(0, 4));
  const [anio, setAnio] = useState(anioInicial ?? anioHoy);
  const [elegido, setElegido] = useState<string | null>(null);
  const [modo, setModo] = usePreferencia<ModoCalor>("diario.anual.modo", "intensidad", esModoCalor);

  const dias = useMemo(() => (datos ? diasEscritos(datos.filas) : null), [datos]);
  const rachas = useMemo(() => (datos ? calcularRachas(datos.filas, hoy) : null), [datos, hoy]);

  const anios = dias ? aniosConEntradas(dias, hoy) : [];
  const masViejo = anios.length ? anios[anios.length - 1].anio : anioHoy;
  const porMes = dias ? cantidadPorMes(dias, anio) : Array<number>(12).fill(0);
  const totalAnio = porMes.reduce((s, n) => s + n, 0);
  const inicio = `${anio}-01-01`;
  const fin = anio === anioHoy ? hoy : `${anio}-12-31`;
  const detalle = elegido && dias ? dias.get(elegido) : undefined;

  return (
    <section aria-label="Vista del año" className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Volver al diario" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">Año {anio}</h2>
        <span className="text-sm text-muted-foreground">
          [{totalAnio} {totalAnio === 1 ? "entrada" : "entradas"}]
        </span>
        <div className="ml-auto flex gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Año anterior" disabled={anio <= masViejo} onClick={() => setAnio(anio - 1)}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Año siguiente" disabled={anio >= anioHoy} onClick={() => setAnio(anio + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      {dias === null || datos === null || rachas === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
          {anios.length > 1 && (
            <div role="group" aria-label="Años con entradas" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {anios.map((a) => (
                <button
                  key={a.anio}
                  type="button"
                  aria-pressed={a.anio === anio}
                  onClick={() => setAnio(a.anio)}
                  className={cn("inline-flex shrink-0 items-baseline gap-1.5 rounded-full border px-3 py-1 text-sm transition", a.anio === anio ? "border-primary bg-primary/10 font-medium text-primary" : "bg-card hover:bg-muted")}
                >
                  {a.anio}
                  <span className="text-xs tabular-nums opacity-70">{a.cantidad}</span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-card p-3">
            {datos.filas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay entradas.</p>
            ) : (
              <>
                <div className="mb-3 flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-semibold tabular-nums">{cantidadUltimoAnio(dias, hoy)}</span>
                      <span className="text-sm text-muted-foreground">entradas en el último año</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cantidadDelMes(dias, hoy.slice(0, 7))} este mes
                      {datos.truncado && " · cuenta las 20.000 más recientes"}
                    </p>
                  </div>
                  {rachas.actual > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pr-2.5 pl-2 text-xs font-semibold tabular-nums text-secondary-foreground">
                      <Flame aria-hidden className="size-3.5" />
                      {rachas.actual} {rachas.actual === 1 ? "día" : "días"} seguidos
                    </span>
                  )}
                </div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Segmentos
                    etiqueta="Qué muestra el mapa de calor"
                    valor={modo}
                    opciones={[
                      { valor: "intensidad", titulo: "Intensidad" },
                      { valor: "animo", titulo: "Ánimo" },
                    ]}
                    onCambio={setModo}
                  />
                  {modo === "intensidad" && <LeyendaCalor />}
                </div>
                <MapaCalor
                  key={anio}
                  dias={dias}
                  inicio={inicio}
                  fin={fin}
                  semanas={semanasEntre(inicio, fin)}
                  modo={modo}
                  escala={escala}
                  hoy={hoy}
                  elegido={elegido}
                  onDia={(f) => setElegido(f === elegido ? null : f)}
                  etiqueta={`Mapa de calor de ${anio}`}
                />
                <div className="mt-2 flex min-h-8 items-center gap-2 text-xs text-muted-foreground">
                  {elegido ? (
                    <>
                      <span className="min-w-0 flex-1 truncate">
                        {fechaLarga(elegido)} · {detalle ? `${detalle.cantidad} ${detalle.cantidad === 1 ? "entrada" : "entradas"} · ${detalle.palabras} palabras` : "ninguna entrada"}
                      </span>
                      {detalle && (
                        <Button type="button" variant="outline" size="sm" onClick={() => onIrADia(elegido)}>
                          Ir a ese día
                        </Button>
                      )}
                    </>
                  ) : (
                    <span>Tocá un día para ver el detalle.</span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {MESES.map((_, i) => {
              const mes = `${anio}-${String(i + 1).padStart(2, "0")}`;
              return <MesMini key={mes} mes={mes} cantidad={porMes[i]} dias={dias} hoy={hoy} onAbrir={(m) => onElegirMes(m, new Set(dias.keys()))} />;
            })}
          </div>
        </>
      )}
    </section>
  );
}
