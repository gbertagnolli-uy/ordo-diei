"use client";

// Propio de Ordo (lane 179, R4): el enlace para ver el plan de un hijo en el calendario del teléfono (Google o Apple Calendar).
import { useState } from "react";
import { CalendarSync, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

export default function SuscribirCalendario({ ruta, nombre }: { ruta: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const url = typeof window === "undefined" ? ruta : `${window.location.origin}${ruta}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar: seleccionalo y copialo a mano");
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setAbierto(true)}>
        <CalendarSync /> Calendario del teléfono
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Plan de {nombre} en tu calendario</DialogTitle>
            <DialogDescription>Se actualiza solo: clases, actividades y días sin clase de los próximos meses.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Enlace del calendario" />
              <Button onClick={copiar}>
                <Copy /> Copiar
              </Button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Google Calendar:</span> Otros calendarios → «Desde URL» → pegá el enlace.
              </li>
              <li>
                <span className="font-medium text-foreground">Apple Calendar:</span> Archivo → «Nueva suscripción a calendario» → pegá el enlace.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">Quien tenga este enlace ve los títulos de las clases de {nombre}. No lo compartas fuera de la familia.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
