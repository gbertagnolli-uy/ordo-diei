import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { BreviariumVista } from "@/components/liturgia/BreviariumVista";
import { esHora } from "@/lib/liturgia/tipos";
import type { Hora } from "@/lib/liturgia/tipos";

export const metadata = {
  title: "Breviarium · Liturgia Horarum | Ordo Diei",
  description: "Oficio Divino tradicional según Divinum Officium (Tridentine 1906, 1888, 1570).",
};

/**
 * Lector de una Hora canónica específica (SPEC liturgia §10.2).
 * `/dashboard/liturgia/breviarium/[hora]?fecha=&version=`
 */
export default async function BreviariumHoraPage({
  params,
}: {
  params: Promise<{ hora: string }>;
}) {
  const { hora } = await params;
  if (!esHora(hora)) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
        </div>
      }
    >
      <BreviariumVista horaInicial={hora as Hora} />
    </Suspense>
  );
}
