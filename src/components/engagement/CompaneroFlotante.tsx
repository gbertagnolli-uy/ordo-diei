"use client";

// Compañero flotante en toda la app (lane 247, gestos y escenas en la lane 248).
// - Tocarlo abre un menú: cambiar de imagen o abrir su panel. Dejarlo apretado permite arrastrarlo a cualquier lugar.
// - Llevarlo abajo del todo lo oculta (queda un botón redondo en el Dock).
// - La imagen y el mensaje cambian solos según la pantalla, el momento del día y lo que pasa en la app (ver companeroEscena.ts).
// - Las frases salen en un globo SVG arriba a la izquierda.
// El layout de /dashboard lo monta; el login y el salvapantallas viven en «/», fuera de ese layout, así que ahí no aparece.
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shuffle, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { GloboDialogo } from "@/components/engagement/GloboDialogo";
import { ImagenConRespaldo } from "@/components/engagement/ImagenConRespaldo";
import { rutaDePose } from "@/components/engagement/EscenaCompanero";
import { datosDePersonaje, tieneFondo, type Personaje, type Pose } from "@/lib/engagement/companero";
import { contextoDePantalla, elegirEscena, fraseDePose, poseFlotante, posesVisibles, siguientePose, type EventoApp, type PoseFlotante } from "@/lib/engagement/companeroEscena";
import { ajusteDe, useCompaneroFlotanteStore } from "@/store/companeroFlotanteStore";
import { useModalStore, type ModalType } from "@/store/modalStore";

export type CompaneroFlotanteDatos = {
  usuarioId: number;
  /** Nombre de quien lo cuida (para las frases) */
  quien: string;
  personaje: Personaje;
  nombre: string;
  /** La pose que se ve en /dashboard/companero al entrar (la de «buenos días» no se muestra flotando) */
  pose: Pose;
  /** Las que ya aprendió */
  poses: Pose[];
  /** Lo que está pasando en la app al abrirla (nivel nuevo, premios, cartas…) */
  eventos: EventoApp[];
};

const ANCHO = 112;
const ALTO = Math.round((ANCHO * 4) / 3);
const ANCHO_MENU = 224;
const ALTO_MENU = 96;
const MARGEN = 8;
const ESPACIO_DOCK = 104;
const UMBRAL_ARRASTRE = 8;
/** Con el compañero ya apretado alcanza un movimiento mínimo para empezar a arrastrar */
const UMBRAL_SOSTENIDO = 2;
const SOSTENER_MS = 250;
const VISIBLE_MS = 8000;
const CAMBIO_SOLO_MIN_MS = 45_000;
const CAMBIO_SOLO_MAX_MS = 75_000;
/** Cuánto de su alto tiene que quedar pasado el borde de abajo para que se oculte al soltarlo */
const FRACCION_PARA_OCULTAR = 0.45;

/** Lo que pasa en la app y se anuncia en el momento (modales de la app) */
const EVENTO_POR_MODAL: Partial<Record<ModalType, EventoApp>> = { TASK_SUCCESS: "tarea-hecha", LEVEL_UP: "nivel", SURPRISE_AWARD: "premio" };

type Punto = { x: number; y: number };

const limitar = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));
const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });
const posicionInicial = (): Punto => ({ x: viewport().w - ANCHO - 16, y: viewport().h - ALTO - ESPACIO_DOCK });
/** Dentro de la pantalla; durante el arrastre se permite pasarse por abajo (es el gesto de ocultar) */
function acomodar(p: Punto, pasarseAbajo = false): Punto {
  const { w, h } = viewport();
  return { x: limitar(p.x, MARGEN, w - ANCHO - MARGEN), y: limitar(p.y, MARGEN, pasarseAbajo ? h : h - ALTO - MARGEN) };
}
/** ¿Lo llevó lo bastante abajo como para esconderlo? */
const enZonaDeOcultar = (p: Punto) => p.y > viewport().h - ALTO * (1 - FRACCION_PARA_OCULTAR);

