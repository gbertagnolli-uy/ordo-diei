"use client";

// Propio de Ordo: quiz final de una lección, una pregunta por vez (lane 186): barra de avance, opciones grandes que se eligen con
// un toque o con las teclas 1–4 / a–d, y una pantalla de repaso antes de entregar. Las preguntas llegan sin la respuesta
// correcta; la nota la calcula el servidor. Si no aprueba: «Repasemos» con vuelta al video.

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { mensajeDeNota, opcionPorTecla, primeraSinResponder, respondidas } from "@/lib/homeschooling/quizFlujo";
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
  // Posición: 0..n-1 = pregunta; n = pantalla de repaso
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    let vigente = true;
    setPreguntas(null);
    setRespuestas({});
    setResultado(null);
    setPaso(0);
    api<Pregunta[]>(`/api/homeschooling/lecciones/${leccionId}/preguntas?tipo=final`)
      .then((p) => vigente && setPreguntas(p))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar el quiz"));
    return () => {
      vigente = false;
    };
  }, [leccionId]);

  // Teclas 1–4 / a–d eligen la opción; Enter avanza; Retroceso vuelve (si no se está escribiendo)
  useEffect(() => {
    if (!preguntas || resultado || paso >= preguntas.length) return;
    const p = preguntas[paso];
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const opcion = opcionPorTecla(e.key, p.opciones.length);
      if (opcion !== null) setRespuestas((r) => ({ ...r, [p.id]: opcion }));
      else if (e.key === "Enter" && respuestas[p.id] !== undefined) setPaso((n) => n + 1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [preguntas, resultado, paso, respuestas]);

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
    const aciertos = resultado.detalle.filter((d) => d.acierto).length;
    return (
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="space-y-1">
          <p className={`flex items-center gap-2 text-2xl font-bold ${resultado.aprobado ? "text-success" : "text-destructive"}`}>
            {resultado.aprobado ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
            {resultado.nota} %
          </p>
          <p className="text-base text-foreground">{mensajeDeNota(resultado.nota, resultado.umbral)}</p>
          <p className="text-sm text-muted-foreground">
            {aciertos} de {preguntas.length} bien · para aprobar hace falta {resultado.umbral} %
          </p>
        </div>
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
          <Button size="lg" className="h-14 w-full text-lg" onClick={() => onAprobado(resultado)}>
            Seguir
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="h-14 w-full text-lg" onClick={onRepasar}>
            <RotateCcw /> Repasemos
          </Button>
        )}
      </div>
    );
  }

  const ids = preguntas.map((p) => p.id);
  const hechas = respondidas(ids, respuestas);

  // Pantalla de repaso: qué falta y entregar
  if (paso >= preguntas.length) {
    const falta = primeraSinResponder(ids, respuestas);
    return (
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <h3 className="text-xl font-bold text-foreground">¿Listo para entregar?</h3>
        <ol className="space-y-2">
          {preguntas.map((p, n) => (
            <li key={p.id}>
              <button type="button" onClick={() => setPaso(n)} className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm hover:bg-muted">
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${respuestas[p.id] === undefined ? "bg-warning/20 text-foreground" : "bg-success/20 text-foreground"}`}>{n + 1}</span>
                <span className="min-w-0 flex-1 truncate text-foreground">{p.enunciado}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{respuestas[p.id] === undefined ? "sin responder" : "respondida"}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="flex gap-2">
          <Button size="lg" variant="outline" className="h-12" onClick={() => setPaso(preguntas.length - 1)}>
            <ArrowLeft /> Volver
          </Button>
          {falta >= 0 ? (
            <Button size="lg" className="h-12 flex-1" onClick={() => setPaso(falta)}>
              Responder la {falta + 1}
            </Button>
          ) : (
            <Button size="lg" className="h-12 flex-1" disabled={enviando} onClick={enviar}>
              {enviando && <Spinner />} Entregar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const p = preguntas[paso];
  const elegida = respuestas[p.id];
  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-muted-foreground">
          Pregunta {paso + 1} de {preguntas.length}
        </p>
        <Progress value={(hechas / preguntas.length) * 100} aria-label={`${hechas} de ${preguntas.length} respondidas`} />
      </div>
      <h3 className="text-xl leading-snug font-bold text-foreground">{p.enunciado}</h3>
      <div role="radiogroup" aria-label={p.enunciado} className="space-y-2.5">
        {p.opciones.map((o, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={elegida === i}
            onClick={() => setRespuestas((r) => ({ ...r, [p.id]: i }))}
            className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base transition-colors ${elegida === i ? "border-primary bg-primary/10 font-medium text-foreground" : "bg-background text-foreground hover:bg-muted"}`}
          >
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${elegida === i ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{String.fromCharCode(65 + i)}</span>
            {o}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="lg" variant="outline" className="h-12" disabled={paso === 0} onClick={() => setPaso((n) => n - 1)}>
          <ArrowLeft /> Anterior
        </Button>
        <Button size="lg" className="h-12 flex-1" disabled={elegida === undefined} onClick={() => setPaso((n) => n + 1)}>
          {paso === preguntas.length - 1 ? "Revisar" : "Siguiente"} <ArrowRight />
        </Button>
      </div>
      <p className="hidden text-center text-xs text-muted-foreground sm:block">Podés elegir con las teclas 1–4 y avanzar con Enter.</p>
    </div>
  );
}
