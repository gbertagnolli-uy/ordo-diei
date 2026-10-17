"use client";

// Propio de Ordo: tarjeta de una historia social que los padres le mostraron hoy (arriba de «Hoy aprendo»).

import { BookOpenText } from "lucide-react";
import type { HistoriaVista } from "@/lib/homeschooling/servidor/neuro";

export default function HistoriaCard({ historia, onClick }: { historia: HistoriaVista; onClick: (h: HistoriaVista) => void }) {
  return (
    <button type="button" onClick={() => onClick(historia)} className="flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <BookOpenText className="size-7" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground">Una historia para vos</span>
        <span className="block truncate text-lg font-semibold text-foreground">{historia.titulo}</span>
      </span>
    </button>
  );
}
