"use client";
// Diario (lane 289): las entradas de un mismo día y mes en todos los años, con «Respondé a tu yo del pasado». Portado de vendor/storypad/lib/views/throwback
// (theachoem/storypad@a76825e: la lista de recuerdos de la fecha y el botón para escribir hoy) y de «En este día» de vendor/Daily_You/lib/flashback_manager.dart (Demizo/Daily_You@7cc237d).
import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { nivelDe, nombreDeNivel } from "@/lib/diario/escala";
import { fechaDeRespuesta, haceAnios, tituloDeRetrospectiva } from "@/lib/diario/recuerdos";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { fechaLarga, MESES } from "../estadisticas/controles";
import { GlifoAnimo, useEscala } from "../EscalaAnimo";

const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function Recuerdo({ e, hoyAnio, onIrADia }: { e: EntradaVista; hoyAnio: number; onIrADia: (fecha: string) => void }) {
  const nivel = nivelDe(useEscala(), e.animo);
  const anios = hoyAnio - Number(e.fecha.slice(0, 4));
  return (
    <li className="rounded-xl border p-3">
      <div className="mb-1 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{anios > 0 ? haceAnios(anios) : "Hoy"}</p>
          <p className="text-xs text-muted-foreground">
            {fechaLarga(e.fecha)} · {hora(e.hora)}
          </p>
        </div>
        {nivel && (
          <span title={nombreDeNivel(nivel)} role="img" aria-label={`Ánimo: ${nombreDeNivel(nivel)}`}>
            <GlifoAnimo nivel={nivel} tamano={22} />
          </span>
        )}
      </div>
      {e.titulo && <h3 className="text-sm font-semibold">{e.titulo}</h3>}
      <p className="line-clamp-6 text-sm whitespace-pre-line">{e.texto || "(sin texto)"}</p>
      {e.fotos.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {e.fotos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload
            <img key={url} src={url} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}
      <Button variant="ghost" size="sm" className="mt-1 -ml-2" onClick={() => onIrADia(e.fecha)}>
        Ir a ese día
      </Button>
    </li>
  );
}

export function EnEsteDiaDialog({
  tipo,
  diaMes,
  hoy,
  onCerrar,
  onIrADia,
  onResponder,
}: {
  tipo: TipoDiario;
  /** "MM-DD". */
  diaMes: string;
  hoy: string;
  onCerrar: () => void;
  onIrADia: (fecha: string) => void;
  /** Abre el editor en esa fecha (el día y mes de esta consulta, en el año de hoy). */
  onResponder: (fecha: string) => void;
}) {
  const [entradas, setEntradas] = useState<EntradaVista[] | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario/en-este-dia?tipo=${tipo}&md=${diaMes}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudieron cargar los recuerdos");
        if (vivo) setEntradas(d.entradas);
      })
      .catch((e) => {
        if (!vivo) return;
        setEntradas([]);
        toast.error(e instanceof Error ? e.message : "No se pudieron cargar los recuerdos");
      });
    return () => {
      vivo = false;
    };
  }, [tipo, diaMes]);

  const hoyAnio = Number(hoy.slice(0, 4));
  const fechaRespuesta = fechaDeRespuesta(diaMes, hoy);
  const anios = (entradas ?? []).map((e) => Number(e.fecha.slice(0, 4)));
  const [mes, dia] = diaMes.split("-").map(Number);

  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            En este día · {dia} de {MESES[mes - 1]}
          </DialogTitle>
          <DialogDescription>{entradas === null ? "Buscando recuerdos…" : entradas.length ? tituloDeRetrospectiva(anios, hoyAnio, diaMes === hoy.slice(5)) : "No hay entradas de este día en otros años."}</DialogDescription>
        </DialogHeader>
        {entradas && entradas.length > 0 && (
          <ul className="flex flex-col gap-3">
            {entradas.map((e) => (
              <Recuerdo
                key={e.id}
                e={e}
                hoyAnio={hoyAnio}
                onIrADia={(f) => {
                  onIrADia(f);
                  onCerrar();
                }}
              />
            ))}
          </ul>
        )}
        {fechaRespuesta && entradas && entradas.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-3">
            <p className="text-sm text-muted-foreground">Respondé a tu yo del pasado.</p>
            <Button onClick={() => onResponder(fechaRespuesta)}>
              <PenLine /> Escribir sobre este día
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
