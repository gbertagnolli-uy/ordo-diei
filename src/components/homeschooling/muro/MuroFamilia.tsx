"use client";

// Propio de Ordo (lane 184, Q2): el muro de la familia. Arriba, qué se celebra hoy en la Iglesia; después, los avisos de papá y mamá
// y los logros que la app anota sola. Cada publicación admite reacciones y comentarios de todos en casa. Inspirado en el feed de
// Roost (vendor/roost/src/components/feed/) pero de una sola familia: sin categorías, sin seguidores, sin menciones.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Church, MessageCircle, Megaphone, Pin, PinOff, Plus, Trophy } from "lucide-react";
import { AdminItem } from "@/components/AdminItem";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import ComentariosEstudio from "@/components/homeschooling/comunidad/ComentariosEstudio";
import { haceCuanto } from "@/lib/homeschooling/comentarios";
import { colorLiturgico } from "@/lib/homeschooling/muro";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { Muro, PublicacionVista } from "@/lib/homeschooling/servidor/muro";
import { toast } from "@/lib/toast";

const PUNTO: Record<string, string> = { blanco: "bg-white border", rojo: "bg-red-600", verde: "bg-green-600", morado: "bg-purple-700", negro: "bg-black", rosa: "bg-pink-400" };

export default function MuroFamilia({ muro, esPadre }: { muro: Muro; esPadre: boolean }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [fijar, setFijar] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [editando, setEditando] = useState<{ id: number; titulo: string; cuerpo: string } | null>(null);

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setPublicando(true);
    try {
      await api("/api/homeschooling/muro", { method: "POST", body: { titulo: titulo.trim(), cuerpo: cuerpo.trim() || null, fijada: fijar } });
      setTitulo("");
      setCuerpo("");
      setFijar(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setPublicando(false);
    }
  };

  const correr = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo hacer");
    }
  };

  const liturgia = muro.hoyEnLaIglesia;

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-5 p-4 sm:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <Megaphone className="size-6" /> Nuestra familia
      </h1>

      {liturgia && (
        <section aria-label="Hoy en la Iglesia" className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <Church className="size-6 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Hoy en la Iglesia</p>
            <p className="font-semibold text-foreground">{liturgia.titulo}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2.5 rounded-full ${PUNTO[liturgia.color] ?? "bg-muted"}`} aria-hidden /> color {colorLiturgico(liturgia.color).toLowerCase()} · {liturgia.rango}
            </p>
          </div>
        </section>
      )}

      {esPadre && (
        <form onSubmit={publicar} className="space-y-2 rounded-2xl border bg-card p-4">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} placeholder="Un aviso para la familia: «Mañana salimos a la plaza»" aria-label="Aviso" />
          {titulo.trim() && <Textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={3} maxLength={1000} placeholder="Más detalle (opcional)" aria-label="Detalle" />}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input type="checkbox" checked={fijar} onChange={(e) => setFijar(e.target.checked)} className="size-4 accent-primary" /> Fijar arriba
            </label>
            <Button type="submit" size="sm" className="ml-auto" disabled={publicando || !titulo.trim()}>
              {publicando ? <Spinner /> : <Plus />} Publicar
            </Button>
          </div>
        </form>
      )}

      {muro.publicaciones.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Megaphone />
            </EmptyMedia>
            <EmptyTitle>El muro todavía está vacío</EmptyTitle>
            <EmptyDescription>Acá aparecen los avisos de papá y mamá y los logros: un libro terminado, una oración aprendida, un trabajo destacado.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {muro.publicaciones.map((p: PublicacionVista) => (
            <li key={p.id}>
              <AdminItem
                enabled={p.puedeBorrar}
                nombre={`la publicación «${p.titulo}»`}
                className={`rounded-2xl border ${p.fijada ? "border-primary/50" : ""}`}
                aviso="También se borran sus comentarios."
                onEdit={p.tipo === "aviso" ? () => setEditando({ id: p.id, titulo: p.titulo, cuerpo: p.cuerpo ?? "" }) : undefined}
                onDelete={async () => {
                  await api(`/api/homeschooling/muro/${p.id}`, { method: "DELETE" });
                  router.refresh();
                }}
              >
              <div className="space-y-3 bg-card p-4">
              <div className="flex items-start gap-3">
                {p.alumno ? (
                  <Avatar size="sm" className="mt-0.5">
                    {p.alumno.fotoUrl && <AvatarImage src={p.alumno.fotoUrl} alt="" />}
                    <AvatarFallback>{p.alumno.nombre.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Megaphone className="size-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {p.tipo === "logro" ? (
                      <span className="flex items-center gap-1 font-medium text-warning">
                        <Trophy className="size-3.5" /> Logro
                      </span>
                    ) : (
                      <span className="font-medium">{p.autor?.nombre ?? "Papá o mamá"}</span>
                    )}
                    <span>{haceCuanto(p.creadoEn)}</span>
                    {p.fijada && (
                      <span className="flex items-center gap-1 text-primary">
                        <Pin className="size-3" /> fijado
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-semibold text-foreground">{p.titulo}</p>
                  {p.cuerpo && <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{p.cuerpo}</p>}
                </div>
                {p.puedeBorrar && (
                  <div className="flex shrink-0 gap-0.5">
                    <Button variant="ghost" size="icon-sm" aria-label={p.fijada ? "Soltar" : "Fijar arriba"} onClick={() => correr(() => api(`/api/homeschooling/muro/${p.id}`, { method: "PATCH", body: { fijada: !p.fijada } }))}>
                      {p.fijada ? <PinOff /> : <Pin />}
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setAbierta(abierta === p.id ? null : p.id)} aria-expanded={abierta === p.id}>
                <MessageCircle /> {p.comentarios === 0 ? "Comentar" : `${p.comentarios} ${p.comentarios === 1 ? "comentario" : "comentarios"}`}
              </Button>
              {abierta === p.id && <ComentariosEstudio key={p.id} destino={{ publicacionId: p.id }} titulo="Comentarios" placeholder="Escribí algo lindo…" />}
              </div>
              </AdminItem>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar aviso</DialogTitle>
            <DialogDescription>Corregí el título o el texto de la publicación.</DialogDescription>
          </DialogHeader>
          {editando && (
            <div className="space-y-3">
              <Input value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} maxLength={120} aria-label="Título" />
              <Textarea rows={5} value={editando.cuerpo} onChange={(e) => setEditando({ ...editando, cuerpo: e.target.value })} maxLength={2000} aria-label="Texto" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button
              disabled={!editando?.titulo.trim()}
              onClick={() => editando && void correr(async () => {
                await api(`/api/homeschooling/muro/${editando.id}`, { method: "PATCH", body: { titulo: editando.titulo, cuerpo: editando.cuerpo } });
                setEditando(null);
                toast.success("Aviso actualizado");
              })}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
