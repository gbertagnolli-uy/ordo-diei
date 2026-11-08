"use client";
// Lector de ePub a pantalla completa (lane 280). La lógica de lectura es la de bookorbit
// (vendor/bookorbit, foliate-js) traducida a React en ./useFoliate; la UI se reduce a lo esencial:
// barra con volver / índice / ajustes / pantalla completa, pie con anterior, progreso y siguiente.
// La barra y el pie se ocultan solos y vuelven al tocar el centro del libro o con Escape.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ListTree, Maximize, Minimize, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { limitarTamano, TAMANO_INICIAL, TEMAS, type TemaLector } from "@/lib/biblioteca/lector";
import { useCromo } from "./useCromo";
import { useFoliate } from "./useFoliate";

const CLAVE_TAMANO = "ordo-lector-tamano";
const CLAVE_TEMA = "ordo-lector-tema";

function leerTamano(): number {
  if (typeof window === "undefined") return TAMANO_INICIAL;
  const guardado = Number(window.localStorage.getItem(CLAVE_TAMANO));
  return limitarTamano(Number.isFinite(guardado) && guardado > 0 ? guardado : TAMANO_INICIAL);
}

function leerTema(): TemaLector {
  if (typeof window === "undefined") return "claro";
  const guardado = window.localStorage.getItem(CLAVE_TEMA);
  return guardado === "sepia" || guardado === "oscuro" ? guardado : "claro";
}

type Panel = "indice" | "ajustes" | null;

