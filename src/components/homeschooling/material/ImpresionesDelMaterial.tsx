"use client";

// Propio de Ordo (lane 168, P1): lo que imprimió cada hijo de un material y el botón para darle una impresión más.
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { ResumenImpresion } from "@/lib/homeschooling/servidor/impresiones";
import { toast } from "@/lib/toast";

const HORA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function ImpresionesDelMaterial({ materialId }: { materialId: number }) {
  const [filas, setFilas] = useState<ResumenImpresion[] | null>(null);
  const [abierto, setAbierto] = useState(false);

  const cargar = async () => {
    try {
      setFilas(await api<ResumenImpresion[]>(`/api/homeschooling/materiales/${materialId}/impresiones`));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar");
    }
  };

  const darUna = async (alumnoId: number) => {
    try {
      await api(`/api/homeschooling/materiales/${materialId}/impresiones`, { method: "POST", body: { alumnoId } });
      toast.success("Le diste una impresión más");
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo dar");
    }
  };

  return (
    <div className="pl-7 text-xs">
      <button
        type="button"
        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
        onClick={() => {
          setAbierto((a) => !a);
          if (!abierto) void cargar();
        }}
      >
        {abierto ? "Ocultar impresiones" : "Ver impresiones"}
      </button>
      {abierto && (
        <ul className="mt-1.5 space-y-1">
          {filas === null ? (
            <li className="text-muted-foreground">Cargando…</li>
          ) : filas.length === 0 ? (
            <li className="text-muted-foreground">Nadie lo imprimió todavía.</li>
          ) : (
            filas.map((f) => (
              <li key={f.alumnoId} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-foreground">
                  {f.nombre}: {f.usadas} de {f.permitidas}
                  {f.ultima && <span className="text-muted-foreground"> · última {HORA.format(new Date(f.ultima))}</span>}
                </span>
                <Button variant="outline" size="xs" onClick={() => darUna(f.alumnoId)}>
                  <Plus /> 1 más
                </Button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
