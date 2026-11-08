"use client";
// Portado de vendor/Daily_You/lib/widgets/zoomable_attachment_page_view.dart (Demizo/Daily_You@7cc237d)
// Lane 294. Visor de fotos a pantalla completa: acercar con la rueda o pellizcando (1× a 10×), doble toque a 2×, mover la imagen sin sacarla de los bordes
// y pasar a la anterior o siguiente. La cuenta del zoom es pura y se prueba (`lib/diario/adjuntos.ts`); acá solo se leen los gestos.
// Cambios: Flutter reparte los gestos entre la imagen y el `PageView` con una arena propia (`_ArenaAwarePanRecognizer`); en la web con la imagen
// acercada arrastra la imagen, y al llegar a un borde un arrastre más hacia ese lado pasa de foto. Sin inercia al soltar (`FrictionSimulation`).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import {
  ESCALA_MAXIMA,
  VISTA_INICIAL,
  acercarEnFoco,
  ajustarAlVisor,
  arrastreMueveLaImagen,
  escalaDeDobleToque,
  factorDeRueda,
  limitarDesplazamiento,
  moverFoto,
  type Direccion,
  type Tamano,
  type Vista,
} from "@/lib/diario/adjuntos";

const UMBRAL_PASAR_FOTO = 60;
const PASO_TECLADO = 1.4;

interface Props {
  fotos: string[];
  /** Con cuál se abre. */
  inicio?: number;
  onCerrar: () => void;
}

interface Puntero {
  x: number;
  y: number;
}

