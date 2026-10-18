"use client";

// Compañero flotante en toda la app (lane 247): se arrastra a cualquier lado, se oculta llevándolo abajo del todo
// (queda un botón redondo en el Dock), al tocarlo cambia de pose y manteniéndolo apretado 1 s abre su pantalla.
// Las frases salen en un globo SVG arriba a la izquierda. El layout de /dashboard lo monta; el login y el
// salvapantallas viven en «/», fuera de ese layout, así que ahí no aparece.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GloboDialogo } from "@/components/engagement/GloboDialogo";
import { ImagenConRespaldo } from "@/components/engagement/ImagenConRespaldo";
import { rutaDePose } from "@/components/engagement/EscenaCompanero";
import { datosDePersonaje, tieneFondo, type Personaje, type Pose } from "@/lib/engagement/companero";
import { fraseDe } from "@/lib/engagement/companeroFrases";
import { ajusteDe, useCompaneroFlotanteStore } from "@/store/companeroFlotanteStore";

export type CompaneroFlotanteDatos = {
  usuarioId: number;
  /** Nombre de quien lo cuida (para las frases) */
  quien: string;
  personaje: Personaje;
  nombre: string;
  /** La pose que se ve en /dashboard/companero al entrar */
  pose: Pose;
  /** Las que ya aprendió: al tocarlo va pasando por ellas */
  poses: Pose[];
  /** Lo primero que dice al abrir la app */
  saludo: string;
};

const ANCHO = 112;
const ALTO = Math.round((ANCHO * 4) / 3);
const MARGEN = 8;
const ESPACIO_DOCK = 104;
const UMBRAL_ARRASTRE = 6;
const PRESION_LARGA_MS = 1000;
const VISIBLE_SALUDO_MS = 9000;
const VISIBLE_TOQUE_MS = 6000;
/** Cuánto de su alto tiene que quedar pasado el borde de abajo para que se oculte al soltarlo */
const FRACCION_PARA_OCULTAR = 0.45;

type Punto = { x: number; y: number };

const limitar = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));
const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });
const posicionInicial = (): Punto => ({ x: viewport().w - ANCHO - 16, y: viewport().h - ALTO - ESPACIO_DOCK });
/** Dentro de la pantalla; durante el arrastre se permite pasarse por abajo (es el gesto de ocultar) */
function acomodar(p: Punto, pasarseAbajo = false): Punto {
  const { w, h } = viewport();
  return { x: limitar(p.x, MARGEN, w - ANCHO - MARGEN), y: limitar(p.y, MARGEN, pasarseAbajo ? h : h - ALTO - MARGEN) };
}
/** ¿Lo llevó lo bastante abajo como para guardarlo? */
const enZonaDeOcultar = (p: Punto) => p.y > viewport().h - ALTO * (1 - FRACCION_PARA_OCULTAR);

