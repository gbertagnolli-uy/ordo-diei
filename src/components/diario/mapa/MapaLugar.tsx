"use client";
// Diario (lane 297): el mapa del editor de lugar. Portado de `_buildMap` en vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/place/place_editor.dart
// (ZhuJHua/moodiary@2c552dd): 200 px de alto, el pin queda fijo en el centro y se mueve el mapa por debajo; los otros lugares se ven como círculos de 200 m (el radio con el que
// se agrupan las entradas) con su insignia; un botón lleva a la ubicación actual. Cuando se mueve el mapa con un gesto, la posición del lugar pasa a ser el centro.
import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RADIO_COINCIDENCIA_M, colorDeIcono } from "@/lib/diario/lugares";
import { ZOOM_EDITOR, metrosAPixeles, type Camara } from "@/lib/diario/mapa";
import type { LugarVista } from "@/lib/diario/servidor-lugares";
import { toast } from "@/lib/toast";
import { InsigniaDeLugar } from "../lugares/iconos";
import { obtenerUbicacion } from "../lugares/ubicacion";
import { MapaBase, useAnimarCamara } from "./MapaBase";

/** Cuando el lugar todavía no tiene posición: Uruguay entero (moodiary arranca en el centro de China, el país de su autor). */
const INICIO_SIN_POSICION: Camara = { latitud: -32.8, longitud: -56, zoom: 6 };

const NEUTRO = "var(--muted-foreground)";

export function MapaLugar({
  latitud,
  longitud,
  icono,
  otros,
  onMover,
}: {
  /** La posición actual del lugar, o null si todavía no tiene (o no se puede leer). */
  latitud: number | null;
  longitud: number | null;
  icono: string | null;
  /** Los demás lugares del diario (no el que se edita). */
  otros: LugarVista[];
  /** El usuario movió el mapa o tocó «ubicación»: la posición nueva. */
  onMover: (latitud: number, longitud: number) => void;
}) {
  const conPosicion = latitud !== null && longitud !== null;
  const [camara, setCamara] = useState<Camara>(conPosicion ? { latitud, longitud, zoom: ZOOM_EDITOR } : INICIO_SIN_POSICION);
  const camaraViva = useRef(camara);
  useEffect(() => {
    camaraViva.current = camara;
  }, [camara]);
  const leer = useCallback(() => camaraViva.current, []);
  const { animar, cortar } = useAnimarCamara(leer, setCamara);
  const [ubicando, setUbicando] = useState(false);
  const ubicadoAlAbrir = useRef(false);
  // La última posición que salió de este mapa: si la de afuera es otra (se escribió en los campos), el mapa la sigue
  const emitida = useRef<string>(conPosicion ? `${latitud},${longitud}` : "");

  useEffect(() => {
    if (latitud === null || longitud === null) return;
    if (`${latitud},${longitud}` === emitida.current) return;
    emitida.current = `${latitud},${longitud}`;
    animar({ latitud, longitud, zoom: Math.max(camaraViva.current.zoom, ZOOM_EDITOR) }, 250);
  }, [latitud, longitud, animar]);

  const mover = useCallback(
    (c: Camara) => {
      setCamara(c);
      emitida.current = `${Number(c.latitud.toFixed(6))},${Number(c.longitud.toFixed(6))}`;
      onMover(Number(c.latitud.toFixed(6)), Number(c.longitud.toFixed(6)));
    },
    [onMover],
  );

  async function irAMiUbicacion() {
    setUbicando(true);
    try {
      const p = await obtenerUbicacion(true);
      cortar();
      mover({ latitud: p.latitud, longitud: p.longitud, zoom: Math.max(camaraViva.current.zoom, ZOOM_EDITOR) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo obtener la ubicación");
    } finally {
      setUbicando(false);
    }
  }

  // moodiary `initState`: un lugar nuevo sin posición busca la ubicación al abrirse
  useEffect(() => {
    if (conPosicion || ubicadoAlAbrir.current) return;
    ubicadoAlAbrir.current = true;
    void irAMiUbicacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, []);

  const color = colorDeIcono(icono) ?? NEUTRO;

  return (
    <div className="relative h-[200px] overflow-hidden rounded-xl border">
      <MapaBase camara={camara} onCamara={mover} onGesto={cortar} className="size-full">
        {(proyectar, _tamano, cam) => (
          <>
            {otros.map((l) => {
              const p = proyectar(l.latitud, l.longitud);
              const radio = metrosAPixeles(RADIO_COINCIDENCIA_M, l.latitud, cam.zoom);
              const c = colorDeIcono(l.icono) ?? NEUTRO;
              return (
                <div key={l.id} className="pointer-events-none absolute" style={{ left: p.x, top: p.y }}>
                  <span
                    className="absolute rounded-full border-[1.5px]"
                    style={{
                      width: radio * 2,
                      height: radio * 2,
                      left: -radio,
                      top: -radio,
                      backgroundColor: `color-mix(in srgb, ${c} 14%, transparent)`,
                      borderColor: `color-mix(in srgb, ${c} 55%, transparent)`,
                    }}
                  />
                  <span className="absolute" style={{ left: -13, top: -13 }} title={l.nombre}>
                    <InsigniaDeLugar icono={l.icono} tamano={26} />
                  </span>
                </div>
              );
            })}
            {/* El pin fijo: la punta queda justo en el centro */}
            <div className="pointer-events-none absolute z-[5]" style={{ left: "50%", top: "50%", transform: "translate(-50%, -100%)" }}>
              <MapPin size={36} style={{ color, filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.4))" }} className="fill-current/20" aria-hidden />
            </div>
          </>
        )}
      </MapaBase>
      <Button type="button" size="icon-sm" variant="secondary" className="absolute top-2 right-2 z-10 shadow" aria-label="Usar mi ubicación" title="Usar mi ubicación" disabled={ubicando} onClick={() => void irAMiUbicacion()}>
        <LocateFixed />
      </Button>
    </div>
  );
}
