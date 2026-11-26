"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CircleHelp, Compass, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModalStore } from "@/store/modalStore";
import { esRutaDeImpresion, obtenerGuiaDeRuta } from "@/lib/ayuda/guiasPantallas";
import { cn } from "@/lib/utils";

const claveVisto = (usuarioId: number | null | undefined, clave: string) =>
  `ordo_tutorial_visto_v1:${usuarioId ?? "invitado"}:${clave}`;

const claveAutoPausado = (usuarioId: number | null | undefined) =>
  `ordo_tutorial_auto_pausado_v1:${usuarioId ?? "invitado"}`;

function leerFlag(clave: string): boolean {
  try {
    return window.localStorage.getItem(clave) === "1";
  } catch {
    return false;
  }
}

function escribirFlag(clave: string, valor: boolean) {
  try {
    if (valor) window.localStorage.setItem(clave, "1");
    else window.localStorage.removeItem(clave);
  } catch {
    // Sin acceso a localStorage (modo privado estricto): no bloquea la app
  }
}

interface SistemaAyudaPantallaProps {
  usuarioId?: number | null;
  rolFamiliar?: string | null;
  variante?: "barra" | "flotante-publica";
  className?: string;
}

/**
 * Botón de ayuda presente en todas las pantallas + tutorial automático en la primera visita a cada pantalla.
 */
export function SistemaAyudaPantalla({
  usuarioId,
  rolFamiliar,
  variante = "barra",
  className,
}: SistemaAyudaPantallaProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const modalGlobalAbierto = useModalStore((s) => s.isOpen);

  const guia = useMemo(
    () => obtenerGuiaDeRuta(pathname, searchParams, rolFamiliar),
    [pathname, searchParams, rolFamiliar],
  );

  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState<"tutorial" | "botones">("tutorial");
  const [pasoIdx, setPasoIdx] = useState(0);
  const [autoPausado, setAutoPausado] = useState(false);

  // Sincroniza preferencia de tutorial automático al montar o cambiar de usuario
  useEffect(() => {
    setAutoPausado(leerFlag(claveAutoPausado(usuarioId)));
  }, [usuarioId]);

  // Primera visita a cada pantalla: muestra el tutorial paso a paso (esperando que no haya otro modal global encima)
  useEffect(() => {
    if (esRutaDeImpresion(pathname)) return;
    if (modalGlobalAbierto) return;
    if (leerFlag(claveAutoPausado(usuarioId))) return;
    if (leerFlag(claveVisto(usuarioId, guia.clave))) return;

    const timer = window.setTimeout(() => {
      if (useModalStore.getState().isOpen) return;
      if (leerFlag(claveVisto(usuarioId, guia.clave))) return;
      setPasoIdx(0);
      setTab("tutorial");
      setAbierto(true);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [pathname, guia.clave, usuarioId, modalGlobalAbierto]);

  const marcarVisto = () => {
    escribirFlag(claveVisto(usuarioId, guia.clave), true);
  };

  const abrirManual = () => {
    setPasoIdx(0);
    setTab(leerFlag(claveVisto(usuarioId, guia.clave)) ? "botones" : "tutorial");
    setAbierto(true);
  };

  const alCambiarAbierto = (next: boolean) => {
    if (!next) marcarVisto();
    setAbierto(next);
  };

  const alternarAutoPausado = () => {
    const nuevo = !autoPausado;
    setAutoPausado(nuevo);
    escribirFlag(claveAutoPausado(usuarioId), nuevo);
  };

  const pasos = guia.pasos;
  const pasoActual = pasos[Math.min(pasoIdx, Math.max(0, pasos.length - 1))];
  const esUltimoPaso = pasoIdx >= pasos.length - 1;

  return (
    <>
      <Button
        type="button"
        variant={variante === "flotante-publica" ? "outline" : "ghost"}
        size="sm"
        onClick={abrirManual}
        aria-label={`Ayuda: ${guia.titulo}`}
        title="Cómo funciona esta pantalla"
        className={cn(
          "gap-1.5 print:hidden",
          variante === "flotante-publica" &&
            "fixed top-4 right-4 z-30 rounded-full border-white/20 bg-card/80 backdrop-blur-md shadow-lg",
          className,
        )}
      >
        <CircleHelp className="size-4 text-primary" />
        <span className={variante === "flotante-publica" ? "text-xs font-medium" : "hidden sm:inline text-xs font-medium"}>
          Ayuda
        </span>
      </Button>

      <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
        <DialogContent className="sm:max-w-lg max-h-[88dvh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="border-b bg-muted/30 px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 pr-6">
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Compass className="size-3" /> Guía rápida
              </Badge>
            </div>
            <DialogTitle className="font-heading text-xl leading-snug">{guia.titulo}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{guia.resumenCorto}</DialogDescription>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "tutorial" | "botones")}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="px-5 pt-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tutorial" className="gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="size-3.5" />
                  Paso a paso ({pasos.length})
                </TabsTrigger>
                <TabsTrigger value="botones" className="gap-1.5 text-xs sm:text-sm">
                  <ListChecks className="size-3.5" />
                  Botones y dudas
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tutorial" className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <p className="text-xs leading-relaxed text-muted-foreground">{guia.paraQueSirve}</p>

              {pasoActual && (
                <div className="rounded-xl border bg-card p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Paso {pasoIdx + 1} de {pasos.length}
                    </span>
                    <div className="flex items-center gap-1" role="tablist" aria-label="Pasos del tutorial">
                      {pasos.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPasoIdx(i)}
                          aria-label={`Ir al paso ${i + 1}`}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            i === pasoIdx ? "w-5 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl"
                    >
                      {pasoActual.icono}
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-heading text-base font-semibold text-foreground">{pasoActual.titulo}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{pasoActual.descripcion}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pasoIdx === 0}
                  onClick={() => setPasoIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="size-4" /> Anterior
                </Button>

                {esUltimoPaso ? (
                  <Button type="button" size="sm" onClick={() => alCambiarAbierto(false)}>
                    ¡Entendido, empezar!
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={() => setPasoIdx((i) => Math.min(pasos.length - 1, i + 1))}>
                    Siguiente <ChevronRight className="size-4" />
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="botones" className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qué hace cada botón aquí
                </h3>
                <ul className="space-y-2">
                  {guia.botonesClave.map((item) => (
                    <li key={item.nombre} className="rounded-lg border bg-card/70 px-3 py-2 text-sm">
                      <p className="font-medium text-foreground">{item.nombre}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.queHace}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {guia.consejos && guia.consejos.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Preguntas frecuentes
                  </h3>
                  <ul className="space-y-2">
                    {guia.consejos.map((item) => (
                      <li key={item.pregunta} className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                        <p className="font-medium text-foreground">{item.pregunta}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{item.respuesta}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setPasoIdx(0);
                    setTab("tutorial");
                  }}
                >
                  <Sparkles className="size-3.5" /> Ver recorrido paso a paso
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/20 px-5 py-3">
            <button
              type="button"
              onClick={alternarAutoPausado}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline text-left"
            >
              {autoPausado
                ? "Reactivar tutorial automático en pantallas nuevas"
                : "No abrir automático al entrar a pantallas nuevas"}
            </button>
            <Button type="button" variant="secondary" size="sm" onClick={() => alCambiarAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
