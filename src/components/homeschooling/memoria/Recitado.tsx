"use client";

// Propio de Ordo (lane 176, L2): la sesión de recitado. El padre tiene la tablet; el hijo recita de memoria, en voz alta, sin mirar.
// El texto se tapa; la pista y el texto completo están por si el padre necesita corregir. Se califica con cuatro botones y sigue
// el siguiente. Sin pantalla para el chico: la pantalla es del padre.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, Lightbulb, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { pista } from "@/lib/homeschooling/catolico";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { MemoriaVista } from "@/lib/homeschooling/servidor/memoria";
import { toast } from "@/lib/toast";

const NIVELES = [
  { nivel: "otra_vez", etiqueta: "No la supo", ayuda: "Mañana otra vez", clases: "border-destructive/50 text-destructive hover:bg-destructive/10" },
  { nivel: "dificil", etiqueta: "Con dudas", ayuda: "En pocos días", clases: "border-warning/60 text-warning hover:bg-warning/10" },
  { nivel: "bien", etiqueta: "Bien", ayuda: "Más adelante", clases: "border-success/60 text-success hover:bg-success/10" },
  { nivel: "facil", etiqueta: "Perfecto", ayuda: "Dentro de mucho", clases: "border-primary/60 text-primary hover:bg-primary/10" },
] as const;

export default function Recitado({ cola, alumno }: { cola: MemoriaVista[]; alumno: { id: number; nombre: string } }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [ver, setVer] = useState<"nada" | "pista" | "todo">("nada");
  const [ocupado, setOcupado] = useState(false);
  const actual = cola[i];
  const volver = `/dashboard/homeschooling/memoria?alumno=${alumno.id}`;

  const calificar = async (nivel: string) => {
    if (!actual) return;
    setOcupado(true);
    try {
      await api(`/api/homeschooling/memoria/${actual.id}`, { method: "POST", body: { nivel } });
      setVer("nada");
      setI((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(false);
    }
  };

  if (!actual) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-md flex-col items-center gap-4 p-8 text-center">
        <PartyPopper className="size-12 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{cola.length === 0 ? "Hoy no hay nada para recitar" : "¡Listo por hoy!"}</h1>
        <p className="text-muted-foreground">{cola.length === 0 ? `${alumno.nombre} está al día.` : `${alumno.nombre} recitó ${cola.length} ${cola.length === 1 ? "texto" : "textos"}.`}</p>
        <Button
          onClick={() => {
            router.push(volver);
            router.refresh();
          }}
        >
          <Check /> Terminar
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon-sm" aria-label="Volver a la memoria">
          <Link href={volver}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">
            Recitado de {alumno.nombre} · {i + 1} de {cola.length}
          </p>
          <Progress value={(i / cola.length) * 100} />
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">{actual.titulo}</h1>
        <p className="text-muted-foreground">Que lo recite de memoria, en voz alta, sin mirar la pantalla.</p>
        {ver === "pista" && <p className="text-lg leading-8 whitespace-pre-wrap text-muted-foreground">{pista(actual.texto)}</p>}
        {ver === "todo" && <p className="text-left text-lg leading-8 whitespace-pre-wrap text-foreground">{actual.texto}</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setVer(ver === "pista" ? "nada" : "pista")}>
            <Lightbulb /> Pista
          </Button>
          <Button variant="outline" size="sm" onClick={() => setVer(ver === "todo" ? "nada" : "todo")}>
            <Eye /> {ver === "todo" ? "Tapar el texto" : "Ver el texto para corregir"}
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="¿Cómo le salió?">
        {NIVELES.map((n) => (
          <button key={n.nivel} type="button" disabled={ocupado} onClick={() => calificar(n.nivel)} className={`flex min-h-20 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-2 py-3 text-base font-semibold transition-colors disabled:opacity-50 ${n.clases}`}>
            {ocupado ? <Spinner /> : n.etiqueta}
            <span className="text-xs font-normal text-muted-foreground">{n.ayuda}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
