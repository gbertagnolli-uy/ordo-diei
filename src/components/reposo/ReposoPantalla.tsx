"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FondoUnsplash } from "./FondoUnsplash";
import { FraseReposo } from "./FraseReposo";
import { TituloDia, type DiaLiturgicoTitulo } from "./TituloDia";
import { Button } from "@/components/ui/button";
import {
  avanzarSecuencia,
  calcularDuracionFraseMs,
  cargarEstadoSecuencia,
  guardarEstadoSecuencia,
  elegirFotoSinRepetirUltimas,
  CITAS_APTAS,
  CATECISMO_APTO,
  type EstadoSecuenciaReposo,
  type ItemFrase,
} from "@/lib/reposo/frases";
import type { FotoPublica } from "@/lib/reposo/unsplash";
import { cn } from "@/lib/utils";

interface ReposoPantallaProps {
  onEntrar: () => void;
  className?: string;
}

/**
 * Pantalla de reposo v2 (SPEC idle-marco-fotos §1, §4, §7).
 * Muestra fotos contemplativas de Unsplash con frases bíblicas y del Catecismo alternadas,
 * título litúrgico del día, logo y botón «Entrar», protección anti burn-in y ciclo continuo.
 */
function fechaLocalISO(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function ReposoPantalla({ onEntrar, className }: ReposoPantallaProps) {
  // Configuración
  const [mostrarRefCatecismo, setMostrarRefCatecismo] = useState(true);

  // Datos
  const [, setFotosPool] = useState<FotoPublica[]>([]);
  const [fotoActual, setFotoActual] = useState<FotoPublica | null>(null);
  const [diaLiturgico, setDiaLiturgico] = useState<DiaLiturgicoTitulo | null>(null);

  // Secuencia de frases y fotos. La frase se elige DESPUÉS de montar: en el servidor no hay localStorage y la elección
  // es al azar, así que hacerla al renderizar daría un HTML distinto al del cliente (error de hidratación).
  // El estado vive en un ref y se avanza fuera de los «updaters» de React (que StrictMode ejecuta dos veces).
  const [itemActual, setItemActual] = useState<ItemFrase | null>(null);
  const estadoRef = useRef<EstadoSecuenciaReposo | null>(null);
  const fotosRef = useRef<FotoPublica[]>([]);

  // Anti burn-in (§4.6): desplazamiento ±24px cada 60s, atenuación a 0.6 tras 5 min de inactividad
  const [burnInOffset, setBurnInOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [atenuado, setAtenuado] = useState(false);
  const ultimoToqueRef = useRef<number>(0);

  // 1. Cargar configuración y datos remotos
  useEffect(() => {
    let montado = true;

    // Configuración
    fetch("/api/reposo/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (!montado || !cfg) return;
        if (typeof cfg.mostrarRefCatecismo === "boolean") {
          setMostrarRefCatecismo(cfg.mostrarRefCatecismo);
        }
      })
      .catch(() => {});

    // Título litúrgico
    // La fecha local va en la URL: así el caché del CDN no sirve el título de ayer (la clave de caché es la URL).
    fetch(`/api/reposo/dia?fecha=${fechaLocalISO()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!montado) return;
        setDiaLiturgico(data);
      })
      .catch(() => {});

    // Fotos de Unsplash
    const esVertical = typeof window !== "undefined" && window.innerHeight > window.innerWidth;
    const urlFotos = `/api/reposo/fotos${esVertical ? "?orientacion=vertical" : ""}`;
    fetch(urlFotos)
      .then((r) => (r.ok ? r.json() : []))
      .then((fotos: FotoPublica[]) => {
        if (!montado || !Array.isArray(fotos) || fotos.length === 0) return;
        fotosRef.current = fotos;
        setFotosPool(fotos);
        // Primera foto, respetando las últimas usadas
        const estado = estadoRef.current ?? cargarEstadoSecuencia();
        const elegida = elegirFotoSinRepetirUltimas(fotos, estado.ultimasFotosIds);
        if (elegida) {
          setFotoActual(elegida.foto);
          estadoRef.current = { ...estado, ultimasFotosIds: elegida.ultimasActualizadas };
          guardarEstadoSecuencia(estadoRef.current);
        }
      })
      .catch(() => {});

    return () => {
      montado = false;
    };
  }, []);

  // 2. Anti burn-in timers y gestos
  useEffect(() => {
    ultimoToqueRef.current = Date.now();

    // Desplazamiento cada 60 s
    const intervalShift = setInterval(() => {
      const offsets = [-24, -12, 0, 12, 24];
      const x = offsets[Math.floor(Math.random() * offsets.length)];
      const y = offsets[Math.floor(Math.random() * offsets.length)];
      setBurnInOffset({ x, y });
    }, 60000);

    // Revisar atenuación cada 10 s (5 min sin toques = 300 000 ms)
    const intervalDim = setInterval(() => {
      if (ultimoToqueRef.current > 0 && Date.now() - ultimoToqueRef.current > 300000) {
        setAtenuado(true);
      }
    }, 10000);

    const alInteractuar = () => {
      ultimoToqueRef.current = Date.now();
      setAtenuado(false);
    };

    window.addEventListener("pointermove", alInteractuar, { passive: true });
    window.addEventListener("pointerdown", alInteractuar, { passive: true });
    window.addEventListener("keydown", alInteractuar, { passive: true });

    return () => {
      clearInterval(intervalShift);
      clearInterval(intervalDim);
      window.removeEventListener("pointermove", alInteractuar);
      window.removeEventListener("pointerdown", alInteractuar);
      window.removeEventListener("keydown", alInteractuar);
    };
  }, []);

  // 3. Avanzar a la siguiente frase y foto (alternancia estricta, D38; foto al azar sin repetir las últimas 12, D39)
  const avanzar = useCallback(() => {
    const previo = estadoRef.current ?? cargarEstadoSecuencia();
    const { item, siguienteEstado } = avanzarSecuencia(previo, CITAS_APTAS, CATECISMO_APTO);
    const pool = fotosRef.current;
    if (pool.length > 0) {
      const elegida = elegirFotoSinRepetirUltimas(pool, siguienteEstado.ultimasFotosIds);
      if (elegida) {
        setFotoActual(elegida.foto);
        siguienteEstado.ultimasFotosIds = elegida.ultimasActualizadas;
        // Precarga de la siguiente
        const siguiente = elegirFotoSinRepetirUltimas(pool, elegida.ultimasActualizadas);
        if (siguiente && typeof window !== "undefined") new Image().src = siguiente.foto.url;
      }
    }
    estadoRef.current = siguienteEstado;
    guardarEstadoSecuencia(siguienteEstado);
    setItemActual(item);
  }, []);

  // 3b. Primera frase al montar
  useEffect(() => {
    avanzar();
  }, [avanzar]);

  // 4. Timer continuo de duración por frase
  useEffect(() => {
    if (!itemActual) return;
    const timer = setTimeout(avanzar, calcularDuracionFraseMs(itemActual));
    return () => clearTimeout(timer);
  }, [itemActual, avanzar]);

  const duracionActualMs = itemActual ? calcularDuracionFraseMs(itemActual) : 15000;

  return (
    <div
      role="region"
      aria-label="Pantalla de reposo"
      className={cn(
        "fixed inset-0 z-20 flex flex-col justify-between overflow-hidden bg-black text-white select-none",
        className,
      )}
      onClick={() => {
        ultimoToqueRef.current = Date.now();
        setAtenuado(false);
      }}
    >
      {/* Fondo de Unsplash o Partículas de respaldo */}
      <FondoUnsplash foto={fotoActual} duracionMs={duracionActualMs} />

      {/* Contenido reposicionado según anti burn-in */}
      <div
        className="relative z-10 flex size-full flex-col justify-between px-6 py-8 sm:px-10 sm:py-10 transition-transform duration-1000 ease-out"
        style={{
          transform: `translate3d(${burnInOffset.x}px, ${burnInOffset.y}px, 0)`,
        }}
      >
        {/* Cabecera: Esquina superior izquierda (Logo) y derecha (Título Litúrgico) */}
        <div
          className={cn(
            "flex w-full shrink-0 items-start justify-between gap-4 transition-opacity duration-500",
            atenuado ? "opacity-60" : "opacity-100",
          )}
        >
          {/* Logo y nombre chicos (SPEC §4.1, §4.2) */}
          <div className="flex items-center gap-3">
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary font-heading text-sm font-bold text-primary-foreground shadow-md">
              OD
            </span>
            <span className="font-heading text-sm sm:text-base font-semibold tracking-wide text-white/90 drop-shadow">
              Ordo Diei
            </span>
          </div>

          {/* Título del oficio del día */}
          <TituloDia dia={diaLiturgico} />
        </div>

        {/* Zona central: Frase (alineada a la izquierda en el 10-12% del ancho y contenida en el alto libre) */}
        <div className="my-auto flex min-h-0 flex-1 items-center w-full max-w-5xl py-3 sm:py-4 pl-[2%] sm:pl-[10%]">
          {itemActual ? <FraseReposo item={itemActual} mostrarRefCatecismo={mostrarRefCatecismo} /> : null}
        </div>

        {/* Zona inferior: Botón Entrar centrado */}
        <div
          className={cn(
            "flex w-full shrink-0 items-center justify-center transition-opacity duration-500 mb-1 sm:mb-2",
            atenuado ? "opacity-60" : "opacity-100",
          )}
        >
          <Button
            size="lg"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onEntrar();
            }}
            aria-label="Entrar a Ordo Diei"
            className="min-h-[48px] min-w-[140px] rounded-full border-white/30 bg-black/40 px-10 py-3 text-base font-medium text-white shadow-2xl backdrop-blur-md transition-all hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary pointer-events-auto cursor-pointer"
          >
            Entrar
          </Button>
        </div>
      </div>
    </div>
  );
}
