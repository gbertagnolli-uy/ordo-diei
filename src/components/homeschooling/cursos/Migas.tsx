"use client";

// Propio de Ordo: migas de pan de la materia — Estudio › Materia › Curso › Lección. Cada nivel anterior es un enlace; el
// último es la pantalla actual. (La navegación dentro de la materia es por ?module=&lesson=, como Roost.)

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Miga = { etiqueta: string; href?: string; onClick?: () => void };

export default function Migas({ items }: { items: Miga[] }) {
  return (
    <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1 px-4 pt-3 text-sm sm:px-6">
      {items.map((m, i) => {
        const ultima = i === items.length - 1;
        return (
          <span key={`${i}-${m.etiqueta}`} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />}
            {ultima || (!m.href && !m.onClick) ? (
              <span aria-current={ultima ? "page" : undefined} className="max-w-56 truncate font-medium text-foreground">
                {m.etiqueta}
              </span>
            ) : m.href ? (
              <Link href={m.href} className="max-w-56 truncate text-muted-foreground hover:text-foreground hover:underline">
                {m.etiqueta}
              </Link>
            ) : (
              <button type="button" onClick={m.onClick} className="max-w-56 truncate text-muted-foreground hover:text-foreground hover:underline">
                {m.etiqueta}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
