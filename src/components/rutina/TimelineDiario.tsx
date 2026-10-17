"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, CheckCircle, Clock, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DragScroll } from "@/components/ui/drag-scroll";
import { EtapaRutina } from "@/lib/rutina/tipos";
import { AdminItem } from "@/components/AdminItem";
import { EtapaCard } from "./EtapaCard";
import {
  horaAMinutos,
  dateAMinutos,
  calcularTermometroEjecucion,
  filtrarEtapasPorDia,
} from "@/lib/rutina/calculadorHorarios";

interface TimelineDiarioProps {
  etapas: EtapaRutina[];
  etapaActualId: string | null;
  proximaEtapaId: string | null;
  horaActual: Date;
  completadasIds: Set<string>;
  onToggleCompletada: (id: string) => void;
  onEditarEtapa?: (etapa: EtapaRutina) => void;
  onEliminarEtapa?: (id: string) => void;
  onCrearEtapa?: () => void;
  esPadre?: boolean;
}

const BLOQUES_MACRO = [
  { id: "todos", label: "Todo el día" },
  { id: "manana", label: "🌅 Mañana (08:00–09:00)" },
  { id: "estudio_am", label: "📚 Estudio (09:00–12:00)" },
  { id: "mediodia", label: "🍲 Mediodía (12:00–13:40)" },
  { id: "tarde", label: "🌿 Tarde (13:40–18:00)" },
  { id: "hogar", label: "🏡 Hogar y Baño (18:00–20:00)" },
  { id: "noche", label: "🌙 Cena y Noche (20:00–08:00)" },
];

