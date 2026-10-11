"use client";

import type { ReactNode } from "react";
import ElectricBorder from "@/components/ElectricBorder";

interface BordeReclamableProps {
  /** Sin reclamo pendiente se devuelve la carta tal cual */
  activo: boolean;
  /** Radio del borde en px, igual al de la carta que envuelve */
  radio?: number;
  className?: string;
  children: ReactNode;
}

/** Borde eléctrico (React Bits) de toda carta que se puede reclamar (vault/ECONOMIA_CARTAS.md §4.5) */
export function BordeReclamable({ activo, radio = 12, className, children }: BordeReclamableProps) {
  if (!activo) return <>{children}</>;
  return (
    <ElectricBorder color="#ffaa00" speed={0.4} chaos={0.03} borderRadius={radio} className={className}>
      {children}
    </ElectricBorder>
  );
}
