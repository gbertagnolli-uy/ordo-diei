"use client";

// Portado de vendor/roost/src/pages/admin/Showcases.tsx (msrbuilds/roost@492af47).
// Cambios: bandeja de revisión del padre — contadores con StatsCard (HS0), filtro por estado, aprobar con StarRating
// opcional, «pedir ajuste» con comentario obligatorio (el modal de rechazo, L45/L94/L418) y destacar/quitar. Cada fila
// es un SwipeRow de Ordo: izquierda = aprobar, derecha = pedir ajuste, más los botones equivalentes (como ParentReviewPanel).

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Clock, ImageIcon, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { SwipeRow } from "@/components/SwipeRow";
import { approveShowcase, featureShowcase, rejectShowcase, unfeatureShowcase } from "@/lib/homeschooling/roost/services/showcase";
import { SHOWCASE_STATUS_INFO, type ShowcaseStats, type ShowcaseStatus, type ShowcaseWithDetails } from "@/lib/homeschooling/roost/tipos";
import { toast } from "@/lib/toast";
import { StarRating } from "@/components/homeschooling/roost/StarRating";
import ChipsPuntaje from "@/components/homeschooling/libreta/ChipsPuntaje";
import { puntajeValido } from "@/lib/homeschooling/calificaciones";
import { api } from "@/lib/homeschooling/roost/services/http";
import { StatsCard } from "@/components/homeschooling/roost/StatsCard";
import CampoBusqueda from "@/components/homeschooling/nav/CampoBusqueda";
import { filtrar } from "@/lib/homeschooling/buscarTexto";

const TABS: { valor: ShowcaseStatus | "todas"; etiqueta: string }[] = [
  { valor: "pendiente", etiqueta: "Pendientes" },
  { valor: "aprobada", etiqueta: "Aprobadas" },
  { valor: "ajustar", etiqueta: "A ajustar" },
  { valor: "todas", etiqueta: "Todas" },
];

