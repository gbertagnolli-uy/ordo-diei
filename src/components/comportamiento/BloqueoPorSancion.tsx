// Aviso de sanción (vault/LANE_200_SANCION_Y_ENGAGEMENT.md): reemplaza la tienda o las cartas durante
// el día de una sanción, y avisa en el resto de la app que lo ganado hoy vale la mitad.
import Link from "next/link";
import { Ban, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { PageHeader } from "@/components/app/PageHeader";
import { AVISO_MITAD, MENSAJE_BLOQUEO, type Bloqueo } from "@/lib/comportamiento/sancion";

const CABECERA = { tienda: "Tienda", cartas: "Cartas", cofre: "Cofre" } as const;

/** Página completa: la sección queda deshabilitada hasta mañana */
export function BloqueoPorSancion({ que }: { que: Exclude<Bloqueo, "cofre"> }) {
  const m = MENSAJE_BLOQUEO[que];
  return (
    <div className="flex flex-col">
      <PageHeader group="Rutina" title={CABECERA[que]} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6">
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ban className="size-5 text-destructive" />
            </EmptyMedia>
            <EmptyTitle>{m.titulo}</EmptyTitle>
            <EmptyDescription>{m.texto}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href="/dashboard">Volver al inicio</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    </div>
  );
}

/** Franja chica para «Mis premios»: hoy todo lo que se gana vale la mitad */
export function AvisoMitadHoy() {
  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>Hoy tenés una sanción</AlertTitle>
      <AlertDescription>{AVISO_MITAD} La tienda y las cartas vuelven mañana.</AlertDescription>
    </Alert>
  );
}
