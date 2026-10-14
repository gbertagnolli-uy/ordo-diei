import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BreviariumVista } from "@/components/liturgia/BreviariumVista";

export const metadata = {
  title: "Breviarium · Liturgia Horarum | Ordo Diei",
  description: "Oficio Divino tradicional según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Pantalla Breviarium (SPEC liturgia §10.2).
 * Suspense es obligatorio porque `BreviariumVista` usa `useParametrosLiturgia` (`useSearchParams`).
 */
export default function BreviariumPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
        </div>
      }
    >
      <BreviariumVista />
    </Suspense>
  );
}
