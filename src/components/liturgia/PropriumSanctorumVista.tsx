"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Search, Sparkles, X } from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { LiturgiaTexto } from "./LiturgiaTexto";
import { ColorLiturgicoPunto } from "./ColorLiturgicoPunto";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import {
  MESES_SANCTORUM,
  buscarSantos,
  deducirColorSanto,
  filtrarSantosPorMes,
  textoRango,
} from "@/lib/liturgia/proprium";
import type { EntradaKalendarium } from "@/lib/liturgia/lecturas";
import type { DocumentoResuelto } from "@/lib/liturgia/tipos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PropriumSanctorumVistaProps {
  className?: string;
}

/**
 * Pantalla Proprium Sanctorum — Propio de los Santos (SPEC liturgia §10.5).
 * Índice por 12 meses con el Kalendarium de la versión seleccionada, buscador por nombre y detalle bilingüe Missa/Officium.
 */
export function PropriumSanctorumVista({ className }: PropriumSanctorumVistaProps) {
  const { version, setVersion } = useParametrosLiturgia("proprium-sanctorum");
  const [mesActivo, setMesActivo] = useState<string>("10"); // Octubre por defecto o actual
  const [busqueda, setBusqueda] = useState<string>("");
  const [santoSeleccionado, setSantoSeleccionado] = useState<EntradaKalendarium | null>(null);
  const [tabDetalle, setTabDetalle] = useState<"missa" | "officium">("missa");

  // Kalendarium de la versión elegida
  const kalendariumLectura = useLectura<EntradaKalendarium[]>(
    rutaLiturgia("kalendarium", { version }),
  );

  const datosKalendarium = kalendariumLectura.estado === "ok" ? kalendariumLectura.datos : null;

  // Filtrado por búsqueda o por mes
  const santosVisibles = useMemo(() => {
    const todosLosSantos = datosKalendarium ?? [];
    if (busqueda.trim()) {
      return buscarSantos(todosLosSantos, busqueda);
    }
    return filtrarSantosPorMes(todosLosSantos, mesActivo);
  }, [datosKalendarium, busqueda, mesActivo]);

  // Rutas de detalle Missa y Officium
  const docMissaRuta = santoSeleccionado
    ? rutaLiturgia("libro", { tipo: "proprium-sanctorum", clave: `Missa/${santoSeleccionado.archivo}`, version })
    : null;
  const docOfficiumRuta = santoSeleccionado
    ? rutaLiturgia("libro", { tipo: "proprium-sanctorum", clave: santoSeleccionado.archivo, version })
    : null;

  const docMissaLectura = useLectura<DocumentoResuelto>(tabDetalle === "missa" ? docMissaRuta : null);
  const docOfficiumLectura = useLectura<DocumentoResuelto>(tabDetalle === "officium" ? docOfficiumRuta : null);

  const mesActualInfo = MESES_SANCTORUM.find((m) => m.num === mesActivo);

  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* 1. Cabecera común */}
      <CabeceraLiturgica
        titulo="Proprium Sanctorum"
        subtitulo="Propio de los Santos · Kalendarium tradicional y festividades"
        version={version}
        onVersion={setVersion}
      />

      {/* 2. Modo Detalle de un Santo */}
      {santoSeleccionado ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSantoSeleccionado(null)}
              className="text-xs text-muted-foreground gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver al Santoral</span>
            </Button>

            <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
              <Link href={`/dashboard/liturgia/calendarium?fecha=2026-${santoSeleccionado.fecha}&version=${version}`}>
                <Calendar className="size-3.5" />
                <span>Ver en Calendarium 2026</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {santoSeleccionado.fecha}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {santoSeleccionado.rangoTexto ?? textoRango(santoSeleccionado.rango)}
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ColorLiturgicoPunto color={deducirColorSanto(santoSeleccionado.nombre)} />
                <span className="capitalize">{deducirColorSanto(santoSeleccionado.nombre)}</span>
              </div>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              {santoSeleccionado.nombre}
            </h2>

            {santoSeleccionado.conmemoracion ? (
              <p className="text-xs text-muted-foreground font-serif italic">
                Commemoratio: {santoSeleccionado.conmemoracion.nombre} ({santoSeleccionado.conmemoracion.rangoTexto ?? textoRango(santoSeleccionado.conmemoracion.rango)})
              </p>
            ) : null}
          </div>

          {/* Pestañas Missa / Officium */}
          <Tabs value={tabDetalle} onValueChange={(v) => setTabDetalle(v as "missa" | "officium")} className="space-y-4">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="missa" className="text-xs font-semibold">
                Missa (Misa)
              </TabsTrigger>
              <TabsTrigger value="officium" className="text-xs font-semibold">
                Officium (Oficio)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="missa" className="space-y-4">
              {docMissaLectura.estado === "cargando" ? (
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : docMissaLectura.estado === "ok" ? (
                <LiturgiaTexto documento={docMissaLectura.datos} />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                  <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
                  <h3 className="font-heading text-base font-semibold">Misa de la fiesta no generada</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    El formulario del Misal para {santoSeleccionado.nombre} ({santoSeleccionado.archivo}) todavía no fue generado en la base.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="officium" className="space-y-4">
              {docOfficiumLectura.estado === "cargando" ? (
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : docOfficiumLectura.estado === "ok" ? (
                <LiturgiaTexto documento={docOfficiumLectura.datos} />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                  <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
                  <h3 className="font-heading text-base font-semibold">Oficio del santo no generado</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Las partes del Oficio para {santoSeleccionado.nombre} ({santoSeleccionado.archivo}) todavía no fueron generadas en la base.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* 3. Modo Índice por Mes con Kalendarium */
        <div className="space-y-6">
          {/* Selector de los 12 meses */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/50 pb-2.5">
            {MESES_SANCTORUM.map((m) => {
              const activo = mesActivo === m.num && !busqueda.trim();
              return (
                <Button
                  key={m.num}
                  variant={activo ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMesActivo(m.num);
                    setBusqueda("");
                  }}
                  className={cn(
                    "text-xs font-sans h-8 shrink-0 cursor-pointer select-none",
                    activo ? "font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{m.castellano}</span>
                  <span className="opacity-60 text-[10px] hidden sm:inline">({m.latino})</span>
                </Button>
              );
            })}
          </div>

          {/* Buscador de santos */}
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar santo por nombre latino o fecha (ej. 10-14)..."
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

          {/* Listado de santos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {busqueda ? `Resultados de «${busqueda}»` : `Fiestas de ${mesActualInfo?.castellano} (${mesActualInfo?.latino})`}
              </h3>
              <span className="text-xs text-muted-foreground font-sans">
                {santosVisibles.length} fiestas encontradas
              </span>
            </div>

            {kalendariumLectura.estado === "cargando" ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : santosVisibles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {santosVisibles.map((s) => {
                  const color = deducirColorSanto(s.nombre);
                  return (
                    <Card
                      key={`${s.fecha}-${s.archivo}`}
                      onClick={() => setSantoSeleccionado(s)}
                      className="group border-border/70 hover:border-primary/80 hover:shadow-md transition-all cursor-pointer p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col items-center justify-center rounded-lg bg-muted/60 px-2 py-1 shrink-0 border border-border/50 text-center min-w-[3.25rem]">
                          <span className="font-mono text-xs font-semibold leading-tight">{s.fecha}</span>
                          <ColorLiturgicoPunto color={color} className="size-2 mt-1" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-serif text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {s.nombre}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>{s.rangoTexto ?? textoRango(s.rango)}</span>
                            {s.conmemoracion ? (
                              <span className="truncate max-w-[12rem] italic">
                                · Com. {s.conmemoracion.nombre}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-muted-foreground group-hover:text-foreground shrink-0 font-medium">
                        Ver →
                      </span>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                <Sparkles className="size-8 mx-auto text-muted-foreground/60" />
                <h4 className="font-heading text-base font-semibold">
                  {busqueda ? "No se encontraron fiestas" : "Kalendarium no generado"}
                </h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {busqueda
                    ? `No se encontró ninguna festividad que coincida con «${busqueda}» en la versión ${version}.`
                    : `El calendario de santos para la versión ${version} todavía no fue generado en la base.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
