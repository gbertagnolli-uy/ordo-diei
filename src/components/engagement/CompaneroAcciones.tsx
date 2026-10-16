"use client";

// Acciones del compañero (lane 203): ponerle o cambiarle el nombre y festejar una etapa nueva.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoolMode } from "@/components/ui/cool-mode";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { MAX_NOMBRE } from "@/lib/engagement/companero";
import { toast } from "@/lib/toast";

async function enviar(cuerpo: Record<string, unknown>) {
  const res = await fetch("/api/companero", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "No se pudo guardar");
}

const CONFITES = { particle: "✨", size: 14 };

export function NombrarCompanero({ nombreActual, primeraVez }: { nombreActual: string; primeraVez: boolean }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(primeraVez ? "" : nombreActual);
  const [ocupado, setOcupado] = useState(false);

  async function guardar() {
    setOcupado(true);
    try {
      await enviar({ accion: "nombrar", nombre });
      setAbierto(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {primeraVez ? (
          <Button size="sm">
            <Pencil className="size-4" /> Ponerle nombre
          </Button>
        ) : (
          <Button size="icon-sm" variant="ghost" aria-label="Cambiar el nombre de tu compañero">
            <Pencil className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{primeraVez ? "¿Cómo se va a llamar?" : "Cambiar el nombre"}</DialogTitle>
          <DialogDescription>Es tu compañero: crece cada día que entrás a la app, y nunca se achica.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="nombre-companero">Nombre</FieldLabel>
          <Input id="nombre-companero" maxLength={MAX_NOMBRE} value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && nombre.trim() && !ocupado && guardar()} />
        </Field>
        <DialogFooter>
          <Button disabled={ocupado || !nombre.trim()} onClick={guardar}>
            {ocupado && <Spinner />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FestejarEtapa() {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function festejar() {
    setOcupado(true);
    try {
      await enviar({ accion: "festejar" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      setOcupado(false);
    }
  }

  return (
    <CoolMode options={CONFITES}>
      <Button size="sm" disabled={ocupado} onClick={festejar}>
        {ocupado ? <Spinner /> : <PartyPopper className="size-4" />} ¡Genial!
      </Button>
    </CoolMode>
  );
}
