"use client";
// Diario (lane 296): elegir el lugar de la entrada. Portado de vendor/moodiary/.../presentation/detail/diary_page.dart (`placeRows`, `_onPickPlace`) y de
// edit_controller.dart (`fetchPosition`) (ZhuJHua/moodiary@2c552dd): la lista va ordenada por distancia cuando se conoce la ubicación, con la distancia a cada
// lugar; «Usar mi ubicación» toma el lugar que ya esté a 200 m o crea uno nuevo con el nombre de la dirección.
import { useEffect, useMemo, useState } from "react";
import { Check, LocateFixed, MapPinOff, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { conDistancia, textoDistancia, type Coordenadas } from "@/lib/diario/lugares";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { EditorLugar } from "./EditorLugar";
import { InsigniaDeLugar } from "./iconos";
import { obtenerUbicacion, tengoPermisoDeUbicacion } from "./ubicacion";
import type { AccionesLugares } from "./useLugares";

export function SelectorLugar({
  lugares,
  valor,
  onElegir,
  onAdministrar,
  onCerrar,
}: {
  lugares: AccionesLugares;
  valor: number | null;
  /** `null` = sin lugar. */
  onElegir: (id: number | null) => void;
  onAdministrar: () => void;
  onCerrar: () => void;
}) {
  const [punto, setPunto] = useState<Coordenadas | null>(null);
  const [ubicando, setUbicando] = useState(false);
  const [creando, setCreando] = useState(false);

  // Si el navegador ya dio permiso, se ordena por cercanía sin pedir nada; si no, queda el orden del usuario hasta que toque «Usar mi ubicación»
  useEffect(() => {
    let vivo = true;
    void (async () => {
      if (!(await tengoPermisoDeUbicacion())) return;
      try {
        const p = await obtenerUbicacion(false);
        if (vivo) setPunto(p);
      } catch {
        /* sin ubicación: sin distancias */
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const lista = lugares.lista;
  const filas = useMemo(() => (lista ? conDistancia(lista, punto) : null), [lista, punto]);

  async function usarMiUbicacion() {
    setUbicando(true);
    try {
      const p = await obtenerUbicacion(true);
      setPunto(p);
      const lugar = await lugares.deUbicacion(p.latitud, p.longitud);
      if (lugar) {
        onElegir(lugar.id);
        onCerrar();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo obtener la ubicación");
    } finally {
      setUbicando(false);
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(a) => !a && onCerrar()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Lugar</DialogTitle>
          </DialogHeader>
          <Button type="button" disabled={ubicando} onClick={() => void usarMiUbicacion()}>
            <LocateFixed /> {ubicando ? "Buscando…" : "Usar mi ubicación"}
          </Button>
          {filas === null ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : filas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay lugares. Usá tu ubicación o creá uno.</p>
          ) : (
            <ul className="flex flex-col">
              {filas.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted", l.id === valor && "bg-muted")}
                    onClick={() => {
                      onElegir(l.id);
                      onCerrar();
                    }}
                  >
                    <InsigniaDeLugar icono={l.icono} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{l.nombre}</span>
                      {l.metros !== null && <span className="block text-xs text-muted-foreground">A {textoDistancia(l.metros)}</span>}
                    </span>
                    {l.id === valor && <Check className="size-4 shrink-0 text-primary" aria-label="Elegido" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter className="sm:flex-wrap">
            <Button type="button" variant="ghost" className="sm:mr-auto" onClick={() => setCreando(true)}>
              <Plus /> Nuevo lugar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onCerrar();
                onAdministrar();
              }}
            >
              <Settings2 /> Administrar
            </Button>
            {valor !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onElegir(null);
                  onCerrar();
                }}
              >
                <MapPinOff /> Quitar lugar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {creando && (
        <EditorLugar
          lugares={lugares}
          inicial={punto ?? undefined}
          onGuardado={(id) => {
            onElegir(id);
            onCerrar();
          }}
          onCerrar={() => setCreando(false)}
        />
      )}
    </>
  );
}
