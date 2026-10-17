"use client";

import { useEffect, useState } from "react";
import SwipeToast from "@/components/SwipeToast";
import { dismissToast, subscribeToasts, type ToastItem, type ToastTipo } from "@/lib/toast";

const COLORES: Record<ToastTipo, { background: string; fuseColor: string }> = {
  success: { background: "#14532d", fuseColor: "#4ade80" },
  error: { background: "#7f1d1d", fuseColor: "#f87171" },
  info: { background: "#27272a", fuseColor: "#ffaa00" },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribeToasts(setItems), []);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[999999999] flex w-[min(356px,calc(100vw-32px))] flex-col items-end sm:right-8 sm:bottom-8">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto w-full">
          <SwipeToast
            inline
            title={t.title}
            description={t.description}
            color="#f5f5f5"
            {...COLORES[t.tipo]}
            duration={t.tipo === "error" ? 5000 : 3000}
            closeButton
            onClose={() => dismissToast(t.id)}
          />
        </div>
      ))}
    </div>
  );
}