export function VisorDeFotos({ fotos, inicio = 0, onCerrar }: Props) {
  const [indice, setIndice] = useState(() => Math.min(Math.max(0, inicio), Math.max(0, fotos.length - 1)));
  const [vista, setVista] = useState<Vista>(VISTA_INICIAL);
  const [imagen, setImagen] = useState<Tamano | null>(null);
  const [visor, setVisor] = useState<Tamano>({ w: 0, h: 0 });
  // El portal necesita `document`: en el servidor no se dibuja
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const contenedor = useRef<HTMLDivElement>(null);

  // Gestos en curso (en refs: no hace falta redibujar por cada movimiento)
  const punteros = useRef(new Map<number, Puntero>());
  const inicioGesto = useRef<{ x: number; y: number; vista: Vista; mueveImagen: boolean | null; direccion: Direccion | null } | null>(null);
  const distanciaPellizco = useRef<number | null>(null);
  const ultimoToque = useRef(0);
  const ajustada = imagen ? ajustarAlVisor(imagen, visor) : { w: 0, h: 0 };
  // Los gestos leen el estado más reciente desde estas referencias (se actualizan después de cada dibujo)
  const vistaRef = useRef(vista);
  const ajustadaRef = useRef(ajustada);
  const visorRef = useRef(visor);
  useEffect(() => {
    vistaRef.current = vista;
    ajustadaRef.current = ajustada;
    visorRef.current = visor;
  });

  useEffect(() => {
    const el = contenedor.current;
    if (!el || !montado) return;
    const medir = () => setVisor({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [montado]);

  const irA = useCallback(
    (paso: -1 | 1) => {
      setIndice((i) => {
        const nuevo = moverFoto(i, fotos.length, paso);
        if (nuevo !== i) {
          setVista(VISTA_INICIAL);
          setImagen(null);
        }
        return nuevo;
      });
    },
    [fotos.length],
  );

  const acercar = useCallback((foco: Puntero, escala: number, movimiento?: Puntero) => {
    setVista((v) => acercarEnFoco(v, foco, escala, ajustadaRef.current, visorRef.current, movimiento));
  }, []);

  // Teclado: Esc cierra, flechas pasan de foto, + y − acercan
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      else if (e.key === "ArrowLeft") irA(-1);
      else if (e.key === "ArrowRight") irA(1);
      else if (e.key === "+" || e.key === "=") acercar({ x: visorRef.current.w / 2, y: visorRef.current.h / 2 }, vistaRef.current.escala * PASO_TECLADO);
      else if (e.key === "-") acercar({ x: visorRef.current.w / 2, y: visorRef.current.h / 2 }, vistaRef.current.escala / PASO_TECLADO);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", alTeclear);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflow;
    };
  }, [onCerrar, irA, acercar]);

  // La rueda se registra a mano: React la pasa como pasiva y no deja evitar el desplazamiento de la página
  useEffect(() => {
    const el = contenedor.current;
    if (!el || !montado) return;
    const alRodar = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      acercar({ x: e.clientX - r.left, y: e.clientY - r.top }, vistaRef.current.escala * factorDeRueda(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY));
    };
    el.addEventListener("wheel", alRodar, { passive: false });
    return () => el.removeEventListener("wheel", alRodar);
  }, [montado, acercar]);

  const local = (e: React.PointerEvent): Puntero => {
    const r = contenedor.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function alBajar(e: React.PointerEvent) {
    if ((e.target as Element).closest("button, a")) return;
    contenedor.current?.setPointerCapture(e.pointerId);
    const p = local(e);
    punteros.current.set(e.pointerId, p);
    if (punteros.current.size === 1) {
      inicioGesto.current = { ...p, vista: vistaRef.current, mueveImagen: null, direccion: null };
      // Doble toque: dos toques seguidos, cerca de donde empezó el primero
      const ahora = e.timeStamp;
      if (ahora - ultimoToque.current < 300) {
        acercar(p, escalaDeDobleToque(vistaRef.current.escala));
        ultimoToque.current = 0;
        inicioGesto.current = null;
      } else {
        ultimoToque.current = ahora;
      }
    } else if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      distanciaPellizco.current = Math.hypot(a.x - b.x, a.y - b.y);
      inicioGesto.current = null;
    }
  }

  function alMover(e: React.PointerEvent) {
    const anterior = punteros.current.get(e.pointerId);
    if (!anterior) return;
    const p = local(e);
    punteros.current.set(e.pointerId, p);
    if (punteros.current.size === 2 && distanciaPellizco.current) {
      const [a, b] = [...punteros.current.values()];
      const distancia = Math.hypot(a.x - b.x, a.y - b.y);
      if (distancia > 0) {
        const foco = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        acercar(foco, vistaRef.current.escala * (distancia / distanciaPellizco.current));
        distanciaPellizco.current = distancia;
      }
      return;
    }
    const g = inicioGesto.current;
    if (!g || punteros.current.size !== 1) return;
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    if (g.mueveImagen === null && Math.hypot(dx, dy) > 6) {
      const direccion: Direccion = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "izquierda" : "derecha") : dy < 0 ? "arriba" : "abajo";
      // Daily You `_computeVerdict`: sin zoom, o ya pegada al borde hacia donde se arrastra, el gesto es del pasador de fotos
      g.direccion = direccion;
      g.mueveImagen = arrastreMueveLaImagen(direccion, g.vista, ajustadaRef.current, visorRef.current);
    }
    if (g.mueveImagen) {
      const { x, y } = limitarDesplazamiento(g.vista.x + dx, g.vista.y + dy, g.vista.escala, ajustadaRef.current, visorRef.current);
      setVista({ escala: g.vista.escala, x, y });
    }
  }

  function alSoltar(e: React.PointerEvent) {
    const p = punteros.current.get(e.pointerId);
    punteros.current.delete(e.pointerId);
    if (punteros.current.size < 2) distanciaPellizco.current = null;
    const g = inicioGesto.current;
    if (p && g && punteros.current.size === 0) {
      const dx = p.x - g.x;
      if (g.mueveImagen === false && (g.direccion === "izquierda" || g.direccion === "derecha") && Math.abs(dx) > UMBRAL_PASAR_FOTO) irA(dx < 0 ? 1 : -1);
      inicioGesto.current = null;
    }
  }

  const foto = fotos[indice];
  if (!montado || !foto) return null;

  return createPortal(
    <div ref={contenedor} role="dialog" aria-modal="true" aria-label="Visor de fotos" className="fixed inset-0 z-[100] touch-none bg-black/95 select-none" onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}>
      {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload */}
      <img
        key={foto}
        src={foto}
        alt=""
        draggable={false}
        onLoad={(e) => setImagen({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        className="absolute top-1/2 left-1/2 max-w-none"
        style={{
          width: ajustada.w || undefined,
          height: ajustada.h || undefined,
          opacity: imagen ? 1 : 0,
          transform: `translate(calc(-50% + ${vista.x}px), calc(-50% + ${vista.y}px)) scale(${vista.escala})`,
          transformOrigin: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3 text-white">
        <span className="rounded-full bg-black/50 px-3 py-1 text-sm tabular-nums">
          {indice + 1} / {fotos.length}
          {vista.escala > 1.01 && <span className="ml-2 opacity-70">{vista.escala.toFixed(1)}×</span>}
        </span>
        <div className="pointer-events-auto flex items-center gap-1">
          <a href={`${foto}?descargar=1`} download className="grid size-10 place-items-center rounded-full bg-black/50 hover:bg-black/70" aria-label="Descargar la foto" title="Descargar">
            <Download className="size-5" />
          </a>
          <button type="button" className="grid size-10 place-items-center rounded-full bg-black/50 hover:bg-black/70" aria-label="Cerrar el visor" title="Cerrar (Esc)" onClick={onCerrar}>
            <X className="size-5" />
          </button>
        </div>
      </div>
      {fotos.length > 1 && (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
            aria-label="Foto anterior"
            disabled={indice === 0}
            onClick={() => irA(-1)}
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
            aria-label="Foto siguiente"
            disabled={indice === fotos.length - 1}
            onClick={() => irA(1)}
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
      <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-white/60">
        Rueda o pellizco para acercar (hasta {ESCALA_MAXIMA}×) · doble toque para ampliar · arrastrá para mover
      </p>
    </div>,
    document.body,
  );
}
