"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  Sparkles,
  Flame,
  BookOpen,
  Quote,
  Scroll,
  Table as TableIcon,
  ShoppingBag,
  GalleryHorizontalEnd,
  IdCard,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CarruselVersionesCarta } from "@/components/cartas/CarruselVersionesCarta";
import { CartaVista } from "@/components/cartas/CartaVista";
import { BordeReclamable } from "@/components/cartas/BordeReclamable";
import { useReclamoCarta } from "@/components/cartas/useReclamoCarta";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { ContenidoCartaVisible } from "@/lib/cartas/revelado";
import type { GradoCarta } from "@/lib/cartas/economia";
import type { VersionCarta } from "@/lib/cartas/versiones";

interface DetalleCartaDTO extends ContenidoCartaVisible {
  fiestaHoy: boolean;
  topeFragmentos: number;
  siguienteGrado: number | null;
  fragmentosParaSiguienteGrado: number;
  inciensoGanado: number;
  versiones: VersionCarta[] | null; // null: todos los grados comparten arte, sin carrusel
  diasHastaCelebracion: number | null;
  textoCelebracion: string | null;
  navegacion: {
    anterior: string | null;
    siguiente: string | null;
  };
}

interface DetalleCartaViewProps {
  carta: DetalleCartaDTO;
}

