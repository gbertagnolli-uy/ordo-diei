"use client";
// Diario (lane 293): lo que otra app compartió con Ordo Diei, para agregarlo al diario. Portado de vendor/Daily_You/lib/pages/share_page.dart (Demizo/Daily_You@7cc237d):
// vista previa de lo compartido, elegir el día y, si ese día ya tiene una entrada, elegir entre agregarlo a ella o crear una nueva.
// Va por el `share_target` del manifiesto (solo texto y enlace: ver «Fuera de esta lane» en la lane 293).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookHeart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { agregarADocumento, diaValido, docDeCompartido, hayCompartido, vistaPreviaCompartida, type Compartido } from "@/lib/diario/compartido";
import { FECHA_MINIMA, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fechaLarga } from "../estadisticas/controles";

const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const resumen = (e: EntradaVista) => (e.titulo?.trim() || e.texto.replace(/\s+/g, " ").trim()).slice(0, 60);

export function CompartidoVista({ compartido, hoy }: { compartido: Compartido; hoy: string }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoDiario>("personal");
  const [fecha, setFecha] = useState(hoy);
  /** Id de la entrada a la que se agrega, o null = crear una nueva. */
  const [destino, setDestino] = useState<number | null>(null);
  const [delDia, setDelDia] = useState<{ clave: string; entradas: EntradaVista[] } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const valido = diaValido(fecha, hoy);
  const mes = fecha.slice(0, 7);
  const claveDia = `${tipo}-${fecha}`;

  useEffect(() => {
    if (!valido) return;
    let vivo = true;
    fetch(`/api/diario?tipo=${tipo}&mes=${mes}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo ver el diario");
        if (vivo) {
          setDelDia({ clave: claveDia, entradas: (d.entradas as EntradaVista[]).filter((e) => e.fecha === fecha && e.puedoEditar) });
          setDestino(null);
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo ver el diario"));
    return () => {
      vivo = false;
    };
  }, [tipo, mes, fecha, valido, claveDia]);

  const entradas = delDia && delDia.clave === claveDia ? delDia.entradas : null;

  if (!hayCompartido(compartido)) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        <p>No llegó nada para agregar.</p>
        <p className="mt-1">Desde otra app, usá «Compartir» y elegí Ordo Diei (hay que tener la app instalada en el celular).</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/dashboard/diario")}>
          Ir a mi diario
        </Button>
      </div>
    );
  }

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    try {
      const existente = destino !== null ? entradas?.find((e) => e.id === destino) : undefined;
      let r: Response;
      if (existente) {
        // El PATCH reemplaza la entrada: se mandan los datos que no cambian (si no, se borraría el ánimo o las fotos)
        r = await fetch(`/api/diario/${existente.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fecha: existente.fecha,
            hora: existente.hora,
            titulo: existente.titulo,
            animo: existente.animo,
            fotos: existente.fotos,
            // el título compartido va como primera línea de lo que se agrega
            contenido: agregarADocumento(existente, [compartido.titulo, compartido.texto].filter(Boolean).join("\n")),
          }),
        });
      } else {
        r = await fetch("/api/diario", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tipo, fecha, titulo: compartido.titulo, contenido: docDeCompartido(compartido.texto || compartido.titulo || "") }),
        });
      }
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar");
      toast.success(existente ? "Agregado a la entrada" : "Entrada creada");
      router.push(tipo === "personal" ? "/dashboard/diario" : "/dashboard/diario/familia");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border bg-card p-4" aria-label="Lo que se va a agregar">
        {compartido.titulo && <h2 className="mb-1 font-semibold">{compartido.titulo}</h2>}
        {compartido.texto && <p className="text-sm whitespace-pre-line">{vistaPreviaCompartida(compartido)}</p>}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-primary">¿A qué diario?</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={tipo === "personal" ? "default" : "outline"} aria-pressed={tipo === "personal"} onClick={() => setTipo("personal")}>
            <BookHeart /> Mi diario
          </Button>
          <Button type="button" variant={tipo === "familiar" ? "default" : "outline"} aria-pressed={tipo === "familiar"} onClick={() => setTipo("familiar")}>
            <Users /> Diario familiar
          </Button>
        </div>
        {tipo === "familiar" && <p className="text-xs text-muted-foreground">Lo va a ver toda la familia.</p>}
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="dia-compartido" className="text-sm font-semibold text-primary">
          ¿Qué día?
        </Label>
        <div className="flex items-center gap-2">
          <Input id="dia-compartido" type="date" min={FECHA_MINIMA} max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className="max-w-48" />
          <Button type="button" variant="outline" size="sm" disabled={fecha === hoy} onClick={() => setFecha(hoy)}>
            Hoy
          </Button>
        </div>
        {valido ? <p className="text-xs text-muted-foreground">{fechaLarga(fecha)}</p> : <p className="text-xs text-destructive">Elegí un día desde el 2000 hasta hoy.</p>}
      </section>

      {valido && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-primary">¿Dónde va?</h3>
          {entradas === null ? (
            <Spinner />
          ) : (
            <div role="radiogroup" aria-label="Entrada de destino" className="flex flex-col gap-2">
              <Opcion activa={destino === null} onClick={() => setDestino(null)}>
                Una entrada nueva
              </Opcion>
              {entradas.map((e) => (
                <Opcion key={e.id} activa={destino === e.id} onClick={() => setDestino(e.id)}>
                  Agregarlo a la de las {hora(e.hora)}
                  <span className="block truncate text-xs font-normal text-muted-foreground">{resumen(e)}</span>
                </Opcion>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="flex gap-2">
        <Button disabled={!valido || guardando || entradas === null} onClick={() => void guardar()}>
          {guardando ? "Guardando…" : destino !== null ? "Agregar" : "Crear entrada"}
        </Button>
        <Button variant="outline" disabled={guardando} onClick={() => router.push("/dashboard/diario")}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function Opcion({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={activa} onClick={onClick} className={cn("rounded-lg border p-3 text-left text-sm font-medium", activa ? "border-primary bg-primary/10" : "bg-card")}>
      {children}
    </button>
  );
}
