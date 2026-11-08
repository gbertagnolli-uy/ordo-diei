"use client";
// Diario (lane 297): el mapa. Reemplaza a `FlutterMap` + `TileLayer` de moodiary (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/map/{map_page,map_tiles}.dart,
// ZhuJHua/moodiary@2c552dd) sin dependencias: baldosas de OpenStreetMap como <img>, arrastre, rueda, pellizco y doble clic (todo menos rotar, como `InteractiveFlag.all & ~rotate`),
// botones de zoom y la atribución. La matemática está en src/lib/diario/mapa.ts.
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acercarEn, aPantalla, baldosaUrl, baldosasVisibles, curvaDesaceleracion, interpolarCamara, moverPorPixeles, ZOOM_MAX, ZOOM_MIN, type Camara, type Tamano } from "@/lib/diario/mapa";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Pasa de coordenadas a píxeles del contenedor, para dibujar encima del mapa. */
export type Proyectar = (latitud: number, longitud: number) => { x: number; y: number };

/** Lo que se mueve el puntero antes de contar como arrastre (así tocar un pin no arrastra el mapa). */
const UMBRAL_ARRASTRE = 4;

/** moodiary `Durations.medium3` (400 ms): lo que tarda la cámara en ir a otro lugar. */
export const DURACION_CAMARA_MS = 400;

/**
 * Mueve la cámara con una animación (moodiary `_animateCamera`, curva `emphasizedDecelerate`). Un gesto del usuario la corta.
 * Devuelve `animar(destino, ms)` y `cortar()`.
 */
export function useAnimarCamara(leer: () => Camara | null, poner: (c: Camara) => void) {
  const cuadro = useRef(0);
  const cortar = useCallback(() => {
    cancelAnimationFrame(cuadro.current);
    cuadro.current = 0;
  }, []);
  const animar = useCallback(
    (destino: Camara, ms = DURACION_CAMARA_MS) => {
      const desde = leer();
      cortar();
      if (!desde) return poner(destino);
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / ms);
        poner(interpolarCamara(desde, destino, curvaDesaceleracion(t)));
        cuadro.current = t < 1 ? requestAnimationFrame(paso) : 0;
      };
      cuadro.current = requestAnimationFrame(paso);
    },
    [leer, poner, cortar],
  );
  useEffect(() => cortar, [cortar]);
  return { animar, cortar };
}