export default function RevisionEvidencias({ evidencias, stats, estado }: { evidencias: ShowcaseWithDetails[]; stats: ShowcaseStats; estado: ShowcaseStatus | "todas" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [aprobando, setAprobando] = useState<ShowcaseWithDetails | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [nota, setNota] = useState("");
  const [q, setQ] = useState("");
  const visibles = filtrar(evidencias, q, (e) => [e.title, e.description, e.author_name, e.materia_name]);
  const [ajustando, setAjustando] = useState<ShowcaseWithDetails | null>(null);
  const [comentario, setComentario] = useState("");
  const [ocupado, setOcupado] = useState(false);
  // Al cancelar un deslizamiento la fila ya se había colapsado: cambiar la `key` la vuelve a mostrar
  const [version, setVersion] = useState(0);

  const refrescar = () => {
    setVersion((v) => v + 1);
    router.refresh();
  };

  const correr = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true);
    try {
      await fn();
      toast.success(ok);
      setAprobando(null);
      setAjustando(null);
      setEstrellas(0);
      setNota("");
      setComentario("");
      refrescar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo hacer");
      refrescar();
    } finally {
      setOcupado(false);
    }
  };

  const irA = (valor: string) => {
    const nuevo = new URLSearchParams(params.toString());
    nuevo.set("estado", valor);
    router.replace(`?${nuevo}`);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-5 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-foreground">Revisión de evidencias</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatsCard title="Pendientes" value={stats.pending} icon={Clock} color="warning" />
        <StatsCard title="Aprobadas" value={stats.approved} icon={Check} color="success" />
        <StatsCard title="A ajustar" value={stats.rejected} icon={X} color="error" />
        <StatsCard title="Destacadas" value={stats.featured} icon={Star} color="primary" />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.valor}
            role="tab"
            aria-selected={estado === t.valor}
            onClick={() => irA(t.valor)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${estado === t.valor ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {evidencias.length > 0 && <CampoBusqueda valor={q} onChange={setQ} placeholder="Buscar por título, alumno o materia…" cantidad={visibles.length} />}

      {evidencias.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>No hay evidencias acá</EmptyTitle>
            <EmptyDescription>Cuando un hijo suba una foto, va a aparecer en «Pendientes».</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {visibles.map((e) => {
            const info = SHOWCASE_STATUS_INFO[e.status];
            const revisable = e.status === "pendiente";
            return (
              <li key={`${e.id}-${version}`}>
                <SwipeRow
                  disabled={!revisable}
                  left={{ label: "Aprobar", icon: <Check className="size-5" />, color: "var(--success)", onColor: "var(--on-success)", onCommit: () => void correr(() => approveShowcase(e.id), "Aprobada") }}
                  right={{ label: "Pedir ajuste", icon: <X className="size-5" />, color: "var(--destructive)", onColor: "#fff", onCommit: () => setAjustando(e) }}
                >
                  <div className="flex items-center gap-3 bg-card px-4 py-3">
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {e.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.images[0].image_url} alt="" className="size-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{e.title || "Sin título"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.author_name}
                        {e.materia_name && ` · ${e.materia_name}`} · {new Date(e.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })} · {e.images.length} {e.images.length === 1 ? "foto" : "fotos"}
                      </p>
                      {e.description && <p className="line-clamp-1 text-xs text-muted-foreground">{e.description}</p>}
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${info.bgColor} ${info.color}`}>{info.label}</span>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                      {revisable ? (
                        <>
                          <Button size="sm" onClick={() => setAprobando(e)} disabled={ocupado}>
                            <Check /> Aprobar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setAjustando(e)} disabled={ocupado}>
                            Ajustar
                          </Button>
                        </>
                      ) : e.status === "aprobada" ? (
                        <Button size="sm" variant="outline" disabled={ocupado} onClick={() => correr(() => (e.is_featured ? unfeatureShowcase(e.id) : featureShowcase(e.id)), e.is_featured ? "Quitada de destacadas" : "Destacada")}>
                          <Star className={e.is_featured ? "fill-current" : ""} /> {e.is_featured ? "Quitar" : "Destacar"}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </SwipeRow>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!aprobando} onOpenChange={(o) => !o && !ocupado && (setAprobando(null), setEstrellas(0), setNota(""))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Aprobar «{aprobando?.title || "Sin título"}»</DialogTitle>
            <DialogDescription>Podés dejar una valoración. Las estrellas no dan monedas.</DialogDescription>
          </DialogHeader>
          <StarRating rating={estrellas} onChange={setEstrellas} size="lg" />
          {aprobando?.dia_lectivo_id ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Nota del día (opcional)</p>
              <ChipsPuntaje valor={nota} onChange={setNota} />
              <p className="text-xs text-muted-foreground">Queda en la libreta de {aprobando.author_name}.</p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => (setAprobando(null), setEstrellas(0), setNota(""))} disabled={ocupado}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                aprobando &&
                correr(async () => {
                  await approveShowcase(aprobando.id, estrellas || null);
                  const n = Number(nota);
                  if (aprobando.dia_lectivo_id && nota.trim() !== "" && puntajeValido(n)) await api(`/api/homeschooling/dias/${aprobando.dia_lectivo_id}/nota`, { method: "PUT", body: { puntaje: n } });
                }, nota.trim() !== "" ? "Aprobada y calificada" : "Aprobada")
              }
              disabled={ocupado || (nota.trim() !== "" && !puntajeValido(Number(nota)))}
            >
              {ocupado && <Spinner />} Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!ajustando}
        onOpenChange={(o) => {
          if (!o && !ocupado) {
            setAjustando(null);
            setComentario("");
            refrescar();
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pedir ajuste</DialogTitle>
            <DialogDescription>Contale qué tiene que corregir; lo va a ver {ajustando?.author_name}.</DialogDescription>
          </DialogHeader>
          <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Falta la foto de la segunda hoja…" rows={4} maxLength={500} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAjustando(null);
                setComentario("");
                refrescar();
              }}
              disabled={ocupado}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => ajustando && correr(() => rejectShowcase(ajustando.id, comentario), "Ajuste pedido")} disabled={ocupado || !comentario.trim()}>
              {ocupado && <Spinner />} Pedir ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
