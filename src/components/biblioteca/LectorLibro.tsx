"use client";
// Portado de vendor/homebranch-web/src/app/routes/dashboard/read-book.tsx (lane 270, fase 2): elige el formato
// (ePub antes que PDF, o el de ?formato=) y abre el lector. ePub: LectorEpub (D4) con la posición de este usuario,
// guardada con PUT …/posicion cada 3 s sin cambios. PDF: <iframe> del navegador en la página guardada; al abrirlo
// queda «leyendo» (el visor del navegador no avisa la página: el resto se marca a mano, D10).
import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LibroDetalle } from "@/lib/biblioteca/servidor";

const LectorEpub = dynamic(() => import("@/components/homeschooling/material/LectorEpub"), { ssr: false });

const ESPERA_MS = 3000;

export function LectorLibro({ libro, formato }: { libro: LibroDetalle; formato?: string | null }) {
  const leibles = libro.archivos.filter((a) => a.formato === "epub" || a.formato === "pdf");
  const archivo = leibles.find((a) => a.formato === formato) ?? leibles.find((a) => a.formato === "epub") ?? leibles[0];
  const pendiente = useRef<{ cfi: string; porcentaje: number } | null>(null);
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
    if (p) void guardar({ cfi: p.cfi, porcentaje: p.porcentaje });
  }, [guardar]);

  const alMoverse = useCallback(
    (cfi: string, porcentaje: number) => {
      // Mientras epub.js no calculó las ubicaciones el porcentaje es 0: se conserva el que ya había.
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="min-h-11">
          <Link href={`/dashboard/biblioteca/libro/${libro.id}`}>
            <ArrowLeft /> Volver
          </Link>
        </Button>
        <h1 className="truncate text-lg font-semibold">{libro.titulo}</h1>
      </div>
      {!archivo ? (
        <p role="alert" className="rounded-xl border p-4 text-sm">
          Este libro no tiene un archivo para leer acá.
        </p>
      ) : archivo.formato === "epub" ? (
        <LectorEpub origen={archivo.url} titulo={libro.titulo} cfiInicial={libro.posicion.cfi} onPosicion={alMoverse} />
      ) : (
        <iframe
          src={`${archivo.url}${libro.posicion.pagina ? `#page=${libro.posicion.pagina}` : ""}`}
          title={`Libro: ${libro.titulo}`}
          className="h-[80svh] w-full rounded-xl border bg-white"
        />
      )}
    </div>
  );
}
