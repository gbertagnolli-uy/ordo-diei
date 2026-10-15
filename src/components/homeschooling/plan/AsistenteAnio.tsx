"use client";

// Propio de Ordo (lane 197, C9): «Configurar el año». En un solo lugar: los tres trimestres del boletín, las vacaciones (con un atajo
// para las de invierno) y las fiestas de primera clase que caen entre semana, que se pueden marcar como días sin clase de todos los
// hijos a la vez. Al terminar se reparte de nuevo cada plan. Homeschool Planet lo llama «asistente de setup guiado».
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCog, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { esDiaHabil } from "@/lib/homeschooling/anioEscolar";
import type { Festividad } from "@/lib/homeschooling/festividades";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

type Rango = { motivo: string; desde: string; hasta: string };
const FECHA = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));

export default function AsistenteAnio({ alumnos, festividades, anio }: { alumnos: { id: number; nombre: string }[]; festividades: Festividad[]; anio: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [hijos, setHijos] = useState<number[]>(alumnos.map((a) => a.id));
  const [rangos, setRangos] = useState<Rango[]>([]);
  // Fiestas de primera clase de ese año que caen de lunes a viernes
  const fiestas = festividades.filter((x) => x.mayor && x.fecha.startsWith(String(anio)) && esDiaHabil(x.fecha));
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const alternar = <T,>(lista: T[], x: T) => (lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x]);

  const aplicar = async () => {
    setOcupado(true);
    try {
      const r = await api<{ dias: number; planesRepartidos: number }>("/api/homeschooling/anio", {
        method: "POST",
        body: { alumnoIds: hijos, vacaciones: rangos.filter((x) => x.desde && x.hasta), fiestas: fiestas.filter((x) => marcadas.includes(x.fecha)).map((x) => ({ fecha: x.fecha, motivo: x.titulo })) },
      });
      toast.success(`${r.dias} días sin clase marcados${r.planesRepartidos > 0 ? " y los planes se repartieron de nuevo" : ""}`);
      setAbierto(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo configurar el año");
    } finally {
      setOcupado(false);
    }
  };

  const hayAlgo = rangos.some((r) => r.desde && r.hasta && r.motivo.trim()) || marcadas.length > 0;

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <CalendarCog /> Configurar el año
      </Button>
      <Dialog open={abierto} onOpenChange={(o) => !ocupado && setAbierto(o)}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar el año {anio}</DialogTitle>
            <DialogDescription>Marcá de una vez las vacaciones y las fiestas en que no hay clase. Los planes de cada hijo se vuelven a repartir sin esos días.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <fieldset className="space-y-1.5">
              <legend className="mb-1 text-sm font-semibold text-foreground">1. ¿Para quiénes?</legend>
              <div className="flex flex-wrap gap-3 text-sm">
                {alumnos.map((a) => (
                  <label key={a.id} className="flex items-center gap-1.5">
                    <input type="checkbox" checked={hijos.includes(a.id)} onChange={() => setHijos((h) => alternar(h, a.id))} className="size-4 accent-primary" /> {a.nombre}
                  </label>
                ))}
              </div>
            </fieldset>

            <section className="space-y-2" aria-label="Vacaciones">
              <h3 className="text-sm font-semibold text-foreground">2. Vacaciones</h3>
              {rangos.map((r, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-lg border p-2 sm:grid-cols-[1fr_9rem_9rem_auto]">
                  <Input aria-label="Nombre" value={r.motivo} maxLength={80} onChange={(e) => setRangos((x) => x.map((y, k) => (k === i ? { ...y, motivo: e.target.value } : y)))} placeholder="Vacaciones de invierno" className="col-span-2 sm:col-span-1" />
                  <Input aria-label="Desde" type="date" value={r.desde} onChange={(e) => setRangos((x) => x.map((y, k) => (k === i ? { ...y, desde: e.target.value } : y)))} />
                  <Input aria-label="Hasta" type="date" value={r.hasta} onChange={(e) => setRangos((x) => x.map((y, k) => (k === i ? { ...y, hasta: e.target.value } : y)))} />
                  <Button variant="ghost" size="icon-sm" aria-label="Quitar" className="justify-self-end" onClick={() => setRangos((x) => x.filter((_, k) => k !== i))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setRangos((x) => [...x, { motivo: "Vacaciones de invierno", desde: `${anio}-07-06`, hasta: `${anio}-07-17` }])}>
                  <Plus /> Vacaciones de invierno
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRangos((x) => [...x, { motivo: "", desde: "", hasta: "" }])}>
                  <Plus /> Otras
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Se marcan los días de lunes a viernes de cada rango.</p>
            </section>

            <section className="space-y-2" aria-label="Fiestas">
              <h3 className="text-sm font-semibold text-foreground">3. Fiestas de primera clase entre semana</h3>
              {fiestas.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay fiestas de primera clase de lunes a viernes cargadas para {anio}.</p>
              ) : (
                <ul className="grid gap-1 sm:grid-cols-2">
                  {fiestas.map((x) => (
                    <li key={x.fecha}>
                      <label className="flex items-start gap-2 rounded-lg border p-2 text-sm">
                        <input type="checkbox" checked={marcadas.includes(x.fecha)} onChange={() => setMarcadas((m) => alternar(m, x.fecha))} className="mt-0.5 size-4 accent-primary" />
                        <span>
                          <span className="font-medium text-foreground">{x.titulo}</span>
                          <span className="block text-xs text-muted-foreground capitalize">{f(x.fecha)}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)} disabled={ocupado}>
              Cancelar
            </Button>
            <Button onClick={aplicar} disabled={ocupado || hijos.length === 0 || !hayAlgo}>
              {ocupado && <Spinner />} Marcar y repartir de nuevo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
