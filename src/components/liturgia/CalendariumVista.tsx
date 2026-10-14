"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Church, ChevronRight, CircleDot, ScrollText } from "lucide-react";
import { CabeceraLiturgica } from "./CabeceraLiturgica";
import { CalendariumMes } from "./CalendariumMes";
import { ColorLiturgicoPunto } from "./ColorLiturgicoPunto";
import { useLectura, rutaLiturgia } from "./useLectura";
import { useParametrosLiturgia } from "./useParametrosLiturgia";
import { horaActual, HORAS_INFO } from "@/lib/liturgia/horas";
import { misteriosDelDia } from "@/lib/liturgia/rosario";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilaDia } from "@/lib/liturgia/repositorio";
import type { DocumentoResuelto, Hora } from "@/lib/liturgia/tipos";
import { cn } from "@/lib/utils";

const TODAS_LAS_HORAS: Hora[] = [
  "Matutinum", "Laudes", "Prima", "Tertia",
  "Sexta", "Nona", "Vespera", "Completorium"
];

function extraerTextoSeccion(doc: DocumentoResuelto | undefined, claveBusqueda: string): { la: string; es: string } | null {
  if (!doc?.secciones) return null;
  const sec = doc.secciones.find((s) => s.clave.toLowerCase().includes(claveBusqueda.toLowerCase()));
  if (!sec || sec.bloques.length === 0) return null;

  for (const b of sec.bloques) {
    const laTexto = b.la.map((s) => ("v" in s ? s.v : "")).filter(Boolean).join(" ");
    const esTexto = (b.es ?? []).map((s) => ("v" in s ? s.v : "")).filter(Boolean).join(" ");
    if (laTexto.length > 5) {
      return { la: laTexto, es: esTexto || "sin traducción" };
    }
  }
  return null;
}

/**
 * Pantalla principal del Calendarium litúrgico (SPEC §10.1).
 * Incluye CabeceraLiturgica, Card Hoy, Card Mes, Breviarium del día, Missale del día,
 * Mysteria Rosarii y Martyrologium.
 */
