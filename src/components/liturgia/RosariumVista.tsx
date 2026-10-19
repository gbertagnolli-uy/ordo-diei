"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, CircleDot, BookOpen, Maximize2, ShieldCheck, Sparkles } from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import { useImagenesMisterios } from "./useImagenesMisterios";
import {
  misteriosDelDia,
  GRUPOS_INFO,
  DEVOCIONARIO_ROSARIO,
  FUENTE_LECTURAS,
  type GrupoMisterios,
  type Misterio,
  type OracionRosario,
} from "@/lib/liturgia/rosario";
import type { FilaDia } from "@/lib/liturgia/repositorio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type ModoIdioma = "ambos" | "la" | "es";

interface RosariumVistaProps {
  className?: string;
}

/**
 * Pantalla Rosarium — Santo Rosario tradicional y Mysteria Rosarii (SPEC liturgia §10.8).
 *
 * Características principales:
 * 1. Tarjetas de acceso directo para rezar el Santo Rosario del día (5 misterios) y el Rosario completo (15 misterios),
 *    con oraciones en orden, imágenes de las cartas y modo contemplativo en pantalla completa.
 * 2. Misterios del día destacados en una sola columna con la imagen de cada misterio (la misma que en las cartas).
 * 3. Explorador de las 3 coronas tradicionales completas (15 misterios) en una sola columna con sus imágenes.
 * 4. Oraciones tradicionales bilingües (latín/español) y Litaniæ Lauretanæ.
 */