export function CompaneroFlotante({ datos }: { datos: CompaneroFlotanteDatos }) {
  const { usuarioId, quien, personaje, nombre, pose: poseInicial, poses, eventos } = datos;
  const router = useRouter();
  const pathname = usePathname();
  const listo = useCompaneroFlotanteStore((s) => s.listo);
  const ajuste = useCompaneroFlotanteStore((s) => ajusteDe(s.ajustes, usuarioId));
  const { ocultar, mover } = useCompaneroFlotanteStore.getState();
  const voz = datosDePersonaje(personaje).voz;
  const visibles = posesVisibles(poses);

  const [pos, setPos] = useState<Punto | null>(null);
  const [pose, setPose] = useState<PoseFlotante>(poseFlotante(poseInicial));
  const [dice, setDice] = useState<string | null>(null);
  const [sostenido, setSostenido] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [porOcultar, setPorOcultar] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const gesto = useRef<{ x0: number; y0: number; px: number; py: number; movido: boolean; sostenido: boolean } | null>(null);
  const temporizadorSostener = useRef<ReturnType<typeof setTimeout> | null>(null);
  const temporizadorFrase = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posActual = useRef<Punto | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  // Lo último que se vio, para que los temporizadores y suscripciones no trabajen con valores viejos
  const ultimo = useRef({ pose: poseFlotante(poseInicial), frase: null as string | null, oculto: ajuste.oculto, menuAbierto: false, arrastrando: false, pathname });
  useEffect(() => {
    ultimo.current.oculto = ajuste.oculto;
    ultimo.current.menuAbierto = menuAbierto;
    ultimo.current.arrastrando = arrastrando || sostenido;
    ultimo.current.pathname = pathname;
  });

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

  const decir = useCallback((texto: string | null) => {
    if (temporizadorFrase.current) clearTimeout(temporizadorFrase.current);
    ultimo.current.frase = texto;
    setDice(texto);
    if (texto) temporizadorFrase.current = setTimeout(() => setDice(null), VISIBLE_MS);
  }, []);

  /** Elige sola la imagen y el mensaje según la pantalla, la hora y lo que pasa en la app */
  const nuevaEscena = useCallback(
    (opciones: { eventoPuntual?: EventoApp; inicial?: boolean } = {}) => {
      const e = elegirEscena({
        voz,
        nombre: quien,
        contexto: contextoDePantalla(ultimo.current.pathname),
        hora: new Date().getHours(),
        eventos,
        desbloqueadas: poses,
        anterior: { pose: ultimo.current.pose, frase: ultimo.current.frase },
        ...opciones,
      });
      ultimo.current.pose = e.pose;
      setPose(e.pose);
      decir(e.frase);
    },
    [voz, quien, eventos, poses, decir],
  );

  // Al abrir la app dice lo más importante; cuando reaparece desde el Dock saluda de nuevo
  const yaSaludo = useRef(false);
  useEffect(() => {
    if (!listo || !pos || ajuste.oculto) return;
    nuevaEscena({ inicial: !yaSaludo.current });
    yaSaludo.current = true;
    // Una vez por vez que se muestra: no debe repetirse porque cambie otra cosa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo, ajuste.oculto, pos === null]);

  // Cambia solo al ir a otra pantalla
  const pantallaAnterior = useRef(pathname);
  useEffect(() => {
    if (pantallaAnterior.current === pathname) return;
    pantallaAnterior.current = pathname;
    if (ultimo.current.oculto) return;
    nuevaEscena();
  }, [pathname, nuevaEscena]);

  // Cambia solo cada tanto, si no lo están usando
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const programar = () => {
      id = setTimeout(() => {
        const u = ultimo.current;
        if (!document.hidden && !u.oculto && !u.menuAbierto && !u.arrastrando) nuevaEscena();
        programar();
      }, CAMBIO_SOLO_MIN_MS + Math.random() * (CAMBIO_SOLO_MAX_MS - CAMBIO_SOLO_MIN_MS));
    };
    programar();
    return () => clearTimeout(id);
  }, [nuevaEscena]);

  // Reacciona a lo que pasa en el momento (tarea hecha, nivel nuevo, premio)
  useEffect(() => {
    return useModalStore.subscribe((estado, previo) => {
      if (!estado.type || estado.type === previo.type) return;
      const evento = EVENTO_POR_MODAL[estado.type];
      if (evento && !ultimo.current.oculto) nuevaEscena({ eventoPuntual: evento });
    });
  }, [nuevaEscena]);

  useEffect(
    () => () => {
      if (temporizadorFrase.current) clearTimeout(temporizadorFrase.current);
      if (temporizadorSostener.current) clearTimeout(temporizadorSostener.current);
    },
    [],
  );

  // El menú se cierra al tocar afuera o con Escape; al abrirlo, el foco va a la primera opción
  useEffect(() => {
    if (!menuAbierto) return;
    menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    const afuera = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !raiz.current?.contains(t)) setMenuAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuAbierto(false);
      raiz.current?.focus();
    };
    document.addEventListener("pointerdown", afuera, true);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", afuera, true);
      document.removeEventListener("keydown", tecla);
    };
  }, [menuAbierto]);

  const cancelarSostener = () => {
    if (temporizadorSostener.current) clearTimeout(temporizadorSostener.current);
    temporizadorSostener.current = null;
  };

  const cambiarImagen = () => {
    const siguiente = siguientePose(pose, visibles);
    ultimo.current.pose = siguiente;
    setPose(siguiente);
    decir(fraseDePose(voz, siguiente, quien, ultimo.current.frase));
    setMenuAbierto(false);
  };

  const abrirPanel = () => {
    setMenuAbierto(false);
    router.push("/dashboard/companero");
  };

  const alApretar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pos || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    gesto.current = { x0: e.clientX, y0: e.clientY, px: pos.x, py: pos.y, movido: false, sostenido: false };
    cancelarSostener();
    // Dejarlo apretado = «lo tengo agarrado»: a partir de ahí cualquier movimiento lo arrastra
    temporizadorSostener.current = setTimeout(() => {
      if (!gesto.current || gesto.current.movido) return;
      gesto.current.sostenido = true;
      setSostenido(true);
      setMenuAbierto(false);
    }, SOSTENER_MS);
  };

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesto.current;
    if (!g) return;
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (!g.movido) {
      if (Math.hypot(dx, dy) < (g.sostenido ? UMBRAL_SOSTENIDO : UMBRAL_ARRASTRE)) return;
      g.movido = true;
      cancelarSostener();
      setSostenido(false);
      setArrastrando(true);
      setMenuAbierto(false);
      decir(null);
    }
    const p = acomodar({ x: g.px + dx, y: g.py + dy }, true);
    posActual.current = p;
    setPos(p);
    setPorOcultar(enZonaDeOcultar(p));
  };

  const terminar = (e: React.PointerEvent<HTMLDivElement>, cancelado: boolean) => {
    const g = gesto.current;
    gesto.current = null;
    cancelarSostener();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setSostenido(false);
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
        decir(null);
        return;
      }
      const final = acomodar(p);
      posActual.current = final;
      setPos(final);
      mover(usuarioId, final.x, final.y);
      return;
    }
    // Un toque (aunque sea largo, si no lo movió): abre o cierra el menú
    if (!cancelado) setMenuAbierto((abierto) => !abierto);
  };

  // Teclado: Enter o espacio abren el menú
  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setMenuAbierto((abierto) => !abierto);
  };

  if (!listo || ajuste.oculto || !pos) return null;

  const datosPersonaje = datosDePersonaje(personaje);
  // Si no hay lugar a la izquierda el globo se pasa para el otro lado; si no hay arriba, queda al costado
  const lado = pos.x < 190 ? "derecha" : "izquierda";
  const haySitioArriba = pos.y > 120;
  const { w: anchoVentana, h: altoVentana } = viewport();
  const menuAbajo = pos.y + ALTO + ALTO_MENU + MARGEN < altoVentana;
  const menuX = limitar(pos.x + ANCHO / 2 - ANCHO_MENU / 2, MARGEN, anchoVentana - ANCHO_MENU - MARGEN);
  const menuY = menuAbajo ? pos.y + ALTO + 4 : Math.max(MARGEN, pos.y - ALTO_MENU + 8);

  return (
    <>
      <div
        ref={raiz}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={menuAbierto}
        aria-label={`${nombre}: tocalo para ver opciones, dejalo apretado para moverlo`}
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={(e) => terminar(e, false)}
        onPointerCancel={(e) => terminar(e, true)}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={alTeclear}
        style={{ width: ANCHO, height: ALTO, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, touchAction: "none" }}
        className={cn(
          "fixed left-0 top-0 z-40 cursor-grab select-none rounded-xl outline-none print:hidden [-webkit-touch-callout:none] focus-visible:ring-[3px] focus-visible:ring-ring/50",
          (arrastrando || sostenido) && "cursor-grabbing",
        )}
      >
        <div className={cn("size-full transition-[transform,opacity] duration-150", (arrastrando || sostenido) && "scale-105", porOcultar && "scale-90 opacity-40")}>
          <ImagenConRespaldo
            srcs={[rutaDePose(personaje, pose), rutaDePose(personaje, "neutral")]}
            alt=""
            className={cn("pointer-events-none size-full animate-in fade-in object-contain object-bottom drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] duration-300", tieneFondo(pose) && "mix-blend-multiply")}
            respaldo={<span aria-hidden className="flex size-full items-end justify-center text-7xl">{datosPersonaje.emoji}</span>}
          />
        </div>
        {dice && !arrastrando && !sostenido && !menuAbierto && (
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
      {menuAbierto && !arrastrando && (
        <div
          ref={menu}
          role="menu"
          aria-label={`Opciones de ${nombre}`}
          style={{ left: menuX, top: menuY, width: ANCHO_MENU }}
          className="fixed z-40 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-150 print:hidden"
        >
          <button type="button" role="menuitem" onClick={cambiarImagen} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground">
            <Shuffle className="size-4" /> Cambiar de imagen
          </button>
          <button type="button" role="menuitem" onClick={abrirPanel} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground">
            <UserRound className="size-4" /> Abrir panel del compañero
          </button>
        </div>
      )}
    </>
  );
}
