"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CircleDot,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import { useImagenesMisterios } from "./useImagenesMisterios";
import { RosariumFullscreen } from "./RosariumFullscreen";
import {
  DEVOCIONARIO_ROSARIO,
  FUENTE_LECTURAS,
  obtenerMisteriosParaRezar,
  obtenerOrdenOracionesRosario,
  type MisterioEnSecuencia,
  type ModoRezoRosario,
  type OracionRosario,
  type PasoOracionOrdenada,
} from "@/lib/liturgia/rosario";
import type { FilaDia } from "@/lib/liturgia/repositorio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type ModoIdioma = "ambos" | "la" | "es";

interface RosariumRezarVistaProps {
  modo: ModoRezoRosario;
  className?: string;
}

/**
 * Pantalla dedicada para rezar el Santo Rosario paso a paso en una sola columna:
 * - Modo `"dia"`: los 5 misterios del día con sus imágenes de cartas y oraciones en orden.
 * - Modo `"completo"`: los 15 misterios completos (las tres coronas tradicionales) con imágenes y oraciones en orden.
 * - Incluye botón para entrar al modo contemplativo en Pantalla Completa (estilo salvapantallas).
 */
export function RosariumRezarVista({ modo, className }: RosariumRezarVistaProps) {
  const { version, setVersion, fecha, setFecha } = useParametrosLiturgia("rosarium");
  const [modoIdioma, setModoIdioma] = useState<ModoIdioma>("ambos");
  const [fullscreenAbierto, setFullscreenAbierto] = useState(false);
  const [indiceFullscreen, setIndiceFullscreen] = useState(0);
  const [cuentasPorMisterio, setCuentasPorMisterio] = useState<Record<number, number>>({});

  const obtenerImagen = useImagenesMisterios();

  // Lectura del día litúrgico para conocer el tiempo en domingo
  const diaLectura = useLectura<FilaDia>(rutaLiturgia("dia", { fecha, version }));
  const dia = diaLectura.estado === "ok" ? diaLectura.datos : null;

  const secuencia = useMemo(
    () => obtenerMisteriosParaRezar(modo, fecha, dia?.tiempo),
    [modo, fecha, dia?.tiempo],
  );

  const ordenOraciones = useMemo(() => obtenerOrdenOracionesRosario(), []);
  const { litaniaeLauretanae } = DEVOCIONARIO_ROSARIO;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (fecha) p.set("fecha", fecha);
    if (version) p.set("version", version);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [fecha, version]);

  const abrirFullscreenEn = (idx: number) => {
    setIndiceFullscreen(idx);
    setFullscreenAbierto(true);
  };

  return (
    <div className={cn("space-y-8 pb-16", className)}>
      {/* 1. Cabecera Litúrgica */}
      <CabeceraLiturgica
        titulo={modo === "completo" ? "Rosarium Integrum (XV Mysteria)" : "Ordo Recitandi Rosarium"}
        subtitulo={
          modo === "completo"
            ? "Rezo completo de las tres coronas tradicionales (15 misterios)"
            : `Rezo del Santo Rosario del día · ${secuencia.tituloLatino}`
        }
        version={version}
        onVersion={setVersion}
        fecha={fecha}
        onFecha={setFecha}
        dia={diaLectura}
      />

      {/* 2. Barra de acciones: Volver, cambiar modo (5 vs 15), selector de idioma y Botón Fullscreen */}
      <Card className="border-primary/30 bg-card/85 shadow-sm backdrop-blur-sm">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/dashboard/liturgia/rosarium${qs}`}>
                <ArrowLeft className="size-4" />
                <span>Volver a Rosarium</span>
              </Link>
            </Button>

            {modo === "dia" ? (
              <Button asChild variant="secondary" size="sm" className="gap-1.5 text-xs">
                <Link href={`/dashboard/liturgia/rosarium/rezar-completo${qs}`}>
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Modo 15 misterios completos</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="secondary" size="sm" className="gap-1.5 text-xs">
                <Link href={`/dashboard/liturgia/rosarium/rezar${qs}`}>
                  <CircleDot className="size-3.5 text-primary" />
                  <span>Modo misterios del día (5)</span>
                </Link>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <Button
              type="button"
              size="sm"
              onClick={() => abrirFullscreenEn(indiceFullscreen)}
              className="gap-2 font-semibold shadow-sm cursor-pointer"
            >
              <Maximize2 className="size-4" />
              <span>Pantalla completa</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Parte I: Oraciones Iniciales en orden (una sola columna) */}
      <section aria-labelledby="titulo-oraciones-iniciales" className="space-y-4">
        <div className="border-b border-border/60 pb-3 space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-mono text-xs">
              Parte I
            </Badge>
            <h2 id="titulo-oraciones-iniciales" className="font-heading text-lg font-semibold">
              Oraciones Iniciales (Rito de Introducción)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Rezar en orden antes de comenzar el primer misterio.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {ordenOraciones.iniciales.map((paso) => (
            <TarjetaPasoOracion key={paso.id} paso={paso} modo={modoIdioma} />
          ))}
        </div>
      </section>

      {/* 4. Parte II: Misterios en orden (una sola columna, con imagen de las cartas y oraciones de cada decena) */}
      <section aria-labelledby="titulo-misterios-rezo" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="font-mono text-xs">
                Parte II
              </Badge>
              <h2 id="titulo-misterios-rezo" className="font-heading text-lg font-semibold">
                {secuencia.tituloLatino} — {secuencia.tituloCastellano}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {secuencia.subtitulo} · Lecturas de la {FUENTE_LECTURAS}.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => abrirFullscreenEn(0)}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Maximize2 className="size-3.5 text-primary" />
            <span>Contemplar desde el I misterio en Fullscreen</span>
          </Button>
        </div>

        {/* Lista de misterios en una sola columna */}
        <div className="flex flex-col gap-6">
          {secuencia.misterios.map((m, idx) => {
            const mostrarEncabezadoCorona =
              modo === "completo" &&
              (idx === 0 || secuencia.misterios[idx - 1]?.grupo !== m.grupo);

            const cuentas = cuentasPorMisterio[m.indiceGlobal] ?? 0;

            return (
              <React.Fragment key={`${m.grupo}-${m.numero}`}>
                {mostrarEncabezadoCorona && (
                  <div className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
                        Corona {m.grupo === "gaudiosa" ? "I" : m.grupo === "dolorosa" ? "II" : "III"}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-foreground">
                        {m.grupoLatino} — {m.grupoCastellano}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      Misterios {idx + 1} al {idx + 5} de 15
                    </Badge>
                  </div>
                )}

                <TarjetaMisterioRezo
                  misterio={m}
                  imagenSrc={obtenerImagen(m)}
                  pasosDecena={ordenOraciones.decena}
                  modoIdioma={modoIdioma}
                  cuentas={cuentas}
                  onCambiarCuentas={(valor) =>
                    setCuentasPorMisterio((prev) => ({ ...prev, [m.indiceGlobal]: valor }))
                  }
                  onAbrirFullscreen={() => abrirFullscreenEn(idx)}
                />
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* 5. Parte III: Oraciones Finales y Letanías Lauretanas en orden (una sola columna) */}
      <section aria-labelledby="titulo-oraciones-finales" className="space-y-4 pt-2">
        <div className="border-b border-border/60 pb-3 space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-mono text-xs">
              Parte III
            </Badge>
            <h2 id="titulo-oraciones-finales" className="font-heading text-lg font-semibold flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <span>Oraciones Finales y Letanías Lauretanas</span>
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Rezar en orden al terminar el último misterio.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* 1. Salve Regina */}
          <TarjetaPasoOracion paso={ordenOraciones.finales[0]} modo={modoIdioma} />

          {/* 2. Oremus */}
          <TarjetaPasoOracion paso={ordenOraciones.finales[1]} modo={modoIdioma} />

          {/* 3. Litaniæ Lauretanæ */}
          <Card className="border border-border/80 bg-card/70 shadow-xs backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      Paso 3
                    </Badge>
                    <CardTitle className="font-serif text-xl font-bold">
                      {litaniaeLauretanae.tituloLa}
                    </CardTitle>
                  </div>
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
              <div className="flex flex-col divide-y divide-border/30 text-sm font-serif">
                {litaniaeLauretanae.invocaciones.map((inv, idx) => {
                  const conLatin = modoIdioma !== "es";
                  const conEspanol = modoIdioma !== "la";
                  return (
                    <div key={idx} className="flex flex-col py-1.5">
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

          {/* 4. Signum Crucis final */}
          <TarjetaPasoOracion paso={ordenOraciones.finales[2]} modo={modoIdioma} />
        </div>
      </section>

      {/* Overlay de Pantalla Completa estilo Screensaver */}
      {fullscreenAbierto && (
        <RosariumFullscreen
          misterios={secuencia.misterios}
          indiceInicial={indiceFullscreen}
          tituloModo={
            modo === "completo"
              ? "Rosarium Integrum · 15 Misterios"
              : `Rosarium · ${secuencia.tituloLatino}`
          }
          obtenerImagen={obtenerImagen}
          onCambiarIndice={setIndiceFullscreen}
          onSalir={() => setFullscreenAbierto(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

function TarjetaPasoOracion({ paso, modo }: { paso: PasoOracionOrdenada; modo: ModoIdioma }) {
  return (
    <Card className="border border-border/75 bg-card/70 shadow-xs overflow-hidden">
      <CardHeader className="py-2.5 px-4 bg-muted/25 border-b border-border/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="font-mono text-xs">
              Paso {paso.orden}
            </Badge>
            {paso.repeticiones && paso.repeticiones > 1 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {paso.repeticiones}×
              </Badge>
            )}
            <h3 className="font-serif font-bold text-base text-foreground">
              {paso.oracion.tituloLa}
            </h3>
            {paso.oracion.tituloEs !== paso.oracion.tituloLa && (
              <span className="text-xs text-muted-foreground font-sans">
                ({paso.oracion.tituloEs})
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{paso.indicacion}</span>
        </div>
      </CardHeader>
      <CardContent className="py-3.5 px-4">
        <BloqueTextoOracion oracion={paso.oracion} modo={modo} />
      </CardContent>
    </Card>
  );
}

function TarjetaMisterioRezo({
  misterio,
  imagenSrc,
  pasosDecena,
  modoIdioma,
  cuentas,
  onCambiarCuentas,
  onAbrirFullscreen,
}: {
  misterio: MisterioEnSecuencia;
  imagenSrc: string;
  pasosDecena: PasoOracionOrdenada[];
  modoIdioma: ModoIdioma;
  cuentas: number;
  onCambiarCuentas: (n: number) => void;
  onAbrirFullscreen: () => void;
}) {
  return (
    <Card className="border-primary/35 bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Imagen de la carta del misterio */}
        <div className="md:w-64 lg:w-72 shrink-0 bg-stone-950/90 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border/50">
          <div className="relative aspect-[63/88] w-44 sm:w-52 md:w-full overflow-hidden rounded-xl border border-amber-500/40 bg-stone-900 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagenSrc}
              alt={misterio.castellano}
              className="size-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAbrirFullscreen}
            className="mt-3 w-full gap-1.5 text-xs cursor-pointer"
          >
            <Maximize2 className="size-3.5 text-primary" />
            <span>Ver en pantalla completa</span>
          </Button>
        </div>

        {/* Contenido del misterio y oraciones de la decena en orden */}
        <div className="flex-1 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/50 pb-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="font-mono text-xs font-bold">
                  Mysterium {misterio.numeroRomano}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {misterio.grupoLatino}
                </Badge>
                {misterio.totalGlobal > 5 && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    #{misterio.indiceGlobal} / {misterio.totalGlobal}
                  </Badge>
                )}
                <span className="text-xs font-mono text-muted-foreground">
                  {misterio.cita}
                </span>
              </div>

              <h3 lang="la" className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                {misterio.latino}
              </h3>
              <p className="text-sm text-foreground/85 font-sans">
                {misterio.castellano}
              </p>
            </div>

            <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-1.5 text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block">
                Fruto espiritual
              </span>
              <span className="font-serif text-xs italic text-foreground">
                {misterio.fruto}
              </span>
            </div>
          </div>

          {/* Cita y lectura de la Vulgata */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Lectio Vulgatæ ({misterio.cita})
              </span>
              <span className="text-[11px] text-muted-foreground italic">
                {FUENTE_LECTURAS}
              </span>
            </div>
            {misterio.lecturas.map((l) => (
              <p key={l.ref} lang="la" className="font-serif text-sm leading-relaxed text-foreground/95">
                {l.la}
              </p>
            ))}
          </div>

          {/* Contador interactivo de las 10 Avemarías de la decena */}
          <div className="rounded-xl border border-border/60 bg-card/60 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">
                Decena · Cuentas de las 10 Avemarías ({cuentas}/10)
              </span>
              {cuentas > 0 && (
                <button
                  type="button"
                  onClick={() => onCambiarCuentas(0)}
                  className="text-xs text-muted-foreground underline hover:text-foreground cursor-pointer"
                >
                  Reiniciar decena
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                const completada = num <= cuentas;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onCambiarCuentas(cuentas === num ? num - 1 : num)}
                    aria-label={`Ave María ${num} de 10`}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border text-xs font-mono font-bold transition-all cursor-pointer",
                      completada
                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    {completada ? <Check className="size-3.5" /> : num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Oraciones de la decena en orden */}
          <details className="rounded-xl border border-border/60 bg-muted/20 p-3.5 group" open={misterio.indiceGlobal === 1}>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-primary select-none">
              Oraciones de la decena en orden (1× Pater Noster · 10× Ave Maria · 1× Gloria Patri · Oratio Fatimæ)
            </summary>
            <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
              {pasosDecena.map((paso) => (
                <div key={paso.id} className="rounded-lg border border-border/50 bg-card/80 p-3 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {paso.orden}. {paso.repeticiones ? `${paso.repeticiones}×` : ""} {paso.oracion.tituloLa}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {paso.oracion.tituloEs}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{paso.indicacion}</span>
                  </div>
                  <BloqueTextoOracion oracion={paso.oracion} modo={modoIdioma} compacto />
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </Card>
  );
}

function BloqueTextoOracion({
  oracion,
  modo,
  compacto = false,
}: {
  oracion: OracionRosario;
  modo: ModoIdioma;
  compacto?: boolean;
}) {
  const conLatin = modo !== "es";
  const conEspanol = modo !== "la";

  return (
    <div className={cn("flex flex-col gap-3", !compacto && modo === "ambos" && "lg:grid lg:grid-cols-2 lg:gap-6")}>
      {conLatin && (
        <div lang="la" className={cn("font-serif leading-relaxed text-foreground", compacto ? "text-sm" : "text-[15px] sm:text-base")}>
          <p>{oracion.textoLa}</p>
          {oracion.versiculoLa && (
            <div className="mt-2 pt-2 border-t border-border/30 text-xs text-foreground/90 whitespace-pre-line font-mono">
              {oracion.versiculoLa}
            </div>
          )}
        </div>
      )}

      {conEspanol && (
        <div
          lang="es"
          className={cn(
            "font-serif leading-relaxed text-foreground/85",
            compacto ? "text-sm" : "text-[15px] sm:text-base",
            !compacto && modo === "ambos" && "lg:border-l lg:border-border/30 lg:pl-6",
          )}
        >
          <p>{oracion.textoEs}</p>
          {oracion.versiculoEs && (
            <div className="mt-2 pt-2 border-t border-border/30 text-xs text-foreground/80 whitespace-pre-line font-mono">
              {oracion.versiculoEs}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
