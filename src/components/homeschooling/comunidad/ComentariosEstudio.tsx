"use client";

// Propio de Ordo (lane 174, Q1): la conversación de la familia sobre una lección, un material o una evidencia — comentarios con
// reacciones (👍 ❤️ 🙏), de padres e hijos. Portado en espíritu de vendor/roost/src/components/feed/CommentSection.tsx
// (msrbuilds/roost@492af47) sin anidado, votos ni menciones: una familia, una lista corta, pensada para hablar en casa.
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { EMOJIS, haceCuanto, MAX_COMENTARIO, type Emoji } from "@/lib/homeschooling/comentarios";
import { api, consulta } from "@/lib/homeschooling/roost/services/http";
import type { ComentarioVista, Conversacion, DestinoComentario, ResumenReacciones } from "@/lib/homeschooling/servidor/comentarios";
import { toast } from "@/lib/toast";

const consultaDe = (d: DestinoComentario) => consulta(d as Record<string, number>);

function Reacciones({ resumen, onAlternar, compacto }: { resumen: ResumenReacciones; onAlternar: (e: Emoji) => void; compacto?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Reacciones">
      {EMOJIS.map((e) => {
        const r = resumen[e];
        if (compacto && r.total === 0 && !r.mia) return null;
        return (
          <button
            key={e}
            type="button"
            onClick={() => onAlternar(e)}
            aria-pressed={r.mia}
            aria-label={`${e} ${r.total}`}
            className={`flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors ${r.mia ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <span aria-hidden>{e}</span>
            {r.total > 0 && <span className="tabular-nums">{r.total}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function ComentariosEstudio({ destino, titulo = "Comentarios", placeholder = "Escribí un comentario…" }: { destino: DestinoComentario; titulo?: string; placeholder?: string }) {
  const clave = JSON.stringify(destino);
  const [datos, setDatos] = useState<Conversacion | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  const leer = useCallback(() => api<Conversacion>(`/api/homeschooling/comentarios${consultaDe(JSON.parse(clave) as DestinoComentario)}`), [clave]);

  useEffect(() => {
    let vigente = true;
    leer()
      .then((d) => vigente && setDatos(d))
      .catch((e) => {
        if (!vigente) return;
        setDatos({ comentarios: [], reacciones: null });
        toast.error(e instanceof Error ? e.message : "No se pudieron cargar los comentarios");
      });
    return () => {
      vigente = false;
    };
  }, [leer]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    try {
      const nuevo = await api<ComentarioVista>("/api/homeschooling/comentarios", { method: "POST", body: { destino, texto: t } });
      setDatos((d) => (d ? { ...d, comentarios: [...d.comentarios, nuevo] } : d));
      setTexto("");
      requestAnimationFrame(() => fin.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (c: ComentarioVista) => {
    if (!window.confirm("¿Borrar este comentario?")) return;
    try {
      await api(`/api/homeschooling/comentarios/${c.id}`, { method: "DELETE" });
      setDatos((d) => (d ? { ...d, comentarios: d.comentarios.filter((x) => x.id !== c.id) } : d));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    }
  };

  const reaccionar = async (objetivo: { comentarioId: number } | { evidenciaId: number } | { publicacionId: number }, emoji: Emoji) => {
    try {
      const r = await api<ResumenReacciones>("/api/homeschooling/reacciones", { method: "POST", body: { objetivo, emoji } });
      setDatos((d) => {
        if (!d) return d;
        if ("evidenciaId" in objetivo || "publicacionId" in objetivo) return { ...d, reacciones: r };
        return { ...d, comentarios: d.comentarios.map((c) => (c.id === objetivo.comentarioId ? { ...c, reacciones: r } : c)) };
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reaccionar");
    }
  };

  return (
    <section aria-label={titulo} className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {titulo}
        {datos && datos.comentarios.length > 0 && <span className="ml-1.5 font-normal text-muted-foreground">({datos.comentarios.length})</span>}
      </h3>

      {datos?.reacciones && ("evidenciaId" in destino || "publicacionId" in destino) && (
        <Reacciones resumen={datos.reacciones} onAlternar={(e) => reaccionar("evidenciaId" in destino ? { evidenciaId: destino.evidenciaId } : { publicacionId: destino.publicacionId }, e)} />
      )}

      {datos === null ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : datos.comentarios.length === 0 ? (
        <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">Todavía no hay comentarios. Escribí el primero.</p>
      ) : (
        <ul className="space-y-3">
          {datos.comentarios.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Avatar size="sm" className="mt-0.5 shrink-0">
                {c.autor.fotoUrl && <AvatarImage src={c.autor.fotoUrl} alt="" />}
                <AvatarFallback>{c.autor.nombre.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                    <span className="text-sm font-semibold text-foreground">{c.autor.nombre}</span>
                    {c.autor.esPadre && <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-medium text-primary">papá/mamá</span>}
                    <span>{haceCuanto(c.creadoEn)}</span>
                  </p>
                  <p className="text-sm whitespace-pre-wrap break-words text-foreground">{c.texto}</p>
                </div>
                <div className="flex items-center gap-2 pl-1">
                  <Reacciones resumen={c.reacciones} onAlternar={(e) => reaccionar({ comentarioId: c.id }, e)} compacto />
                  {c.puedeBorrar && (
                    <Button variant="ghost" size="icon-xs" aria-label="Borrar comentario" className="ml-auto text-muted-foreground" onClick={() => borrar(c)}>
                      <Trash2 />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div ref={fin} />

      <div className="space-y-1.5">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={2}
          maxLength={MAX_COMENTARIO}
          placeholder={placeholder}
          aria-label="Escribir un comentario"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Ctrl + Enter para enviar</p>
          <Button size="sm" onClick={enviar} disabled={enviando || !texto.trim()}>
            {enviando ? <Spinner /> : <Send />} Enviar
          </Button>
        </div>
      </div>
    </section>
  );
}
