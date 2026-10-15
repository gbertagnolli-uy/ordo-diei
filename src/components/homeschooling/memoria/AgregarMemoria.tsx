"use client";

// Propio de Ordo (lane 176, L2): agregar a la memoria de uno o varios hijos —del catálogo católico de la casa, con un toque por
// oración— o un texto propio (un poema, un salmo, lo que pide la clase).
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { porCategoria } from "@/lib/homeschooling/catolico";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

const GRUPOS = porCategoria();

export default function AgregarMemoria({ open, alumnos, alumnoInicial, tienen, onClose, onGuardado }: { open: boolean; alumnos: { id: number; nombre: string }[]; alumnoInicial: number; tienen: string[]; onClose: () => void; onGuardado: () => void }) {
  const [paraQuien, setParaQuien] = useState<number[]>([alumnoInicial]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);

  const alternar = (c: string) => setElegidas((e) => (e.includes(c) ? e.filter((x) => x !== c) : [...e, c]));
  const alternarHijo = (id: number) => setParaQuien((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const guardar = async (cuerpo: object, mensaje: string) => {
    setGuardando(true);
    try {
      await api("/api/homeschooling/memoria", { method: "POST", body: cuerpo });
      toast.success(mensaje);
      setElegidas([]);
      setTitulo("");
      setTexto("");
      onGuardado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const cuadroHijos = alumnos.length > 1 && (
    <fieldset className="flex flex-wrap items-center gap-3 text-sm">
      <legend className="sr-only">Para quién</legend>
      <span className="text-muted-foreground">Para:</span>
      {alumnos.map((a) => (
        <label key={a.id} className="flex items-center gap-1.5">
          <input type="checkbox" checked={paraQuien.includes(a.id)} onChange={() => alternarHijo(a.id)} className="size-4 accent-primary" /> {a.nombre}
        </label>
      ))}
    </fieldset>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar a la memoria</DialogTitle>
          <DialogDescription>Para aprender de memoria y recitar frente a mamá o papá.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="catalogo">
          <TabsList>
            <TabsTrigger value="catalogo">Del catálogo</TabsTrigger>
            <TabsTrigger value="propio">Un texto propio</TabsTrigger>
          </TabsList>
          <TabsContent value="catalogo" className="space-y-4 pt-2">
            {cuadroHijos}
            {GRUPOS.map((g) => (
              <section key={g.categoria} aria-label={g.etiqueta} className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">{g.etiqueta}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((i) => {
                    const ya = tienen.includes(i.clave);
                    const on = elegidas.includes(i.clave);
                    return (
                      <button
                        key={i.clave}
                        type="button"
                        disabled={ya}
                        aria-pressed={on}
                        onClick={() => alternar(i.clave)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"}`}
                      >
                        {i.titulo}
                        {ya ? " ✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={guardando}>
                Cerrar
              </Button>
              <Button disabled={guardando || elegidas.length === 0 || paraQuien.length === 0} onClick={() => guardar({ alumnoIds: paraQuien, claves: elegidas }, `${elegidas.length} agregada${elegidas.length === 1 ? "" : "s"}`)}>
                {guardando && <Spinner />} Agregar {elegidas.length > 0 ? `(${elegidas.length})` : ""}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="propio" className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="mem-titulo">Título</Label>
              <Input id="mem-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150} placeholder="Salmo 23" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mem-texto">Texto</Label>
              <Textarea id="mem-texto" rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={5000} placeholder="Una línea por verso o por elemento" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={guardando}>
                Cerrar
              </Button>
              <Button disabled={guardando || !titulo.trim() || texto.trim().length < 5} onClick={() => guardar({ alumnoId: paraQuien[0] ?? alumnoInicial, titulo: titulo.trim(), texto }, "Texto agregado")}>
                {guardando && <Spinner />} Agregar
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
