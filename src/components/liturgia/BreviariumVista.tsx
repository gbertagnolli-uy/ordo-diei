"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { LiturgiaTexto } from "./LiturgiaTexto";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import { horaActual, horasOrdenadasDesde, HORAS_INFO, LISTA_HORAS } from "@/lib/liturgia/horas";
import { esHora } from "@/lib/liturgia/tipos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilaDia } from "@/lib/liturgia/repositorio";
import type { DocumentoResuelto, Hora } from "@/lib/liturgia/tipos";
import { cn } from "@/lib/utils";

interface BreviariumVistaProps {
  horaInicial?: Hora;
  className?: string;
}

/**
 * Pantalla Breviarium — Oficio Divino (SPEC liturgia §10.2).
 * Hub con Hora destacada (AHORA según franja S8 en APP_TZ) + 7 cards secundarias ordenadas cronológicamente.
 * Lector de la Hora con barra de navegación de 8 Horas y LiturgiaTexto bilingüe.
 */
export function BreviariumVista({ horaInicial, className }: BreviariumVistaProps) {
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const { version, setVersion, fecha, setFecha } = useParametrosLiturgia("breviarium");

  // La hora puede venir por prop de ruta dinámica /breviarium/[hora] o por query param ?hora=...
  const qHora = searchParams.get("hora");
  const horaActiva: Hora | null = horaInicial ?? (esHora(qHora) ? qHora : null);

  // Hora según reloj local familiar
  const horaVigente = horaActual();
  const horaDestacada = horaActiva ?? horaVigente;
  const infoHoraDestacada = HORAS_INFO[horaDestacada];
  const horasSecundarias = horasOrdenadasDesde(horaVigente).filter((h) => h.hora !== horaVigente);

  // Lecturas
  const diaLectura = useLectura<FilaDia>(rutaLiturgia("dia", { fecha, version }));
  const docRuta = horaActiva ? rutaLiturgia("hora", { fecha, hora: horaActiva, version }) : null;
  const docLectura = useLectura<DocumentoResuelto>(docRuta);

  const dia = diaLectura.estado === "ok" ? diaLectura.datos : null;

  // Construye la URL preservando fecha y version
  const armarUrlHora = (h: Hora | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("hora");
    const qs = params.toString();
    const base = h ? `/dashboard/liturgia/breviarium/${h}` : `/dashboard/liturgia/breviarium`;
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* 1. Cabecera común */}
      <CabeceraLiturgica
        titulo="Breviarium"
        subtitulo="Liturgia Horarum · Oficio Divino"
        version={version}
        onVersion={setVersion}
        fecha={fecha}
        onFecha={setFecha}
        dia={diaLectura}
      />

      {/* 2. Barra de salto entre las 8 Horas */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border/50 py-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {LISTA_HORAS.map((h) => {
            const esActiva = horaActiva === h.hora;
            const esMomentoActual = horaVigente === h.hora;

            return (
              <Button
                key={h.hora}
                asChild
                variant={esActiva ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-1.5 text-xs font-sans h-8 shrink-0 cursor-pointer select-none",
                  esActiva
                    ? "font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Link href={armarUrlHora(h.hora)}>
                  <span>{h.castellano}</span>
                  {esMomentoActual ? (
                    <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" title="Hora actual" />
                  ) : null}
                </Link>
              </Button>
            );
          })}
        </div>

        {horaActiva ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1.5 shrink-0"
          >
            <Link href={armarUrlHora(null)}>
              <ArrowLeft className="size-3.5" />
              <span>Ver todas las Horas</span>
            </Link>
          </Button>
        ) : null}
      </div>

      {/* 3. Modo Lector de la Hora */}
      {horaActiva ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {infoHoraDestacada.franja}
                </Badge>
                {horaActiva === horaVigente ? (
                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                    Hora actual
                  </Badge>
                ) : null}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                {infoHoraDestacada.tituloLatino} · {infoHoraDestacada.castellano}
              </h2>
              {dia ? (
                <p className="font-serif text-sm text-muted-foreground italic">
                  {dia.titulo}
                </p>
              ) : null}
            </div>
          </div>

          {/* Lector bilingüe o estados de carga */}
          {docLectura.estado === "cargando" ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : docLectura.estado === "ok" ? (
            <LiturgiaTexto documento={docLectura.datos} />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
              <BookOpen className="size-8 mx-auto text-muted-foreground/60" />
              <h3 className="font-heading text-base font-semibold">
                Oficio no generado
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                El texto de {infoHoraDestacada.castellano} ({infoHoraDestacada.tituloLatino}) todavía no fue generado en la base para esta fecha y versión.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* 4. Modo Hub (Card destacada + 7 secundarias) */
        <div className="space-y-6">
          {/* Card destacada: AHORA (SPEC §10.2, D54) */}
          <div className="group">
            <Card className="relative min-h-[22rem] md:min-h-[26rem] overflow-hidden rounded-2xl border-border/80 bg-black p-0 shadow-lg cursor-pointer select-none transition-all group-hover:ring-2 group-hover:ring-primary/80">
              {/* Imagen a sangre con Ken Burns */}
              <motion.div
                animate={{
                  scale: reduceMotion ? 1 : [1, 1.06],
                  transition: { duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" },
                }}
                className="absolute inset-0 size-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={HORAS_INFO[horaVigente].fotoUrl}
                  alt=""
                  className="size-full object-cover"
                />
              </motion.div>

              {/* Overlay de contraste D54: negro a transparente concentrado en la base. Medido (scripts/liturgia/medir-contraste.py): texto blanco ≥ 5,3:1 en las 8 fotos (percentil 95 de la luminancia de la zona de texto) */}
              <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

              {/* Contenido en la base izquierda */}
              <div className="relative z-10 flex h-full min-h-[22rem] md:min-h-[26rem] flex-col justify-end p-6 sm:p-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-2.5 py-0.5 shadow-md">
                    AHORA · {HORAS_INFO[horaVigente].franja}
                  </Badge>
                  <span className="text-xs text-white/80 font-sans flex items-center gap-1">
                    <Clock className="size-3.5" />
                    Hora canónica vigente
                  </span>
                </div>

                <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-balance text-white mb-1">
                  {HORAS_INFO[horaVigente].tituloLatino}
                </h2>

                <p className="font-sans text-sm sm:text-base text-white/90 mb-4 max-w-xl">
                  {HORAS_INFO[horaVigente].castellano}
                  {dia ? ` · ${dia.titulo}` : ""}
                </p>

                <div className="flex items-center justify-between pt-1">
                  {/* Enlace extendido: toda la tarjeta abre la Hora; el botón es el foco de teclado (SPEC §10.2) */}
                  <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-xl focus:ring-2 focus:ring-primary">
                    <Link href={armarUrlHora(horaVigente)} className="after:absolute after:inset-0 after:content-['']">
                      <BookOpen className="size-4 mr-2" />
                      Rezar {HORAS_INFO[horaVigente].castellano}
                    </Link>
                  </Button>

                  {/* Atribución Unsplash (enlaces con UTM; el clic no abre la Hora) */}
                  <div className="text-[10px] text-white/70 font-sans hidden sm:block">
                    Foto de{" "}
                    <a
                      href={HORAS_INFO[horaVigente].autorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-20 underline underline-offset-2 hover:text-white"
                    >
                      {HORAS_INFO[horaVigente].autorNombre}
                    </a>{" "}
                    en{" "}
                    <a
                      href={HORAS_INFO[horaVigente].paginaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-20 underline underline-offset-2 hover:text-white"
                    >
                      Unsplash
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Cards secundarias: Las otras 7 Horas en orden cronológico */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Horas del Oficio Divino
              </h3>
              <span className="text-xs text-muted-foreground font-sans">
                Ordenadas cronológicamente
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {horasSecundarias.map((h) => (
                <Link key={h.hora} href={armarUrlHora(h.hora)} className="block group">
                  <Card className="relative overflow-hidden rounded-xl border border-border/70 bg-card/70 p-0 shadow-xs group-hover:border-primary/70 group-hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none h-full">
                    {/* Foto de la franja (16:9) */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={h.fotoUrl}
                        alt=""
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-white/90 drop-shadow">
                        {h.franja}
                      </span>
                    </div>

                    <CardContent className="p-3">
                      <span className="block font-serif text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {h.tituloLatino}
                      </span>
                      <span className="block font-sans text-xs text-muted-foreground">
                        {h.castellano}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Atribución de las fotos de las Horas (Unsplash exige nombrar a cada autor con enlace) */}
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Fotos en{" "}
            <a href="https://unsplash.com/?utm_source=ordo_diei&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Unsplash
            </a>
            :{" "}
            {LISTA_HORAS.map((h, i) => (
              <React.Fragment key={h.hora}>
                {i > 0 ? " · " : ""}
                {h.castellano}{" "}
                <a href={h.autorUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {h.autorNombre}
                </a>
              </React.Fragment>
            ))}
            .
          </p>
        </div>
      )}
    </div>
  );
}
