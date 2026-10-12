"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

// Fila con gesto de swipe completo en ambas direcciones (basada en el SwipeRow provisto,
// que solo soportaba un lado y un cajón de acciones; acá solo hay "full swipe").
const HYST = 10;
const FLICK = 600;
const SPRING = { type: "spring" as const, duration: 0.3, bounce: 0 };

const rubber = (o: number, dim: number, c: number) => (o * dim * c) / (dim + c * Math.abs(o));

export interface SwipeSide {
  label: string;
  icon?: ReactNode;
  /** Color de fondo CSS (acepta var(--x)). */
  color: string;
  /** Color del texto/icono sobre el fondo. */
  onColor: string;
  onCommit: () => void;
}

interface Props {
  children: ReactNode;
  /** Se ejecuta al deslizar hacia la izquierda. */
  left?: SwipeSide;
  /** Se ejecuta al deslizar hacia la derecha. */
  right?: SwipeSide;
  /** Fracción del ancho a partir de la cual se confirma (0-1). */
  commitAt?: number;
  resistance?: number;
  collapseMs?: number;
  disabled?: boolean;
  className?: string;
}

export function SwipeRow({
  children, left, right, commitAt = 0.55, resistance = 0.55, collapseMs = 200, disabled = false, className = "",
}: Props) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const grip = useRef<{ id: number; x0: number; y0: number; grab: number | null; last: number; t: number; v: number } | null>(null);
  const [done, setDone] = useState(false);
  const [height, setHeight] = useState<number | "auto">("auto");
  const [armed, setArmed] = useState<"left" | "right" | null>(null);
  const x = useMotionValue(0);
  const revealLeft = useTransform(x, v => Math.min(1, Math.max(0, -v / 80)));
  const revealRight = useTransform(x, v => Math.min(1, Math.max(0, v / 80)));
  const leftActive = useRef(left);
  const rightActive = useRef(right);
  leftActive.current = left; // eslint-disable-line react-hooks/refs
  rightActive.current = right; // eslint-disable-line react-hooks/refs
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const width = () => root.current?.offsetWidth || 360;
  const allowed = (dir: number) => (dir < 0 ? !!leftActive.current : !!rightActive.current);

  const commit = (dir: -1 | 1, v: number) => {
    const side = dir < 0 ? leftActive.current : rightActive.current;
    if (!side) return;
    setDone(true);
    setHeight(root.current?.offsetHeight ?? "auto");
    const finish = () => {
      requestAnimationFrame(() => setHeight(0));
      timer.current = setTimeout(side.onCommit, reduce ? 0 : collapseMs);
    };
    if (reduce) { x.set(dir * width()); finish(); return; }
    animate(x, dir * width(), { ...SPRING, velocity: v }).then(finish);
  };

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || done || grip.current || e.button !== 0) return;
    x.stop();
    grip.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, grab: null, last: 0, t: performance.now(), v: 0 };
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x0;
    if (g.grab === null) {
      if (Math.abs(dx) < HYST || Math.abs(dx) < Math.abs(e.clientY - g.y0)) return;
      g.grab = g.x0 + Math.sign(dx) * HYST;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }
    const raw = e.clientX - g.grab;
    const W = width();
    const dir = Math.sign(raw);
    const ex = !allowed(dir) ? rubber(raw, W, 0.15) : rubber(raw, W, resistance + 0.45);
    const now = performance.now();
    g.v = ((ex - g.last) / Math.max(1, now - g.t)) * 1000;
    g.last = ex; g.t = now;
    x.set(ex);
    const past = allowed(dir) && Math.abs(ex) >= commitAt * W;
    const next = past ? (dir < 0 ? "left" : "right") : null;
    setArmed(prev => {
      if (prev !== next && next && "vibrate" in navigator && e.pointerType === "touch") navigator.vibrate?.(8);
      return next;
    });
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    grip.current = null;
    if (g.grab === null) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    const ex = x.get();
    const dir = Math.sign(ex) as -1 | 1;
    const flick = Math.abs(g.v) >= FLICK && Math.sign(g.v) === dir && Math.abs(ex) > width() * 0.2;
    setArmed(null);
    if (e.type !== "pointercancel" && allowed(dir) && (Math.abs(ex) >= commitAt * width() || flick)) {
      commit(dir, g.v);
    } else {
      animate(x, 0, { ...SPRING, velocity: g.v });
    }
  };

  const Side = ({ side, dir }: { side: SwipeSide; dir: "left" | "right" }) => (
    <motion.div
      aria-hidden
      className={`absolute inset-y-0 flex items-center px-6 text-sm font-medium ${dir === "left" ? "right-0 justify-end" : "left-0 justify-start"}`}
      style={{ background: side.color, color: side.onColor, width: "100%", opacity: dir === "left" ? revealLeft : revealRight }}
    >
      <motion.span
        className="flex items-center gap-2"
        animate={{ scale: armed === dir ? 1.15 : 1 }}
        transition={SPRING}
      >
        {dir === "left" ? <>{side.label}{side.icon}</> : <>{side.icon}{side.label}</>}
      </motion.span>
    </motion.div>
  );

  return (
    <div
      ref={root}
      className={`relative overflow-hidden ${className}`}
      style={{
        height: height === "auto" ? undefined : height,
        opacity: height === 0 ? 0 : 1,
        transition: done ? `height ${collapseMs}ms cubic-bezier(0.23,1,0.32,1), opacity ${collapseMs}ms` : undefined,
      }}
    >
      {left && <Side side={left} dir="left" />}
      {right && <Side side={right} dir="right" />}
      <motion.div
        className="relative z-[1] touch-pan-y bg-card [-webkit-tap-highlight-color:transparent]"
        style={{ x }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeRow;