export function CalendariumVista() {
  const { version, setVersion, fecha, setFecha } = useParametrosLiturgia("calendarium");
  const [expandirMartirologio, setExpandirMartirologio] = useState(false);

  // Lecturas de la API
  const diaLectura = useLectura<FilaDia>(rutaLiturgia("dia", { fecha, version }));
  const missaLectura = useLectura<DocumentoResuelto>(rutaLiturgia("missa", { fecha, version }));
  const martyrologiumLectura = useLectura<DocumentoResuelto>(rutaLiturgia("martyrologium", { fecha, version }));

  const dia = diaLectura.estado === "ok" ? diaLectura.datos : null;
  const horaVigente = horaActual();
  const infoHoraVigente = HORAS_INFO[horaVigente];
  const rosarioInfo = misteriosDelDia(fecha, dia?.tiempo);

  // Datos del Missale del día
  const docMissa = missaLectura.estado === "ok" ? missaLectura.datos : undefined;
  const introitus = extraerTextoSeccion(docMissa, "introitus");
  const oratio = extraerTextoSeccion(docMissa, "oratio");
  const epistola = extraerTextoSeccion(docMissa, "lectio") || extraerTextoSeccion(docMissa, "epistola");
  const evangelium = extraerTextoSeccion(docMissa, "evangelium");

  // Martirologio del día
  const docMart = martyrologiumLectura.estado === "ok" ? martyrologiumLectura.datos : undefined;
  // El documento trae «titulus» (la fecha en latín) y «martyrologium» (un bloque por elogio)
  const bloquesMart = docMart?.secciones?.find((s) => s.clave === "martyrologium")?.bloques ?? [];
  const textoDe = (segs: readonly { t: string; v?: string }[] | null | undefined) =>
    (segs ?? []).map((s) => s.v ?? "").filter(Boolean).join(" ");
  const martLatino = bloquesMart.map((b) => textoDe(b.la as never)).filter(Boolean).join("\n\n");
  const martEspanol = bloquesMart.map((b) => textoDe(b.es as never)).filter(Boolean).join("\n\n");

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Cabecera común con navegación por fecha y selector de versión */}
      <CabeceraLiturgica
        titulo="Calendarium"
        subtitulo="Calendario litúrgico"
        version={version}
        onVersion={setVersion}
        fecha={fecha}
        onFecha={setFecha}
        dia={diaLectura}
      />

      {/* 2. Grilla principal (12 columnas en escritorio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* --- Card Hoy (8 cols en desktop) --- */}
        <Card className="lg:col-span-8 flex flex-col justify-between border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {dia ? <ColorLiturgicoPunto color={dia.color} className="size-3" /> : null}
                <span className="font-heading text-sm font-semibold capitalize">
                  {dia ? `${dia.color} · ${dia.rango}` : "Día litúrgico"}
                </span>
                {dia?.tiempo ? (
                  <Badge variant="outline" className="text-xs uppercase font-sans tracking-wide">
                    {dia.tiempo}
                  </Badge>
                ) : null}
              </div>
              {dia?.dominical ? (
                <Badge variant="secondary" className="text-xs font-semibold">
                  Día del Señor
                </Badge>
              ) : null}
            </div>

            {diaLectura.estado === "cargando" ? (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : dia ? (
              <div className="space-y-1.5 pt-2">
                <CardTitle className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-balance leading-tight">
                  {dia.titulo}
                </CardTitle>
                {dia.tituloEs ? (
                  <p className="font-serif text-base text-muted-foreground italic leading-snug">
                    {dia.tituloEs}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="py-4 text-muted-foreground italic">
                Este día todavía no se generó en la base de datos para la versión seleccionada.
              </div>
            )}
          </CardHeader>

          {dia && Array.isArray(dia.lineas) && dia.lineas.length > 0 ? (
            <CardContent className="pt-0 pb-4 text-sm font-serif text-muted-foreground/90 space-y-1 border-t border-border/40 mt-3 pt-3">
              {dia.lineas.map((linea, idx) => (
                <p key={idx} className="leading-relaxed">
                  {linea}
                </p>
              ))}
            </CardContent>
          ) : null}

          <CardFooter className="pt-2 pb-4 bg-muted/20 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>Tridentine - {version}</span>
            <span>Calendarium Generale</span>
          </CardFooter>
        </Card>

        {/* --- Card Mes (4 cols en desktop) --- */}
        <div className="lg:col-span-4">
          <CalendariumMes
            fechaSeleccionada={fecha}
            version={version}
            onFecha={setFecha}
          />
        </div>

        {/* --- Card Breviarium del día (4 cols) --- */}
        <Card className="col-span-12 md:col-span-4 flex flex-col justify-between border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden group">
          <div className="relative h-32 overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={infoHoraVigente.fotoUrl}
              alt=""
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <Badge className="bg-primary/80 text-primary-foreground text-[10px] font-semibold mb-1">
                AHORA · {infoHoraVigente.franja}
              </Badge>
              <h3 className="font-serif text-xl font-bold tracking-tight leading-tight">
                {infoHoraVigente.tituloLatino}
              </h3>
              <p className="text-xs text-white/80 font-sans">
                {infoHoraVigente.castellano}
              </p>
            </div>
          </div>

          <CardContent className="pt-3 pb-2 space-y-3">
            <p className="text-[10px] text-muted-foreground">
              Foto de{" "}
              <a href={infoHoraVigente.autorUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {infoHoraVigente.autorNombre}
              </a>{" "}
              en{" "}
              <a href={infoHoraVigente.paginaUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Unsplash
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              8 Horas canónicas del Oficio Divino:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TODAS_LAS_HORAS.map((h) => {
                const info = HORAS_INFO[h];
                const esActual = h === horaVigente;
                return (
                  <Link
                    key={h}
                    href={`/dashboard/liturgia/breviarium?hora=${h}&fecha=${fecha}&version=${version}`}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-sans transition-colors border select-none",
                      esActual
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60",
                    )}
                  >
                    {info.castellano}
                  </Link>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/40">
            <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
              <Link href={`/dashboard/liturgia/breviarium?fecha=${fecha}&version=${version}`}>
                <span>Abrir Breviarium</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* --- Card Missale del día (4 cols) --- */}
        <Card className="col-span-12 md:col-span-4 flex flex-col justify-between border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Church className="size-4 text-primary" />
              <span className="text-xs font-heading font-semibold uppercase tracking-wider">
                Missa del día
              </span>
            </div>
            <CardTitle className="font-serif text-lg font-bold">
              {introitus ? "Introitus" : "Misa Tradicional"}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0 pb-2 space-y-3 text-xs leading-relaxed">
            {missaLectura.estado === "cargando" ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : introitus ? (
              <>
                <p className="font-serif italic text-foreground/90 line-clamp-2">
                  «{introitus.la}»
                </p>
                {oratio ? (
                  <div className="border-l-2 border-primary/50 pl-2 text-muted-foreground space-y-0.5">
                    <span className="font-semibold text-[11px] block text-foreground/80">Colecta (Oratio):</span>
                    <p className="line-clamp-2 font-serif">{oratio.es !== "sin traducción" ? oratio.es : oratio.la}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground font-sans">
                  {epistola ? <span className="bg-muted px-1.5 py-0.5 rounded">Epístola</span> : null}
                  {evangelium ? <span className="bg-muted px-1.5 py-0.5 rounded">Evangelio</span> : null}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground italic">
                {missaLectura.estado === "no-generado"
                  ? "Texto de la Misa aún no generado para este día."
                  : "Misa según el Rito Romano tradicional."}
              </p>
            )}
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/40">
            <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
              <Link href={`/dashboard/liturgia/missale?fecha=${fecha}&version=${version}`}>
                <span>Abrir Missale</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* --- Card Mysteria Rosarii (4 cols) --- */}
        <Card className="col-span-12 md:col-span-4 flex flex-col justify-between border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CircleDot className="size-4 text-primary" />
              <span className="text-xs font-heading font-semibold uppercase tracking-wider">
                Mysteria Rosarii
              </span>
            </div>
            <CardTitle className="font-serif text-lg font-bold">
              {rosarioInfo.tituloLatino}
            </CardTitle>
            <p className="text-xs text-muted-foreground font-sans capitalize">
              {rosarioInfo.tituloCastellano} · {rosarioInfo.motivo}
            </p>
          </CardHeader>

          <CardContent className="pt-0 pb-2 space-y-1.5 text-xs">
            {rosarioInfo.misterios.map((m) => (
              <div key={m.numero} className="flex items-start gap-1.5 leading-snug">
                <span className="font-semibold text-primary shrink-0 w-4 font-mono">
                  {m.numeroRomano}.
                </span>
                <span className="font-serif text-foreground/90 truncate">
                  {m.latino}
                </span>
              </div>
            ))}
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/40">
            <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
              <Link href={`/dashboard/liturgia/rosarium?fecha=${fecha}&version=${version}`}>
                <span>Abrir Rosarium</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* --- Card Martyrologium · Santoral del día (12 cols) --- */}
        <Card className="col-span-12 border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <ScrollText className="size-4 text-primary" />
              <div>
                <CardTitle className="font-serif text-lg font-bold">
                  Martyrologium · Santoral del día
                </CardTitle>
                <p className="text-xs text-muted-foreground font-sans">
                  Elogio martirológico tradicional y memoria de los santos
                </p>
              </div>
            </div>
            {martLatino ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandirMartirologio(!expandirMartirologio)}
              >
                {expandirMartirologio ? "Contraer" : "Ver todo"}
              </Button>
            ) : null}
          </CardHeader>

          <CardContent className="pt-1 pb-4 text-xs leading-relaxed space-y-3">
            {martyrologiumLectura.estado === "cargando" ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : martLatino ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna latina tradicional */}
                <div className="space-y-1">
                  <span className="font-semibold text-primary font-mono text-[11px] block">
                    Latín tradicional:
                  </span>
                  <p className={cn("font-serif text-foreground/90 text-justify whitespace-pre-line", !expandirMartirologio && "line-clamp-3")}>
                    {martLatino}
                  </p>
                </div>

                {/* Columna española de DO */}
                <div className="space-y-1 border-t md:border-t-0 md:border-l md:pl-4 border-border/40 pt-2 md:pt-0">
                  <span className="font-semibold text-primary font-mono text-[11px] block">
                    Español (Divinum Officium):
                  </span>
                  <p className={cn("font-serif text-muted-foreground text-justify whitespace-pre-line", !expandirMartirologio && "line-clamp-3")}>
                    {martEspanol || "Sin traducción al español en el martirologio."}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 italic pt-1">
                    Nota: el texto en español es una adaptación de Divinum Officium (D52).
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                {martyrologiumLectura.estado === "no-generado"
                  ? "Martirologio aún no generado para este día."
                  : "Entrada del Martirologio Romano tradicional."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
