import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendariumVista } from "@/components/liturgia/CalendariumVista";

export const metadata = {
  title: "Calendarium · Calendario litúrgico | Ordo Diei",
  description: "Calendario litúrgico católico tradicional según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Pantalla Calendarium (SPEC liturgia §10.1).
 * Suspense es obligatorio porque `CalendariumVista` usa `useParametrosLiturgia` (`useSearchParams`).
 */
export default function CalendariumPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-8 h-48 rounded-xl" />
            <Skeleton className="lg:col-span-4 h-48 rounded-xl" />
          </div>
        </div>
      }
    >
      <CalendariumVista />
    </Suspense>
  );
}
