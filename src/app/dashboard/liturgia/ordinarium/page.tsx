import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrdinariumVista } from "@/components/liturgia/OrdinariumVista";

export const metadata = {
  title: "Ordinarium · Ordo Missæ | Ordo Diei",
  description: "Ordinario de la Misa y Preces comunes según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Pantalla Ordinarium (SPEC liturgia §10.6).
 * Suspense obligatorio porque `OrdinariumVista` usa `useParametrosLiturgia` (`useSearchParams`).
 */
export default function OrdinariumPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
        </div>
      }
    >
      <OrdinariumVista />
    </Suspense>
  );
}