export function DetalleCartaView({ carta }: DetalleCartaViewProps) {
  // D20/D21: al reclamar, router.refresh() vuelve a pedir la carta con el grado nuevo
  const { reclamar, reclamando, modal } = useReclamoCarta();
  const reclamo =
    carta.id && carta.fiestaHoy
      ? ({ tipo: "fiesta", cartaId: carta.id } as const)
      : carta.id && carta.reclamable
        ? ({ tipo: "grado", cartaId: carta.id } as const)
        : null;
  const [vista, setVista] = React.useState<"carta" | "versiones">("carta");
  const gradoRomano = TEXTOS_CARTAS.gradosRomanos[carta.grado] || "I";
  const gradoTexto = TEXTOS_CARTAS.grados[carta.grado];

  // Cálculo de porcentaje para la barra visual (si está desbloqueada, escala hasta 300%)
  const maxBarra = carta.desbloqueada ? 300 : 100;
  const pctBarra = Math.min(100, Math.round((carta.porcentaje / maxBarra) * 100));

  return (
    <div className="flex flex-col">
      <PageHeader group="Colección" title={carta.nombre} />
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Navegación Superior */}
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/cartas">
            <ArrowLeft className="size-4" />
            <span>Volver al Álbum</span>
          </Link>
        </Button>

        <div className="flex items-center gap-1">
          {carta.navegacion.anterior ? (
            <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
              <Link href={`/dashboard/cartas/${carta.navegacion.anterior}`}>
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1 text-xs opacity-50">
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
          )}

          {carta.navegacion.siguiente ? (
            <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
              <Link href={`/dashboard/cartas/${carta.navegacion.siguiente}`}>
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1 text-xs opacity-50">
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Contenido Principal: Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Carta Holo y Créditos (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4">
          {carta.versiones && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={vista}
              onValueChange={(v) => v && setVista(v as "carta" | "versiones")}
              aria-label="Cómo ver la carta"
            >
              <ToggleGroupItem value="carta" className="gap-1.5 text-xs">
                <IdCard className="size-3.5" />
                Carta
              </ToggleGroupItem>
              <ToggleGroupItem value="versiones" className="gap-1.5 text-xs">
                <GalleryHorizontalEnd className="size-3.5" />
                Versiones
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          {carta.versiones && vista === "versiones" ? (
            <CarruselVersionesCarta carta={{ ...carta, versiones: carta.versiones }} />
          ) : (
          <BordeReclamable activo={reclamo !== null} radio={16} className="w-full max-w-[340px]">
            {/* La holo no se recorta (tilt 3D); la bloqueada llena la caja 63:88 */}
            <div
              className={
                carta.desbloqueada
                  ? "flex w-full max-w-[340px] justify-center"
                  : "w-full max-w-[340px] aspect-[63/88] rounded-2xl overflow-hidden shadow-2xl"
              }
            >
              <CartaVista
                carta={carta}
                modo={carta.desbloqueada ? "holo" : "bloqueada"}
                grado={carta.grado}
                fragmentos={carta.fragmentos}
                mostrarProgreso
                ancho={340}
                mostrarTitulo={false}
                prioridad
              />
            </div>
          </BordeReclamable>
          )}

          {carta.creditoImagen && (
            <p className="text-[11px] text-muted-foreground text-center italic max-w-xs">
              Fuente de arte: {carta.creditoImagen}
            </p>
          )}

          <div className="w-full max-w-[340px] flex flex-col gap-2 pt-2">
            {reclamo && (
              <Button
                type="button"
                onClick={() => reclamar(reclamo)}
                disabled={reclamando !== null}
                className="w-full gap-2 bg-amber-500 text-amber-950 font-bold hover:bg-amber-600"
              >
                <Sparkles className="size-4" />
                {reclamando !== null
                  ? "Reclamando..."
                  : reclamo.tipo === "fiesta"
                    ? carta.desbloqueada
                      ? TEXTOS_CARTAS.eventos.fiestaPremioRepetida
                      : TEXTOS_CARTAS.eventos.fiestaPremio
                    : TEXTOS_CARTAS.reclamos.reclamarGrado(carta.desbloqueada ? TEXTOS_CARTAS.gradosRomanos[carta.gradoDisponible] : "")}
              </Button>
            )}
            {reclamo?.tipo === "fiesta" && (
              <p className="text-[11px] text-center text-muted-foreground">{TEXTOS_CARTAS.eventos.fiestaDetalle}</p>
            )}
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/dashboard/cartas?tab=tienda">
                <ShoppingBag className="size-4" />
                <span>Ir a la Tienda de Cartas</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Columna Derecha: Título, Hitos de Fragmentos y Secciones Progresivas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Cabecera del Detalle */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase font-semibold">
                {carta.categoria}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {TEXTOS_CARTAS.rarezas[carta.rareza]}
              </Badge>
              {carta.desbloqueada ? (
                <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/40 text-xs font-serif font-bold">
                  Grado {gradoRomano} · {gradoTexto}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-xs gap-1">
                  <Lock className="size-3" />
                  <span>Bloqueada (Grado 0)</span>
                </Badge>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {carta.nombre}
            </h1>

            {carta.subtitulo && (
              <p className="text-sm font-medium text-muted-foreground">
                {carta.subtitulo}
              </p>
            )}

            {/* Banner de Celebración Litúrgica */}
            {carta.textoCelebracion ? (
              <div className="mt-2 flex items-center gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium">
                <Calendar className="size-4 shrink-0" />
                <span>{carta.textoCelebracion}</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 p-3 rounded-xl bg-muted/40 border text-muted-foreground text-xs">
                <Sparkles className="size-3.5 shrink-0" />
                <span>Misterio y devoción permanente de la Santa Iglesia</span>
              </div>
            )}
          </div>

          {/* Bloque de Progreso de Fragmentos y Hitos */}
          <Card className="border-muted bg-card/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Progreso de Gracia y Revelación
                </CardTitle>
                <span className="text-xs font-medium tabular-nums text-foreground">
                  {carta.fragmentos} de {carta.fragmentosRequeridos} fragmentos ({carta.porcentaje} %)
                </span>
              </div>
              <CardDescription className="text-xs">
                {carta.reclamable ? (
                  TEXTOS_CARTAS.reclamos.alcanzado(TEXTOS_CARTAS.gradosRomanos[carta.gradoDisponible])
                ) : carta.desbloqueada ? (
                  carta.siguienteGrado !== null ? (
                    `Faltan ${carta.fragmentosParaSiguienteGrado} fragmentos para Grado ${TEXTOS_CARTAS.gradosRomanos[carta.siguienteGrado as GradoCarta]}`
                  ) : (
                    "¡Grado IV Glorioso alcanzado! El arte ha alcanzado su plenitud."
                  )
                ) : (
                  `Faltan ${Math.max(0, carta.fragmentosRequeridos - carta.fragmentos)} fragmentos para consagrar y desbloquear esta carta.`
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {/* Barra de Progreso con Hitos Marcados */}
              <div className="flex flex-col gap-2">
                <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${pctBarra}%` }}
                  />
                </div>

                {/* Etiquetas de Hitos */}
                {!carta.desbloqueada ? (
                  <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                    <span>0 % (Oración)</span>
                    <span className={carta.porcentaje >= 25 ? "font-semibold text-primary" : ""}>
                      25 % (Frase)
                    </span>
                    <span className={carta.porcentaje >= 50 ? "font-semibold text-primary" : ""}>
                      50 % (Datos)
                    </span>
                    <span className={carta.porcentaje >= 100 ? "font-semibold text-primary" : ""}>
                      100 % (Consagrada)
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                    <span className="font-semibold text-primary">100 % (I)</span>
                    <span className={carta.porcentaje >= 150 ? "font-semibold text-primary" : ""}>
                      150 % (II)
                    </span>
                    <span className={carta.porcentaje >= 200 ? "font-semibold text-primary" : ""}>
                      200 % (III)
                    </span>
                    <span className={carta.porcentaje >= 300 ? "font-semibold text-primary" : ""}>
                      300 % (IV)
                    </span>
                  </div>
                )}
              </div>

              {/* Aviso de Incienso Ganado por Excedente */}
              {carta.inciensoGanado > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs">
                  <Flame className="size-4 shrink-0" />
                  <span>
                    Has obtenido {carta.inciensoGanado} granos de incienso por excedente sobre el tope de esta carta.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================== */}
          {/* SECCIONES PROGRESIVAS D13 (MOSTRANDO EXACTAMENTE LA API)  */}
          {/* ========================================================== */}
          <div className="flex flex-col gap-4">
            {/* 1. Oración Sagrada (se revela con más del 0%) */}
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Oración Sagrada</CardTitle>
                  </div>
                  {!carta.oracion.visible && (
                    <span className="text-[11px] text-muted-foreground italic">
                      {carta.oracion.pista || "Se revela con más de 0 %"}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {carta.oracion.visible ? (
                  <p className="text-sm/relaxed font-serif italic text-foreground bg-muted/20 p-3 rounded-lg border">
                    «{carta.oracion.valor}»
                  </p>
                ) : (
                  <div className="flex flex-col gap-1 text-muted-foreground p-3 rounded-lg bg-muted/10 border border-dashed">
                    <span className="font-mono text-sm tracking-widest text-muted-foreground/60">
                      {carta.oracion.valor}
                    </span>
                    <span className="text-xs text-muted-foreground/75">
                      Obtené tu primer fragmento para revelar la oración tradicional.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Frase con Autor (se revela al 25%) */}
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Quote className="size-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Frase Sagrada</CardTitle>
                  </div>
                  {!carta.frase.visible && (
                    <span className="text-[11px] text-muted-foreground italic">
                      {carta.frase.pista || "Se revela al 25 %"}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {carta.frase.visible ? (
                  <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/20 border">
                    <p className="text-sm font-medium text-foreground">
                      «{carta.frase.valor}»
                    </p>
                    {carta.frase.autor && (
                      <span className="text-xs text-muted-foreground self-end italic">
                        — {carta.frase.autor}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 text-muted-foreground p-3 rounded-lg bg-muted/10 border border-dashed">
                    <span className="font-mono text-sm tracking-widest text-muted-foreground/60">
                      {carta.frase.valor}
                    </span>
                    <span className="text-xs text-muted-foreground/75">
                      Alcanzá el 25 % de fragmentos para revelar la frase testimonial.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Datasheet (revelación progresiva 25% a 100%) */}
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TableIcon className="size-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Datos y Atributos</CardTitle>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Revelación progresiva (25 % a 100 %)
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {carta.datasheet.map((dato, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-xs text-muted-foreground w-1/3 py-2.5 pl-6">
                          {dato.etiqueta}
                        </TableCell>
                        <TableCell className="text-xs py-2.5 pr-6">
                          {dato.visible ? (
                            <span className="text-foreground font-medium">{dato.valor}</span>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-muted-foreground/60 tracking-wider">
                                {dato.valor}
                              </span>
                              <span className="text-[10px] text-muted-foreground/75 italic">
                                ({dato.pista || `Se revela al ${dato.porcentajeRequerido ?? 100} %`})
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 4. Historia Sagrada (se revela al 100%) */}
            <Card className="border-muted">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scroll className="size-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Historia Sagrada</CardTitle>
                  </div>
                  {!carta.historia.visible && (
                    <span className="text-[11px] text-muted-foreground italic">
                      {carta.historia.pista || "Se revela al 100 % (Consagrada)"}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {carta.historia.visible ? (
                  <div className="flex flex-col gap-3 text-sm/relaxed text-foreground">
                    {carta.historia.valor.split("\n\n").map((parrafo, idx) => (
                      <p key={idx}>{parrafo}</p>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/10 border border-dashed text-center">
                    <Lock className="size-5 mx-auto text-muted-foreground/50" />
                    <span className="font-mono text-sm tracking-widest text-muted-foreground/60">
                      {carta.historia.valor}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Consagrá la carta al 100 % para contemplar la historia y el testimonio completo.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {modal}
    </div>
    </div>
  );
}
