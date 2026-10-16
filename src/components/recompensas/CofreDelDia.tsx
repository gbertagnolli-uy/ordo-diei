"use client";

// Sección «Cofre del día» de Mis premios: siempre visible, deshabilitada con cuenta regresiva hasta las
// 18:00 (UTC-03:00); desde esa hora se puede abrir. La barra empieza llena 24 h antes y se va vaciando.
import { useEffect, useState } from "react";
import Image from "next/image";
import { Ban, Clock, Gift, PackageOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { CoolMode } from "@/components/ui/cool-mode";
import { cn } from "@/lib/utils";
import { estadoCofre, formatearRestante } from "@/lib/comportamiento/cofreHorario";
import { MENSAJE_BLOQUEO } from "@/lib/comportamiento/sancion";

const CONFITES = { particle: "🎁", size: 14 };

export function CofreDelDia({
  hayCofre,
  abiertoHoy,
  sancionado,
  ocupado,
  abriendo,
  masPendientes,
  onAbrir,
}: {
  /** Hay un cofre sin abrir esperando */
  hayCofre: boolean;
  /** Ya se abrió un cofre hoy */
  abiertoHoy: boolean;
  /** Hoy hay una sanción: no hay cofre hasta mañana */
  sancionado: boolean;
  ocupado: boolean;
  abriendo: boolean;
  /** Otros cofres sin abrir además del que se muestra */
  masPendientes: number;
  onAbrir: () => void;
}) {
  // null hasta montar: evita diferencias entre el HTML del servidor y el del navegador
  const [ahora, setAhora] = useState<number | null>(null);
  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const e = ahora === null ? null : estadoCofre(ahora, hayCofre);
  const listo = e?.fase === "listo" && !sancionado;

  return (
    <section className="space-y-4" aria-labelledby="cofre-del-dia">
      <h2 id="cofre-del-dia" className="flex items-center gap-2 font-heading text-lg font-medium">
        <PackageOpen className="size-5 text-primary" /> Cofre del día
      </h2>
      <Card className={cn("flex-row gap-0 overflow-hidden py-0", listo && "border-primary/40")}>
        <div className="relative w-32 shrink-0 self-stretch bg-white sm:w-48">
          <Image
            src="/premios/cofre.webp"
            alt=""
            fill
            unoptimized
            sizes="(min-width: 640px) 192px, 128px"
            className={cn(
              "object-contain [mask-image:linear-gradient(to_right,black_70%,transparent_96%)] transition-[filter,opacity]",
              !listo && "opacity-50 grayscale"
            )}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3 p-4 text-left sm:p-5">
          <Badge variant={sancionado ? "destructive" : listo ? "default" : "secondary"}>
            {sancionado ? <Ban className="size-3" /> : listo ? <Gift className="size-3" /> : <Clock className="size-3" />}{" "}
            {sancionado ? "Perdido por hoy" : listo ? "Listo para abrir" : "Cofre del día"}
          </Badge>
          <div className="space-y-0.5">
            <h3 className="font-heading text-lg leading-tight font-medium">Cofre sorpresa diario</h3>
            <p className="text-sm text-muted-foreground">
              {e === null
                ? " "
                : sancionado
                ? MENSAJE_BLOQUEO.cofre.texto
                : e.fase === "listo"
                ? "¡Te lo ganaste por portarte bien! Ya lo podés abrir."
                : e.fase === "cuenta"
                ? "Llega a las 18:00 si tus papás ven que te portaste bien hoy."
                : abiertoHoy
                ? "Ya abriste el cofre de hoy. El próximo llega mañana a las 18:00."
                : "Hoy todavía no llegó: tus papás aún no registraron tu comportamiento. Si lo hacen, aparece acá."}
              {masPendientes > 0 && ` Tenés ${masPendientes} cofre${masPendientes === 1 ? "" : "s"} más esperando.`}
            </p>
          </div>

          {e && e.fase !== "listo" && !sancionado && (
            <div className="w-full max-w-sm space-y-1.5">
              <Progress
                value={e.progreso * 100}
                aria-label="Tiempo que falta para las 18:00"
                className="h-2"
              />
              <p className="text-xs text-muted-foreground tabular-nums">
                {e.fase === "cuenta" ? "Se abre en" : "Próximo cofre en"} <span className="font-medium text-foreground">{formatearRestante(e.restanteMs)}</span>
              </p>
            </div>
          )}

          <CoolMode options={CONFITES}>
            <Button size="sm" disabled={!listo || ocupado} onClick={onAbrir}>
              {abriendo ? <Spinner /> : <Gift className="size-4" />} Abrir cofre
            </Button>
          </CoolMode>
        </div>
      </Card>
    </section>
  );
}
