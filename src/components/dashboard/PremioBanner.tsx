"use client";

// Avisos de premios por reclamar: misma barra que los de NoticeBar (Happy Hour, etc.).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const BARRA =
  "flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-[color-mix(in_srgb,var(--secondary)_25%,transparent)] bg-[color-mix(in_srgb,var(--secondary)_10%,transparent)] px-4 py-2 text-center text-sm font-medium text-[var(--secondary)]";

export function PremioBanner({ cantidad, reconocimientos = 0 }: { cantidad: number; reconocimientos?: number }) {
  const pathname = usePathname();
  if (pathname === "/dashboard/mis-premios") return null;

  return (
    <>
      {reconocimientos > 0 && (
        <div id="reconocimiento-banner" role="status" className={BARRA}>
          <span>
            🏅 {reconocimientos === 1 ? "¡Ganaste un reconocimiento!" : `¡Ganaste ${reconocimientos} reconocimientos!`} Andá a reclamarlo.
          </span>
          <Button asChild size="sm" className="h-7">
            <Link href="/dashboard/mis-premios">Reclamar reconocimiento</Link>
          </Button>
        </div>
      )}
      {cantidad > 0 && (
        <div id="premio-banner" role="status" className={BARRA}>
          <span>
            🎁 {cantidad === 1 ? "¡Te ganaste un premio sorpresa!" : `¡Te ganaste ${cantidad} premios sorpresa!`} Andá a reclamarlo.
          </span>
          <Button asChild size="sm" className="h-7">
            <Link href="/dashboard/mis-premios">Reclamar premio</Link>
          </Button>
        </div>
      )}
    </>
  );
}
