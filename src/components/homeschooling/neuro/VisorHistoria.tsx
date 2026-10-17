"use client";

// Propio de Ordo: visor de una historia social a pantalla completa — un paso por pantalla, texto y símbolo grandes.
// Se remonta por historia (key) para volver al primer paso. Al terminar se marca como vista y deja de mostrarse arriba de «Hoy aprendo».

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { HistoriaVista } from "@/lib/homeschooling/servidor/neuro";
import { toast } from "@/lib/toast";
import IconoHistoria from "./IconoHistoria";

export default function VisorHistoria({ historia, onClose, marcarVista = true }: { historia: HistoriaVista | null; onClose: () => void; marcarVista?: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);

  if (!historia) return <Sheet open={false} onOpenChange={() => {}} />;
  const p = historia.pasos[paso];
  const ultimo = paso === historia.pasos.length - 1;

  const terminar = async () => {
    try {
      if (marcarVista) await api(`/api/homeschooling/historias/${historia.id}/vista`, { method: "POST" });
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-svh max-h-svh gap-0 rounded-none p-0 data-[side=bottom]:h-svh data-[side=bottom]:max-h-svh">
        <SheetHeader className="border-b p-4 pr-14">
          <SheetTitle>{historia.titulo}</SheetTitle>
          <SheetDescription>
            Paso {paso + 1} de {historia.pasos.length}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
          <IconoHistoria nombre={p.icono} className="size-32 text-primary" />
          <p className="max-w-xl text-3xl leading-snug font-semibold text-foreground">{p.texto}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t p-4">
          <Button size="lg" variant="outline" disabled={paso === 0} onClick={() => setPaso((n) => n - 1)}>
            <ArrowLeft /> Atrás
          </Button>
          {ultimo ? (
            <Button size="lg" onClick={terminar}>
              <Check /> Listo
            </Button>
          ) : (
            <Button size="lg" onClick={() => setPaso((n) => n + 1)}>
              Siguiente <ArrowRight />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
