"use client";
// Diario (lane 287): estadísticas de un período (semana, mes o año) con anterior y siguiente. Portado de
// vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/mood_insights/{mood_insights_page,mood_period_header,mood_patterns}.dart
// (ZhuJHua/moodiary@2c552dd): promedio con su nivel y la diferencia con el período anterior, días registrados, entradas, mejor día o mayor racha de días buenos,
// tendencia, distribución con porcentaje y patrón por día de la semana; y de vendor/storypad/lib/views/stats/stats_content.dart (theachoem/storypad@a76825e):
// entradas, días activos «X de Y», palabras y fotos, lo más usado por grupo de etiquetas, entradas por mes y secciones que se pueden ocultar.
import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ListFilter, ArrowDown, ArrowUp, Equal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ALCANCES,
  DIAS_SEMANA,
  diasEntre,
  diferencia,
  estadisticasDelPeriodo,
  filasDelPeriodo,
  limitesDePeriodo,
  mejorDia,
  moverPeriodo,
  nivelDePromedio,
  promediosMensuales,
  promediosPorDiaSemana,
  resumenAnimo,
  diaSemana,
  type Alcance,
  type FilaEstadistica,
  type Ventana,
} from "@/lib/diario/estadisticas";
import { sumarDias } from "@/lib/diario/busqueda";
import { nivelDe, nombreDeNivel } from "@/lib/diario/escala";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { colorDe, GlifoAnimo, useEscala } from "../EscalaAnimo";
import { ChipEtiqueta } from "../etiquetas/ChipEtiqueta";
import { IconoEtiqueta } from "../etiquetas/iconos";
import { MESES, Segmentos, fechaLarga, usePreferencia } from "./controles";
import { GraficoBarras, GraficoLinea, type PuntoLinea } from "./graficos";
import { TarjetaGrafico } from "./TarjetaGrafico";

type Seccion = "resumen" | "tendencia" | "distribucion" | "patron" | "etiquetas" | "categorias" | "meses" | "dias";
const SECCIONES: { id: Seccion; titulo: string }[] = [
  { id: "resumen", titulo: "Resumen" },
  { id: "tendencia", titulo: "Tendencia del ánimo" },
  { id: "distribucion", titulo: "Distribución del ánimo" },
  { id: "patron", titulo: "Patrón por día de la semana" },
  { id: "etiquetas", titulo: "Etiquetas más usadas" },
  { id: "categorias", titulo: "Categorías más usadas" },
  { id: "meses", titulo: "Entradas por mes" },
  { id: "dias", titulo: "Días de la semana" },
];
const esOcultas = (v: unknown): v is Seccion[] => Array.isArray(v) && v.every((x) => SECCIONES.some((s) => s.id === x));
const esAlcance = (v: unknown): v is Alcance => v === "semana" || v === "mes" || v === "anio";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const dec = (n: number) => n.toFixed(1).replace(".", ",");
const VISIBLES_RANKING = 5;

/** Texto del período: «2 – 8 de noviembre de 2026», «noviembre de 2026» o «2026». */
function titularPeriodo(alcance: Alcance, inicio: string, ultimo: string): string {
  const [a, m, d] = inicio.split("-").map(Number);
  const [a2, m2, d2] = ultimo.split("-").map(Number);
  if (alcance === "anio") return String(a);
  if (alcance === "mes") return `${MESES[m - 1]} de ${a}`;
  if (m === m2) return `${d} – ${d2} de ${MESES[m - 1]} de ${a}`;
  return a === a2 ? `${d} ${MESES_CORTOS[m - 1]} – ${d2} ${MESES_CORTOS[m2 - 1]} ${a}` : `${d} ${MESES_CORTOS[m - 1]} ${a} – ${d2} ${MESES_CORTOS[m2 - 1]} ${a2}`;
}

function Bloque({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-3">
      {titulo && <h3 className="mb-3 text-sm font-semibold">{titulo}</h3>}
      {children}
    </section>
  );
}

function Cifra({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="text-lg font-semibold tabular-nums">{valor}</span>
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
    </div>
  );
}

/** moodiary `MoodDeltaPill`: cuánto cambió el promedio respecto del período anterior. */
function Diferencia({ valor }: { valor: number }) {
  const igual = Math.abs(valor) < 0.05;
  const Icono = igual ? Equal : valor > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium tabular-nums", igual ? "bg-muted text-muted-foreground" : valor > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")} title="Diferencia con el período anterior">
      <Icono className="size-3.5" aria-hidden />
      {igual ? "Igual" : dec(Math.abs(valor))}
    </span>
  );
}

