"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModalAperturaSobre, type ResultadoCompraSobre } from "@/components/cartas/ModalAperturaSobre";
import { toast } from "@/lib/toast";

export type CuerpoReclamo =
  | { tipo: "fiesta" | "grado"; cartaId: number }
  | { tipo: "cumple"; cartaId?: number }
  | { tipo: "bienvenida" };

const TITULOS: Record<CuerpoReclamo["tipo"], string> = {
  fiesta: "Regalo de la fiesta",
  grado: "Carta reclamada",
  cumple: "Regalo de cumpleaños",
  bienvenida: "Regalo de bienvenida",
};

/** Clave estable de un reclamo, para saber cuál botón está esperando respuesta */
export function claveReclamo(cuerpo: CuerpoReclamo): string {
  return "cartaId" in cuerpo ? `${cuerpo.tipo}-${cuerpo.cartaId ?? ""}` : cuerpo.tipo;
}

/**
 * Reclama un regalo o un grado (POST /api/cartas/reclamar) y muestra el resultado con el
 * modal de apertura. `modal` se renderiza una vez en el componente que usa el hook.
 */
export function useReclamoCarta(onExito?: () => void) {
  const router = useRouter();
  const [reclamando, setReclamando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoCompraSobre | null>(null);

  const reclamar = async (cuerpo: CuerpoReclamo) => {
    setReclamando(claveReclamo(cuerpo));
    try {
      const res = await fetch("/api/cartas/reclamar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo reclamar");

      setResultado({
        nombreSobre: data.sobre ?? TITULOS[cuerpo.tipo],
        nuevoSaldoPuntos: 0,
        nuevoSaldoIncienso: 0,
        mostrarSaldos: false,
        totalInciensoGanado: data.totalInciensoGanado ?? data.inciensoGanado ?? 0,
        cartasAfectadas: data.cartasAfectadas ?? [],
      });
      router.refresh(); // aviso de la barra lateral
      onExito?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setReclamando(null);
    }
  };

  const modal = (
    <ModalAperturaSobre
      open={resultado !== null}
      onOpenChange={(abierto) => !abierto && setResultado(null)}
      resultado={resultado}
    />
  );

  return { reclamar, reclamando, modal };
}
