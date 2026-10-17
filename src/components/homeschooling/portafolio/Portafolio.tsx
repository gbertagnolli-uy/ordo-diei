"use client";

// Portado de vendor/roost/src/pages/Showcase.tsx (msrbuilds/roost@492af47).
// Cambios: galería de evidencias con filtros por alumno/materia/mes; detalle en un Sheet; el padre destaca y quita;
// el hijo reenvía una evidencia con ajustes pedidos o borra las que no están aprobadas. Datos desde la página servidor.

import ComentariosEstudio from "@/components/homeschooling/comunidad/ComentariosEstudio";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Printer, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SHOWCASE_STATUS_INFO, type ShowcaseWithDetails } from "@/lib/homeschooling/roost/tipos";
import { deleteShowcase, featureShowcase, resubmitShowcase, unfeatureShowcase } from "@/lib/homeschooling/roost/services/showcase";
import { toast } from "@/lib/toast";
import { StarRating } from "@/components/homeschooling/roost/StarRating";
import EnviarEvidencia from "@/components/homeschooling/evidencia/EnviarEvidencia";
import CampoBusqueda from "@/components/homeschooling/nav/CampoBusqueda";
import { filtrar } from "@/lib/homeschooling/buscarTexto";
import EvidenciaCard from "./EvidenciaCard";
import FiltrosPortafolio from "./FiltrosPortafolio";

export default function Portafolio({
  evidencias,
  esPadre,
  alumnos,
  materias,
}: {
  evidencias: ShowcaseWithDetails[];
  esPadre: boolean;
  alumnos: { id: number; nombre: string }[];
  materias: { id: number; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  // El portafolio impreso respeta el hijo y la materia que se están mirando
  const imprimirQuery = (() => {
    const q = new URLSearchParams();
    if (params.get("alumno")) q.set("alumno", params.get("alumno") as string);
    if (params.get("materia")) q.set("materia", params.get("materia") as string);
    return q.toString() ? `?${q}` : "";
  })();
  const [abierta, setAbierta] = useState<ShowcaseWithDetails | null>(null);
  const [nueva, setNueva] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [q, setQ] = useState("");
  const visibles = filtrar(evidencias, q, (e) => [e.title, e.description, e.author_name, e.materia_name]);

  const correr = async (fn: () => Promise<unknown>, ok?: string) => {
    setOcupado(true);
    try {
      await fn();
      if (ok) toast.success(ok);
      setAbierta(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo hacer");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Portafolio</h1>
        {!esPadre && (
          <Button onClick={() => setNueva(true)}>
            <Camera /> Mostrar mi trabajo
          </Button>
        )}
        {esPadre && (
          <Button asChild variant="outline">
            <Link href={`/dashboard/homeschooling/portafolio/imprimir${imprimirQuery}`}>
              <Printer /> Portafolio para imprimir
            </Link>
          </Button>
        )}
      </div>

      <FiltrosPortafolio alumnos={esPadre ? alumnos : undefined} materias={materias} />
      {evidencias.length > 0 && <CampoBusqueda valor={q} onChange={setQ} placeholder="Buscar un trabajo…" cantidad={visibles.length} />}

      {evidencias.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Camera />
            </EmptyMedia>
            <EmptyTitle>Todavía no hay evidencias</EmptyTitle>
            <EmptyDescription>Las fotos de los trabajos aparecen acá.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {visibles.map((e) => (
            <EvidenciaCard key={e.id} evidencia={e} mostrarAlumno={esPadre} onClick={setAbierta} />
          ))}
        </div>
      )}

      <Sheet open={!!abierta} onOpenChange={(o) => !o && setAbierta(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {abierta && (
            <>
              <SheetHeader>
                <SheetTitle>{abierta.title || "Sin título"}</SheetTitle>
                <SheetDescription>
                  {abierta.author_name}
                  {abierta.materia_name && ` · ${abierta.materia_name}`} · {SHOWCASE_STATUS_INFO[abierta.status].label}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-4">
                {abierta.images.map((i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i.id} src={i.image_url} alt="" className="w-full rounded-lg border" />
                ))}
                {abierta.description && <p className="whitespace-pre-wrap text-sm text-foreground">{abierta.description}</p>}
                {abierta.stars ? <StarRating rating={abierta.stars} readonly /> : null}
                {abierta.moderation_notes && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">Para ajustar: {abierta.moderation_notes}</p>
                )}

                <ComentariosEstudio key={abierta.id} destino={{ evidenciaId: abierta.id }} titulo="Comentarios" placeholder="Felicitá, preguntá o comentá este trabajo…" />

                {esPadre && abierta.status === "aprobada" && (
                  <Button variant="outline" disabled={ocupado} onClick={() => correr(() => (abierta.is_featured ? unfeatureShowcase(abierta.id) : featureShowcase(abierta.id)))}>
                    <Star className={abierta.is_featured ? "fill-current" : ""} /> {abierta.is_featured ? "Quitar de destacadas" : "Destacar"}
                  </Button>
                )}
                {!esPadre && abierta.status === "ajustar" && (
                  <Button disabled={ocupado} onClick={() => correr(() => resubmitShowcase(abierta.id), "Enviada otra vez")}>
                    Volver a enviar
                  </Button>
                )}
                {(esPadre || abierta.status !== "aprobada") && (
                  <Button variant="ghost" className="text-destructive" disabled={ocupado} onClick={() => correr(() => deleteShowcase(abierta.id), "Evidencia borrada")}>
                    Borrar
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <EnviarEvidencia open={nueva} onClose={() => setNueva(false)} onEnviada={() => router.refresh()} />
    </div>
  );
}
