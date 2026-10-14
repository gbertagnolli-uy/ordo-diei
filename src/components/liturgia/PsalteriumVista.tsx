"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Music, Search, X } from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { LiturgiaTexto } from "./LiturgiaTexto";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import {
  buscarSalterio,
  generarIndiceSalterio,
  NOTA_SALTERIO_VULGATA,
  type EntradaSalmoInfo,
} from "@/lib/liturgia/salterio";
import type { DocumentoResuelto } from "@/lib/liturgia/tipos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PsalteriumVistaProps {
  className?: string;
}

/**
 * Pantalla Psalterium — Salterio de 150 Salmos y Cánticos bíblicos (SPEC liturgia §10.7).
 * Índice 1–150 + Cánticos con numeración de la Vulgata, buscador por número o palabra,
 * nota D52 y lector bilingüe con LiturgiaTexto.
 */
export function PsalteriumVista({ className }: PsalteriumVistaProps) {
  const { version, setVersion } = useParametrosLiturgia("psalterium");
  const [busqueda, setBusqueda] = useState<string>("");
  const [salmoSeleccionado, setSalmoSeleccionado] = useState<EntradaSalmoInfo | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "salmos" | "canticos">("todos");

  // Índice base de los 150 salmos + cánticos
  const todosLosSalmos = useMemo(() => generarIndiceSalterio(), []);

  // Filtrado por búsqueda y tipo
  const salmosVisibles = useMemo(() => {
    let base = todosLosSalmos;
    if (filtroTipo === "salmos") base = base.filter((s) => s.tipo === "salmo");
    else if (filtroTipo === "canticos") base = base.filter((s) => s.tipo === "cantico");

    return buscarSalterio(base, busqueda);
  }, [todosLosSalmos, busqueda, filtroTipo]);

  // Documento del salmo seleccionado
  const docRuta = salmoSeleccionado
    ? rutaLiturgia("libro", { tipo: "psalterium", clave: salmoSeleccionado.clave, version })
    : null;
  const docLectura = useLectura<DocumentoResuelto>(docRuta);

  // Navegación anterior / siguiente
  const indiceActual = salmoSeleccionado
    ? todosLosSalmos.findIndex((s) => s.clave === salmoSeleccionado.clave)
    : -1;
  const salmoAnterior = indiceActual > 0 ? todosLosSalmos[indiceActual - 1] : null;
  const salmoSiguiente = indiceActual >= 0 && indiceActual < todosLosSalmos.length - 1 ? todosLosSalmos[indiceActual + 1] : null;

  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* 1. Cabecera común */}
      <CabeceraLiturgica
        titulo="Psalterium"
        subtitulo="Salterio · 150 Salmos de David y Cánticos del Oficio Divino"
        version={version}
        onVersion={setVersion}
      />

      {/* Nota D52 obligatoria sobre la numeración Vulgata y fuente de traducción */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
        <span className="font-semibold">Nota: </span>
        {NOTA_SALTERIO_VULGATA}
      </div>

      {/* 2. Modo Lector del Salmo */}
      {salmoSeleccionado ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSalmoSeleccionado(null)}
              className="text-xs text-muted-foreground gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver al Salterio</span>
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={!salmoAnterior}
                onClick={() => salmoAnterior && setSalmoSeleccionado(salmoAnterior)}
                className="text-xs gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!salmoSiguiente}
                onClick={() => salmoSiguiente && setSalmoSeleccionado(salmoSiguiente)}
                className="text-xs gap-1"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {salmoSeleccionado.tipo === "salmo" ? `Psalmus ${salmoSeleccionado.numero}` : "Canticum"}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {salmoSeleccionado.clave}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              {salmoSeleccionado.incipitLa}
            </h2>
            {salmoSeleccionado.incipitEs ? (
              <p className="font-sans text-sm text-muted-foreground">
                {salmoSeleccionado.incipitEs}
              </p>
            ) : null}
          </div>

          {/* Lector bilingüe o estados */}
          {docLectura.estado === "cargando" ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : docLectura.estado === "ok" ? (
            <LiturgiaTexto documento={docLectura.datos} />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
              <h3 className="font-heading text-base font-semibold">Salmo no generado</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                El texto de {salmoSeleccionado.clave} todavía no fue cargado en la base para esta versión.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* 3. Modo Índice de Salmos */
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por número (ej. 22, 50, 90) o texto (ej. Miserere)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-8 text-xs h-9"
              />
              {busqueda ? (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Filtro: todos / salmos / canticos */}
            <div className="flex items-center gap-1">
              <Button
                variant={filtroTipo === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroTipo("todos")}
                className="h-8 text-xs"
              >
                Todos (156)
              </Button>
              <Button
                variant={filtroTipo === "salmos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroTipo("salmos")}
                className="h-8 text-xs"
              >
                Salmos (150)
              </Button>
              <Button
                variant={filtroTipo === "canticos" ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltroTipo("canticos")}
                className="h-8 text-xs"
              >
                Cánticos (6)
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {busqueda ? `Resultados de «${busqueda}»` : "Salmos y Cánticos del Salterio"}
              </h3>
              <span className="text-xs text-muted-foreground font-sans">
                {salmosVisibles.length} elementos
              </span>
            </div>

            {salmosVisibles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {salmosVisibles.map((s) => (
                  <Card
                    key={s.clave}
                    onClick={() => setSalmoSeleccionado(s)}
                    className="group border-border/70 hover:border-primary/80 hover:shadow-md transition-all cursor-pointer p-3 flex items-center justify-between gap-3 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center rounded-lg bg-muted/60 size-9 shrink-0 border border-border/50 text-center font-mono text-xs font-bold">
                        {s.tipo === "salmo" ? s.numero : "C"}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <span className="block font-serif text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {s.incipitLa}
                        </span>
                        {s.incipitEs ? (
                          <span className="block font-sans text-xs text-muted-foreground truncate">
                            {s.incipitEs}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span className="text-xs text-muted-foreground group-hover:text-foreground shrink-0 font-medium">
                      Leer →
                    </span>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                <Music className="size-8 mx-auto text-muted-foreground/60" />
                <h4 className="font-heading text-base font-semibold">No se encontraron salmos</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  No se encontró ningún salmo o cántico que coincida con «{busqueda}».
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
