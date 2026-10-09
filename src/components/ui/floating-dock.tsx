"use client";

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export interface DockItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  active?: boolean;
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: DockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 bottom-full mb-3 flex flex-col gap-2 p-3 rounded-2xl bg-[var(--surface-container-lowest)]/95 backdrop-blur-xl border border-[color-mix(in_srgb,var(--outline-variant)_25%,transparent)] shadow-2xl z-50 min-w-[200px]"
          >
            {items.map((item) => {
              const content = (
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors w-full",
                    item.active
                      ? "bg-[var(--primary)] text-[var(--on-primary)] [&_svg]:!text-[var(--on-primary)]"
                      : "text-[var(--on-surface)] hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                  )}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="truncate">{item.title}</span>
                  {item.badge !== undefined && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-[var(--primary-container)] text-[var(--on-primary)] font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
              );

              if (item.href) {
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.title}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className="w-full text-left"
                >
                  {content}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-container-lowest)] text-[var(--on-surface)] shadow-lg border border-[color-mix(in_srgb,var(--outline-variant)_20%,transparent)] hover:scale-105 active:scale-95 transition-transform"
        aria-label="Abrir menú dock"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: DockItem[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-center gap-3 rounded-2xl bg-[var(--surface-container-lowest)]/85 px-4 backdrop-blur-xl border border-[color-mix(in_srgb,var(--outline-variant)_20%,transparent)] shadow-[0_12px_40px_rgba(0,0,0,0.15)] md:flex z-50",
        className
      )}
    >
      {items.map((item) => (
        <DockIconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function DockIconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
  active,
}: DockItem & { mouseX: MotionValue }) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-160, 0, 160], [42, 68, 42]);
  const heightTransform = useTransform(distance, [-160, 0, 160], [42, 68, 42]);

  const widthTransformIcon = useTransform(distance, [-160, 0, 160], [20, 32, 20]);
  const heightTransformIcon = useTransform(distance, [-160, 0, 160], [20, 32, 20]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 170,
    damping: 14,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 170,
    damping: 14,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 170,
    damping: 14,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 170,
    damping: 14,
  });

  const [hovered, setHovered] = useState(false);

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-xl transition-colors cursor-pointer select-none",
        active
          ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-md [&_svg]:!text-[var(--on-primary)]"
          : "bg-[var(--surface-container)] text-[var(--on-surface)] hover:bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] hover:text-[var(--primary)]"
      )}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 4, x: "-50%" }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-max px-2.5 py-1 rounded-md bg-[var(--surface-container-high)] text-[var(--on-surface)] border border-[color-mix(in_srgb,var(--outline-variant)_25%,transparent)] text-xs font-semibold shadow-lg pointer-events-none z-50 whitespace-nowrap"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
      >
        {icon}
      </motion.div>
    </motion.div>
  );

  if (href) {
    return <Link href={href} aria-label={title}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} aria-label={title} className="focus:outline-none">
      {content}
    </button>
  );
}
