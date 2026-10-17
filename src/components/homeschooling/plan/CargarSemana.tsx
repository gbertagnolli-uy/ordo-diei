"use client";

// Propio de Ordo (lane 192, A1/A2): «Cargar la semana». El padre escribe, día por día, lo que le toca a un hijo —un enlace de
// YouTube o de Drive, o una tarea corta, uno por línea— y se crea todo de una vez. Es la forma más rápida de dejar la semana lista
// (carga sin fricción). Lo que se escribe queda como borrador si se cierra el diálogo.
import { AyudaIcono } from "@/components/AyudaIcono";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/homeschooling/roost/services/http";
import { diasDeSemana, etiquetaDia, lunesDe, sumarDias } from "@/lib/homeschooling/semana";
import { useBorrador } from "@/lib/homeschooling/useBorrador";
import { toast } from "@/lib/toast";

const FECHA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });
const f = (c: string) => FECHA.format(new Date(`${c}T00:00:00Z`));

function Formulario({ alumno, lunes, onLunes, onListo }: { alumno: { id: number; nombre: string }; lunes: string; onLunes: (l: string) => void; onListo: () => void }) {
  const router = useRouter();
  const [borrador, setBorrador, borrarBorrador] = useBorrador(`semana-${alumno.id}-${lunes}`);
  const [verFinde, setVerFinde] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const fechas = useMemo(() => diasDeSemana(lunes), [lunes]);
  const dias = verFinde ? fechas : fechas.slice(0, 5);

  const porDia = useMemo(() => {
    try {
      return (borrador ? JSON.parse(borrador) : {}) as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  }, [borrador]);
  const cambiar = (fecha: string, v: string) => setBorrador(JSON.stringify({ ...porDia, [fecha]: v }));
  const total = fechas.reduce((n, d) => n + (porDia[d] ?? "").split("\n").filter((l) => l.trim()).length, 0);

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await api<{ creados: number; dias: number }>("/api/homeschooling/materiales/semana", {
        method: "POST",
        body: { alumnoId: alumno.id, dias: fechas.map((fecha) => ({ fecha, lineas: (porDia[fecha] ?? "").split("\n") })).filter((d) => d.lineas.some((l) => l.trim())) },
      });
      toast.success(`${r.creados} ${r.creados === 1 ? "material cargado" : "materiales cargados"} en ${r.dias} ${r.dias === 1 ? "día" : "días"}`);
      borrarBorrador();
      router.refresh();
      onListo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la semana");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" aria-label="Semana anterior" onClick={() => onLunes(sumarDias(lunes, -7))}>
          <ChevronLeft />
        </Button>
        <p className="min-w-0 flex-1 text-center text-sm font-medium text-foreground">
          Semana del {f(fechas[0])} al {f(fechas[6])}
        </p>
        <Button variant="outline" size="icon-sm" aria-label="Semana siguiente" onClick={() => onLunes(sumarDias(lunes, 7))}>
          <ChevronRight />
        </Button>
      </div>

      <div className="space-y-3">
        {dias.map((fecha) => (
          <div key={fecha} className="space-y-1">
            <Label htmlFor={`sem-${fecha}`} className="capitalize">
              {etiquetaDia(fecha)}
            </Label>
            <Textarea id={`sem-${fecha}`} rows={2} value={porDia[fecha] ?? ""} onChange={(e) => cambiar(fecha, e.target.value)} placeholder="https://youtu.be/…  ·  Hacer la hoja de multiplicar" className="field-sizing-fixed min-w-0 text-sm break-all" />
          </div>
        ))}
        <button type="button" onClick={() => setVerFinde((v) => !v)} className="text-sm text-primary underline underline-offset-2">
          {verFinde ? "Ocultar sábado y domingo" : "Agregar sábado y domingo"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Un material por línea. Los enlaces (YouTube, Drive, Docs, PDF…) se reconocen solos y traen su título; una línea sin enlace es una tarea. Para un texto largo usá «Material para un día».</p>

      <DialogFooter>
        <Button onClick={enviar} disabled={enviando || total === 0}>
          {enviando ? <Spinner /> : <CalendarPlus />} Cargar {total > 0 ? `(${total})` : ""}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function CargarSemana({ alumnos, alumnoId, hoy }: { alumnos: { id: number; nombre: string }[]; alumnoId: number; hoy: string }) {
  const [abierto, setAbierto] = useState(false);
  const [lunes, setLunes] = useState(() => lunesDe(hoy));
  const alumno = alumnos.find((a) => a.id === alumnoId) ?? alumnos[0];
  if (!alumno) return null;

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <CalendarPlus /> Cargar la semana
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">Cargar la semana de {alumno.nombre} <AyudaIcono titulo="Cargar la semana"><p>Armá de una vez lo que el alumno hace cada día. Lo que cargues aparece en «Para hoy» el día que corresponde.</p></AyudaIcono></DialogTitle>
            <DialogDescription>Dejá lista toda la semana en un solo lugar: lo que cargues aparece en «Para hoy» el día que corresponda.</DialogDescription>
          </DialogHeader>
          <Formulario key={`${alumno.id}-${lunes}`} alumno={alumno} lunes={lunes} onLunes={setLunes} onListo={() => setAbierto(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
