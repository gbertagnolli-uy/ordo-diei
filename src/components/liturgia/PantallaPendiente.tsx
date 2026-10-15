import type { LucideIcon } from "lucide-react";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

/**
 * Marcador de las pantallas de liturgia que todavía no se implementaron (L4–L9). Cada lane lo
 * reemplaza por su pantalla; no se deja al lado de la pantalla real.
 */
export function PantallaPendiente({ titulo, castellano, icono: Icono }: { titulo: string; castellano: string; icono: LucideIcon }) {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{castellano}</p>
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icono />
          </EmptyMedia>
          <EmptyTitle>Próximamente</EmptyTitle>
          <EmptyDescription>Esta pantalla de la liturgia todavía se está preparando.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
