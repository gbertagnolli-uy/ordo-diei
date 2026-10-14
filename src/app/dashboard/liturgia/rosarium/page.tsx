import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RosariumVista } from "@/components/liturgia/RosariumVista";

export const metadata = {
  title: "Rosarium · Mysteria Rosarii | Ordo Diei",
  description: "Santo Rosario tradicional preconciliar: misterios del día, 15 misterios y devocionario bilingüe.",
};

/**
 * Pantalla Rosarium (SPEC liturgia §10.8).
 * Requiere Suspense porque RosariumVista utiliza `useParametrosLiturgia` (`useSearchParams`).
 */
export default function RosariumPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[20rem] w-full rounded-2xl" />
          <Skeleton className="h-[16rem] w-full rounded-xl" />
        </div>
      }
    >
      <RosariumVista />
    </Suspense>
  );
}
