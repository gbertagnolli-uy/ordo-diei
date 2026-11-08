"use client";
// Diario (lane 296): crear o editar un lugar frecuente. Portado de vendor/moodiary/.../presentation/place/place_editor_page.dart (ZhuJHua/moodiary@2c552dd):
// nombre, ícono y posición. La posición se elige moviendo el mapa (lane 297, igual que moodiary) o se escribe en coordenadas.
import { useCallback, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ETIQUETA_ICONO_LUGAR, ICONOS_LUGAR, MAX_NOMBRE_LUGAR, nombreDeCoordenadas, type IconoLugar } from "@/lib/diario/lugares";
import type { LugarVista } from "@/lib/diario/servidor-lugares";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { IconoDeLugar } from "./iconos";
import { MapaLugar } from "../mapa/MapaLugar";
import type { AccionesLugares } from "./useLugares";

const aNumero = (t: string) => (t.trim() === "" ? NaN : Number(t.trim().replace(",", ".")));

export function EditorLugar({
  lugar,
  lugares,
  inicial,
  onGuardado,
  onCerrar,
}: {
  /** Sin lugar = nuevo. */
  lugar?: LugarVista;
  lugares: AccionesLugares;
  /** Posición con la que arranca un lugar nuevo (la ubicación que ya se tiene). */
  inicial?: { latitud: number; longitud: number };
  /** Se llama con el id del lugar guardado (nuevo o editado). */
  onGuardado?: (id: number) => void;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(lugar?.nombre ?? "");
  const [icono, setIcono] = useState<IconoLugar | null>(lugar?.icono ?? null);
  const [latitud, setLatitud] = useState(String(lugar?.latitud ?? inicial?.latitud ?? ""));
  const [longitud, setLongitud] = useState(String(lugar?.longitud ?? inicial?.longitud ?? ""));
  const [trabajando, setTrabajando] = useState(false);

  const lat = aNumero(latitud);
  const lon = aNumero(longitud);
  const posicionValida = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  const otros = useMemo(() => (lugares.lista ?? []).filter((l) => l.id !== lugar?.id), [lugares.lista, lugar?.id]);
  const moverA = useCallback((lat: number, lon: number) => {
    setLatitud(String(lat));
    setLongitud(String(lon));
  }, []);

  async function guardar() {
    if (!posicionValida) return toast.error("Poné una latitud entre -90 y 90 y una longitud entre -180 y 180");
    setTrabajando(true);
    // Sin nombre, moodiary lo llama `lat, lon`
    const cuerpo = { nombre: nombre.trim() || nombreDeCoordenadas(lat, lon), latitud: lat, longitud: lon, icono };
    let id: number | null = lugar?.id ?? null;
    let ok: boolean;
    if (lugar) ok = await lugares.editar(lugar.id, cuerpo);
    else {
      id = await lugares.crear(cuerpo);
      ok = id !== null;
    }
    setTrabajando(false);
    if (!ok || id === null) return;
    onGuardado?.(id);
    onCerrar();
  }

  async function borrar() {
    if (!lugar || !window.confirm(`¿Borrar el lugar «${lugar.nombre}»? No se puede deshacer.`)) return;
    setTrabajando(true);
    const ok = await lugares.borrar(lugar.id);
    setTrabajando(false);
    if (ok) onCerrar();
  }

  return (
    <Sheet open onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{lugar ? "Editar lugar" : "Nuevo lugar"}</SheetTitle>
          <SheetDescription>Las entradas con un lugar a menos de 200 m de este se agrupan en él.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre-lugar">Nombre</Label>
            <Input id="nombre-lugar" value={nombre} maxLength={MAX_NOMBRE_LUGAR} placeholder="Casa, Oficina…" onChange={(e) => setNombre(e.target.value)} />
          </div>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Ícono</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={icono === null}
                onClick={() => setIcono(null)}
                className={cn("flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm", icono === null && "border-primary bg-primary/10")}
              >
                <IconoDeLugar icono={null} /> Pin
              </button>
              {ICONOS_LUGAR.map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={icono === i}
                  aria-label={ETIQUETA_ICONO_LUGAR[i]}
                  title={ETIQUETA_ICONO_LUGAR[i]}
                  onClick={() => setIcono(i)}
                  className={cn("flex size-10 items-center justify-center rounded-lg border", icono === i && "border-primary bg-primary/10")}
                >
                  <IconoDeLugar icono={i} tamano={20} />
                </button>
              ))}
            </div>
          </fieldset>
          <MapaLugar latitud={posicionValida ? lat : null} longitud={posicionValida ? lon : null} icono={icono} otros={otros} onMover={moverA} />
          <div className="flex flex-col gap-1.5">
            <Label>Posición</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input aria-label="Latitud" inputMode="decimal" placeholder="Latitud" value={latitud} onChange={(e) => setLatitud(e.target.value)} />
              <Input aria-label="Longitud" inputMode="decimal" placeholder="Longitud" value={longitud} onChange={(e) => setLongitud(e.target.value)} />
            </div>
          </div>
        </div>
        <SheetFooter className="flex-row items-center justify-between gap-2">
          {lugar ? (
            <Button type="button" variant="ghost" className="text-destructive" disabled={trabajando || lugar.usos > 0 || !lugar.puedoEditar} title={lugar.usos > 0 ? "Tiene entradas: cambialas de lugar antes de borrarlo" : undefined} onClick={() => void borrar()}>
              <Trash2 /> Borrar
            </Button>
          ) : (
            <span />
          )}
          <span className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="button" disabled={trabajando || !posicionValida || (lugar !== undefined && !lugar.puedoEditar)} onClick={() => void guardar()}>
              Guardar
            </Button>
          </span>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
