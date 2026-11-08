"use client";
// Diario (lane 297): el mapa de huellas — dónde escribiste. Portado de vendor/moodiary/packages/feature/moodiary_diary/lib/src/presentation/map/map_page.dart
// (ZhuJHua/moodiary@2c552dd): una tarjeta de mapa con un pin por lugar (con la cantidad de entradas), debajo la lista de lugares ordenada por cantidad,
// «Ampliar» a pantalla completa, «Ajustar a todos» cuando se movió el mapa, y la hoja del lugar al tocar un pin o una fila.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Maximize2, MapPinned, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colorDeIcono, colorSobre } from "@/lib/diario/lugares";
import { MARGEN_TARJETA, ZOOM_ENFOQUE, ajustarVista, ordenarHuellas, rellenoUniforme, tamanoPin, textoCantidad, textoPin, type Camara, type Tamano } from "@/lib/diario/mapa";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import type { HuellaVista } from "@/lib/diario/servidor-huellas";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { InsigniaDeLugar } from "../lugares/iconos";
import type { AccionesLugares } from "../lugares/useLugares";
import { HojaDelLugar } from "./HojaDelLugar";
import { MapaBase, useAnimarCamara } from "./MapaBase";

const ALTO_TARJETA = 280;
const NEUTRO = "var(--muted-foreground)";

