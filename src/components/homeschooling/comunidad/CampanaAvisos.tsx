"use client";

// Propio de Ordo (lane 174, Q3): la campana de avisos de Estudio. El número se actualiza cada minuto; al abrirla se ven los
// avisos y se marcan como leídos. Cada aviso lleva a donde ocurrió.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { haceCuanto } from "@/lib/homeschooling/comentarios";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { AvisoVista } from "@/lib/homeschooling/servidor/avisos";

type Respuesta = { avisos: AvisoVista[]; sinLeer: number };

export default function CampanaAvisos() {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [sinLeer, setSinLeer] = useState(0);

  const leer = useCallback(() => api<Respuesta>("/api/homeschooling/notificaciones"), []);

  // El contador se refresca al montar y cada minuto (mientras la pestaña está visible)
  useEffect(() => {
    let vigente = true;
    const ver = () => {
      if (document.visibilityState !== "visible") return;
      leer()
        .then((r) => vigente && setSinLeer(r.sinLeer))
        .catch(() => {});
    };
    ver();
    const t = setInterval(ver, 60_000);
    return () => {
      vigente = false;
      clearInterval(t);
    };
  }, [leer]);

  const abrir = async (o: boolean) => {
    setAbierta(o);
    if (!o) return;
    try {
      const r = await leer();
      setDatos(r);
      if (r.sinLeer > 0) {
        await api("/api/homeschooling/notificaciones", { method: "POST", body: {} });
        setSinLeer(0);
      }
    } catch {
      setDatos({ avisos: [], sinLeer: 0 });
    }
  };

  const ir = (a: AvisoVista) => {
    setAbierta(false);
    if (a.href) router.push(a.href);
  };

  return (
    <>
      <Button variant="ghost" size="icon-sm" className="relative" aria-label={sinLeer > 0 ? `Avisos (${sinLeer} sin leer)` : "Avisos"} onClick={() => void abrir(true)}>
        <Bell />
        {sinLeer > 0 && <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white tabular-nums">{sinLeer > 9 ? "9+" : sinLeer}</span>}
      </Button>
      <Sheet open={abierta} onOpenChange={(o) => void abrir(o)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Avisos</SheetTitle>
            <SheetDescription>Lo que pasó en Estudio mientras no estabas.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {datos === null ? (
              <Skeleton className="h-16 w-full rounded-xl" />
            ) : datos.avisos.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No hay avisos.</p>
            ) : (
              <ul className="space-y-2">
                {datos.avisos.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => ir(a)} className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted ${a.leido ? "bg-card" : "border-primary/40 bg-primary/5"}`}>
                      <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                      {a.cuerpo && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.cuerpo}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{haceCuanto(a.creadoEn)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