export function RosariumVista({ className }: RosariumVistaProps) {
  const { version, setVersion, fecha, setFecha } = useParametrosLiturgia("rosarium");
  const [modoIdioma, setModoIdioma] = useState<ModoIdioma>("ambos");
  const [grupoExplorador, setGrupoExplorador] = useState<GrupoMisterios>("gaudiosa");
  const obtenerImagen = useImagenesMisterios();

  // Lectura del día litúrgico para saber el tiempo en los domingos
  const diaLectura = useLectura<FilaDia>(rutaLiturgia("dia", { fecha, version }));
  const dia = diaLectura.estado === "ok" ? diaLectura.datos : null;

  // Misterios correspondientes al día seleccionado
  const infoHoy = useMemo(() => misteriosDelDia(fecha, dia?.tiempo), [fecha, dia?.tiempo]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (fecha) p.set("fecha", fecha);
    if (version) p.set("version", version);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [fecha, version]);

  const { oraciones, litaniaeLauretanae } = DEVOCIONARIO_ROSARIO;
  const primerMisterioHoy = infoHoy.misterios[0];

  return (
    <div className={cn("space-y-8 pb-16", className)}>
      {/* 1. Cabecera Litúrgica común */}
      <CabeceraLiturgica
        titulo="Rosarium"
        subtitulo="Mysteria Rosarii · Santo Rosario tradicional"
        version={version}
        onVersion={setVersion}
        fecha={fecha}
        onFecha={setFecha}
        dia={diaLectura}
      />

      {/* 2. Tarjetas para Rezar el Santo Rosario (Modo del día y Modo 15 misterios completos) */}
      <section aria-labelledby="titulo-rezar-rosario" className="space-y-3">
        <h2 id="titulo-rezar-rosario" className="sr-only">
          Rezar el Santo Rosario
        </h2>

        <div className="flex flex-col gap-4">
          {/* Card 1: Rezar el Santo Rosario del día (5 misterios) */}
          <Link
            href={`/dashboard/liturgia/rosarium/rezar${qs}`}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          >
            <Card className="py-0 gap-0 border-primary/45 bg-gradient-to-r from-primary/10 via-card to-card shadow-md transition-all duration-200 group-hover:border-primary group-hover:shadow-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {primerMisterioHoy && (
                  <div className="w-full sm:w-44 md:w-48 aspect-[63/88] shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-r border-border/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={obtenerImagen(primerMisterioHoy)}
                      alt={primerMisterioHoy.castellano}
                      className="block size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 gap-4">
                  <div className="space-y-2 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default" className="text-xs uppercase tracking-wider">
                        Rezar el Santo Rosario del Día
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {infoHoy.tituloLatino} · 5 misterios
                      </Badge>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Maximize2 className="size-3" />
                        Incluye modo Fullscreen
                      </Badge>
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      Rezar hoy: {infoHoy.tituloCastellano} ({infoHoy.tituloLatino})
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Abrí la guía paso a paso con todas las oraciones en orden, los 5 misterios de hoy ({infoHoy.motivo}) con sus imágenes de las cartas y el modo contemplativo en pantalla completa.
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-border/40">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform group-hover:translate-x-1">
                      <span>Comenzar a rezar</span>
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          {/* Card 2: Modo separado para rezar los 15 misterios completos */}
          <Link
            href={`/dashboard/liturgia/rosarium/rezar-completo${qs}`}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
          >
            <Card className="py-0 gap-0 border-border/80 bg-card/85 shadow-sm transition-all duration-200 group-hover:border-primary/70 group-hover:shadow-md overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-44 md:w-48 aspect-[63/88] shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-r border-border/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={obtenerImagen(GRUPOS_INFO.gloriosa.misterios[4])}
                    alt={GRUPOS_INFO.gloriosa.misterios[4].castellano}
                    className="block size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 gap-4">
                  <div className="space-y-2 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs uppercase tracking-wider">
                        <Sparkles className="size-3 text-primary" />
                        Rosarium Integrum · 15 Misterios Completos
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Maximize2 className="size-3" />
                        Incluye modo Fullscreen
                      </Badge>
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      Rezar los 15 Misterios Completos (Las Tres Coronas)
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Modo separado para rezar las tres coronas tradicionales seguidas (Gozosos, Dolorosos y Gloriosos) con todas las oraciones en orden, las 15 imágenes y modo pantalla completa.
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-border/40">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-transform group-hover:translate-x-1">
                      <span>Rezar 15 misterios</span>
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* 3. Sección destacada: Misterios del día (en una sola columna con imagen) */}
      <section aria-labelledby="titulo-misterios-dia" className="space-y-4">
        <Card className="border-primary/30 bg-card/80 shadow-md backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-primary/5 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs uppercase font-sans tracking-wide">
                    {infoHoy.grupo === "gaudiosa"
                      ? "Mysteria Gaudiosa"
                      : infoHoy.grupo === "dolorosa"
                        ? "Mysteria Dolorosa"
                        : "Mysteria Gloriosa"}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-sans capitalize">
                    {infoHoy.tituloCastellano}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-sans">
                    · Rezo asignado para hoy ({infoHoy.motivo})
                  </span>
                </div>
                <CardTitle id="titulo-misterios-dia" className="font-serif text-2xl font-bold tracking-tight pt-1">
                  Misterios del día: {infoHoy.tituloLatino}
                </CardTitle>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground border border-border/60 bg-background/60 px-2.5 py-1 rounded-md">
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                <span>Regla dominical tradicional</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-5 pb-6">
            <div className="flex flex-col gap-4">
              {infoHoy.misterios.map((m) => (
                <TarjetaMisterio
                  key={m.numero}
                  misterio={m}
                  imagenSrc={obtenerImagen(m)}
                  destacado={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Sección: Los 15 Misterios tradicionales (Explorador de coronas en una sola columna) */}
      <section aria-labelledby="titulo-todos-misterios" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="space-y-0.5">
            <h2 id="titulo-todos-misterios" className="font-heading text-lg font-semibold flex items-center gap-2">
              <CircleDot className="size-5 text-primary" />
              <span>Las Tres Coronas del Santo Rosario</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              15 misterios de la devoción tradicional preconciliar (sin misterios luminosos de 2002).
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            {infoHoy.grupo === grupoExplorador ? (
              <Badge variant="secondary" className="text-[11px] font-sans">
                Corona correspondiente al día
              </Badge>
            ) : null}
          </div>
        </div>

        <Tabs
          value={grupoExplorador}
          onValueChange={(v) => setGrupoExplorador(v as GrupoMisterios)}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="gaudiosa" className="text-xs font-semibold gap-1.5">
              <span>Gozosos</span>
              {infoHoy.grupo === "gaudiosa" && (
                <span className="size-1.5 rounded-full bg-primary inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger value="dolorosa" className="text-xs font-semibold gap-1.5">
              <span>Dolorosos</span>
              {infoHoy.grupo === "dolorosa" && (
                <span className="size-1.5 rounded-full bg-primary inline-block" />
              )}
            </TabsTrigger>
            <TabsTrigger value="gloriosa" className="text-xs font-semibold gap-1.5">
              <span>Gloriosos</span>
              {infoHoy.grupo === "gloriosa" && (
                <span className="size-1.5 rounded-full bg-primary inline-block" />
              )}
            </TabsTrigger>
          </TabsList>

          {(["gaudiosa", "dolorosa", "gloriosa"] as const).map((g) => {
            const info = GRUPOS_INFO[g];
            return (
              <TabsContent key={g} value={g} className="space-y-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-serif font-bold text-sm text-foreground">
                      {info.latino} — {info.castellano}
                    </span>
                    <p className="text-muted-foreground">
                      {g === "gaudiosa"
                        ? "Lunes y jueves. Domingos de Adviento, Navidad y Epifanía."
                        : g === "dolorosa"
                          ? "Martes y viernes. Domingos de Cuaresma y Pasión."
                          : "Miércoles y sábados. Domingos del resto del año (Septuagésima, tiempo pascual y per annum)."}
                    </p>
                  </div>
                  {infoHoy.grupo === g && (
                    <Badge variant="default" className="text-[10px] uppercase">
                      Rezo de hoy
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {info.misterios.map((m) => (
                    <TarjetaMisterio
                      key={m.numero}
                      misterio={m}
                      imagenSrc={obtenerImagen(m)}
                      destacado={infoHoy.grupo === g}
                    />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Lecturas de cada misterio: {FUENTE_LECTURAS}. Solo en latín (sin traducción).
        </p>
      </section>

      {/* 5. Sección: Oraciones del Santo Rosario (Preces Sancti Rosarii) */}
      <section aria-labelledby="titulo-oraciones-rosario" className="space-y-5 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
          <div className="space-y-0.5">
            <h2 id="titulo-oraciones-rosario" className="font-heading text-lg font-semibold flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <span>Oraciones del Santo Rosario</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Preces tradicionales en latín y español con indicación de fuentes históricas impresas.
            </p>
          </div>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={modoIdioma}
            onValueChange={(v) => v && setModoIdioma(v as ModoIdioma)}
            aria-label="Idioma de las oraciones"
          >
            <ToggleGroupItem value="ambos" className="text-xs">
              Ambos
            </ToggleGroupItem>
            <ToggleGroupItem value="la" className="text-xs">
              Latín
            </ToggleGroupItem>
            <ToggleGroupItem value="es" className="text-xs">
              Español
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Oraciones básicas del Rosario */}
        <div className="space-y-4">
          <TarjetaOracion oracion={oraciones.signumCrucis} modo={modoIdioma} />
          <TarjetaOracion oracion={oraciones.credo} modo={modoIdioma} />
          <TarjetaOracion oracion={oraciones.paterNoster} modo={modoIdioma} />
          <TarjetaOracion oracion={oraciones.aveMaria} modo={modoIdioma} />
          <TarjetaOracion oracion={oraciones.gloriaPatri} modo={modoIdioma} />
          <TarjetaOracion oracion={oraciones.fatima} modo={modoIdioma} />
          <TarjetaOracion oracion={oraciones.salveRegina} modo={modoIdioma} />
          <TarjetaOracion oracion={oraciones.oremusFinal} modo={modoIdioma} />
        </div>

        {/* Letanías Lauretanas */}
        <Card className="border border-border/80 bg-card/70 shadow-xs backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <CardTitle className="font-serif text-xl font-bold">
                  {litaniaeLauretanae.tituloLa}
                </CardTitle>
                <p className="text-xs text-muted-foreground font-sans">
                  {litaniaeLauretanae.tituloEs}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground font-sans italic">
                {litaniaeLauretanae.fuente}
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4 pb-6 space-y-4">
            <p className="text-xs text-muted-foreground">
              Súplica tradicional al final del Santo Rosario.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm font-serif">
              {litaniaeLauretanae.invocaciones.map((inv, idx) => {
                const conLatin = modoIdioma !== "es";
                const conEspanol = modoIdioma !== "la";
                return (
                  <div
                    key={idx}
                    className="flex flex-col py-1 border-b border-border/30 last:border-none"
                  >
                    {conLatin && (
                      <span lang="la" className="text-foreground/95 leading-snug">
                        {inv.la}
                      </span>
                    )}
                    {conEspanol && (
                      <span
                        lang="es"
                        className={cn(
                          "text-xs font-sans text-muted-foreground leading-normal",
                          conLatin && "mt-0.5",
                        )}
                      >
                        {inv.es}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes auxiliares
// ---------------------------------------------------------------------------

function TarjetaMisterio({
  misterio,
  imagenSrc,
  destacado,
}: {
  misterio: Misterio;
  imagenSrc: string;
  destacado?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. Card con la imagen destacada (proporción 63:88 de las cartas, sin fondo oscuro, sin recortes y sin espacio libre) y todos los datos del misterio */}
      <Card
        className={cn(
          "py-0 gap-0 overflow-hidden border transition-all duration-200",
          destacado
            ? "border-primary/40 bg-card shadow-xs hover:border-primary/70"
            : "border-border/70 bg-card/50 hover:bg-card/80",
        )}
      >
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-52 md:w-56 aspect-[63/88] shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-r border-border/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagenSrc}
              alt={misterio.castellano}
              className="block size-full object-cover"
            />
          </div>

          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 gap-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={destacado ? "default" : "outline"}
                  className="font-mono text-xs font-bold px-2.5 py-0.5 shrink-0"
                >
                  Mysterium {misterio.numeroRomano}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  {misterio.cita}
                </span>
              </div>

              <div className="space-y-1">
                <h3 lang="la" className="font-serif font-bold text-xl sm:text-2xl leading-tight text-foreground">
                  {misterio.latino}
                </h3>
                <p className="text-sm sm:text-base text-foreground/85 font-sans leading-snug">
                  {misterio.castellano}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between">
              <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block">
                  Fruto espiritual
                </span>
                <span className="font-serif text-xs sm:text-sm italic text-foreground">
                  {misterio.fruto}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Card con Lectio Vulgatæ en acordeón colapsado */}
      <Card className="py-0 gap-0 border border-border/70 bg-card/75 shadow-xs overflow-hidden">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-primary select-none hover:bg-muted/30 transition-colors">
            <div className="flex flex-wrap items-center gap-2">
              <span>Lectio Vulgatæ ({misterio.cita})</span>
              <span className="text-[11px] font-normal normal-case text-muted-foreground italic">
                · {FUENTE_LECTURAS}
              </span>
            </div>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="border-t border-border/50 bg-muted/20 px-4 py-3.5 space-y-2">
            {misterio.lecturas.map((l) => (
              <div key={l.ref}>
                <span className="block text-[11px] font-mono text-muted-foreground">{l.ref}</span>
                <p lang="la" className="text-xs sm:text-sm font-serif leading-relaxed text-foreground/95">
                  {l.la}
                </p>
              </div>
            ))}
          </div>
        </details>
      </Card>
    </div>
  );
}

function TarjetaOracion({ oracion, modo }: { oracion: OracionRosario; modo: ModoIdioma }) {
  const conLatin = modo !== "es";
  const conEspanol = modo !== "la";

  return (
    <Card className="border border-border/70 bg-card/60 shadow-xs backdrop-blur-sm overflow-hidden">
      <CardHeader className="py-2.5 px-4 bg-muted/20 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-base text-foreground">
              {oracion.tituloLa}
            </h3>
            {oracion.etiqueta && (
              <Badge variant="outline" className="text-[10px] font-sans border-primary/40 text-primary">
                {oracion.etiqueta}
              </Badge>
            )}
            {conEspanol && oracion.tituloEs !== oracion.tituloLa && (
              <span className="text-xs text-muted-foreground font-sans">
                ({oracion.tituloEs})
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground/80 font-sans italic">
            {oracion.fuente}
          </span>
        </div>
      </CardHeader>

      <CardContent className="py-3.5 px-4 space-y-3">
        <div className={cn("grid gap-x-8 gap-y-2", modo === "ambos" && "lg:grid-cols-2")}>
          {conLatin && (
            <div lang="la" className="font-serif text-[15px] sm:text-base leading-relaxed text-foreground">
              <p>{oracion.textoLa}</p>
              {oracion.versiculoLa && (
                <div className="mt-2.5 pt-2 border-t border-border/30 text-xs text-foreground/90 whitespace-pre-line font-mono">
                  {oracion.versiculoLa}
                </div>
              )}
            </div>
          )}

          {conEspanol && (
            <div
              lang="es"
              className={cn(
                "font-serif text-[15px] sm:text-base leading-relaxed text-foreground/85",
                modo === "ambos" && "pl-0 lg:border-l lg:border-border/30 lg:pl-6",
              )}
            >
              <p>{oracion.textoEs}</p>
              {oracion.versiculoEs && (
                <div className="mt-2.5 pt-2 border-t border-border/30 text-xs text-foreground/80 whitespace-pre-line font-mono">
                  {oracion.versiculoEs}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

