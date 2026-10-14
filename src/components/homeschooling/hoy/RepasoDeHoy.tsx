"use client";

// Propio de Ordo: «Repaso de hoy» — hasta 3 mini-preguntas de lecciones que costaron, antes de las lecciones nuevas.

import { useEffect, useState } from "react";
import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

type Repaso = { tarjetaId: number; leccion: { id: number; titulo: string }; materia: string; pregunta: { id: number; enunciado: string; opciones: string[] } };
type Respuesta = { correcta: boolean; explicacion: string | null };

export default function RepasoDeHoy() {
  const [repasos, setRepasos] = useState<Repaso[]>([]);
  const [resultados, setResultados] = useState<Record<number, Respuesta>>({});

  useEffect(() => {
    let vigente = true;
    api<Repaso[]>("/api/homeschooling/repasos/hoy")
      .then((r) => vigente && setRepasos(r))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, []);

  const responder = async (r: Repaso, i: number) => {
    try {
      const res = await api<Respuesta>(`/api/homeschooling/repasos/${r.tarjetaId}`, { method: "POST", body: { preguntaId: r.pregunta.id, elegida: i } });
      setResultados((x) => ({ ...x, [r.tarjetaId]: res }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo responder");
    }
  };

  if (repasos.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4" aria-label="Repaso de hoy">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Brain className="size-5 text-primary" /> Repaso de hoy
      </h2>
      {repasos.map((r) => {
        const res = resultados[r.tarjetaId];
        return (
          <div key={r.tarjetaId} className="space-y-2 rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">
              {r.materia} · {r.leccion.titulo}
            </p>
            <p className="font-medium text-foreground">{r.pregunta.enunciado}</p>
            {!res ? (
              <div className="grid gap-2">
                {r.pregunta.opciones.map((o, i) => (
                  <Button key={i} variant="outline" className="h-auto min-h-11 justify-start whitespace-normal py-2 text-left" onClick={() => responder(r, i)}>
                    {o}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <p className={`flex items-center gap-2 font-medium ${res.correcta ? "text-success" : "text-destructive"}`}>
                  {res.correcta ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />} {res.correcta ? "¡Bien!" : "Lo vemos otra vez más adelante"}
                </p>
                {res.explicacion && <p className="text-muted-foreground">{res.explicacion}</p>}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
