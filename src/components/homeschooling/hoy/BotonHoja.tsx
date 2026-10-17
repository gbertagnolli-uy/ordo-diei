"use client";

// Propio de Ordo (lane 178, P3): «Imprimir mi hoja» del día. Confirma mostrando cuántas impresiones quedan, gasta una en el
// servidor y abre la hoja en otra pestaña (dentro del clic, para que no la bloquee el navegador).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

const plural = (n: number) => (n === 1 ? "1 impresión" : `${n} impresiones`);

export default function BotonHoja({ diaId, restantes, esPadre = false, className, variante = "outline" }: { diaId: number; restantes: number | null; esPadre?: boolean; className?: string; variante?: "outline" | "default" | "ghost" }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const agotado = !esPadre && restantes !== null && restantes <= 0;

  const imprimir = async () => {
    setOcupado(true);
    const ventana = window.open("", "_blank");
    try {
      const r = await api<{ restantes: number | null; hojaUrl: string }>(`/api/homeschooling/dias/${diaId}/hoja`, { method: "POST" });
      if (ventana) ventana.location.href = r.hojaUrl;
      else window.open(r.hojaUrl, "_blank");
      setConfirmando(false);
      router.refresh();
      if (r.restantes !== null) toast.info(r.restantes === 0 ? "Esa fue tu última impresión de la hoja de hoy" : `Te quedan ${plural(r.restantes)} de la hoja de hoy`);
    } catch (e) {
      ventana?.close();
      toast.error(e instanceof Error ? e.message : "No se pudo preparar la hoja");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <Button type="button" variant={variante} className={className} disabled={agotado} title={agotado ? "Ya usaste las impresiones. Pedile una más a mamá o a papá." : "Imprimir la hoja del día"} onClick={() => (esPadre ? void imprimir() : setConfirmando(true))}>
        <Printer /> {agotado ? "Sin impresiones" : esPadre ? "Imprimir hoja del día" : "Imprimir mi hoja"}
      </Button>
      <Dialog open={confirmando} onOpenChange={(o) => !o && !ocupado && setConfirmando(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Imprimir la hoja de hoy?</DialogTitle>
            <DialogDescription>
              {restantes !== null && restantes > 1 ? `Te quedan ${plural(restantes)} de esta hoja.` : "Es tu última impresión de esta hoja."} Imprimí solo si vas a trabajar en el cuaderno.
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
