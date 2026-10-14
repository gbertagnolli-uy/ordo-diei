"use client";

// Propio de Ordo: pregunta que interrumpe el video (checkpoint). Botones grandes. Acierto → «Continuar»;
// fallo → la explicación y «Volver 30 s». La corrección la hace el servidor.

import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

export type PreguntaCheckpoint = { id: number; segundoVideo: number | null; enunciado: string; opciones: string[] };

export default function CheckpointOverlay({
  leccionId,
  pregunta,
  onAcierto,
  onFallo,
}: {
  leccionId: number;
  pregunta: PreguntaCheckpoint;
  /** El niño contestó bien: seguir con el video */
  onAcierto: () => void;
  /** Contestó mal: volver 30 s (la misma pregunta vuelve a salir) */
  onFallo: () => void;
}) {
  const [cargando, setCargando] = useState<number | null>(null);
  const [resultado, setResultado] = useState<{ correcta: boolean; explicacion: string | null } | null>(null);

  const elegir = async (i: number) => {
    setCargando(i);
    try {
      setResultado(await api(`/api/homeschooling/lecciones/${leccionId}/checkpoint`, { method: "POST", body: { preguntaId: pregunta.id, elegida: i } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo responder");
    } finally {
      setCargando(null);
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto bg-background/95 p-4" role="dialog" aria-label="Pregunta del video">
      <div className="w-full max-w-lg space-y-4">
        <p className="text-lg font-semibold text-foreground">{pregunta.enunciado}</p>
        {!resultado ? (
          <div className="grid gap-2">
            {pregunta.opciones.map((o, i) => (
              <Button key={i} variant="outline" size="lg" className="h-auto min-h-12 justify-start whitespace-normal py-3 text-left" disabled={cargando !== null} onClick={() => elegir(i)}>
                {cargando === i && <Spinner />} {o}
              </Button>
            ))}
          </div>
        ) : resultado.correcta ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-medium text-success">
              <CheckCircle2 className="size-5" /> ¡Correcto!
            </p>
            {resultado.explicacion && <p className="text-sm text-muted-foreground">{resultado.explicacion}</p>}
            <Button size="lg" className="w-full" onClick={onAcierto}>
              Continuar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-medium text-destructive">
              <XCircle className="size-5" /> Todavía no
            </p>
            {resultado.explicacion && <p className="text-sm text-muted-foreground">{resultado.explicacion}</p>}
            <Button size="lg" variant="outline" className="w-full" onClick={onFallo}>
              <RotateCcw /> Volver 30 s
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