export function TimelineDiario({
  etapas,
  etapaActualId,
  proximaEtapaId,
  horaActual,
  completadasIds,
  onToggleCompletada,
  onEditarEtapa,
  onEliminarEtapa,
  onCrearEtapa,
  esPadre = false,
}: TimelineDiarioProps) {
  const [busqueda, setBusqueda] = useState("");
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<string>("todos");
  const [ocultarCompletadas, setOcultarCompletadas] = useState(false);

  const minActual = dateAMinutos(horaActual);

  // Solo cuentan las etapas que aplican hoy (y sus cumplimientos)
  const etapasHoy = useMemo(() => filtrarEtapasPorDia(etapas, horaActual), [etapas, horaActual]);
  const idsHoy = useMemo(() => new Set(etapasHoy.map((e) => e.id)), [etapasHoy]);
  const cantCompletadas = useMemo(
    () => [...completadasIds].filter((id) => idsHoy.has(id)).length,
    [completadasIds, idsHoy]
  );

  // Termómetro de ejecución según el horario actual
  const termometro = useMemo(() => {
    return calcularTermometroEjecucion(etapas, completadasIds, horaActual);
  }, [etapas, completadasIds, horaActual]);

  // Filtrado reactivo de etapas
  const etapasFiltradas = useMemo(() => {
    return etapasHoy.filter((e) => {
      // Ocultar completadas si está activo el interruptor
      if (ocultarCompletadas && completadasIds.has(e.id)) {
        return false;
      }

      // Filtro de búsqueda
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincide =
          e.titulo.toLowerCase().includes(query) ||
          e.horaInicio.includes(query) ||
          (e.descripcion && e.descripcion.toLowerCase().includes(query));
        if (!coincide) return false;
      }

      // Filtro de bloque macro
      if (bloqueSeleccionado !== "todos") {
        if (e.bloqueMacro !== bloqueSeleccionado) return false;
      }

      return true;
    });
  }, [etapasHoy, busqueda, bloqueSeleccionado, ocultarCompletadas, completadasIds]);

  // Totales
  const totalEtapas = etapasHoy.length;
  const porcentajeCumplimiento = totalEtapas > 0 ? Math.round((cantCompletadas / totalEtapas) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Termómetro de Ritmo Familiar y Ejecución al Momento */}
      <div className="rounded-3xl border bg-card/85 p-5 shadow-sm backdrop-blur-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
                termometro.estado === "impecable"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : termometro.estado === "bueno"
                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                  : termometro.estado === "demorado"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
              }`}
            >
              {termometro.estado === "impecable" ? (
                <Sparkles className="size-5" />
              ) : termometro.estado === "bueno" ? (
                <CheckCircle className="size-5" />
              ) : termometro.estado === "demorado" ? (
                <AlertCircle className="size-5" />
              ) : (
                <Clock className="size-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Termómetro de Ritmo</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    termometro.estado === "impecable"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : termometro.estado === "bueno"
                      ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                      : termometro.estado === "demorado"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                  }`}
                >
                  {termometro.estado === "impecable"
                    ? "¡Ritmo Impecable!"
                    : termometro.estado === "bueno"
                    ? "Buen Ritmo"
                    : termometro.estado === "demorado"
                    ? "Con Demora"
                    : "Preparados"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{termometro.mensaje}</p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs font-mono font-bold text-foreground">
              {termometro.esperadasTotal > 0
                ? `${termometro.completadasEsperadas} de ${termometro.esperadasTotal} al día (${termometro.porcentajeRitmo}%)`
                : `${cantCompletadas} completadas`}
            </span>
            <div className="text-[11px] text-muted-foreground">
              Total del día: {cantCompletadas} de {totalEtapas} ({porcentajeCumplimiento}%)
            </div>
          </div>
        </div>

        {/* Barra de progreso de ejecución según el horario actual */}
        <Progress
          value={termometro.esperadasTotal > 0 ? termometro.porcentajeRitmo : 100}
          className={`h-2.5 rounded-full ${
            termometro.estado === "impecable"
              ? "[&>div]:bg-emerald-500"
              : termometro.estado === "bueno"
              ? "[&>div]:bg-sky-500"
              : termometro.estado === "demorado"
              ? "[&>div]:bg-amber-500"
              : "[&>div]:bg-indigo-500"
          }`}
        />
      </div>

      {/* Barra de Búsqueda, Filtros y Ocultar Completadas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en la rutina (ej. estudio, merienda, oración)..."
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Botón para alternar Ocultar/Mostrar tareas completadas */}
          <Button
            variant={ocultarCompletadas ? "secondary" : "outline"}
            size="sm"
            onClick={() => setOcultarCompletadas(!ocultarCompletadas)}
            className="h-10 rounded-xl gap-1.5 text-xs font-medium shrink-0"
            title="Ocultar de la lista las etapas ya marcadas como completadas"
          >
            {ocultarCompletadas ? (
              <>
                <Eye className="size-4 text-primary" />
                <span>Mostrar completadas ({cantCompletadas})</span>
              </>
            ) : (
              <>
                <EyeOff className="size-4 text-muted-foreground" />
                <span>Ocultar completadas</span>
              </>
            )}
          </Button>

          {/* Botón para crear etapa (padres) */}
          {esPadre && onCrearEtapa && (
            <Button onClick={onCrearEtapa} className="h-10 rounded-xl gap-1.5 shrink-0">
              <Plus className="size-4" />
              <span>Nueva etapa</span>
            </Button>
          )}
        </div>
      </div>

      {/* Selector rápido de bloques macro del día: se desliza arrastrando, sin barra de scroll */}
      <DragScroll activeIndex={BLOQUES_MACRO.findIndex((b) => b.id === bloqueSeleccionado)}>
        {BLOQUES_MACRO.map((b) => (
          <Button
            key={b.id}
            variant={bloqueSeleccionado === b.id ? "default" : "outline"}
            size="sm"
            onClick={() => setBloqueSeleccionado(b.id)}
            className="h-8 rounded-full text-xs shrink-0 font-medium"
          >
            {b.label}
          </Button>
        ))}
      </DragScroll>

      {/* Lista de Tarjetas de Rutina */}
      <div className="space-y-3">
        {etapasFiltradas.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground">
            <Clock className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No se encontraron etapas con los filtros seleccionados.</p>
            {ocultarCompletadas && cantCompletadas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOcultarCompletadas(false)}
                className="mt-3 text-xs text-primary"
              >
                Mostrar las {cantCompletadas} etapas completadas
              </Button>
            )}
          </div>
        ) : (
          etapasFiltradas.map((etapa) => {
            const ini = horaAMinutos(etapa.horaInicio);
            const fin = horaAMinutos(etapa.horaFin);
            const esActiva = etapa.id === etapaActualId;
            const esProxima = etapa.id === proximaEtapaId;
            const esPasada = fin > ini ? minActual >= fin : minActual >= fin && minActual < ini;

            return (
              <AdminItem
                key={etapa.id}
                enabled={esPadre}
                nombre={`la etapa «${etapa.titulo}»`}
                className="rounded-2xl"
                aviso="Se quita de la rutina familiar de todos."
                onEdit={onEditarEtapa ? () => onEditarEtapa(etapa) : undefined}
                onDelete={onEliminarEtapa ? () => onEliminarEtapa(etapa.id) : undefined}
              >
              <EtapaCard
                etapa={etapa}
                esActiva={esActiva}
                esProxima={esProxima}
                esPasada={esPasada}
                estaCompletada={completadasIds.has(etapa.id)}
                onToggleCompletada={onToggleCompletada}
              />
              </AdminItem>
            );
          })
        )}

        {/* Notificación informativa al final si hay completadas ocultas */}
        {ocultarCompletadas && cantCompletadas > 0 && etapasFiltradas.length > 0 && (
          <div className="p-3 text-center rounded-2xl bg-muted/30 border border-dashed text-xs text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle className="size-3.5 text-emerald-500" />
            <span>Hay {cantCompletadas} etapa{cantCompletadas > 1 ? "s" : ""} completada{cantCompletadas > 1 ? "s" : ""} oculta{cantCompletadas > 1 ? "s" : ""}.</span>
            <button
              type="button"
              onClick={() => setOcultarCompletadas(false)}
              className="text-primary font-semibold underline underline-offset-2 hover:opacity-80 ml-1"
            >
              Ver todas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
