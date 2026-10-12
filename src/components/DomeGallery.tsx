'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useGesture } from '@use-gesture/react';
import { Lock } from 'lucide-react';

import './DomeGallery.css';

// Adaptado de React Bits DomeGallery (MIT): las celdas de la esfera muestran cartas 63:88
// y, en vez de ampliar la imagen, un toque/click avisa con `onSelect` para abrir la carta.

export interface DomeItem {
  id: string;
  src: string;
  alt: string;
  /** Carta sin consagrar: arte en blanco y negro con candado */
  locked?: boolean;
}

export interface DomeGalleryProps {
  items: DomeItem[];
  onSelect?: (item: DomeItem) => void;
  fit?: number;
  fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
  minRadius?: number;
  maxRadius?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  dragDampening?: number;
  segments?: number;
  tileRadius?: string;
  className?: string;
}

interface Slot {
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
  poolIndex: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const wrapAngleSigned = (deg: number) => (((((deg + 180) % 360) + 360) % 360) - 180);

function buildSlots(poolSize: number, seg: number): Slot[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];
  const coords = xCols.flatMap((x, c) => (c % 2 === 0 ? evenYs : oddYs).map(y => ({ x, y, sizeX: 2, sizeY: 2 })));
  if (poolSize === 0) return [];

  // Se reparten las cartas en orden, evitando dos iguales seguidas
  const order = Array.from({ length: coords.length }, (_, i) => i % poolSize);
  for (let i = 1; i < order.length; i++) {
    if (order[i] !== order[i - 1]) continue;
    for (let j = i + 1; j < order.length; j++) {
      if (order[j] !== order[i]) {
        [order[i], order[j]] = [order[j], order[i]];
        break;
      }
    }
  }
  return coords.map((c, i) => ({ ...c, poolIndex: order[i] }));
}

