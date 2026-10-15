"use client";

// Propio de Ordo: quiz final de una lección (radio-group de ui/). Las preguntas llegan sin la respuesta correcta; la nota la
// calcula el servidor. Si no aprueba: «Repasemos» con vuelta al video.

import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

type Pregunta = { id: number; enunciado: string; opciones: string[] };
export type ResultadoQuiz = {
  nota: number;
  aprobado: boolean;
  umbral: number;
  detalle: { preguntaId: number; acierto: boolean; explicacion: string | null }[];
  ultimaDelDia: boolean;
  tareaId: number | null;
};

export default function QuizFinal({
  leccionId,
  onAprobado,
  onRepasar,
}: {
  leccionId: number;
  onAprobado: (r: ResultadoQuiz) => void;
  onRepasar: () => void;
}) {
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null);

  useEffect(() => {
    let vigente = true;
    setPreguntas(null);
    setRespuestas({});
    setResultado(null);
    api<Pregunta[]>(`/api/homeschooling/lecciones/${leccionId}/preguntas?tipo=final`)
      .then((p) => vigente && setPreguntas(p))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar el quiz"));
    return () => {
      vigente = false;
    };
  }, [leccionId]);

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await api<ResultadoQuiz>(`/api/homeschooling/lecciones/${leccionId}/calificar`, { method: "POST", body: { respuestas } });
      setResultado(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo calificar");
    } finally {
      setEnviando(false);
    }
  };

  if (!preguntas) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <p className={`flex items-center gap-2 text-xl font-bold ${resultado.aprobado ? "text-success" : "text-destructive"}`}>
          {resultado.aprobado ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
          {resultado.aprobado ? `¡Aprobaste! ${resultado.nota} %` : `${resultado.nota} %: hace falta ${resultado.umbral} %`}
        </p>
        <ul className="space-y-2 text-sm">
          {preguntas.map((p) => {
            const d = resultado.detalle.find((x) => x.preguntaId === p.id);
            return (
              <li key={p.id} className="rounded-lg border p-3">
                <p className="font-medium text-foreground">{p.enunciado}</p>
                <p className={d?.acierto ? "text-success" : "text-destructive"}>{d?.acierto ? "Bien" : "Para repasar"}</p>
                {d?.explicacion && <p className="text-muted-foreground">{d.explicacion}</p>}
              </li>
            );
          })}
        </ul>
        {resultado.aprobado ? (
          <Button size="lg" className="w-full" onClick={() => onAprobado(resultado)}>
            Seguir
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="w-full" onClick={onRepasar}>
            <RotateCcw /> Repasemos
          </Button>
        )}
      </div>
    );
  }

  const completo = preguntas.every((p) => respuestas[p.id] !== undefined);
  return (
    <div className="space-y-5 rounded-xl border bg-card p-5">
      <h3 className="text-lg font-bold text-foreground">Quiz de la lección</h3>
      {preguntas.map((p, n) => (
        <fieldset key={p.id} className="space-y-2">
          <legend className="mb-1 font-medium text-foreground">
            {n + 1}. {p.enunciado}
          </legend>
          <RadioGroup value={respuestas[p.id] === undefined ? "" : String(respuestas[p.id])} onValueChange={(v) => setRespuestas((r) => ({ ...r, [p.id]: Number(v) }))}>
            {p.opciones.map((o, i) => (
              <div key={i} className="flex min-h-11 items-center gap-3 rounded-lg border px-3">
                <RadioGroupItem value={String(i)} id={`q${p.id}-${i}`} />
                <Label htmlFor={`q${p.id}-${i}`} className="flex-1 cursor-pointer py-2 text-sm">
                  {o}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      ))}
      <Button size="lg" className="w-full" disabled={!completo || enviando} onClick={enviar}>
        {enviando && <Spinner />} Entregar
      </Button>
    </div>
  );
}
