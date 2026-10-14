import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PsalteriumVista } from "@/components/liturgia/PsalteriumVista";

export const metadata = {
  title: "Psalterium · Salterio | Ordo Diei",
  description: "Salterio de 150 Salmos de la Vulgata y Cánticos según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Pantalla Psalterium (SPEC liturgia §10.7).
 * Suspense obligatorio porque `PsalteriumVista` usa `useParametrosLiturgia` (`useSearchParams`).
 */
export default function PsalteriumPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
        </div>
      }
    >
      <PsalteriumVista />
    </Suspense>
  );
}
