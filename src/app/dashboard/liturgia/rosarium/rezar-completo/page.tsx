import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RosariumRezarVista } from "@/components/liturgia/RosariumRezarVista";

export const metadata = {
  title: "Rezar los 15 Misterios Completos · Rosarium Integrum | Ordo Diei",
  description: "Guía paso a paso para rezar los 15 misterios completos del Santo Rosario tradicional con imágenes de las cartas, oraciones en orden y pantalla completa.",
};

export default function RosariumRezarCompletoPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-[24rem] w-full rounded-2xl" />
          <Skeleton className="h-[20rem] w-full rounded-xl" />
        </div>
      }
    >
      <RosariumRezarVista modo="completo" />
    </Suspense>
  );
}
