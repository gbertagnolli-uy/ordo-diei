"use client";

// Propio de Ordo (lane 186, V3): si algo falla al cargar una pantalla de Estudio, la cabecera con las pestañas queda a la vista y
// acá aparece un mensaje claro con «Volver a intentar» en vez de la pantalla de error genérica. (Next 16: `unstable_retry`.)
import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorEstudio({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error("[Estudio]", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-md flex-col items-center gap-4 p-8 text-center" role="alert">
      <TriangleAlert className="size-10 text-warning" />
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">No se pudo cargar esta pantalla</h1>
        <p className="text-sm text-muted-foreground">Puede ser un corte de internet o un problema pasajero. Tus datos están a salvo.</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => unstable_retry()}>Volver a intentar</Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/homeschooling">Ir al inicio de Estudio</Link>
        </Button>
      </div>
    </div>
  );
}