export function CompaneroFlotante({ datos }: { datos: CompaneroFlotanteDatos }) {
  const { usuarioId, quien, personaje, nombre, pose: poseInicial, poses, saludo } = datos;
  const router = useRouter();
  const listo = useCompaneroFlotanteStore((s) => s.listo);
  const ajuste = useCompaneroFlotanteStore((s) => ajusteDe(s.ajustes, usuarioId));
  const { ocultar, mover } = useCompaneroFlotanteStore.getState();

  const [pos, setPos] = useState<Punto | null>(null);
  const [pose, setPose] = useState<Pose>(poseInicial);
  const [dice, setDice] = useState<string | null>(saludo);
  const [arrastrando, setArrastrando] = useState(false);
  const [porOcultar, setPorOcultar] = useState(false);

  const gesto = useRef<{ x0: number; y0: number; px: number; py: number; movido: boolean; largo: boolean } | null>(null);
  const temporizadorLargo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const temporizadorFrase = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posActual = useRef<Punto | null>(null);

  // Leer lo guardado en el navegador (en el servidor no existe)
  useEffect(() => {
    void Promise.resolve(useCompaneroFlotanteStore.persist.rehydrate()).then(() => useCompaneroFlotanteStore.getState().marcarListo());
  }, []);

  // Ubicar el compañero cuando se sabe dónde quedó la última vez
  const guardadoX = ajuste.x;
  const guardadoY = ajuste.y;
  useEffect(() => {
    if (!listo) return;
    const inicial = guardadoX !== null && guardadoY !== null ? { x: guardadoX, y: guardadoY } : posicionInicial();
    const p = acomodar(inicial);
    posActual.current = p;
    setPos(p);
    // Sólo cuando termina de leerse el almacenamiento o cambia el usuario: moverlo no debe reubicarlo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, usuarioId]);

  // Que no quede fuera de la pantalla si cambia su tamaño (girar el celular, achicar la ventana)
  useEffect(() => {
    const reacomodar = () => {
      if (!posActual.current) return;
      const p = acomodar(posActual.current);
      posActual.current = p;
      setPos(p);
    };
    window.addEventListener("resize", reacomodar);
    return () => window.removeEventListener("resize", reacomodar);
  }, []);

  const decir = useCallback((texto: string, ms: number) => {
    if (temporizadorFrase.current) clearTimeout(temporizadorFrase.current);
    setDice(texto);
    temporizadorFrase.current = setTimeout(() => setDice(null), ms);
  }, []);

  // El saludo del día se muestra un rato al abrir y después se calla
  useEffect(() => {
    temporizadorFrase.current = setTimeout(() => setDice(null), VISIBLE_SALUDO_MS);
    return () => {
      if (temporizadorFrase.current) clearTimeout(temporizadorFrase.current);
      if (temporizadorLargo.current) clearTimeout(temporizadorLargo.current);
    };
  }, []);

  const cancelarPresionLarga = () => {
    if (temporizadorLargo.current) clearTimeout(temporizadorLargo.current);
    temporizadorLargo.current = null;
  };

  const cambiarPose = () => {
    const lista = poses.length > 0 ? poses : [poseInicial];
    const siguiente = lista[(Math.max(lista.indexOf(pose), -1) + 1) % lista.length];
    setPose(siguiente);
    decir(fraseDe(personaje, "toque", quien, Math.floor(Math.random() * 1000)), VISIBLE_TOQUE_MS);
  };

  const alApretar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pos || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesto.current = { x0: e.clientX, y0: e.clientY, px: pos.x, py: pos.y, movido: false, largo: false };
    cancelarPresionLarga();
    temporizadorLargo.current = setTimeout(() => {
      if (!gesto.current || gesto.current.movido) return;
      gesto.current.largo = true;
      router.push("/dashboard/companero");
    }, PRESION_LARGA_MS);
  };

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesto.current;
    if (!g) return;
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (!g.movido) {
      if (Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
      g.movido = true;
      cancelarPresionLarga();
      setArrastrando(true);
    }
    const p = acomodar({ x: g.px + dx, y: g.py + dy }, true);
    posActual.current = p;
    setPos(p);
    setPorOcultar(enZonaDeOcultar(p));
  };

  const terminar = (e: React.PointerEvent<HTMLDivElement>, cancelado: boolean) => {
    const g = gesto.current;
    gesto.current = null;
    cancelarPresionLarga();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setArrastrando(false);
    setPorOcultar(false);
    if (!g) return;
    if (g.movido) {
      const p = posActual.current;
      if (!p) return;
      if (!cancelado && enZonaDeOcultar(p)) {
        // Se esconde, pero vuelve a su último lugar visible cuando lo llamen desde el Dock
        const vuelta = acomodar({ x: p.x, y: g.py });
        posActual.current = vuelta;
        setPos(vuelta);
        mover(usuarioId, vuelta.x, vuelta.y);
        ocultar(usuarioId);
        setDice(null);
        return;
      }
      const final = acomodar(p);
      posActual.current = final;
      setPos(final);
      mover(usuarioId, final.x, final.y);
      return;
    }
    if (!cancelado && !g.largo) cambiarPose();
  };

  // Teclado: Enter o espacio cambian la pose; Enter con Mayús abre su pantalla
  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (e.shiftKey) router.push("/dashboard/companero");
    else cambiarPose();
  };

  if (!listo || ajuste.oculto || !pos) return null;

  const datosPersonaje = datosDePersonaje(personaje);
  // Si no hay lugar a la izquierda el globo se pasa para el otro lado; si no hay arriba, queda al costado
  const lado = pos.x < 190 ? "derecha" : "izquierda";
  const haySitioArriba = pos.y > 120;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${nombre}: tocalo para cambiar de pose, mantenelo apretado para abrir su pantalla, arrastralo para moverlo`}
      onPointerDown={alApretar}
      onPointerMove={alMover}
      onPointerUp={(e) => terminar(e, false)}
      onPointerCancel={(e) => terminar(e, true)}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={alTeclear}
      style={{ width: ANCHO, height: ALTO, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, touchAction: "none" }}
      className={cn(
        "fixed left-0 top-0 z-40 cursor-grab select-none outline-none print:hidden [-webkit-touch-callout:none] focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-xl",
        arrastrando && "cursor-grabbing",
        !arrastrando && "transition-[opacity] duration-150",
      )}
    >
      <div className={cn("size-full transition-[transform,opacity] duration-150", arrastrando && "scale-105", porOcultar && "scale-90 opacity-40")}>
        <ImagenConRespaldo
          srcs={[rutaDePose(personaje, pose), rutaDePose(personaje, "neutral")]}
          alt=""
          className={cn("pointer-events-none size-full object-contain object-bottom drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]", tieneFondo(pose) && "mix-blend-multiply")}
          respaldo={<span aria-hidden className="flex size-full items-end justify-center text-7xl">{datosPersonaje.emoji}</span>}
        />
      </div>
      {dice && !arrastrando && (
        <div
          className={cn(
            "pointer-events-none absolute",
            haySitioArriba ? "bottom-[86%]" : "top-0",
            lado === "izquierda" ? (haySitioArriba ? "right-[42%]" : "right-[92%]") : haySitioArriba ? "left-[42%]" : "left-[92%]",
          )}
        >
          <GloboDialogo lado={lado}>{dice}</GloboDialogo>
        </div>
      )}
    </div>
  );
}
