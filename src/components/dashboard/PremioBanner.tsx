"use client";

// Aviso de premio sorpresa de comportamiento: misma barra que los avisos de NoticeBar (Happy Hour, etc.).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PremioBanner({ cantidad }: { cantidad: number }) {
  const pathname = usePathname();
  if (!cantidad || pathname === "/dashboard/mis-premios") return null;

  return (
    <div
      id="premio-banner"
      role="status"
      className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[color-mix(in_srgb,var(--secondary)_25%,transparent)] bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] px-4 py-2 text-center text-sm font-medium text-[var(--secondary)]"
    >
      <span>
        🎁 {cantidad === 1 ? "¡Te ganaste un premio sorpresa!" : `¡Te ganaste ${cantidad} premios sorpresa!`} Andá a reclamarlo.
      </span>
      <Button asChild size="sm" className="h-7">
        <Link href="/dashboard/mis-premios">Reclamar premio</Link>
      </Button>
    </div>
  );
}
