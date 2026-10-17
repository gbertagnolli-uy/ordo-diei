"use client";

// Propio de Ordo (lane 167, M2): visor de material a pantalla completa. Muestra cada tipo a su manera —video, markdown y texto
// renderizados, PDF y Google Docs/Drive en visor embebido, y lo que no se puede incrustar (ePub, webs) con un botón claro para
// abrirlo— y deja pasar al anterior/siguiente sin cerrar. El hijo lee o mira; no hay nada que configurar.
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Download, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { esImagenMaterial, ETIQUETA_TIPO } from "@/lib/homeschooling/material";
import type { MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import ComentariosEstudio from "@/components/homeschooling/comunidad/ComentariosEstudio";
import IconoMaterial from "./IconoMaterial";
import LectorEpub from "./LectorEpub";
import MarkdownTexto from "./MarkdownTexto";

const urlDescarga = (url: string) => (url.startsWith("/api/archivos/") ? `${url}${url.includes("?") ? "&" : "?"}descargar=1` : url);

function Cuerpo({ m }: { m: MaterialVista }) {
  const v = m.vista;

  if (esImagenMaterial(m) && m.url) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center overflow-hidden rounded-xl border bg-muted/30 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt={m.titulo} className="max-h-[72svh] w-auto rounded-lg object-contain" />
        </div>
        {m.contenido && <MarkdownTexto texto={m.contenido} markdown={m.tipo === "markdown"} className="mx-auto w-full min-w-0 max-w-prose" />}
        <div className="flex justify-center">
          <Button asChild variant="outline" size="sm">
            <a href={urlDescarga(m.url)} download>
              <Download /> Descargar imagen
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (m.contenido !== null && !m.url) return <MarkdownTexto texto={m.contenido} markdown={m.tipo === "markdown"} className="mx-auto w-full min-w-0 max-w-prose" />;

  if (m.tipo === "video" && v.embedUrl) {
    return (
      <div className="space-y-4">
        {v.videoDirecto ? (
          <video src={v.embedUrl} controls playsInline className="aspect-video w-full rounded-xl bg-black" />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe src={v.embedUrl} title={m.titulo} className="absolute inset-0 size-full" allow="fullscreen; picture-in-picture" allowFullScreen />
          </div>
        )}
        {m.contenido && <MarkdownTexto texto={m.contenido} markdown className="mx-auto w-full min-w-0 max-w-prose" />}
      </div>
    );
  }

  // ePub y PDF con enlace propio: se muestran adentro, bajados por la app (sin CORS ni bloqueos de otros sitios)
  if (m.tipo === "epub" && v.archivoUrl) return <LectorEpub key={m.id} origen={v.archivoUrl} titulo={m.titulo} />;
  if (m.tipo === "pdf" && v.archivoUrl && m.proveedor !== "drive") {
    return (
      <div className="space-y-2">
        <iframe src={v.archivoUrl} title={m.titulo} className="h-[72svh] w-full rounded-xl border bg-background" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Si no se ve, abrilo o descargalo con los botones.</span>
          {m.url && (
            <Button asChild variant="outline" size="sm">
              <a href={urlDescarga(m.url)} download>
                <Download /> Descargar PDF
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (v.embedUrl) {
    return (
      <div className="space-y-2">
        <iframe src={v.embedUrl} title={m.titulo} className="h-[72svh] w-full rounded-xl border bg-background" allowFullScreen />
        <p className="text-center text-xs text-muted-foreground">Si no se ve, abrilo en otra pestaña con el botón de arriba.</p>
      </div>
    );
  }

  // Documentos descargables, páginas web y todo lo que no admite iframe
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed p-8 text-center">
      <IconoMaterial tipo={m.tipo} className="size-12 text-primary" />
      <div>
        <p className="text-lg font-semibold text-foreground">{m.titulo}</p>
        <p className="text-sm text-muted-foreground">{ETIQUETA_TIPO[m.tipo]}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {v.abrirUrl && m.url?.startsWith("/api/archivos/") && (
          <Button asChild size="lg">
            <a href={urlDescarga(m.url)} download>
              <Download /> Descargar archivo
            </a>
          </Button>
        )}
        {v.abrirUrl && (
          <Button asChild size="lg" variant={m.url?.startsWith("/api/archivos/") ? "outline" : "default"}>
            <a href={v.abrirUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Abrir
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function VisorMaterial({
  lista,
  indice,
  onCambiar,
  onClose,
  acciones,
}: {
  lista: MaterialVista[];
  /** Posición del material abierto; null = cerrado */
  indice: number | null;
  onCambiar: (i: number) => void;
  onClose: () => void;
  /** Botones extra de la barra (p. ej. imprimir) */
  acciones?: (m: MaterialVista) => React.ReactNode;
}) {
  const m = indice !== null ? (lista[indice] ?? null) : null;
  // Comentarios de la familia sobre este material: se cargan recién al abrirlos (lane 190)
  const [conversando, setConversando] = useState<number | null>(null);

  // ← / → pasan al material anterior / siguiente
  useEffect(() => {
    if (indice === null) return;
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft" && indice > 0) onCambiar(indice - 1);
      if (e.key === "ArrowRight" && indice < lista.length - 1) onCambiar(indice + 1);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [indice, lista.length, onCambiar]);

  return (
    <Sheet open={m !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-svh max-h-svh gap-0 overflow-y-auto rounded-none p-0 data-[side=bottom]:h-svh data-[side=bottom]:max-h-svh [&>[data-slot=sheet-close]]:z-20">
        {m && indice !== null && (
          <>
            <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 p-3 pr-14 backdrop-blur">
              <div className="flex items-center gap-2">
                <IconoMaterial tipo={m.tipo} className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-base">{m.titulo}</SheetTitle>
                  <SheetDescription>
                    {ETIQUETA_TIPO[m.tipo]}
                    {lista.length > 1 ? ` · ${indice + 1} de ${lista.length}` : ""}
                  </SheetDescription>
                </div>
                {acciones?.(m)}
                {m.vista.abrirUrl && m.tipo !== "web" && m.tipo !== "epub" && (
                  <Button asChild variant="outline" size="sm">
                    <a href={m.vista.abrirUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir en otra pestaña">
                      <ExternalLink /> <span className="hidden sm:inline">Abrir</span>
                    </a>
                  </Button>
                )}
              </div>
            </SheetHeader>
            <div className="mx-auto w-full min-w-0 max-w-4xl flex-1 p-4 sm:p-6">
              <Cuerpo key={m.id} m={m} />
              <div className="mt-6 border-t pt-4">
                <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" aria-expanded={conversando === m.id} onClick={() => setConversando(conversando === m.id ? null : m.id)}>
                  <MessageCircle /> {conversando === m.id ? "Ocultar comentarios" : "Comentarios de la familia"}
                </Button>
                {conversando === m.id && (
                  <div className="mt-3">
                    <ComentariosEstudio key={m.id} destino={{ materialId: m.id }} titulo="Comentarios" placeholder="Una duda, una idea, una felicitación…" />
                  </div>
                )}
              </div>
            </div>
            {lista.length > 1 && (
              <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t bg-background/95 p-3 backdrop-blur">
                <Button variant="outline" size="lg" disabled={indice === 0} onClick={() => onCambiar(indice - 1)}>
                  <ArrowLeft /> Anterior
                </Button>
                <Button size="lg" disabled={indice === lista.length - 1} onClick={() => onCambiar(indice + 1)}>
                  Siguiente <ArrowRight />
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
