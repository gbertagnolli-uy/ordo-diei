import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PropriumDeTemporeVista } from "@/components/liturgia/PropriumDeTemporeVista";

export const metadata = {
  title: "Proprium de Tempore · Liturgia | Ordo Diei",
  description: "Propio del Tiempo tradicional según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Pantalla Proprium de Tempore (SPEC liturgia §10.4).
 * Suspense obligatorio porque `PropriumDeTemporeVista` usa `useParametrosLiturgia` (`useSearchParams`).
 */
export default function PropriumDeTemporePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
        </div>
      }
    >
      <PropriumDeTemporeVista />
    </Suspense>
  );
}
