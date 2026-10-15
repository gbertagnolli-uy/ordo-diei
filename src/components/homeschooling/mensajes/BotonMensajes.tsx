"use client";

// Propio de Ordo (lane 191, G7): el sobre de la barra superior de Estudio con la cantidad de mensajes sin leer (se actualiza cada minuto).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/homeschooling/roost/services/http";

export default function BotonMensajes() {
  const [sinLeer, setSinLeer] = useState(0);

  useEffect(() => {
    let vigente = true;
    const ver = () => {
      if (document.visibilityState !== "visible") return;
      api<{ sinLeer: number }>("/api/homeschooling/mensajes?resumen=1")
        .then((r) => vigente && setSinLeer(r.sinLeer))
        .catch(() => {});
    };
    ver();
    const t = setInterval(ver, 60_000);
    return () => {
      vigente = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Button asChild variant="ghost" size="icon-sm" className="relative">
      <Link href="/dashboard/homeschooling/mensajes" aria-label={sinLeer > 0 ? `Mensajes (${sinLeer} sin leer)` : "Mensajes"}>
        <Mail />
        {sinLeer > 0 && <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground tabular-nums">{sinLeer > 9 ? "9+" : sinLeer}</span>}
      </Link>
    </Button>
  );
}
