"use client";

// Acciones del compañero (lanes 203 y 220): elegir quién lo acompaña, ponerle nombre y festejar un nivel nuevo.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Pencil, UserRoundPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CoolMode } from "@/components/ui/cool-mode";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ImagenConRespaldo } from "@/components/engagement/ImagenConRespaldo";
import { rutaDePose } from "@/components/engagement/EscenaCompanero";
import { MAX_NOMBRE, PERSONAJES_ELEGIBLES, personajeGuardado, type Personaje } from "@/lib/engagement/companero";
import { toast } from "@/lib/toast";

export async function enviarCompanero(cuerpo: Record<string, unknown>) {
  const res = await fetch("/api/companero", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "No se pudo guardar");
}

const CONFITES = { particle: "✨", size: 14 };

/** «¿Quién te va a acompañar?»: los héroes y el nombre */
export function ElegirCompanero({ actual, nombreActual, etiqueta }: { actual: Personaje | null; nombreActual?: string; etiqueta: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [elegido, setElegido] = useState<Personaje | null>(personajeGuardado(actual));
  const [nombre, setNombre] = useState(actual ? (nombreActual ?? "") : "");
  const [ocupado, setOcupado] = useState(false);

  function elegir(p: (typeof PERSONAJES_ELEGIBLES)[number]) {
    setElegido(p.clave);
    // El nombre sugerido acompaña al personaje mientras no escriba uno propio
    if (!nombre || PERSONAJES_ELEGIBLES.some((x) => x.nombre === nombre)) setNombre(p.nombre);
  }

  async function guardar() {
    if (!elegido) return;
    setOcupado(true);
    try {
      await enviarCompanero({ accion: "elegir", personaje: elegido, nombre });
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
        <Button size="sm" variant={actual ? "outline" : "default"}>
          <UserRoundPlus className="size-4" /> {etiqueta}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>¿Quién te va a acompañar?</DialogTitle>
          <DialogDescription>Tu compañero te recibe cada día, celebra tus logros y crece con tu nivel. Podés cambiarlo cuando quieras.</DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="Compañero" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PERSONAJES_ELEGIBLES.map((p) => (
            <button
              key={p.clave}
              type="button"
              role="radio"
              aria-checked={elegido === p.clave}
              onClick={() => elegir(p)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
                elegido === p.clave && "border-primary bg-primary/10",
              )}
            >
              <span className="flex aspect-[3/4] w-full items-end justify-center overflow-hidden rounded-md bg-muted/60">
                <ImagenConRespaldo
                  srcs={[rutaDePose(p.clave, "neutral")]}
                  alt=""
                  className="h-full w-auto object-contain"
                  respaldo={<span aria-hidden className="self-center text-5xl">{p.emoji}</span>}
                />
              </span>
              <span className="font-medium">{p.nombre}</span>
              <span className="text-xs">{p.titulo}</span>
              <span className="text-xs text-muted-foreground">{p.descripcion}</span>
            </button>
          ))}
        </div>
        <Field>
          <FieldLabel htmlFor="nombre-companero">Nombre</FieldLabel>
          <Input id="nombre-companero" maxLength={MAX_NOMBRE} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <DialogFooter>
          <Button disabled={ocupado || !elegido || !nombre.trim()} onClick={guardar}>
            {ocupado && <Spinner />} {actual ? "Guardar" : "Quedarme con mi compañero"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NombrarCompanero({ nombreActual }: { nombreActual: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(nombreActual);
  const [ocupado, setOcupado] = useState(false);

  async function guardar() {
    setOcupado(true);
    try {
      await enviarCompanero({ accion: "nombrar", nombre });
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
        <Button size="icon-sm" variant="ghost" aria-label="Cambiar el nombre de tu compañero">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar el nombre</DialogTitle>
          <DialogDescription>Es tu compañero: crece con vos y nunca se achica.</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="nuevo-nombre-companero">Nombre</FieldLabel>
          <Input id="nuevo-nombre-companero" maxLength={MAX_NOMBRE} value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && nombre.trim() && !ocupado && guardar()} />
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

export function FestejarNivel() {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function festejar() {
    setOcupado(true);
    try {
      await enviarCompanero({ accion: "festejar" });
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
