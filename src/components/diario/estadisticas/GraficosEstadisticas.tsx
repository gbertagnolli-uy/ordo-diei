"use client";
// Diario (lane 287): gráficos por sujeto (ánimo, etiqueta o contador) y por rango. Portado de vendor/Daily_You/lib/pages/statistics_page.dart y de
// lib/widgets/{value_over_time_chart,value_by_day_chart,distribution_chart,mood_summary_chart,label_summary_card,stat_range_selector}.dart
// (Demizo/Daily_You@7cc237d): el rango (1 mes, 6 meses, 1 año, todo) y el sujeto se recuerdan; cada sujeto tiene sus tres gráficos.
import { useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  AGRUPACIONES,
  RANGOS_MOVILES,
  agrupacionEfectiva,
  agrupacionesDisponibles,
  calcularBins,
  cobertura,
  conteoPorDiaSemana,
  diasDeSerie,
  DIAS_SEMANA,
  esAgrupacion,
  esEntero,
  esRangoMovil,
  etiquetaDeBin,
  filasEnRango,
  idsConEtiqueta,
  promedioPorDiaSemana,
  rangoDinamico,
  rangoYContador,
  serieAgrupada,
  totalesAnimo,
  valoresContador,
  type Agrupacion,
  type Combinar,
  type FilaEstadistica,
  type PuntoSerie,
  type RangoMovil,
} from "@/lib/diario/estadisticas";
import { nombreDeNivel } from "@/lib/diario/escala";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo, EtiquetaVista } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { colorDe, GlifoAnimo, useEscala } from "../EscalaAnimo";
import { ChipEtiqueta } from "../etiquetas/ChipEtiqueta";
import { Segmentos, marcaDeFecha, usePreferencia } from "./controles";
import { GraficoBarras, GraficoLinea, type PuntoBarra, type PuntoLinea } from "./graficos";
import { TarjetaGrafico } from "./TarjetaGrafico";

type Sujeto = { tipo: "animo" } | { tipo: "etiqueta" | "contador"; id: number };
const SUJETO_ANIMO: Sujeto = { tipo: "animo" };
const esSujeto = (v: unknown): v is Sujeto => {
  const o = v as { tipo?: unknown; id?: unknown } | null;
  return !!o && (o.tipo === "animo" || ((o.tipo === "etiqueta" || o.tipo === "contador") && typeof o.id === "number"));
};
const esBooleano = (v: unknown): v is boolean => typeof v === "boolean";
const esAgrupacionONulo = (v: unknown): v is Agrupacion | null => v === null || esAgrupacion(v);

// ── Evolución en el tiempo ──────────────────────────────────────────────────

function Evolucion({
  titulo,
  puntos,
  modo,
  rangoY,
  ticks,
  color,
  hoy,
  leyenda,
  etiquetaValor,
}: {
  titulo: string;
  puntos: PuntoSerie[];
  modo: Combinar;
  /** "dinamico" = de 0 al máximo de la serie. */
  rangoY: { min: number; max: number } | "dinamico";
  ticks?: number[];
  color?: string;
  hoy: string;
  leyenda?: React.ReactNode;
  etiquetaValor?: (v: number) => string;
}) {
  const [preferida, setPreferida] = usePreferencia<Agrupacion | null>("diario.stats.agrupacion", null, esAgrupacionONulo);
  const [suave, setSuave] = usePreferencia<boolean>("diario.stats.suavizado", true, esBooleano);
  const hayDatos = puntos.length > 1;
  const dias = diasDeSerie(puntos, hoy);
  const disponibles = agrupacionesDisponibles(dias);
  const efectiva = agrupacionEfectiva(dias, preferida);
  const serie = serieAgrupada(puntos, efectiva, hoy, modo);
  const datos: PuntoLinea[] = serie.map((c) => ({ x: c.fecha, marca: marcaDeFecha(c.fecha, dias), y: c.valor }));
  const rango = rangoY === "dinamico" ? rangoDinamico(serie.flatMap((c) => (c.valor === null ? [] : [c.valor]))) : rangoY;
  return (
    <TarjetaGrafico titulo={titulo} hayDatos={hayDatos}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Segmentos etiqueta="Agrupar por" opciones={AGRUPACIONES.filter((a) => disponibles.includes(a.valor))} valor={efectiva} onCambio={setPreferida} />
        <label className="flex items-center gap-2 text-sm">
          Suavizado
          <Switch checked={suave} onCheckedChange={setSuave} aria-label="Suavizado" />
        </label>
      </div>
      <GraficoLinea datos={datos} yMin={rango.min} yMax={rango.max} ticks={ticks} suave={suave} color={color} etiquetaValor={etiquetaValor} />
      {leyenda}
    </TarjetaGrafico>
  );
}

