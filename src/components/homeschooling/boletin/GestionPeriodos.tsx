"use client";

// Propio de Ordo (lane 182, K2): los períodos de calificación de la casa — crear los tres trimestres de un año con un clic, agregar
// uno propio (un semestre, un bimestre) y borrar los que sobran.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { AyudaIcono } from "@/components/AyudaIcono";
import { AdminItem } from "@/components/AdminItem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { Periodo } from "@/lib/homeschooling/servidor/boletin";
import { toast } from "@/lib/toast";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));

export default function GestionPeriodos({ periodos, anio }: { periodos: Periodo[]; anio: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [nombre, setNombre] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const correr = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true);
    try {
      await fn();
      toast.success(ok);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <CalendarRange /> Períodos
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">Períodos de calificación <AyudaIcono titulo="Períodos"><p>Son los cortes del año para armar el boletín (trimestres, semestres…). Creá los tres trimestres con un clic o agregá uno propio; deslizá un período para editarlo o borrarlo.</p></AyudaIcono></DialogTitle>
            <DialogDescription>Los cortes del año para armar el boletín: trimestres, semestres, lo que use la casa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button className="w-full" disabled={ocupado} onClick={() => correr(() => api("/api/homeschooling/periodos", { method: "POST", body: { anio } }), "Trimestres creados")}>
              {ocupado && <Spinner />} Crear los tres trimestres de {anio}
            </Button>

            {periodos.length > 0 && (
              <ul className="divide-y rounded-xl border">
                {periodos.map((p) => (
                  <li key={p.id}>
                    <AdminItem
                      enabled
                      nombre={`el período «${p.nombre}»`}
                      aviso="Se pierde también el comentario de sus boletines."
                      onEdit={() => {
                        setEditandoId(p.id);
                        setNombre(p.nombre);
                        setInicio(p.inicio);
                        setFin(p.fin);
                      }}
                      onDelete={async () => {
                        await api(`/api/homeschooling/periodos/${p.id}`, { method: "DELETE" });
                        toast.success("Período borrado");
                        router.refresh();
                      }}
                    >
                      <div className="px-3 py-2 text-sm">
                        <span className="block truncate font-medium text-foreground">{p.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {f(p.inicio)} → {f(p.fin)}
                        </span>
                      </div>
                    </AdminItem>
                  </li>
                ))}
              </ul>
            )}

            <form
              className="space-y-3 rounded-xl border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void correr(async () => {
                  const cuerpo = { nombre: nombre.trim(), inicio, fin };
                  if (editandoId) await api(`/api/homeschooling/periodos/${editandoId}`, { method: "PATCH", body: cuerpo });
                  else await api("/api/homeschooling/periodos", { method: "POST", body: cuerpo });
                  setEditandoId(null);
                  setNombre("");
                  setInicio("");
                  setFin("");
                }, editandoId ? "Período actualizado" : "Período creado");
              }}
            >
              <p className="text-sm font-medium text-foreground">{editandoId ? "Editar período" : "Agregar uno propio"}</p>
              <div className="space-y-1.5">
                <Label htmlFor="per-nombre">Nombre</Label>
                <Input id="per-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} placeholder="Primer semestre" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="per-inicio">Desde</Label>
                  <Input id="per-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="per-fin">Hasta</Label>
                  <Input id="per-fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
                </div>
              </div>
              <Button type="submit" variant="outline" disabled={ocupado || !nombre.trim() || !inicio || !fin}>
                {editandoId ? "Guardar cambios" : "Agregar período"}
              </Button>
              {editandoId && (
                <Button type="button" variant="ghost" className="ml-2" onClick={() => { setEditandoId(null); setNombre(""); setInicio(""); setFin(""); }}>
                  Cancelar
                </Button>
              )}
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
