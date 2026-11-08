"use client";
// Portado de vendor/Daily_You/lib/pages/audio_recorder_page.dart y widgets/audio_waveform_decoration.dart (Demizo/Daily_You@7cc237d)
// Lane 294. Grabadora de notas de voz con MediaRecorder: grabar, pausar y seguir, descartar (pide confirmar pasados 3 s),
// guardar (mínimo 1 s), se pausa sola si la página pasa a segundo plano, calidad alta / media / baja y onda animada con semilla.
// Cambios: en la web el micrófono lo pide el navegador (no `permission_handler`), el archivo sale de un `Blob` (no de un temporal en disco)
// y la grabación se corta sola antes de pasar los 4 MB que admite el servidor.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Mic, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  CALIDADES_VOZ,
  CALIDAD_VOZ_PREDETERMINADA,
  bpsDe,
  barrasDeOnda,
  elegirMimeDeGrabacion,
  esCalidadVoz,
  extensionDeGrabacion,
  formatearTiempo,
  limiteDeGrabacionSeg,
  nombreDeNotaDeVoz,
  pideConfirmarDescarte,
  puedeGuardarGrabacion,
  type CalidadVoz,
} from "@/lib/diario/adjuntos";
import { toast } from "@/lib/toast";
import { usePreferencia } from "../../estadisticas/controles";

type Fase = "inactiva" | "iniciando" | "grabando" | "pausada" | "guardando";
type Confirmar = "descartar" | "reiniciar" | null;

const BARRAS = 41;
const PASO_ONDA_MS = 60;

function nombreDeHoy(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, "0");
  return nombreDeNotaDeVoz(`${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`, d.getHours() * 60 + d.getMinutes());
}

interface Props {
  /** Recibe la nota de voz ya grabada; el que llama la sube y la inserta. */
  onGuardar: (archivo: File) => void | Promise<void>;
  onCerrar: () => void;
}

