"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, CalendarRange, ChevronRight } from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { LiturgiaTexto } from "./LiturgiaTexto";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import {
  clasificarClaveTempora,
  LISTA_TIEMPOS_TEMPORE,
  type TiempoTempore,
} from "@/lib/liturgia/proprium";
import type { EntradaIndice } from "@/lib/liturgia/lecturas";
import type { DocumentoResuelto } from "@/lib/liturgia/tipos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ElementoTempore {
  claveBase: string;
  codigo: string;
  titulo: string;
  tiempo: TiempoTempore;
  tieneMissa: boolean;
  tieneOfficium: boolean;
}

interface PropriumDeTemporeVistaProps {
  className?: string;
}

/**
 * Pantalla Proprium de Tempore — Propio del Tiempo (SPEC liturgia §10.4).
 * Índice por los 8 tiempos litúrgicos y detalle bilingüe con pestañas Missa y Officium.
 */
export function PropriumDeTemporeVista({ className }: PropriumDeTemporeVistaProps) {
  const { version, setVersion } = useParametrosLiturgia("proprium-de-tempore");
  const [tiempoActivo, setTiempoActivo] = useState<TiempoTempore>("Adventus");
  const [claveSeleccionada, setClaveSeleccionada] = useState<string | null>(null);
  const [tabDetalle, setTabDetalle] = useState<"missa" | "officium">("missa");

  // Índice de documentos del Proprium de Tempore
  const indiceLectura = useLectura<EntradaIndice[]>(
    rutaLiturgia("indice", { tipo: "proprium-de-tempore", version }),
  );

  // Agrupa entradas por su clave base (Tempora/...)
  const elementos = useMemo(() => {
    if (indiceLectura.estado !== "ok" || !indiceLectura.datos) return [];
    const mapa = new Map<string, ElementoTempore>();

    for (const entrada of indiceLectura.datos) {
      const esMissa = entrada.clave.startsWith("Missa/");
      const claveBase = entrada.clave.replace(/^Missa\//, "");
      const codigo = claveBase.replace(/^(Tempora|Commune)\//, "");

      let el = mapa.get(claveBase);
      if (!el) {
        el = {
          claveBase,
          codigo,
          titulo: entrada.titulo,
          tiempo: clasificarClaveTempora(claveBase, entrada.titulo),
          tieneMissa: false,
          tieneOfficium: false,
        };
        mapa.set(claveBase, el);
      }
      if (esMissa) el.tieneMissa = true;
      else el.tieneOfficium = true;

      if (entrada.titulo && entrada.titulo !== codigo && (!el.titulo || el.titulo === codigo)) {
        el.titulo = entrada.titulo;
      }
    }

    return [...mapa.values()];
  }, [indiceLectura]);

  // Filtra por tiempo litúrgico seleccionado
  const elementosDelTiempo = useMemo(() => {
    return elementos.filter((e) => e.tiempo === tiempoActivo);
  }, [elementos, tiempoActivo]);

  // Selección actual
  const elementoActual = useMemo(() => {
    if (!claveSeleccionada) return null;
    return elementos.find((e) => e.claveBase === claveSeleccionada) ?? {
      claveBase: claveSeleccionada,
      codigo: claveSeleccionada.replace(/^(Tempora|Commune)\//, ""),
      titulo: claveSeleccionada,
      tiempo: clasificarClaveTempora(claveSeleccionada),
      tieneMissa: true,
      tieneOfficium: true,
    };
  }, [elementos, claveSeleccionada]);

  // Lectura de los documentos de detalle
  const docMissaRuta = claveSeleccionada
    ? rutaLiturgia("libro", { tipo: "proprium-de-tempore", clave: `Missa/${claveSeleccionada}`, version })
    : null;
  const docOfficiumRuta = claveSeleccionada
    ? rutaLiturgia("libro", { tipo: "proprium-de-tempore", clave: claveSeleccionada, version })
    : null;

  const docMissaLectura = useLectura<DocumentoResuelto>(tabDetalle === "missa" ? docMissaRuta : null);
  const docOfficiumLectura = useLectura<DocumentoResuelto>(tabDetalle === "officium" ? docOfficiumRuta : null);

  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* 1. Cabecera común sin fecha (libro temático) */}
      <CabeceraLiturgica
        titulo="Proprium de Tempore"
        subtitulo="Propio del Tiempo · Ciclo anual de los misterios de Cristo"
        version={version}
        onVersion={setVersion}
      />

      {/* 2. Modo Detalle (cuando hay un día/formulario seleccionado) */}
      {elementoActual ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setClaveSeleccionada(null)}
              className="text-xs text-muted-foreground gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Volver a los tiempos</span>
            </Button>

            <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
              <Link href="/dashboard/liturgia">
                <Calendar className="size-3.5" />
                <span>¿Cuándo cae este año?</span>
              </Link>
            </Button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-xs">
                {elementoActual.codigo}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {LISTA_TIEMPOS_TEMPORE.find((t) => t.id === elementoActual.tiempo)?.castellano ?? elementoActual.tiempo}
              </Badge>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              {elementoActual.titulo}
            </h2>
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
                  <h3 className="font-heading text-base font-semibold">Formulario de Misa no generado</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    El texto de la Misa para {elementoActual.codigo} no está disponible en la base para esta versión.
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
                  <h3 className="font-heading text-base font-semibold">Oficio Divino no generado</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Las partes del Oficio para {elementoActual.codigo} no están disponibles en la base para esta versión.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* 3. Modo Índice por tiempos */
        <div className="space-y-6">
          {/* Barra de 8 tiempos */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-border/50 pb-2.5">
            {LISTA_TIEMPOS_TEMPORE.map((t) => {
              const activo = tiempoActivo === t.id;
              return (
                <Button
                  key={t.id}
                  variant={activo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTiempoActivo(t.id)}
                  className={cn(
                    "gap-1 text-xs font-sans h-8 shrink-0 cursor-pointer select-none",
                    activo ? "font-semibold shadow-xs" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="font-serif">{t.latino}</span>
                  <span className="opacity-75 text-[10px]">({t.castellano})</span>
                </Button>
              );
            })}
          </div>

          {/* Listado de domingos y ferias del tiempo activo */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Domingos y ferias · {LISTA_TIEMPOS_TEMPORE.find((t) => t.id === tiempoActivo)?.latino}
              </h3>
              <span className="text-xs text-muted-foreground font-sans">
                {elementosDelTiempo.length} celebraciones
              </span>
            </div>

            {indiceLectura.estado === "cargando" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : elementosDelTiempo.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {elementosDelTiempo.map((el) => (
                  <Card
                    key={el.claveBase}
                    onClick={() => setClaveSeleccionada(el.claveBase)}
                    className="group border-border/70 hover:border-primary/80 hover:shadow-md transition-all cursor-pointer p-4 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {el.codigo}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {el.tieneMissa ? (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              Misa
                            </Badge>
                          ) : null}
                          {el.tieneOfficium ? (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              Oficio
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      <h4 className="font-serif text-base font-bold group-hover:text-primary transition-colors leading-snug">
                        {el.titulo}
                      </h4>
                    </div>

                    <div className="pt-3 flex items-center justify-end text-xs text-muted-foreground group-hover:text-foreground">
                      <span>Ver textos</span>
                      <ChevronRight className="size-3.5 ml-0.5" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                <CalendarRange className="size-8 mx-auto text-muted-foreground/60" />
                <h4 className="font-heading text-base font-semibold">Índice no generado</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Los libros de {tiempoActivo} todavía no fueron cargados en la base para la versión {version}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
