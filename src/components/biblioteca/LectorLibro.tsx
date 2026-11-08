"use client";
// Portado de vendor/homebranch-web/src/app/routes/dashboard/read-book.tsx (lane 270, fase 2; corregido en lane 280):
// elige el formato (ePub antes que PDF, o el de ?formato=) y abre el lector. ePub: el lector fullscreen de
// ./lector/LectorEpub, que retoma el CFI de este usuario y lo guarda cada 3 s sin cambios. PDF: visor del navegador
// en pantalla completa en la página guardada; al abrirlo queda «leyendo» (el visor no avisa la página, D10).
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LibroDetalle } from "@/lib/biblioteca/servidor";
import LectorEpub from "./lector/LectorEpub";

const ESPERA_MS = 3000;

export function LectorLibro({ libro, formato }: { libro: LibroDetalle; formato?: string | null }) {
  const router = useRouter();
  const leibles = libro.archivos.filter((a) => a.formato === "epub" || a.formato === "pdf");
  const archivo = leibles.find((a) => a.formato === formato) ?? leibles.find((a) => a.formato === "epub") ?? leibles[0];
  const pendiente = useRef<{ cfi: string | null; porcentaje: number } | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guardar = useCallback(
    (cuerpo: Record<string, unknown>) =>
      fetch(`/api/biblioteca/libros/${libro.id}/posicion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivoId: archivo?.id, ...cuerpo }),
        keepalive: true,
      }).catch(() => {}),
    [libro.id, archivo?.id],
  );

  const vaciar = useCallback(() => {
    if (reloj.current) clearTimeout(reloj.current);
    reloj.current = null;
    const p = pendiente.current;
    pendiente.current = null;
    if (p) void guardar(p.cfi ? { cfi: p.cfi, porcentaje: p.porcentaje } : { porcentaje: p.porcentaje });
  }, [guardar]);

  const alMoverse = useCallback(
    (cfi: string | null, porcentaje: number) => {
      // Mientras el motor no calculó el porcentaje llega 0: se conserva el que ya había.
      pendiente.current = { cfi, porcentaje: porcentaje > 0 ? porcentaje : libro.porcentaje };
      if (reloj.current) clearTimeout(reloj.current);
      reloj.current = setTimeout(vaciar, ESPERA_MS);
    },
    [vaciar, libro.porcentaje],
  );

  // Al salir (o al cerrar la pestaña) se guarda lo que falte.
  useEffect(() => {
    window.addEventListener("pagehide", vaciar);
    return () => {
      window.removeEventListener("pagehide", vaciar);
      vaciar();
    };
  }, [vaciar]);

  // PDF: abrirlo cuenta como empezar a leer.
  useEffect(() => {
    if (archivo?.formato === "pdf" && libro.estado === "sin_empezar") void guardar({ porcentaje: 1 });
  }, [archivo?.formato, libro.estado, guardar]);

  if (!archivo) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p role="alert" className="max-w-sm text-sm text-muted-foreground">
          Este libro no tiene un archivo para leer acá.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft /> Volver
        </Button>
      </div>
    );
  }

  if (archivo.formato === "epub") {
    return (
      <LectorEpub
        origen={archivo.url}
        titulo={libro.titulo}
        cfiInicial={libro.posicion.cfi}
        onPosicion={alMoverse}
        onCerrar={() => router.back()}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      <div className="flex items-center gap-2 border-b p-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} aria-label="Volver a la biblioteca">
          <ArrowLeft /> Volver
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{libro.titulo}</p>
      </div>
      <iframe
        src={`${archivo.url}${libro.posicion.pagina ? `#page=${libro.posicion.pagina}` : ""}`}
        title={`Libro: ${libro.titulo}`}
        className="min-h-0 w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