export function GrabadoraDeVoz({ onGuardar, onCerrar }: Props) {
  const [fase, setFase] = useState<Fase>("inactiva");
  const [segundos, setSegundos] = useState(0);
  const [fasOnda, setFaseOnda] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Confirmar>(null);
  const [calidad, setCalidad] = usePreferencia<CalidadVoz>("diario.voz.calidad", CALIDAD_VOZ_PREDETERMINADA, esCalidadVoz);
  const semilla = useMemo(() => Date.now() % 2_147_483_647, []);

  const grabadora = useRef<MediaRecorder | null>(null);
  const flujo = useRef<MediaStream | null>(null);
  const trozos = useRef<Blob[]>([]);
  const acumuladoMs = useRef(0);
  const inicioTramo = useRef<number | null>(null);
  const terminando = useRef(false);
  const activa = useRef(true);

  const transcurridoMs = useCallback(() => acumuladoMs.current + (inicioTramo.current === null ? 0 : performance.now() - inicioTramo.current), []);

  const soltarMicrofono = useCallback(() => {
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
    grabadora.current = null;
  }, []);

  const pausar = useCallback(() => {
    const g = grabadora.current;
    if (!g || g.state !== "recording") return;
    g.pause();
    acumuladoMs.current = transcurridoMs();
    inicioTramo.current = null;
    setFase("pausada");
  }, [transcurridoMs]);

  const seguir = useCallback(() => {
    const g = grabadora.current;
    if (!g || g.state !== "paused") return;
    g.resume();
    inicioTramo.current = performance.now();
    setFase("grabando");
  }, []);

  async function iniciar() {
    if (fase !== "inactiva" && fase !== "iniciando") return;
    setError(null);
    setFase("iniciando");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Este navegador no puede grabar audio.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      if (!activa.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      flujo.current = stream;
      const mime = elegirMimeDeGrabacion((m) => MediaRecorder.isTypeSupported(m));
      const g = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: bpsDe(calidad) });
      trozos.current = [];
      g.ondataavailable = (e) => {
        if (e.data.size > 0) trozos.current.push(e.data);
      };
      acumuladoMs.current = 0;
      g.start(1000);
      grabadora.current = g;
      inicioTramo.current = performance.now();
      setSegundos(0);
      setFase("grabando");
    } catch (e) {
      soltarMicrofono();
      setFase("inactiva");
      const negado = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setError(
        negado
          ? "No hay permiso para usar el micrófono. Habilitalo desde el candado de la barra de direcciones y probá de nuevo."
          : e instanceof DOMException && e.name === "NotFoundError"
            ? "No se encontró ningún micrófono."
            : e instanceof Error
              ? e.message
              : "No se pudo empezar a grabar.",
      );
    }
  }

  /** Daily You `_finish`: con `guardar` y al menos 1 s sale la nota de voz; si no, se descarta. */
  const terminar = useCallback(
    async (guardar: boolean) => {
      const g = grabadora.current;
      if (terminando.current) return;
      terminando.current = true;
      if (!g) {
        terminando.current = false;
        onCerrar();
        return;
      }
      setFase("guardando");
      const ms = transcurridoMs();
      inicioTramo.current = null;
      const conservar = guardar && puedeGuardarGrabacion(ms / 1000);
      const mime = g.mimeType || "audio/webm";
      await new Promise<void>((resolver) => {
        if (g.state === "inactive") return resolver();
        g.onstop = () => resolver();
        g.stop();
      });
      soltarMicrofono();
      if (conservar && trozos.current.length) {
        const blob = new Blob(trozos.current, { type: mime });
        const archivo = new File([blob], `${nombreDeHoy()}.${extensionDeGrabacion(mime)}`, { type: blob.type });
        trozos.current = [];
        try {
          await onGuardar(archivo);
        } catch {
          /* quien llama ya avisó el error */
        }
      }
      trozos.current = [];
      onCerrar();
    },
    [onCerrar, onGuardar, soltarMicrofono, transcurridoMs],
  );

  // Reloj, onda y tope de la grabación
  useEffect(() => {
    if (fase !== "grabando" && fase !== "pausada") return;
    const limite = limiteDeGrabacionSeg(bpsDe(calidad));
    const reloj = setInterval(() => {
      const s = Math.floor(transcurridoMs() / 1000);
      setSegundos(s);
      if (s >= limite) {
        toast.info("Llegaste al máximo de la nota de voz (4 MB): se guardó lo grabado.");
        void terminar(true);
      }
    }, 250);
    const onda = fase === "grabando" ? setInterval(() => setFaseOnda((f) => (f + PASO_ONDA_MS / 1600) % 1), PASO_ONDA_MS) : null;
    return () => {
      clearInterval(reloj);
      if (onda) clearInterval(onda);
    };
  }, [fase, calidad, transcurridoMs, terminar]);

  // Daily You `didChangeAppLifecycleState`: si la página pasa a segundo plano se pausa sola
  useEffect(() => {
    const alCambiar = () => {
      if (document.visibilityState === "hidden") pausar();
    };
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, [pausar]);

  // Al cerrar el diálogo sin guardar se corta el micrófono
  useEffect(() => {
    activa.current = true;
    return () => {
      activa.current = false;
      const g = grabadora.current;
      if (g && g.state !== "inactive") {
        g.onstop = null;
        g.stop();
      }
      flujo.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function pedirDescarte(que: Exclude<Confirmar, null>) {
    if (fase === "guardando") return;
    if (fase === "inactiva" || fase === "iniciando" || !pideConfirmarDescarte(transcurridoMs() / 1000)) {
      if (que === "descartar") void terminar(false);
      else reiniciar();
      return;
    }
    setConfirmar(que);
  }

  function reiniciar() {
    const g = grabadora.current;
    if (g && g.state !== "inactive") {
      g.onstop = null;
      g.stop();
    }
    soltarMicrofono();
    trozos.current = [];
    acumuladoMs.current = 0;
    inicioTramo.current = null;
    setSegundos(0);
    setConfirmar(null);
    setFase("inactiva");
  }

  const grabandoAhora = fase === "grabando";
  const ocupada = fase === "iniciando" || fase === "guardando";
  const empezo = fase === "grabando" || fase === "pausada";
  const barras = barrasDeOnda(semilla, BARRAS, fasOnda, grabandoAhora ? 1 : 0);

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && pedirDescarte("descartar")}>
      <DialogContent className="sm:max-w-sm" showCloseButton={!ocupada}>
        <DialogHeader>
          <DialogTitle>Nota de voz</DialogTitle>
          <DialogDescription>Se agrega al texto como un audio que podés escuchar y adelantar.</DialogDescription>
        </DialogHeader>

        <div className="md-voz">
          <div className="md-voz__onda" data-quieta={!grabandoAhora} aria-hidden>
            {barras.map((h, i) => (
              <span key={i} className="md-voz__barra" style={{ height: `${Math.max(4, Math.round(Math.min(1, h) * 72))}px` }} />
            ))}
          </div>
          <p className="text-center text-3xl font-bold tabular-nums" aria-live="off">
            {formatearTiempo(segundos)}
          </p>
          {!empezo && fase !== "guardando" && (
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Calidad</span>
              <NativeSelect size="sm" value={calidad} onChange={(e) => esCalidadVoz(e.target.value) && setCalidad(e.target.value)} aria-label="Calidad de la grabación">
                {CALIDADES_VOZ.map((c) => (
                  <NativeSelectOption key={c.valor} value={c.valor}>
                    {c.titulo} ({c.bps / 1000} kb/s)
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {confirmar ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm" role="alertdialog" aria-label="Confirmar">
            <p>{confirmar === "descartar" ? "¿Descartar la grabación? Se pierde lo que grabaste." : "¿Volver a empezar? Se pierde lo que grabaste."}</p>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setConfirmar(null)}>
                Seguir grabando
              </Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => (confirmar === "descartar" ? void terminar(false) : reiniciar())}>
                Descartar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-6">
            <Button type="button" size="icon-lg" variant="secondary" aria-label="Descartar y volver a empezar" disabled={!empezo} onClick={() => pedirDescarte("reiniciar")}>
              <Trash2 />
            </Button>
            <Button
              type="button"
              size="icon-lg"
              className={grabandoAhora ? "size-16 rounded-xl" : "size-16 rounded-full"}
              aria-label={fase === "inactiva" || fase === "iniciando" ? "Empezar a grabar" : grabandoAhora ? "Pausar" : "Seguir grabando"}
              disabled={ocupada}
              onClick={() => (fase === "inactiva" ? void iniciar() : grabandoAhora ? pausar() : seguir())}
            >
              {fase === "inactiva" || fase === "iniciando" ? <Mic /> : grabandoAhora ? <Pause /> : <Play />}
            </Button>
            <Button type="button" size="icon-lg" aria-label="Guardar nota de voz" disabled={!empezo} onClick={() => void terminar(true)}>
              <Check />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
