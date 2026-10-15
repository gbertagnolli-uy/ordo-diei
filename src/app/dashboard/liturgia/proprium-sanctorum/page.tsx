import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PropriumSanctorumVista } from "@/components/liturgia/PropriumSanctorumVista";

export const metadata = {
  title: "Proprium Sanctorum · Kalendarium | Ordo Diei",
  description: "Propio de los Santos tradicional según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Pantalla Proprium Sanctorum (SPEC liturgia §10.5).
 * Suspense obligatorio porque `PropriumSanctorumVista` usa `useParametrosLiturgia` (`useSearchParams`).
 */
export default function PropriumSanctorumPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
        </div>
      }
    >
      <PropriumSanctorumVista />
    </Suspense>
  );
}