export default function DomeGallery({
  items,
  onSelect,
  fit = 0.5,
  fitBasis = 'auto',
  minRadius = 600,
  maxRadius = Infinity,
  overlayBlurColor = '#0c0a09',
  maxVerticalRotationDeg = 5,
  dragSensitivity = 20,
  dragDampening = 2,
  segments = 35,
  tileRadius = '10px',
  className = ''
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const pointerTypeRef = useRef('mouse');
  const movedRef = useRef(false);
  const lastSelectAt = useRef(0);
  const itemsRef = useRef(items);
  const onSelectRef = useRef(onSelect);
  itemsRef.current = items;
  onSelectRef.current = onSelect;

  const slots = useMemo(() => buildSlots(items.length, segments), [items.length, segments]);

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
  };

  // Un toque es un click (o pointerup en táctil) sin arrastre; el guard evita abrir dos veces
  const select = (poolIndex: number) => {
    const now = performance.now();
    if (now - lastSelectAt.current < 400) return;
    lastSelectAt.current = now;
    const item = itemsRef.current[poolIndex];
    if (item) onSelectRef.current?.(item);
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      let basis: number;
      switch (fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = w / h >= 1.3 ? w : minDim;
      }
      const radius = clamp(Math.min(basis * fit, h * 1.35), minRadius, maxRadius);
      root.style.setProperty('--radius', `${Math.round(radius)}px`);
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, fitBasis, minRadius, maxRadius]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;
      const d = clamp(dragDampening, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if ((Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) || ++frames > maxFrames) {
          inertiaRAF.current = null;
          return;
        }
        const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useEffect(() => stopInertia, [stopInertia]);

  useGesture(
    {
      onDragStart: ({ event }) => {
        stopInertia();
        const e = event as PointerEvent;
        pointerTypeRef.current = e.pointerType || 'mouse';
        if (pointerTypeRef.current === 'touch') e.preventDefault();
        draggingRef.current = true;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: e.clientX, y: e.clientY };
        movedRef.current = false;
      },
      onDragEnd: ({ event }) => {
        // En táctil el puntero queda capturado por el contenedor: la carta se busca por posición
        if (pointerTypeRef.current !== 'touch' || movedRef.current) return;
        const { clientX, clientY } = event as PointerEvent;
        const card = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('.dome-card');
        if (card) select(Number(card.dataset.poolIndex));
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        const start = startPosRef.current;
        if (!draggingRef.current || !start) return;
        const e = event as PointerEvent;
        if (pointerTypeRef.current === 'touch') e.preventDefault();

        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const moveThreshold = pointerTypeRef.current === 'touch' ? 10 : 6;
        if (dx * dx + dy * dy > moveThreshold * moveThreshold) movedRef.current = true;
        const nextX = clamp(startRotRef.current.x - dy / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = startRotRef.current.y + dx / dragSensitivity;
        const cur = rotationRef.current;
        if (cur.x !== nextX || cur.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }

        if (!last) return;
        draggingRef.current = false;
        const isTap = !movedRef.current;

        let vx = velocity[0] * direction[0];
        let vy = velocity[1] * direction[1];
        if (!isTap && Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001) {
          vx = (movement[0] / dragSensitivity) * 0.02;
          vy = (movement[1] / dragSensitivity) * 0.02;
        }
        if (!isTap && (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005)) startInertia(vx, vy);

        startPosRef.current = null;
      }
    },
    { target: mainRef, eventOptions: { passive: false } }
  );

  return (
    <div
      ref={rootRef}
      className={`dome-root${className ? ` ${className}` : ''}`}
      style={
        {
          '--segments-x': segments,
          '--segments-y': segments,
          '--dome-bg': overlayBlurColor,
          '--tile-radius': tileRadius
        } as CSSProperties
      }
    >
      <main
        ref={mainRef}
        className="absolute inset-0 grid place-items-center overflow-hidden select-none"
        style={{ touchAction: 'none', WebkitUserSelect: 'none', backgroundColor: overlayBlurColor }}
      >
        <div className="dome-stage">
          <div ref={sphereRef} className="dome-sphere">
            {slots.map((slot, i) => {
              const item = items[slot.poolIndex];
              return (
                <div
                  key={`${slot.x},${slot.y},${i}`}
                  className="dome-item"
                  style={
                    {
                      '--offset-x': slot.x,
                      '--offset-y': slot.y,
                      '--item-size-x': slot.sizeX,
                      '--item-size-y': slot.sizeY
                    } as CSSProperties
                  }
                >
                  <div className="dome-slot">
                    <div
                      className="dome-card"
                      role="button"
                      tabIndex={0}
                      aria-label={item.alt}
                      data-pool-index={slot.poolIndex}
                      data-locked={item.locked ? '' : undefined}
                      onClick={() => {
                        if (!movedRef.current) select(slot.poolIndex);
                      }}
                      onKeyDown={e => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        select(slot.poolIndex);
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.src} alt="" draggable={false} loading="lazy" decoding="async" />
                      {item.locked ? (
                        <div className="dome-card__lock" aria-hidden="true">
                          <span>
                            <Lock className="size-4" />
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Viñeta y desenfoque de los bordes */}
        <div
          className="pointer-events-none absolute inset-0 z-[3] m-auto"
          style={{ backgroundImage: `radial-gradient(rgba(235,235,235,0) 65%, ${overlayBlurColor} 100%)` }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[3] m-auto"
          style={{
            WebkitMaskImage: `radial-gradient(rgba(235,235,235,0) 70%, ${overlayBlurColor} 90%)`,
            maskImage: `radial-gradient(rgba(235,235,235,0) 70%, ${overlayBlurColor} 90%)`,
            backdropFilter: 'blur(3px)'
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[120px] rotate-180"
          style={{ background: `linear-gradient(to bottom, transparent, ${overlayBlurColor})` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[120px]"
          style={{ background: `linear-gradient(to bottom, transparent, ${overlayBlurColor})` }}
        />
      </main>
    </div>
  );
}
