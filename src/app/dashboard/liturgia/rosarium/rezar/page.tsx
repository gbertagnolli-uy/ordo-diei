import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RosariumRezarVista } from "@/components/liturgia/RosariumRezarVista";

export const metadata = {
  title: "Rezar el Santo Rosario del Día · Rosarium | Ordo Diei",
  description: "Guía paso a paso para rezar el Santo Rosario del día con las oraciones tradicionales en orden, imágenes de los misterios y modo contemplativo en pantalla completa.",
};

export default function RosariumRezarDiaPage() {
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
      <RosariumRezarVista modo="dia" />
    </Suspense>
  );
}
