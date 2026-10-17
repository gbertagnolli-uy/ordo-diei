"use client";

// Formulario para que un padre o madre fije (o corrija) la meta de la semana en familia (lane 202).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { MAX_OBJETIVO, MAX_PREMIO } from "@/lib/engagement/meta";
import { toast } from "@/lib/toast";

export function FijarMeta({ sugerido, premioActual, editar }: { sugerido: number; premioActual?: string; editar: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [objetivo, setObjetivo] = useState(String(sugerido));
  const [premio, setPremio] = useState(premioActual ?? "");
  const [ocupado, setOcupado] = useState(false);

  async function guardar() {
    setOcupado(true);
    try {
      const res = await fetch("/api/meta-semanal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objetivo: Number(objetivo), premio }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar la meta");
      toast.success("Meta de la semana guardada");
      setAbierto(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la meta");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button size="sm" variant={editar ? "ghost" : "default"}>
          <Target className="size-4" /> {editar ? "Cambiar" : "Fijar la meta"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meta de la semana en familia</DialogTitle>
          <DialogDescription>Entre todos los chicos suman tareas aprobadas y hábitos hechos. Si llegan, cada uno recibe un vale.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="meta-objetivo">¿Cuántos logros entre todos?</FieldLabel>
            <Input id="meta-objetivo" type="number" inputMode="numeric" min={1} max={MAX_OBJETIVO} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
            <FieldDescription>Te sugerimos {sugerido}, según cómo les fue la semana pasada.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="meta-premio">Premio para cada uno: «Vale por…»</FieldLabel>
            <Input id="meta-premio" maxLength={MAX_PREMIO} placeholder="una noche de pizza y película" value={premio} onChange={(e) => setPremio(e.target.value)} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button disabled={ocupado || !premio.trim() || !objetivo} onClick={guardar}>
            {ocupado && <Spinner />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
