"use client";
// Diario (lane 297): la hoja de un lugar del mapa — su nombre, cuántas entradas tiene y de cuándo a cuándo, y esas entradas. Portado de `_PlaceSheet` y
// `DiaryEntryTile` (vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/{map/map_page,widget/diary_entry_tile}.dart, ZhuJHua/moodiary@2c552dd):
// cada entrada muestra su foto de portada, el título (o «Sin título»), la categoría, la fecha y hora y dos líneas del texto; tocarla lleva al día.
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { rangoDeMeses, textoCantidad } from "@/lib/diario/mapa";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import type { HuellaVista } from "@/lib/diario/servidor-huellas";
import type { LugarVista } from "@/lib/diario/servidor-lugares";
import { toast } from "@/lib/toast";
import { fechaLarga } from "../estadisticas/controles";
import { caminoDe } from "../ListaDia";
import { InsigniaDeLugar } from "../lugares/iconos";

const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function HojaDelLugar({
  tipo,
  lugar,
  huella,
  catalogo,
  version,
  onIrADia,
  onCerrar,
}: {
  tipo: TipoDiario;
  lugar: LugarVista;
  huella: HuellaVista;
  catalogo: Catalogo | null;
  /** Sube cuando cambió algo en el diario: se vuelven a pedir las entradas. */
  version: number;
  onIrADia: (fecha: string) => void;
  onCerrar: () => void;
}) {
  const [entradas, setEntradas] = useState<EntradaVista[] | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario/lugares/${lugar.id}/entradas?tipo=${tipo}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudieron cargar las entradas");
        if (vivo) setEntradas(d.entradas);
      })
      .catch((e) => {
        if (vivo) setEntradas([]);
        toast.error(e instanceof Error ? e.message : "No se pudieron cargar las entradas");
      });
    return () => {
      vivo = false;
    };
  }, [tipo, lugar.id, version, huella.cantidad]);

  return (
    <Sheet open onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent side="bottom" className="mx-auto max-h-[60vh] w-full overflow-y-auto sm:max-w-xl sm:rounded-t-xl">
        <SheetHeader className="flex-row items-center gap-3">
          <InsigniaDeLugar icono={lugar.icono} tamano={40} />
          <div className="min-w-0">
            <SheetTitle className="truncate">{lugar.nombre}</SheetTitle>
            <SheetDescription>
              {textoCantidad(huella.cantidad)} · {rangoDeMeses(huella.primera, huella.ultima)}
            </SheetDescription>
          </div>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-4">
          {entradas === null && <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>}
          {entradas?.map((e) => {
            const portada = e.fotos[0];
            const categoria = catalogo && e.categoriaId != null ? caminoDe(e.categoriaId, catalogo.categorias) : [];
            const ultima = categoria[categoria.length - 1];
            const texto = e.texto.replace(/\s+/g, " ").trim();
            return (
              <button key={e.id} type="button" onClick={() => onIrADia(e.fecha)} className="flex items-start gap-2.5 rounded-xl border bg-card p-2.5 text-left transition hover:bg-muted">
                {portada && (
                  // eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload
                  <img src={portada} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{(e.titulo ?? "").trim() || "Sin título"}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {ultima && (
                      <>
                        <span className="size-2 shrink-0 rounded-full border" style={{ backgroundColor: ultima.color ?? "transparent" }} aria-hidden />
                        <span className="truncate">{ultima.nombre}</span>
                      </>
                    )}
                    <span className="shrink-0">
                      {fechaLarga(e.fecha)} · {hora(e.hora)}
                    </span>
                  </span>
                  {texto && <span className="line-clamp-2 text-xs text-muted-foreground">{texto}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