export function MapaBase({
  camara,
  onCamara,
  onTamano,
  onGesto,
  interactivo = true,
  className,
  controlesZoom = true,
  children,
}: {
  /** null = todavía no se sabe qué mostrar: solo se mide el contenedor. */
  camara: Camara | null;
  /** El usuario movió el mapa con un gesto. Quien lo usa guarda la cámara nueva. */
  onCamara: (c: Camara) => void;
  /** El tamaño del contenedor (al montarse y cuando cambia). */
  onTamano?: (t: Tamano) => void;
  /** Se llama cuando empieza un gesto del usuario (para cortar una animación o marcar «se movió»). */
  onGesto?: () => void;
  interactivo?: boolean;
  className?: string;
  controlesZoom?: boolean;
  /** Se dibuja encima de las baldosas; `proyectar` da el píxel de cada coordenada. */
  children?: (proyectar: Proyectar, tamano: Tamano, camara: Camara) => ReactNode;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [tamano, setTamano] = useState<Tamano>({ ancho: 0, alto: 0 });
  // Siempre los últimos valores, para los manejadores nativos (la rueda) que se registran una sola vez
  const vivo = useRef({ camara, tamano, onCamara, onGesto, interactivo });
  useEffect(() => {
    vivo.current = { camara, tamano, onCamara, onGesto, interactivo };
  });
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const movido = useRef(0);
  const capturado = useRef(false);
  const ultimaDistancia = useRef(0);
  const avisoDeError = useRef(false);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => {
      const t = { ancho: el.clientWidth, alto: el.clientHeight };
      setTamano((a) => (a.ancho === t.ancho && a.alto === t.alto ? a : t));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (tamano.ancho > 0) onTamano?.(tamano);
  }, [tamano, onTamano]);

  // La rueda se registra a mano porque React la deja como «pasiva» y no se puede evitar que la página se desplace
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const alRodar = (e: WheelEvent) => {
      const v = vivo.current;
      if (!v.interactivo || !v.camara) return;
      e.preventDefault();
      v.onGesto?.();
      const r = el.getBoundingClientRect();
      const paso = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      v.onCamara(acercarEn(v.camara, v.tamano, e.clientX - r.left, e.clientY - r.top, v.camara.zoom - paso / 240));
    };
    el.addEventListener("wheel", alRodar, { passive: false });
    return () => el.removeEventListener("wheel", alRodar);
  }, []);

  const posicion = (e: React.PointerEvent) => {
    const r = caja.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function alBajar(e: React.PointerEvent) {
    if (!interactivo || !camara) return;
    punteros.current.set(e.pointerId, posicion(e));
    movido.current = 0;
    capturado.current = false;
    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      ultimaDistancia.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function alMover(e: React.PointerEvent) {
    const previo = punteros.current.get(e.pointerId);
    const v = vivo.current;
    if (!previo || !v.camara || !v.interactivo) return;
    const ahora = posicion(e);
    punteros.current.set(e.pointerId, ahora);
    if (punteros.current.size === 1) {
      const dx = ahora.x - previo.x;
      const dy = ahora.y - previo.y;
      movido.current += Math.abs(dx) + Math.abs(dy);
      if (movido.current < UMBRAL_ARRASTRE) return;
      if (!capturado.current) {
        capturado.current = true;
        caja.current?.setPointerCapture(e.pointerId);
        v.onGesto?.();
      }
      v.onCamara(moverPorPixeles(v.camara, dx, dy));
    } else if (punteros.current.size === 2) {
      // Pellizco: el zoom sigue el cambio de distancia entre los dos dedos, alrededor del punto medio
      const [a, b] = [...punteros.current.values()];
      const distancia = Math.hypot(a.x - b.x, a.y - b.y);
      if (ultimaDistancia.current > 0 && distancia > 0) {
        if (!capturado.current) {
          capturado.current = true;
          v.onGesto?.();
        }
        const medio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        v.onCamara(acercarEn(v.camara, v.tamano, medio.x, medio.y, v.camara.zoom + Math.log2(distancia / ultimaDistancia.current)));
      }
      ultimaDistancia.current = distancia;
    }
  }

  function alSoltar(e: React.PointerEvent) {
    punteros.current.delete(e.pointerId);
    ultimaDistancia.current = 0;
    if (caja.current?.hasPointerCapture(e.pointerId)) caja.current.releasePointerCapture(e.pointerId);
  }

  function dobleClic(e: React.MouseEvent) {
    if (!interactivo || !camara) return;
    if ((e.target as HTMLElement).closest("button,a")) return;
    const r = caja.current!.getBoundingClientRect();
    onGesto?.();
    onCamara(acercarEn(camara, tamano, e.clientX - r.left, e.clientY - r.top, camara.zoom + 1));
  }

  function zoomCentro(delta: number) {
    if (!camara) return;
    onGesto?.();
    onCamara(acercarEn(camara, tamano, tamano.ancho / 2, tamano.alto / 2, camara.zoom + delta));
  }

  function falloBaldosa() {
    if (avisoDeError.current) return;
    avisoDeError.current = true;
    toast.error("No se pudo cargar el mapa. Revisá la conexión.");
  }

  const medido = tamano.ancho > 0 && tamano.alto > 0;
  const baldosas = camara && medido ? baldosasVisibles(camara, tamano) : [];
  const proyectar: Proyectar = (lat, lon) => (camara ? aPantalla(camara, tamano, lat, lon) : { x: 0, y: 0 });

  return (
    <div
      ref={caja}
      role="application"
      aria-label="Mapa"
      className={cn("relative touch-none overflow-hidden bg-muted select-none", interactivo && "cursor-grab active:cursor-grabbing", className)}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onDoubleClick={dobleClic}
    >
      <div className="absolute inset-0" aria-hidden>
        {baldosas.map((b) => (
          // eslint-disable-next-line @next/next/no-img-element -- baldosas de OpenStreetMap: son muchas, chicas y las cachea el navegador
          <img
            key={`${b.z}/${b.col}/${b.y}`}
            src={baldosaUrl(b.z, b.x, b.y)}
            alt=""
            draggable={false}
            onError={falloBaldosa}
            className="absolute max-w-none"
            style={{ left: b.izquierda, top: b.arriba, width: b.lado + 0.5, height: b.lado + 0.5 }}
          />
        ))}
      </div>
      {camara && medido && children?.(proyectar, tamano, camara)}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer noopener"
        className="absolute bottom-1.5 left-1.5 z-10 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground backdrop-blur-sm hover:underline"
      >
        © OpenStreetMap contributors
      </a>
      {controlesZoom && interactivo && camara && (
        <div className="absolute right-2 bottom-2 z-10 flex flex-col gap-1">
          <Button type="button" size="icon-sm" variant="secondary" className="shadow" aria-label="Acercar" disabled={camara.zoom >= ZOOM_MAX} onClick={() => zoomCentro(1)}>
            <Plus />
          </Button>
          <Button type="button" size="icon-sm" variant="secondary" className="shadow" aria-label="Alejar" disabled={camara.zoom <= ZOOM_MIN} onClick={() => zoomCentro(-1)}>
            <Minus />
          </Button>
        </div>
      )}
    </div>
  );
}