function Ranking({ etiquetas, catalogo, grupoId, items }: { etiquetas: Catalogo["etiquetas"]; catalogo: Catalogo; grupoId: number | null; items: { id: number; n: number }[] }) {
  const [abierto, setAbierto] = useState(false);
  const grupo = grupoId === null ? null : catalogo.grupos.find((g) => g.id === grupoId);
  const visibles = abierto ? items : items.slice(0, VISIBLES_RANKING);
  const mayor = items[0]?.n ?? 1;
  return (
    <div className="mb-3 last:mb-0">
      <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {grupo && <IconoEtiqueta icono={grupo.icono} tipoIcono={grupo.tipoIcono} color={grupo.color} />}
        {grupo?.nombre ?? "Etiquetas sueltas"}
      </h4>
      <ul className="flex flex-col gap-1">
        {visibles.map((it) => {
          const e = etiquetas.find((x) => x.id === it.id);
          if (!e) return null;
          return (
            <li key={it.id} className="relative flex items-center gap-2 overflow-hidden rounded-lg px-1 py-1">
              <span aria-hidden className="absolute inset-y-0 left-0 rounded-lg opacity-15" style={{ width: `${(it.n / mayor) * 100}%`, backgroundColor: e.color ?? "var(--primary)" }} />
              <span className="relative min-w-0 flex-1">
                <ChipEtiqueta etiqueta={e} pequeno />
              </span>
              <span className="relative text-sm font-semibold tabular-nums">{it.n}</span>
            </li>
          );
        })}
      </ul>
      {items.length > VISIBLES_RANKING && (
        <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={() => setAbierto(!abierto)}>
          {abierto ? <ChevronUp /> : <ChevronDown />} {abierto ? "Ver menos" : `Ver ${items.length - VISIBLES_RANKING} más`}
        </Button>
      )}
    </div>
  );
}

