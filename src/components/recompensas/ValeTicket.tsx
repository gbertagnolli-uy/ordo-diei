"use client";

// Vale ya abierto, con forma de ticket (vault/LANE_86_VALES.md): se arranca la parte derecha para usarlo.
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Scissors } from "lucide-react";
import TearTicket from "@/components/ui/tear-ticket";
import type { RecompensaVista } from "@/lib/recompensas/server";

const dia = (iso: string) => format(new Date(iso), "d MMM yyyy", { locale: es });

export function ValeTicket({ vale, onUsar, deshabilitado }: { vale: RecompensaVista; onUsar: () => void; deshabilitado?: boolean }) {
  const usado = vale.usadoEn !== null;
  const fechaReclamo = vale.reclamadaEn ?? vale.ganadaEn;

  return (
    <div className="flex justify-center">
      <TearTicket
        torn={usado}
        onTear={onUsar}
        disabled={deshabilitado}
        width={460}
        height={190}
        stubSize={120}
        rotate={0}
        tiltMax={6}
        // Tokens de la app: se adapta solo a modo claro y oscuro
        background="var(--card)"
        color="var(--card-foreground)"
        stubBackground="color-mix(in srgb, var(--primary) 14%, var(--card))"
        borderColor="color-mix(in srgb, var(--primary) 35%, transparent)"
        ariaLabel={`Arrancar el vale por ${vale.titulo} para usarlo`}
        stub={
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-primary">
            <Scissors className="size-5" />
            <span className="font-heading text-sm leading-tight font-semibold">Arrancá para usar</span>
            <span className="text-[10px] tracking-widest uppercase opacity-70">{"←"} deslizá</span>
          </div>
        }
      >
        <div className="relative flex h-full flex-col justify-center gap-1 px-6 py-5">
          <span className="absolute top-3 right-6 text-[10px] text-muted-foreground">{dia(fechaReclamo)}</span>
          <span className="text-[11px] font-semibold tracking-[0.25em] text-primary uppercase">Vale por</span>
          <p className="font-heading text-2xl leading-tight font-semibold text-balance">{vale.titulo}</p>
          {vale.origen && <p className="text-xs text-muted-foreground">{vale.origen}</p>}
          {usado && vale.usadoEn && (
            <span className="mt-1 w-fit -rotate-3 rounded border-2 border-destructive/70 px-2 py-0.5 text-xs font-bold tracking-widest text-destructive uppercase">
              Usado · {dia(vale.usadoEn)}
            </span>
          )}
        </div>
      </TearTicket>
    </div>
  );
}
