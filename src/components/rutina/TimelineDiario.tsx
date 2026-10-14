"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Filter, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EtapaRutina, CategoriaRutina, CATEGORIAS_INFO } from "@/lib/rutina/tipos";
import { EtapaCard } from "./EtapaCard";
import { horaAMinutos, dateAMinutos } from "@/lib/rutina/calculadorHorarios";

interface TimelineDiarioProps {
  etapas: EtapaRutina[];
  etapaActualId: string | null;
  proximaEtapaId: string | null;
  horaActual: Date;
  completadasIds: Set<string>;
  onToggleCompletada: (id: string) => void;
  onEditarEtapa?: (etapa: EtapaRutina) => void;
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
  onCrearEtapa,
  esPadre = false,
}: TimelineDiarioProps) {
  const [busqueda, setBusqueda] = useState("");
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<string>("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");

  const minActual = dateAMinutos(horaActual);

  // Filtrado reactivo de etapas
  const etapasFiltradas = useMemo(() => {
    return etapas.filter((e) => {
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

      // Filtro de categoría
      if (categoriaFiltro !== "todas") {
        if (e.categoria !== categoriaFiltro) return false;
      }

      return true;
    });
  }, [etapas, busqueda, bloqueSeleccionado, categoriaFiltro]);

  // Cálculo de progreso del día
  const totalEtapas = etapas.length;
  const cantCompletadas = completadasIds.size;
  const porcentajeCumplimiento = totalEtapas > 0 ? Math.round((cantCompletadas / totalEtapas) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Barra de progreso global del día */}
      <div className="rounded-2xl border bg-card/70 p-4 shadow-xs backdrop-blur-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-emerald-500" />
            <span className="text-sm font-semibold">Progreso de la Rutina de Hoy</span>
          </div>
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {cantCompletadas} de {totalEtapas} completadas ({porcentajeCumplimiento}%)
          </span>
        </div>
        <Progress value={porcentajeCumplimiento} className="h-2" />
      </div>

      {/* Barra de Búsqueda y Filtros */}
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

        {/* Botón para crear etapa (padres) */}
        {esPadre && onCrearEtapa && (
          <Button onClick={onCrearEtapa} className="h-10 rounded-xl gap-1.5 shrink-0">
            <Plus className="size-4" />
            <span>Nueva etapa</span>
          </Button>
        )}
      </div>

      {/* Selector rápido de bloques macro del día */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
      </div>

      {/* Lista de Tarjetas de Rutina */}
      <div className="space-y-3">
        {etapasFiltradas.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground">
            <Clock className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No se encontraron etapas con los filtros seleccionados.</p>
          </div>
        ) : (
          etapasFiltradas.map((etapa) => {
            const ini = horaAMinutos(etapa.horaInicio);
            const fin = horaAMinutos(etapa.horaFin);
            const esActiva = etapa.id === etapaActualId;
            const esProxima = etapa.id === proximaEtapaId;
            const esPasada = fin > ini ? minActual >= fin : minActual >= fin && minActual < ini;

            return (
              <EtapaCard
                key={etapa.id}
                etapa={etapa}
                esActiva={esActiva}
                esProxima={esProxima}
                esPasada={esPasada}
                estaCompletada={completadasIds.has(etapa.id)}
                onToggleCompletada={onToggleCompletada}
                onEditar={onEditarEtapa}
                esPadre={esPadre}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