export function PeriodoEstadisticas({
  tipo,
  filas,
  hoy,
  catalogo,
  onIrADia,
}: {
  tipo: string;
  filas: FilaEstadistica[];
  hoy: string;
  catalogo: Catalogo | null;
  /** Lleva al día en el diario (desde «Días de la semana»). */
  onIrADia: (fecha: string) => void;
}) {
  const escala = useEscala();
  const [alcance, setAlcance] = usePreferencia<Alcance>("diario.stats.alcance", "mes", esAlcance);
  const [ocultas, setOcultas] = usePreferencia<Seccion[]>(`diario.stats.ocultas.${tipo}`, [], esOcultas);
  const [ancla, setAncla] = useState(hoy);

  const { inicio, fin } = limitesDePeriodo(ancla, alcance);
  const ultimo = sumarDias(fin, -1);
  const previo = limitesDePeriodo(moverPeriodo(ancla, alcance, -1), alcance);
  const hayPosterior = moverPeriodo(ancla, alcance, 1) !== ancla && limitesDePeriodo(moverPeriodo(ancla, alcance, 1), alcance).inicio <= hoy;
  const contieneHoy = hoy >= inicio && hoy <= ultimo;
  const primera = filas.reduce((m, f) => (f.fecha < m ? f.fecha : m), hoy);

  const actual = filasDelPeriodo(filas, inicio, fin);
  const resumen = resumenAnimo(actual);
  const anterior = resumenAnimo(filasDelPeriodo(filas, previo.inicio, previo.fin));
  const ventana: Ventana = { tipo: alcance === "anio" ? "anio" : "mes", inicio, fin: ultimo, dias: diasEntre(inicio, fin) };
  const etiquetasCat = (catalogo?.etiquetas ?? []).map((e) => ({ id: e.id, grupoId: e.grupoId }));
  const stats = estadisticasDelPeriodo(filas, ventana, hoy, etiquetasCat);
  const delta = diferencia(resumen, anterior);
  const nivelPromedio = nivelDePromedio(resumen.promedio);
  const nivel = nivelPromedio === null ? null : nivelDe(escala, nivelPromedio);
  const mejor = alcance === "semana" ? mejorDia(resumen.dias) : null;
  const visible = (s: Seccion) => !ocultas.includes(s);

  const tendencia: PuntoLinea[] = (() => {
    if (alcance === "anio") {
      const mensual = promediosMensuales(actual);
      const anio = inicio.slice(0, 4);
      return Array.from({ length: 12 }, (_, i) => ({ x: `${anio}-${String(i + 1).padStart(2, "0")}`, marca: MESES_CORTOS[i], y: mensual[`${anio}-${String(i + 1).padStart(2, "0")}`] ?? null }));
    }
    const total = diasEntre(inicio, fin);
    return Array.from({ length: total }, (_, i) => {
      const f = sumarDias(inicio, i);
      return { x: f, marca: alcance === "semana" ? DIAS_SEMANA[i] : String(i + 1), y: resumen.dias[f]?.promedio ?? null };
    });
  })();
  const marcasTendencia = (() => {
    const n = tendencia.length;
    if (alcance === "anio") return new Set([0, 3, 6, 9]);
    if (alcance === "semana") return new Set(Array.from({ length: n }, (_, i) => i));
    return new Set([0, 7, 14, 21, n - 1]);
  })();

  const patron = promediosPorDiaSemana(filas, alcance === "mes" ? sumarDias(fin, -90) : inicio, fin);
  const totalDistribucion = Object.values(resumen.distribucion).reduce((a, b) => a + b, 0);
  const sinAnimo = resumen.promedio === null;

  function saltar(valor: string) {
    if (!valor) return;
    const f = alcance === "anio" ? `${valor}-01-01` : alcance === "mes" ? `${valor}-01` : valor;
    setAncla(f > hoy ? hoy : f);
  }

  function alternar(s: Seccion) {
    setOcultas(visible(s) ? [...ocultas, s] : ocultas.filter((x) => x !== s));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmentos etiqueta="Período" opciones={ALCANCES} valor={alcance} onCambio={(a) => { setAlcance(a); setAncla(hoy); }} />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <ListFilter /> Secciones
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <p className="mb-2 text-sm font-medium">Qué mostrar</p>
            <ul className="flex flex-col gap-2">
              {SECCIONES.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={visible(s.id)} onCheckedChange={() => alternar(s.id)} />
                    {s.titulo}
                  </label>
                </li>
              ))}
            </ul>
            {ocultas.length > 0 && (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setOcultas([])}>
                Mostrar todas
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Período anterior" disabled={inicio <= primera} onClick={() => setAncla(moverPeriodo(ancla, alcance, -1))}>
          <ChevronLeft />
        </Button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-lg font-semibold capitalize" aria-live="polite">
            {titularPeriodo(alcance, inicio, ultimo)}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label="Período siguiente" disabled={!hayPosterior} onClick={() => setAncla(moverPeriodo(ancla, alcance, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          Saltar a
          <input
            type={alcance === "anio" ? "number" : alcance === "mes" ? "month" : "date"}
            className="h-8 rounded-lg border bg-transparent px-2 text-foreground"
            aria-label="Saltar a un período"
            min={alcance === "anio" ? Number(primera.slice(0, 4)) : alcance === "mes" ? primera.slice(0, 7) : primera}
            max={alcance === "anio" ? Number(hoy.slice(0, 4)) : alcance === "mes" ? hoy.slice(0, 7) : hoy}
            value={alcance === "anio" ? ancla.slice(0, 4) : alcance === "mes" ? ancla.slice(0, 7) : ancla}
            onChange={(e) => saltar(e.target.value)}
          />
        </label>
        {!contieneHoy && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAncla(hoy)}>
            Volver a hoy
          </Button>
        )}
      </div>

      {visible("resumen") && (
        <Bloque>
          {sinAnimo || !nivel ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin ánimos registrados en este período.</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <GlifoAnimo nivel={nivel} tamano={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-semibold tabular-nums">{dec(resumen.promedio!)}</p>
                  <p className="text-sm text-muted-foreground">{nombreDeNivel(nivel)}</p>
                </div>
                {delta !== null && <Diferencia valor={delta} />}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Cifra valor={alcance === "semana" ? `${resumen.diasRegistrados}/7` : String(resumen.diasRegistrados)} etiqueta="Días registrados" />
                <Cifra valor={String(resumen.entradas)} etiqueta="Entradas" />
                {alcance === "semana" ? <Cifra valor={mejor ? DIAS_SEMANA[diaSemana(mejor)] : "—"} etiqueta="Mejor día" /> : <Cifra valor={`${resumen.mayorRachaBuena} ${resumen.mayorRachaBuena === 1 ? "día" : "días"}`} etiqueta="Mayor racha buena" />}
              </div>
            </>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 sm:grid-cols-4">
            <Cifra valor={String(stats.entradas)} etiqueta="Entradas" />
            <Cifra valor={`${stats.diasActivos} de ${stats.diasTotales}`} etiqueta="Días activos" />
            <Cifra valor={new Intl.NumberFormat("es-UY").format(stats.palabras)} etiqueta="Palabras" />
            <Cifra valor={String(stats.fotos)} etiqueta="Fotos" />
          </div>
        </Bloque>
      )}

      {visible("tendencia") && !sinAnimo && (
        <TarjetaGrafico titulo={alcance === "anio" ? "Tendencia mensual" : "Tendencia"} hayDatos>
          <GraficoLinea datos={tendencia} yMin={1} yMax={5} ticks={[1, 2, 3, 4, 5]} referencia={3} marcasX={marcasTendencia} etiquetaValor={(v) => nombreDeNivel(escala[Math.min(4, Math.max(0, Math.round(v) - 1))])} />
        </TarjetaGrafico>
      )}

      {visible("distribucion") && !sinAnimo && (
        <Bloque titulo="Distribución">
          <ul className="flex flex-col gap-2">
            {[...escala].reverse().map((n) => {
              const c = resumen.distribucion[n.valor] ?? 0;
              const p = totalDistribucion === 0 ? 0 : (c * 100) / totalDistribucion;
              return (
                <li key={n.valor} className="flex items-center gap-2">
                  <GlifoAnimo nivel={n} tamano={20} />
                  <span className="w-20 shrink-0 truncate text-sm">{nombreDeNivel(n)}</span>
                  <span className="h-2.5 flex-1 rounded-r bg-muted/40">
                    <span className="block h-full rounded-r" style={{ width: `${p}%`, backgroundColor: colorDe(n) }} />
                  </span>
                  <span className="w-20 text-right text-xs text-muted-foreground tabular-nums">
                    {c} · {Math.round(p)} %
                  </span>
                </li>
              );
            })}
          </ul>
        </Bloque>
      )}

      {visible("patron") && alcance !== "semana" && !sinAnimo && (
        <TarjetaGrafico titulo="Patrón por día de la semana" hayDatos>
          <GraficoBarras
            datos={DIAS_SEMANA.map((d, i) => ({ nombre: d, valor: patron[i] === null ? null : patron[i]! - 3, color: patron[i] === null ? undefined : colorDe(nivelDe(escala, nivelDePromedio(patron[i]))!) }))}
            yMin={-2}
            yMax={2}
            ticks={[-2, -1, 0, 1, 2]}
            referencia={0}
            formatoY={(t) => String(t + 3)}
            etiquetaValor={(v) => dec(v + 3)}
          />
          <p className="mt-1 text-center text-xs text-muted-foreground">{alcance === "mes" ? "Últimos 90 días. " : ""}Las barras suben o bajan del 3, el ánimo normal.</p>
        </TarjetaGrafico>
      )}

      {visible("etiquetas") && catalogo && stats.rankings.length > 0 && (
        <Bloque titulo="Etiquetas más usadas">
          {stats.rankings.map((r) => (
            <Ranking key={r.grupoId ?? "sueltas"} etiquetas={catalogo.etiquetas} catalogo={catalogo} grupoId={r.grupoId} items={r.items} />
          ))}
        </Bloque>
      )}

      {visible("categorias") && catalogo && stats.categorias.length > 0 && (
        <Bloque titulo="Categorías más usadas">
          <ul className="flex flex-col gap-1.5">
            {stats.categorias.map((c) => {
              const cat = catalogo.categorias.find((x) => x.id === c.id);
              if (!cat) return null;
              return (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color ?? "var(--muted-foreground)" }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{cat.nombre}</span>
                  <span className="font-semibold tabular-nums">{c.n}</span>
                </li>
              );
            })}
          </ul>
        </Bloque>
      )}

      {visible("meses") && alcance === "anio" && (
        <TarjetaGrafico titulo="Entradas por mes" hayDatos={stats.entradas > 0}>
          <GraficoBarras datos={MESES_CORTOS.map((m, i) => ({ nombre: m, valor: stats.porMes[i] }))} yMin={0} yMax={Math.max(1, ...stats.porMes)} etiquetaValor={(v) => `${v} ${v === 1 ? "entrada" : "entradas"}`} alto="h-40" />
        </TarjetaGrafico>
      )}

      {visible("dias") && alcance === "semana" && (
        <Bloque titulo="Días de la semana">
          <ul className="flex flex-col">
            {Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i)).map((f, i) => {
              const dia = resumen.dias[f];
              const n = dia?.promedio == null ? null : nivelDePromedio(dia.promedio);
              const futuro = f > hoy;
              return (
                <li key={f}>
                  <button type="button" disabled={futuro || !dia} onClick={() => onIrADia(f)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent" aria-label={`${fechaLarga(f)}: ${dia ? `${dia.entradas.length} entradas` : "sin entradas"}`}>
                    <span className="w-10 text-sm font-medium">{DIAS_SEMANA[i]}</span>
                    <span className="flex-1 text-sm text-muted-foreground">{f.slice(8)} de {MESES[Number(f.slice(5, 7)) - 1]}</span>
                    {n !== null && <GlifoAnimo nivel={nivelDe(escala, n)!} tamano={18} />}
                    <span className="w-24 text-right text-xs text-muted-foreground">{dia ? `${dia.entradas.length} ${dia.entradas.length === 1 ? "entrada" : "entradas"}` : "—"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Bloque>
      )}
    </div>
  );
}
