import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MissaleVista } from "@/components/liturgia/MissaleVista";

export const metadata = {
  title: "Missale · Sancta Missa | Ordo Diei",
  description: "Misa tradicional según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Pantalla Missale (SPEC liturgia §10.3).
 * Requiere Suspense porque MissaleVista utiliza `useParametrosLiturgia` (`useSearchParams`).
 */
export default function MissalePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
        </div>
      }
    >
      <MissaleVista />
    </Suspense>
  );
}