export function MapaHuellas({
  tipo,
  lugares,
  catalogo,
  version,
  onVolver,
  onIrADia,
}: {
  tipo: TipoDiario;
  lugares: AccionesLugares;
  catalogo: Catalogo | null;
  /** Sube cuando cambió algo en el diario. */
  version: number;
  onVolver: () => void;
  onIrADia: (fecha: string) => void;
}) {
  const [huellas, setHuellas] = useState<HuellaVista[] | null>(null);
  const [camara, setCamara] = useState<Camara | null>(null);
  const [tamano, setTamano] = useState<Tamano | null>(null);
  const [ampliado, setAmpliado] = useState(false);
  /** Se movió el mapa a mano: aparece «ajustar a todos» (moodiary `_cardMoved`). */
  const [movido, setMovido] = useState(false);
  const [elegido, setElegido] = useState<number | null>(null);
  const hueco = useRef<HTMLDivElement>(null);
  const camaraViva = useRef<Camara | null>(null);
  useEffect(() => {
    camaraViva.current = camara;
  }, [camara]);
  const leer = useCallback(() => camaraViva.current, []);
  const { animar, cortar } = useAnimarCamara(leer, setCamara);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario/lugares/huellas?tipo=${tipo}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo cargar el mapa");
        if (vivo) setHuellas(d.huellas);
      })
      .catch((e) => {
        if (vivo) setHuellas([]);
        toast.error(e instanceof Error ? e.message : "No se pudo cargar el mapa");
      });
    return () => {
      vivo = false;
    };
  }, [tipo, version]);

  /** Los lugares con al menos una entrada, con sus datos, más entradas primero. */
  const filas = useMemo(() => {
    if (!huellas || !lugares.lista) return null;
    const porId = new Map(lugares.lista.map((l) => [l.id, l]));
    return ordenarHuellas(huellas).flatMap((h) => {
      const lugar = porId.get(h.lugarId);
      return lugar ? [{ huella: h, lugar }] : [];
    });
  }, [huellas, lugares.lista]);

  const puntos = useMemo(() => (filas ?? []).map((f) => ({ latitud: f.lugar.latitud, longitud: f.lugar.longitud })), [filas]);
  const hay = (filas?.length ?? 0) > 0;

  /** La vista que muestra todos los lugares: en la tarjeta con margen parejo, ampliada con espacio para los botones de arriba y abajo. */
  const vistaTodos = useCallback(
    (grande: boolean): Camara | null => {
      if (grande) {
        const t = { ancho: window.innerWidth, alto: window.innerHeight };
        return ajustarVista(puntos, t, { arriba: 72, derecha: 48, abajo: 56, izquierda: 48 });
      }
      const t = { ancho: hueco.current?.clientWidth ?? tamano?.ancho ?? 0, alto: ALTO_TARJETA };
      return t.ancho > 0 ? ajustarVista(puntos, t, rellenoUniforme(MARGEN_TARJETA)) : null;
    },
    [puntos, tamano],
  );

  // Primera vista (y cuando cambian los lugares con entradas): ajustada a todos, sin animación
  const firma = puntos.map((p) => `${p.latitud},${p.longitud}`).join("|");
  const ultimaFirma = useRef("");
  useEffect(() => {
    if (!tamano || !hay || firma === ultimaFirma.current) return;
    ultimaFirma.current = firma;
    const v = vistaTodos(ampliado);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la cámara depende del tamaño que solo se conoce después de dibujar
    if (v) setCamara(v);
    setMovido(false);
  }, [tamano, hay, firma, vistaTodos, ampliado]);

  function ajustarATodos(grande = ampliado) {
    const v = vistaTodos(grande);
    if (v) animar(v);
    setMovido(false);
  }

  function ampliar() {
    setAmpliado(true);
    const v = vistaTodos(true);
    if (v) animar(v);
  }

  const reducir = useCallback(() => {
    setAmpliado(false);
    const v = vistaTodos(false);
    if (v) animar(v);
    setMovido(false);
  }, [vistaTodos, animar]);

  // Escape cierra la vista ampliada (moodiary: el botón «atrás» del sistema)
  useEffect(() => {
    if (!ampliado) return;
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && reducir();
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [ampliado, reducir]);

  /** moodiary `_onPlaceTap`: acerca la cámara al lugar (al menos zoom 14) y abre su hoja. */
  function abrir(id: number) {
    const f = filas?.find((x) => x.lugar.id === id);
    if (!f) return;
    setElegido(id);
    if (camara) {
      animar({ latitud: f.lugar.latitud, longitud: f.lugar.longitud, zoom: Math.max(camara.zoom, ZOOM_ENFOQUE) });
      if (!ampliado) setMovido(true);
    }
  }

  const abierta = elegido === null ? null : (filas?.find((x) => x.lugar.id === elegido) ?? null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Volver al diario" onClick={onVolver}>
          <ArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">Mapa de huellas</h2>
      </div>
      {filas === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : !hay ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex size-[72px] items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <MapPinned className="size-9" aria-hidden />
          </span>
          <p className="font-medium">Aún no hay lugares con entradas</p>
          <p className="max-w-xs text-sm text-muted-foreground">Elegí un lugar al escribir una entrada y va a aparecer acá.</p>
        </div>
      ) : (
        <>
          {/* El hueco conserva el alto de la tarjeta mientras el mapa está ampliado */}
          <div ref={hueco} className="relative" style={{ height: ALTO_TARJETA }}>
            <MapaBase
              camara={camara}
              onCamara={setCamara}
              onTamano={setTamano}
              onGesto={() => {
                cortar();
                setMovido(true);
              }}
              className={ampliado ? "fixed inset-0 z-50" : "absolute inset-0 rounded-xl border"}
            >
              {(proyectar) => (
                <>
                  {filas.map(({ huella, lugar }) => {
                    const p = proyectar(lugar.latitud, lugar.longitud);
                    const esElegido = lugar.id === elegido;
                    const lado = tamanoPin(huella.cantidad, esElegido);
                    const color = colorDeIcono(lugar.icono) ?? NEUTRO;
                    const numero = textoPin(huella.cantidad, esElegido);
                    return (
                      <button
                        key={lugar.id}
                        type="button"
                        aria-label={`${lugar.nombre}: ${textoCantidad(huella.cantidad)}`}
                        title={lugar.nombre}
                        onClick={() => abrir(lugar.id)}
                        className="absolute z-[5] flex items-center justify-center rounded-full"
                        style={{ left: p.x - 26, top: p.y - 26, width: 52, height: 52 }}
                      >
                        <span className="flex items-center justify-center rounded-full transition-all duration-200" style={{ padding: esElegido ? 7 : 0, backgroundColor: `color-mix(in srgb, ${color} ${esElegido ? 24 : 0}%, transparent)` }}>
                          <span
                            className={cn("flex items-center justify-center rounded-full border-white font-semibold shadow-md transition-all duration-200", esElegido ? "border-[3px]" : "border-2")}
                            style={{ width: lado, height: lado, backgroundColor: color, color: colorDeIcono(lugar.icono) ? colorSobre(colorDeIcono(lugar.icono)!) : "var(--background)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}
                          >
                            {numero}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </MapaBase>
            {ampliado ? (
              <div className="fixed top-3 right-3 left-3 z-[60] flex items-start justify-between">
                <Button type="button" size="icon" variant="secondary" className="shadow" aria-label="Volver" onClick={reducir}>
                  <ArrowLeft />
                </Button>
                <Button type="button" size="icon" variant="secondary" className="shadow" aria-label="Ajustar a todos los lugares" title="Ajustar a todos los lugares" onClick={() => ajustarATodos(true)}>
                  <Scan />
                </Button>
              </div>
            ) : (
              <div className="absolute top-2.5 right-2.5 z-10 flex gap-2">
                {movido && (
                  <Button type="button" size="icon-sm" variant="secondary" className="shadow" aria-label="Ajustar a todos los lugares" title="Ajustar a todos los lugares" onClick={() => ajustarATodos(false)}>
                    <Scan />
                  </Button>
                )}
                <Button type="button" size="icon-sm" variant="secondary" className="shadow" aria-label="Ampliar el mapa" title="Ampliar el mapa" onClick={ampliar}>
                  <Maximize2 />
                </Button>
              </div>
            )}
          </div>
          <section aria-labelledby="lugares-del-mapa" className="flex flex-col gap-2">
            <h3 id="lugares-del-mapa" className="text-sm font-medium text-muted-foreground">
              Lugares
            </h3>
            <ul className="flex flex-col gap-2">
              {filas.map(({ huella, lugar }) => (
                <li key={lugar.id}>
                  <button type="button" onClick={() => abrir(lugar.id)} className="flex w-full items-center gap-3.5 rounded-xl border bg-card px-3.5 py-3 text-left transition hover:bg-muted">
                    <InsigniaDeLugar icono={lugar.icono} tamano={42} />
                    <span className="min-w-0 flex-1 truncate">{lugar.nombre}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">{textoCantidad(huella.cantidad)}</span>
                    <ChevronRight className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {abierta && (
        <HojaDelLugar
          tipo={tipo}
          lugar={abierta.lugar}
          huella={abierta.huella}
          catalogo={catalogo}
          version={version}
          onIrADia={onIrADia}
          onCerrar={() => setElegido(null)}
        />
      )}
    </div>
  );
}