// ── Por día de la semana ────────────────────────────────────────────────────

function PorDia({ titulo, valores, yMin, yMax, ticks, color, hayDatos, etiquetaValor }: { titulo: string; valores: (number | null)[]; yMin: number; yMax: number; ticks?: number[]; color?: string; hayDatos: boolean; etiquetaValor?: (v: number) => string }) {
  const datos: PuntoBarra[] = DIAS_SEMANA.map((d, i) => ({ nombre: d, valor: valores[i] ?? yMin }));
  return (
    <TarjetaGrafico titulo={titulo} hayDatos={hayDatos}>
      <GraficoBarras datos={datos} yMin={yMin} yMax={yMax} ticks={ticks} color={color} etiquetaValor={etiquetaValor} />
    </TarjetaGrafico>
  );
}

// ── Ánimo ───────────────────────────────────────────────────────────────────

function ResumenNiveles({ filas }: { filas: FilaEstadistica[] }) {
  const escala = useEscala();
  const totales = totalesAnimo(filas);
  const maximo = Math.max(1, ...Object.values(totales));
  const masComun = escala.reduce((m, n) => (totales[n.valor] > (totales[m.valor] ?? -1) ? n : m), escala[0]).valor;
  const hayDatos = filas.filter((f) => f.animo !== null).length > 1;
  return (
    <TarjetaGrafico titulo="Resumen de ánimo" hayDatos={hayDatos}>
      <ul className="flex flex-col gap-1.5">
        {[...escala].reverse().map((n) => (
          <li key={n.valor} className="flex items-center gap-2">
            <span className="flex w-8 justify-center">
              <GlifoAnimo nivel={n} tamano={22} />
            </span>
            <span className="w-20 shrink-0 truncate text-sm">{nombreDeNivel(n)}</span>
            <span className="h-4 flex-1 overflow-hidden rounded-r bg-muted/40">
              <span className="block h-full rounded-r" style={{ width: `${(totales[n.valor] / maximo) * 100}%`, backgroundColor: colorDe(n) }} />
            </span>
            <span className={cn("w-9 text-right text-sm tabular-nums", n.valor === masComun && "font-bold")}>{totales[n.valor]}</span>
          </li>
        ))}
      </ul>
    </TarjetaGrafico>
  );
}

function GraficosAnimo({ filas, hoy }: { filas: FilaEstadistica[]; hoy: string }) {
  const escala = useEscala();
  const puntos = useMemo(() => filas.flatMap((f) => (f.animo === null ? [] : [{ fecha: f.fecha, valor: f.animo }])), [filas]);
  const hayDatos = puntos.length > 1;
  return (
    <>
      <Evolucion
        titulo="Ánimo a lo largo del tiempo"
        puntos={puntos}
        modo="promedio"
        rangoY={{ min: 1, max: 5 }}
        ticks={[1, 2, 3, 4, 5]}
        hoy={hoy}
        etiquetaValor={(v) => nombreDeNivel(escala[Math.min(4, Math.max(0, Math.round(v) - 1))])}
        leyenda={
          <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="Niveles del eje vertical">
            {escala.map((n) => (
              <li key={n.valor} className="flex items-center gap-1">
                {n.valor} <GlifoAnimo nivel={n} tamano={14} /> {nombreDeNivel(n)}
              </li>
            ))}
          </ul>
        }
      />
      <ResumenNiveles filas={filas} />
      <PorDia titulo="Ánimo por día" valores={promedioPorDiaSemana(filas, (f) => f.animo, 1)} yMin={1} yMax={5} ticks={[1, 2, 3, 4, 5]} hayDatos={hayDatos} />
    </>
  );
}

