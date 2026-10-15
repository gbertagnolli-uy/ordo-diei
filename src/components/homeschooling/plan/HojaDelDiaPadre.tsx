"use client";

// Propio de Ordo (lane 178, P3): en el día del plan, el padre imprime la hoja sin tope y ve cuántas imprimió el hijo (con «+1 más»).
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";
import BotonHoja from "@/components/homeschooling/hoy/BotonHoja";

export default function HojaDelDiaPadre({ diaId }: { diaId: number }) {
  const [uso, setUso] = useState<{ usadas: number; permitidas: number } | null>(null);
  const leer = useCallback(() => api<{ usadas: number; permitidas: number }>(`/api/homeschooling/dias/${diaId}/hoja`), [diaId]);

  useEffect(() => {
    let vigente = true;
    leer()
      .then((r) => vigente && setUso(r))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [leer]);

  const darUna = async () => {
    try {
      await api(`/api/homeschooling/dias/${diaId}/hoja`, { method: "PUT" });
      toast.success("Le diste una impresión más");
      setUso(await leer());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo dar");
    }
  };

  return (
    <div className="space-y-2">
      <BotonHoja diaId={diaId} restantes={null} esPadre className="w-full" />
      {uso && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          El alumno imprimió la hoja {uso.usadas} de {uso.permitidas} veces.
          <Button variant="outline" size="xs" onClick={darUna}>
            <Plus /> 1 más
          </Button>
        </p>
      )}
    </div>
  );
}
