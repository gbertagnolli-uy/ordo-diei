"use client";

// Propio de Ordo (lane 166, M1): tareas del día sin curso (una lectura, una hoja, un video) con su «Hecho».
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import { toast } from "@/lib/toast";
import MaterialesDelDia from "./MaterialesDelDia";

export default function MaterialSuelto({ materiales }: { materiales: MaterialVista[] }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<number | null>(null);
  if (materiales.length === 0) return null;

  const alternar = async (m: MaterialVista) => {
    setOcupado(m.id);
    try {
      await api(`/api/homeschooling/materiales/${m.id}/hecho`, { method: "POST", body: { hecho: !m.hecho } });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section aria-label="Para hoy" className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">Para hoy</h2>
      {materiales.map((m) => (
        <div key={m.id} className="space-y-2">
          <MaterialesDelDia materiales={[m]} titulo={""} />
          <Button variant={m.hecho ? "secondary" : "default"} size="lg" className="w-full" disabled={ocupado === m.id} onClick={() => alternar(m)}>
            {m.hecho ? <CheckCircle2 /> : <Circle />} {m.hecho ? "Hecho (tocá para deshacer)" : "Terminé"}
          </Button>
        </div>
      ))}
    </section>
  );
}