// ── Contador ────────────────────────────────────────────────────────────────

function GraficosContador({ filas, etiqueta, hoy }: { filas: FilaEstadistica[]; etiqueta: EtiquetaVista; hoy: string }) {
  const color = etiqueta.color ?? undefined;
  const valores = useMemo(() => valoresContador(filas, etiqueta.id), [filas, etiqueta.id]);
  const puntos = useMemo(() => filas.flatMap((f) => (valores.has(f.id) ? [{ fecha: f.fecha, valor: valores.get(f.id)! }] : [])), [filas, valores]);
  const crudos = puntos.map((p) => p.valor);
  const hayDatos = puntos.length > 1;
  const rango = rangoYContador(crudos);
  const bins = calcularBins(crudos);
  const enteros = crudos.every(esEntero);
  const mayor = Math.max(1, ...bins.map((b) => b.n));
  return (
    <>
      <Evolucion titulo={`${etiqueta.nombre} a lo largo del tiempo`} puntos={puntos} modo="promedio" rangoY={rango} color={color} hoy={hoy} />
      <TarjetaGrafico titulo={`Distribución de ${etiqueta.nombre}`} hayDatos={hayDatos}>
        <GraficoBarras datos={bins.map((b) => ({ nombre: etiquetaDeBin(b, enteros), valor: b.n }))} yMin={0} yMax={Math.ceil(mayor * 1.15)} color={color} etiquetaValor={(v) => `${v} ${v === 1 ? "vez" : "veces"}`} />
      </TarjetaGrafico>
      <PorDia titulo={`${etiqueta.nombre} por día`} valores={promedioPorDiaSemana(filas, (f) => valores.get(f.id) ?? null)} yMin={rango.min} yMax={rango.max} color={color} hayDatos={hayDatos} />
    </>
  );
}

// ── Etiqueta común ──────────────────────────────────────────────────────────

function GraficosEtiqueta({ filas, etiqueta, hoy }: { filas: FilaEstadistica[]; etiqueta: EtiquetaVista; hoy: string }) {
  const color = etiqueta.color ?? undefined;
  const con = useMemo(() => idsConEtiqueta(filas, etiqueta.id), [filas, etiqueta.id]);
  const puntos = useMemo(() => filas.map((f) => ({ fecha: f.fecha, valor: con.has(f.id) ? 1 : 0 })), [filas, con]);
  const c = cobertura(filas, etiqueta.id);
  const conteo = conteoPorDiaSemana(filas, (f) => con.has(f.id));
  const maximo = Math.max(1, ...conteo);
  return (
    <>
      <Evolucion titulo={`${etiqueta.nombre} a lo largo del tiempo`} puntos={puntos} modo="suma" rangoY="dinamico" color={color} hoy={hoy} />
      <TarjetaGrafico titulo={`Resumen de ${etiqueta.nombre}`} hayDatos={c.total > 0}>
        <div className="flex items-center gap-4 px-2 py-1">
          <div className="flex flex-1 flex-col items-center gap-1">
            <ChipEtiqueta etiqueta={etiqueta} pequeno />
            <span className="text-3xl font-bold" style={{ color: etiqueta.color ?? "var(--primary)" }}>
              {String(c.porcentaje).replace(".", ",")}%
            </span>
            <span className="text-xs text-muted-foreground">Cobertura</span>
          </div>
          <dl className="flex flex-1 flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: etiqueta.color ?? "var(--primary)" }} aria-hidden />
              <dt className="text-muted-foreground">Presente</dt>
              <dd className="ml-auto font-bold">{c.presentes}</dd>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-foreground/40" aria-hidden />
              <dt className="text-muted-foreground">Ausente</dt>
              <dd className="ml-auto font-bold">{c.ausentes}</dd>
            </div>
          </dl>
        </div>
      </TarjetaGrafico>
      <PorDia titulo={`${etiqueta.nombre} por día`} valores={conteo} yMin={0} yMax={maximo} color={color} hayDatos={c.total > 0} etiquetaValor={(v) => `${v} ${v === 1 ? "vez" : "veces"}`} />
    </>
  );
}

