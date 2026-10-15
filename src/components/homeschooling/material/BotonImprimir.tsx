"use client";

// Propio de Ordo (lane 168, P1): «Imprimir» del alumno. Pide confirmación mostrando cuántas le quedan, gasta una en el servidor
// y abre la hoja (texto) o el PDF (Docs/Drive) en otra pestaña. Sin impresiones: botón apagado con el motivo.
import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { ResultadoImpresion } from "@/lib/homeschooling/servidor/impresiones";
import type { MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import { toast } from "@/lib/toast";

const plural = (n: number) => (n === 1 ? "1 impresión" : `${n} impresiones`);

export default function BotonImprimir({ material, restantes, onUsada }: { material: MaterialVista; restantes: number | null; onUsada: (restantes: number | null) => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  if (!material.imprimible) return null;
  const agotado = restantes !== null && restantes <= 0;

  const imprimir = async () => {
    setOcupado(true);
    // La pestaña se abre ya, dentro del clic: si se abriera después de la espera, el navegador la bloquearía
    const ventana = window.open("", "_blank");
    try {
      const r = await api<ResultadoImpresion>(`/api/homeschooling/materiales/${material.id}/imprimir`, { method: "POST" });
      const destino = r.hojaUrl ?? r.externaUrl;
      if (ventana && destino) ventana.location.href = destino;
      else if (destino) window.open(destino, "_blank");
      onUsada(r.restantes);
      setConfirmando(false);
      if (r.restantes !== null) toast.info(r.restantes === 0 ? "Esa fue tu última impresión de este material" : `Te quedan ${plural(r.restantes)}`);
    } catch (e) {
      ventana?.close();
      toast.error(e instanceof Error ? e.message : "No se pudo preparar la impresión");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" disabled={agotado} onClick={() => (restantes === null ? void imprimir() : setConfirmando(true))} title={agotado ? "Ya usaste todas las impresiones. Pedile una más a mamá o a papá." : "Imprimir"}>
        <Printer />
        <span className="hidden sm:inline">{agotado ? "Sin impresiones" : restantes === null ? "Imprimir" : `Imprimir (${restantes})`}</span>
      </Button>
      <Dialog open={confirmando} onOpenChange={(o) => !o && !ocupado && setConfirmando(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Imprimir «{material.titulo}»?</DialogTitle>
            <DialogDescription>
              {restantes !== null && restantes > 1 ? `Te quedan ${plural(restantes)} de este material.` : "Es tu última impresión de este material."} Imprimí solo si lo vas a usar en el cuaderno.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmando(false)} disabled={ocupado}>
              Ahora no
            </Button>
            <Button onClick={imprimir} disabled={ocupado}>
              {ocupado ? <Spinner /> : <Printer />} Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
