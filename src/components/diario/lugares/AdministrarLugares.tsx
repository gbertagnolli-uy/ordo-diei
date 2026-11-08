"use client";
// Diario (lane 296): administrar los lugares. Portado de vendor/moodiary/.../presentation/place/place_manager_page.dart (ZhuJHua/moodiary@2c552dd):
// búsqueda por nombre, cuántas entradas tiene cada lugar, editar, borrar (solo si no tiene entradas) y reordenar. El orden se cambia con flechas (moodiary
// arrastra con pulsación larga). Al final están las tres opciones de relleno automático de las entradas nuevas.
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { claveDeNombre } from "@/lib/diario/lugares";
import { EditorLugar } from "./EditorLugar";
import { InsigniaDeLugar } from "./iconos";
import { usePreferenciasRelleno, type OpcionesRelleno } from "./relleno";
import type { AccionesLugares } from "./useLugares";

const OPCIONES: { clave: keyof OpcionesRelleno; titulo: string; detalle: string }[] = [
  { clave: "lugarCercano", titulo: "Lugar cercano", detalle: "En una entrada nueva pone el lugar guardado que esté a menos de 200 m." },
  { clave: "lugarDeUbicacion", titulo: "Lugar de mi ubicación", detalle: "Pone el lugar de dónde estás y, si no hay uno cerca, lo crea con el nombre de la dirección." },
  { clave: "clima", titulo: "Clima de ahora", detalle: "Pone el clima actual en tu ubicación." },
];

export function AdministrarLugares({ lugares, onCerrar }: { lugares: AccionesLugares; onCerrar: () => void }) {
  // undefined = lista; null = lugar nuevo; número = id del que se edita
  const [editando, setEditando] = useState<number | null | undefined>(undefined);
  const [busqueda, setBusqueda] = useState("");
  const [relleno, setRelleno] = usePreferenciasRelleno();
  const lista = lugares.lista;
  const q = claveDeNombre(busqueda);
  const filas = useMemo(() => (lista ? lista.filter((l) => !q || claveDeNombre(l.nombre).includes(q)) : null), [lista, q]);

  /** Mueve un lugar un puesto (con la lista completa: con una búsqueda activa, el orden de los demás no cambia). */
  async function mover(id: number, delta: -1 | 1) {
    if (!lista) return;
    const ids = lista.map((l) => l.id);
    const i = ids.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await lugares.reordenar(ids);
  }

  return (
    <Sheet open onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Lugares</SheetTitle>
          <SheetDescription>Los lugares donde escribís seguido. Un lugar con entradas no se puede borrar.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <Button type="button" onClick={() => setEditando(null)}>
            <Plus /> Nuevo lugar
          </Button>
          {(lista?.length ?? 0) > 4 && (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input aria-label="Buscar un lugar" placeholder="Buscar un lugar" className="pl-8" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
          )}
          {filas === null && <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>}
          {filas?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{q ? "Ningún lugar coincide." : "Aún no hay lugares."}</p>}
          <ul className="flex flex-col">
            {filas?.map((l) => {
              const i = lista!.findIndex((x) => x.id === l.id);
              return (
                <li key={l.id} className="flex items-center gap-1">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted" onClick={() => setEditando(l.id)}>
                    <InsigniaDeLugar icono={l.icono} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{l.nombre}</span>
                      <span className="block text-xs text-muted-foreground">{l.usos === 1 ? "1 entrada" : `${l.usos} entradas`}</span>
                    </span>
                  </button>
                  {!q && (
                    <>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Subir «${l.nombre}»`} disabled={i === 0} onClick={() => void mover(l.id, -1)}>
                        <ArrowUp />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Bajar «${l.nombre}»`} disabled={i === lista!.length - 1} onClick={() => void mover(l.id, 1)}>
                        <ArrowDown />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <section className="mt-2 flex flex-col gap-3 border-t pt-4" aria-labelledby="relleno-lugares">
            <div>
              <h3 id="relleno-lugares" className="text-sm font-medium">
                Al escribir una entrada nueva
              </h3>
              <p className="text-xs text-muted-foreground">Usa la ubicación de este dispositivo y solo se aplica si el navegador ya te dio permiso. Por defecto, apagado.</p>
            </div>
            {OPCIONES.map((o) => (
              <div key={o.clave} className="flex items-start justify-between gap-3">
                <Label htmlFor={`relleno-${o.clave}`} className="flex flex-col items-start gap-0.5 font-normal">
                  <span className="font-medium">{o.titulo}</span>
                  <span className="text-xs text-muted-foreground">{o.detalle}</span>
                </Label>
                <Switch id={`relleno-${o.clave}`} checked={relleno[o.clave]} onCheckedChange={(v) => setRelleno({ ...relleno, [o.clave]: v })} />
              </div>
            ))}
          </section>
        </div>
        {editando !== undefined && <EditorLugar key={editando ?? "nuevo"} lugar={editando === null ? undefined : lista?.find((l) => l.id === editando)} lugares={lugares} onCerrar={() => setEditando(undefined)} />}
      </SheetContent>
    </Sheet>
  );
}