// ── Pantalla ────────────────────────────────────────────────────────────────

export function GraficosEstadisticas({ tipo, filas, hoy, catalogo }: { tipo: TipoDiario; filas: FilaEstadistica[]; hoy: string; catalogo: Catalogo | null }) {
  const [rango, setRango] = usePreferencia<RangoMovil>("diario.stats.rango", "todo", esRangoMovil);
  const [sujeto, setSujeto] = usePreferencia<Sujeto>(`diario.stats.sujeto.${tipo}`, SUJETO_ANIMO, esSujeto);
  const enRango = useMemo(() => filasEnRango(filas, rango, hoy), [filas, rango, hoy]);

  const etiquetas = catalogo?.etiquetas ?? [];
  const lista = sujeto.tipo === "animo" ? [] : etiquetas.filter((e) => e.tipo === sujeto.tipo);
  // Si la etiqueta elegida ya no existe (se borró), se vuelve al ánimo
  const elegida = sujeto.tipo === "animo" ? null : (lista.find((e) => e.id === sujeto.id) ?? null);

  function cambiarTipo(t: "animo" | "etiqueta" | "contador") {
    if (t === "animo") return setSujeto(SUJETO_ANIMO);
    const primera = etiquetas.find((e) => e.tipo === t);
    setSujeto(primera ? { tipo: t, id: primera.id } : { tipo: t, id: -1 });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Qué analizar" value={sujeto.tipo} onChange={(e) => cambiarTipo(e.target.value as "animo" | "etiqueta" | "contador")}>
          <NativeSelectOption value="animo">Ánimo</NativeSelectOption>
          <NativeSelectOption value="etiqueta">Etiqueta</NativeSelectOption>
          <NativeSelectOption value="contador">Contador</NativeSelectOption>
        </NativeSelect>
        {sujeto.tipo !== "animo" && lista.length > 0 && (
          <NativeSelect aria-label={sujeto.tipo === "contador" ? "Contador" : "Etiqueta"} value={elegida?.id ?? ""} onChange={(e) => setSujeto({ tipo: sujeto.tipo as "etiqueta" | "contador", id: Number(e.target.value) })}>
            {!elegida && <NativeSelectOption value="">Elegí una</NativeSelectOption>}
            {lista.map((e) => (
              <NativeSelectOption key={e.id} value={e.id}>
                {e.nombre}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </div>
      <Segmentos etiqueta="Rango de tiempo" opciones={RANGOS_MOVILES} valor={rango} onCambio={setRango} className="self-start" />
      {sujeto.tipo === "animo" && <GraficosAnimo filas={enRango} hoy={hoy} />}
      {sujeto.tipo !== "animo" && lista.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{sujeto.tipo === "contador" ? "Todavía no hay contadores. Podés crearlos desde «Etiquetas y categorías»." : "Todavía no hay etiquetas. Podés crearlas desde «Etiquetas y categorías»."}</p>
      )}
      {elegida && sujeto.tipo === "contador" && <GraficosContador filas={enRango} etiqueta={elegida} hoy={hoy} />}
      {elegida && sujeto.tipo === "etiqueta" && <GraficosEtiqueta filas={enRango} etiqueta={elegida} hoy={hoy} />}
    </div>
  );
}
