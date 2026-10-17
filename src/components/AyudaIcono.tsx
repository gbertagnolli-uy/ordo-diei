"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Icono «?» que abre una explicación corta de un paso, formulario o sección. */
export function AyudaIcono({ titulo, children, className = "" }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={titulo ? `Ayuda: ${titulo}` : "Ayuda"}
          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring ${className}`}
        >
          <CircleHelp className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-1 text-sm" align="start">
        {titulo && <p className="font-medium text-foreground">{titulo}</p>}
        <div className="space-y-1 text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

export default AyudaIcono;
