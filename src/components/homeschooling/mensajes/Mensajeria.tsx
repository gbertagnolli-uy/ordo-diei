"use client";

// Propio de Ordo (lane 191, G7): mensajes directos entre los integrantes de la familia — lista de personas a la izquierda y la
// conversación a la derecha (en el teléfono, una a la vez). Inspirado en vendor/roost/src/components/messages/ (ChatView,
// ConversationList, MessageBubble) sin adjuntos ni grupos. No hay tiempo real: mientras está abierta consulta cada 8 segundos.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { haceCuanto, MAX_COMENTARIO } from "@/lib/homeschooling/comentarios";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { Interlocutor, MensajeVista } from "@/lib/homeschooling/servidor/mensajes";
import { toast } from "@/lib/toast";

const HORA = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });
const DIA = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short" });

export default function Mensajeria({ personas: inicial, conInicial }: { personas: Interlocutor[]; conInicial: number | null }) {
  const [personas, setPersonas] = useState(inicial);
  const [con, setCon] = useState<number | null>(conInicial);
  const [mensajes, setMensajes] = useState<MensajeVista[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const ultimoId = useRef(0);

  const persona = personas.find((p) => p.id === con) ?? null;

  const recargarLista = useCallback(async () => {
    try {
      const r = await api<{ personas: Interlocutor[] }>("/api/homeschooling/mensajes");
      setPersonas(r.personas);
    } catch {
      // la lista se queda como estaba
    }
  }, []);

  const leerHilo = useCallback(async (id: number) => {
    const m = await api<MensajeVista[]>(`/api/homeschooling/mensajes/${id}`);
    setMensajes(m);
    return m;
  }, []);

  // Al elegir a alguien: se carga la conversación y se vuelve a consultar cada 8 s mientras la pestaña está visible
  useEffect(() => {
    if (con === null) return;
    let vigente = true;
    ultimoId.current = 0;
    const cargar = () => {
      if (document.visibilityState !== "visible") return;
      leerHilo(con)
        .then((m) => {
          if (!vigente) return;
          const nuevoUltimo = m.at(-1)?.id ?? 0;
          if (nuevoUltimo !== ultimoId.current) {
            ultimoId.current = nuevoUltimo;
            requestAnimationFrame(() => fin.current?.scrollIntoView({ block: "end" }));
            void recargarLista();
          }
        })
        .catch((e) => vigente && toast.error(e instanceof Error ? e.message : "No se pudo cargar la conversación"));
    };
    cargar();
    const t = setInterval(cargar, 8000);
    return () => {
      vigente = false;
      clearInterval(t);
    };
  }, [con, leerHilo, recargarLista]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || con === null || enviando) return;
    setEnviando(true);
    try {
      const nuevo = await api<MensajeVista>("/api/homeschooling/mensajes", { method: "POST", body: { paraId: con, texto: t } });
      setMensajes((m) => [...(m ?? []), nuevo]);
      ultimoId.current = nuevo.id;
      setTexto("");
      requestAnimationFrame(() => fin.current?.scrollIntoView({ block: "end", behavior: "smooth" }));
      void recargarLista();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100svh-7.5rem)] min-h-96 w-full min-w-0 max-w-5xl gap-0 overflow-hidden p-0 sm:gap-4 sm:p-6">
      {/* Lista de personas */}
      <aside aria-label="Personas" className={`w-full shrink-0 overflow-y-auto border-r sm:w-72 sm:rounded-xl sm:border ${con !== null ? "hidden sm:block" : ""}`}>
        <h1 className="border-b p-4 text-lg font-bold text-foreground">Mensajes</h1>
        <ul>
          {personas.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => { setMensajes(null); setCon(p.id); }} aria-current={p.id === con ? "true" : undefined} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${p.id === con ? "bg-primary/10" : ""}`}>
                <Avatar>
                  {p.fotoUrl && <AvatarImage src={p.fotoUrl} alt="" />}
                  <AvatarFallback>{p.nombre.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-medium text-foreground">{p.nombre}</span>
                    {p.ultimo && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{haceCuanto(p.ultimo.creadoEn)}</span>}
                  </span>
                  <span className={`block truncate text-xs ${p.sinLeer > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{p.ultimo ? `${p.ultimo.deMi ? "Vos: " : ""}${p.ultimo.texto}` : p.esPadre ? "Papá o mamá" : "Escribile un mensaje"}</span>
                </span>
                {p.sinLeer > 0 && <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">{p.sinLeer}</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Conversación */}
      <section aria-label="Conversación" className={`flex min-w-0 flex-1 flex-col sm:rounded-xl sm:border ${con === null ? "hidden sm:flex" : "flex"}`}>
        {!persona ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">Elegí con quién querés hablar.</div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b p-3">
              <Button variant="ghost" size="icon-sm" className="sm:hidden" aria-label="Volver a la lista" onClick={() => setCon(null)}>
                <ArrowLeft />
              </Button>
              <Avatar size="sm">
                {persona.fotoUrl && <AvatarImage src={persona.fotoUrl} alt="" />}
                <AvatarFallback>{persona.nombre.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="font-semibold text-foreground">{persona.nombre}</h2>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite" aria-label={`Conversación con ${persona.nombre}`}>
              {mensajes === null ? (
                <Skeleton className="h-12 w-2/3 rounded-2xl" />
              ) : mensajes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay mensajes. Escribí el primero.</p>
              ) : (
                mensajes.map((m, i) => {
                  const nuevoDia = i === 0 || new Date(mensajes[i - 1].creadoEn).toDateString() !== new Date(m.creadoEn).toDateString();
                  return (
                    <div key={m.id}>
                      {nuevoDia && <p className="my-3 text-center text-xs text-muted-foreground capitalize">{DIA.format(new Date(m.creadoEn))}</p>}
                      <div className={`flex ${m.deMi ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.deMi ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground"}`}>
                          <p className="break-words whitespace-pre-wrap">{m.texto}</p>
                          <p className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${m.deMi ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {HORA.format(new Date(m.creadoEn))}
                            {m.deMi && (m.leido ? <CheckCheck className="size-3" aria-label="Leído" /> : <Check className="size-3" aria-label="Enviado" />)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={fin} />
            </div>
            <footer className="flex items-end gap-2 border-t p-3">
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar();
                  }
                }}
                rows={1}
                maxLength={MAX_COMENTARIO}
                placeholder={`Escribile a ${persona.nombre}…`}
                aria-label="Mensaje"
                className="max-h-32 min-h-10 resize-none"
              />
              <Button onClick={enviar} disabled={enviando || !texto.trim()} aria-label="Enviar mensaje">
                {enviando ? <Spinner /> : <Send />}
              </Button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