export default function LectorEpub({
  origen,
  titulo,
  cfiInicial,
  onPosicion,
  onCerrar,
}: {
  origen: string;
  titulo: string;
  cfiInicial?: string | null;
  /** Cada cambio de página: CFI (si el motor lo da) y porcentaje 0–100 de todo el libro. */
  onPosicion?: (cfi: string | null, porcentaje: number) => void;
  /** Volver a la biblioteca (o cerrar el visor que contiene al lector). */
  onCerrar?: () => void;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  // Las preferencias se leen después de montar: si se leyeran en el primer render, el HTML del
  // servidor (tema claro) no coincidiría con el del cliente (tema guardado) y React avisaría.
  const [tamano, setTamano] = useState(TAMANO_INICIAL);
  const [tema, setTema] = useState<TemaLector>("claro");
  const [preferenciasListas, setPreferenciasListas] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const panelRef = useRef<Panel>(null);
  panelRef.current = panel;
  const [acerca, setAcerca] = useState(false);
  const [arrastre, setArrastre] = useState<number | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [pantallaDisponible, setPantallaDisponible] = useState(false);
  const { visible, alternar, mostrar } = useCromo();

  // El toque central cierra un panel abierto antes de ocultar la barra. En pantalla completa sigue
  // funcionando: Escape es aparte, lo maneja el navegador para salir de pantalla completa.
  const alternarUi = useCallback(() => {
    if (acerca) {
      setAcerca(false);
      return;
    }
    if (panelRef.current) {
      setPanel(null);
      return;
    }
    alternar();
  }, [acerca, alternar]);

  const lector = useFoliate({ contenedor, url: origen, cfiInicial, tamano, tema, alMover: onPosicion, alAlternarUi: alternarUi });

  useEffect(() => {
    setTamano(leerTamano());
    setTema(leerTema());
    setPreferenciasListas(true);
  }, []);

  // Solo se guarda cuando ya se leyeron las preferencias, para no pisarlas con los valores por defecto.
  useEffect(() => {
    if (!preferenciasListas) return;
    window.localStorage.setItem(CLAVE_TAMANO, String(tamano));
    window.localStorage.setItem(CLAVE_TEMA, tema);
  }, [preferenciasListas, tamano, tema]);

  useEffect(() => {
    const sincronizar = () => setPantallaCompleta(!!document.fullscreenElement);
    setPantallaDisponible(!!document.fullscreenEnabled && !!raiz.current?.requestFullscreen);
    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") {
        if (acerca) {
          setAcerca(false);
          return;
        }
        if (panelRef.current) {
          setPanel(null);
          return;
        }
        if (document.fullscreenElement) return; // el navegador sale de pantalla completa
        e.preventDefault();
        alternar();
      } else if (!panelRef.current && e.key === "ArrowRight") {
        e.preventDefault();
        lector.siguiente();
      } else if (!panelRef.current && e.key === "ArrowLeft") {
        e.preventDefault();
        lector.anterior();
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [acerca, alternar, lector.siguiente, lector.anterior]);

  async function alternarPantallaCompleta() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await raiz.current?.requestFullscreen();
    } catch {
      // El navegador puede rechazarlo (iOS): el lector ya ocupa toda la ventana.
    }
  }

  const abrirPanel = (cual: Exclude<Panel, null>) => {
    setAcerca(false);
    mostrar();
    setPanel(cual);
  };

  const cerrarPanel = () => {
    setAcerca(false);
    setPanel(null);
    mostrar();
  };

  const porcentajeVisible = Math.round((arrastre ?? lector.porcentaje) * 10) / 10;
  const capa = "transition-all duration-300";

  return (
    // El margen alrededor de la página sigue al tema del libro (como ReaderView de bookorbit).
    <div
      ref={raiz}
      className="fixed inset-0 z-[70] overflow-hidden text-foreground"
      style={{ background: TEMAS[tema].fondo, colorScheme: TEMAS[tema].oscuro ? "dark" : "light" }}
    >
      <div ref={contenedor} className="absolute inset-0" aria-label={`Libro: ${titulo}`} />

      {lector.estado === "cargando" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background">
          <Spinner className="size-6" />
          <p className="text-sm text-muted-foreground">Abriendo «{titulo}»…</p>
        </div>
      )}

      {lector.estado === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background p-6">
          <div className="flex max-w-sm flex-col items-center gap-3 text-center">
            <p className="font-medium">No se pudo abrir el libro</p>
            <p className="text-sm text-muted-foreground">{lector.error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={lector.reintentar}>
                <RotateCcw /> Reintentar
              </Button>
              {onCerrar && (
                <Button variant="ghost" onClick={onCerrar}>
                  <ArrowLeft /> Volver
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <header
        data-ui
        className={cn(
          "absolute inset-x-0 top-0 z-20 flex items-center gap-1.5 border-b bg-background/90 p-2 backdrop-blur",
          capa,
          visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        {onCerrar && (
          <Button variant="ghost" size="icon" onClick={onCerrar} aria-label="Volver a la biblioteca">
            <ArrowLeft />
          </Button>
        )}
        <div className="min-w-0 flex-1 px-1">
          <p className="truncate text-sm font-medium">{lector.capitulo ?? titulo}</p>
          {lector.capitulo && <p className="truncate text-xs text-muted-foreground">{titulo}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => abrirPanel("indice")} aria-label="Índice" disabled={lector.capitulos.length === 0}>
          <ListTree />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => abrirPanel("ajustes")} aria-label="Tamaño de letra y tema">
          <Type />
        </Button>
        {pantallaDisponible && (
          <Button variant="ghost" size="icon" onClick={() => void alternarPantallaCompleta()} aria-label={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}>
            {pantallaCompleta ? <Minimize /> : <Maximize />}
          </Button>
        )}
      </header>

      <footer
        data-ui
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t bg-background/90 px-2 py-1.5 backdrop-blur",
          capa,
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        )}
      >
        <Button variant="ghost" size="icon-sm" onClick={lector.anterior} aria-label="Página anterior">
          <ChevronLeft />
        </Button>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={porcentajeVisible}
          onChange={(e) => setArrastre(Number(e.target.value))}
          onPointerUp={() => {
            if (arrastre !== null) lector.irAFraccion(arrastre / 100);
            setArrastre(null);
          }}
          onKeyUp={(e) => {
            if (e.key.startsWith("Arrow") && arrastre !== null) {
              lector.irAFraccion(arrastre / 100);
              setArrastre(null);
            }
          }}
          aria-label="Progreso de lectura"
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
        />
        <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{Math.round(porcentajeVisible)} %</span>
        <Button variant="ghost" size="icon-sm" onClick={lector.siguiente} aria-label="Página siguiente">
          <ChevronRight />
        </Button>
      </footer>

      <p className="sr-only" aria-live="polite">
        {lector.capitulo ? `${lector.capitulo}. ` : ""}
        {Math.round(lector.porcentaje)} % leído
      </p>

      {panel && (
        <div data-ui className="absolute inset-0 z-30" role="dialog" aria-modal="true" aria-label={panel === "indice" ? "Índice" : "Ajustes de lectura"}>
          <button type="button" className="absolute inset-0 bg-black/20" aria-label="Cerrar" onClick={cerrarPanel} />
          {panel === "indice" ? (
            <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border-r bg-background shadow-xl">
              <div className="flex items-center justify-between border-b p-3">
                <p className="text-sm font-semibold">Índice</p>
                <Button variant="ghost" size="sm" onClick={cerrarPanel}>
                  Cerrar
                </Button>
              </div>
              <ul className="flex-1 overflow-y-auto p-2">
                {lector.capitulos.map((c, i) => (
                  <li key={`${c.href}-${i}`}>
                    <button
                      type="button"
                      onClick={() => {
                        lector.irA(c.href);
                        cerrarPanel();
                      }}
                      className="w-full rounded-lg py-2 pr-2 text-left text-sm hover:bg-muted"
                      style={{ paddingLeft: `${12 + c.nivel * 14}px` }}
                    >
                      {c.etiqueta}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-md flex-col gap-4 rounded-t-2xl border-t bg-background p-4 pb-6 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Lectura</p>
                <Button variant="ghost" size="sm" onClick={cerrarPanel}>
                  Cerrar
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Tamaño de letra</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" onClick={() => setTamano((n) => limitarTamano(n - 1))} aria-label="Letra más chica">
                    <span aria-hidden className="text-sm leading-none">A−</span>
                  </Button>
                  <span className="w-10 text-center text-sm tabular-nums">{tamano}</span>
                  <Button variant="outline" size="icon-sm" onClick={() => setTamano((n) => limitarTamano(n + 1))} aria-label="Letra más grande">
                    <span aria-hidden className="text-base leading-none">A+</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Tema</span>
                <div className="flex gap-1">
                  {(Object.keys(TEMAS) as TemaLector[]).map((nombre) => (
                    <Button key={nombre} variant={tema === nombre ? "default" : "outline"} size="sm" onClick={() => setTema(nombre)} aria-pressed={tema === nombre}>
                      {TEMAS[nombre].etiqueta}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Atribución exigida por los términos adicionales de BookOrbit (ver THIRD_PARTY_NOTICES.md). */}
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-sm text-muted-foreground">Acerca de</span>
                <Button variant="ghost" size="sm" onClick={() => setAcerca(true)}>
                  Avisos legales
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {acerca && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-label="Avisos legales">
          <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl border bg-background p-4 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">Avisos legales</p>
              <Button variant="ghost" size="sm" onClick={() => setAcerca(false)}>
                Cerrar
              </Button>
            </div>
            <div className="mt-3 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  <a href="https://github.com/bookorbit/bookorbit" target="_blank" rel="noreferrer" className="underline">
                    Powered by BookOrbit
                  </a>
                </p>
                <p>Copyright (C) 2025-2026 neon.</p>
                <p>Additional copyright is held by the respective BookOrbit contributors.</p>
                <p>
                  Original project:{" "}
                  <a href="https://github.com/bookorbit/bookorbit" target="_blank" rel="noreferrer" className="underline">
                    github.com/bookorbit/bookorbit
                  </a>
                </p>
                <p>
                  Licensed under the GNU Affero General Public License, version 3 only, with additional terms. This software is provided without
                  warranty. You may redistribute and modify it under those terms.
                </p>
              </div>
              <p>
                El lector de ePub de Ordo es una versión modificada del lector de BookOrbit (portado a React/Next el 7/11/2026) y no es una versión
                oficial de BookOrbit.
              </p>
              <p>Motor de lectura: foliate-js (MIT, John Factotum).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
