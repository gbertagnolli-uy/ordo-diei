"use client";

// Propio de Ordo (lane 166, M1; ampliado en lane 230): lista de bloques de contenido y material descargable de una lección,
// un día o un alumno. Permite agregar texto, imagen, video embebido, archivo/PDF o enlace, previsualizar en pantalla completa,
// descargar e imprimir.
import { useCallback, useEffect, useState } from "react";
import { AlignLeft, Download, Eye, ExternalLink, FileUp, Globe, Image as ImageIcon, PlayCircle, Plus, Printer } from "lucide-react";
import { AdminItem } from "@/components/AdminItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { esImagenMaterial, ETIQUETA_TIPO } from "@/lib/homeschooling/material";
import { api, consulta } from "@/lib/homeschooling/roost/services/http";
import type { Destino, MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import { toast } from "@/lib/toast";
import AgregarMaterial, { type ModoMaterial } from "./AgregarMaterial";
import BotonImprimir from "./BotonImprimir";
import IconoMaterial from "./IconoMaterial";
import ImpresionesDelMaterial from "./ImpresionesDelMaterial";
import MarkdownTexto from "./MarkdownTexto";
import VisorMaterial from "./VisorMaterial";

const consultaDestino = (d: Destino) => ("diaLectivoId" in d ? consulta({ diaId: d.diaLectivoId }) : "leccionId" in d ? consulta({ leccionId: d.leccionId }) : consulta({ alumnoId: d.alumnoId, fecha: d.fecha }));
const urlDescarga = (url: string) => (url.startsWith("/api/archivos/") ? `${url}${url.includes("?") ? "&" : "?"}descargar=1` : url);

export default function ListaMaterial({
  destino,
  contexto,
  expandido = false,
  onCambio,
}: {
  destino: Destino;
  contexto?: string;
  /** En el constructor de clases muestra el contenido (texto, imagen, video, descargables) desplegado en orden */
  expandido?: boolean;
  onCambio?: (cantidad: number) => void;
}) {
  const [lista, setLista] = useState<MaterialVista[] | null>(null);
  const [modoAgregar, setModoAgregar] = useState<ModoMaterial | null>(null);
  const [visorIndice, setVisorIndice] = useState<number | null>(null);
  const clave = JSON.stringify(destino);

  const leer = useCallback(() => api<MaterialVista[]>(`/api/homeschooling/materiales${consultaDestino(JSON.parse(clave) as Destino)}`), [clave]);

  const cargar = useCallback(async () => {
    try {
      const filas = await leer();
      setLista(filas);
      onCambio?.(filas.length);
    } catch (e) {
      setLista([]);
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el material");
    }
  }, [leer, onCambio]);

  // Primera carga: la promesa se resuelve fuera del efecto (sin setState sincrónico)
  useEffect(() => {
    let vigente = true;
    leer()
      .then((filas) => {
        if (!vigente) return;
        setLista(filas);
        onCambio?.(filas.length);
      })
      .catch((e) => {
        if (!vigente) return;
        setLista([]);
        toast.error(e instanceof Error ? e.message : "No se pudo cargar el material");
      });
    return () => {
      vigente = false;
    };
  }, [leer, onCambio]);

  const cambiar = async (m: MaterialVista, cambios: { titulo?: string; limiteImpresiones?: number; soloPadres?: boolean }) => {
    try {
      await api(`/api/homeschooling/materiales/${m.id}`, { method: "PATCH", body: cambios });
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const quitar = async (m: MaterialVista) => {
    await api(`/api/homeschooling/materiales/${m.id}`, { method: "DELETE" });
    await cargar();
  };

  return (
    <section aria-label="Material" className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => setModoAgregar("texto")}>
          <AlignLeft className="size-3.5" /> + Texto / Tarea
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setModoAgregar("imagen")}>
          <ImageIcon className="size-3.5" /> + Imagen
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setModoAgregar("video")}>
          <PlayCircle className="size-3.5" /> + Video embebido
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setModoAgregar("archivo")}>
          <FileUp className="size-3.5" /> + Archivo / Libro
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setModoAgregar("enlace")}>
          <Globe className="size-3.5" /> + Enlace
        </Button>
      </div>

      {lista === null ? (
        <Skeleton className="h-14 w-full rounded-xl" />
      ) : lista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Todavía no hay bloques ni materiales cargados. Elegí un botón de arriba para agregar texto, imágenes, videos embebidos, archivos descargables o enlaces.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {lista.map((m, idx) => {
            const esImg = esImagenMaterial(m);
            return (
              <li key={m.id}>
                <AdminItem
                  enabled
                  nombre={`el material «${m.titulo}»`}
                  className="rounded-xl border"
                  onEdit={() => document.getElementById(`material-titulo-${m.id}`)?.focus()}
                  onDelete={() => quitar(m)}
                >
                  <div className="space-y-2.5 bg-card p-3">
                    <div className="flex items-start gap-2">
                      {esImg ? (
                        <ImageIcon className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
                      ) : (
                        <IconoMaterial tipo={m.tipo} className="mt-1 size-5 shrink-0 text-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <Input
                          id={`material-titulo-${m.id}`}
                          defaultValue={m.titulo}
                          aria-label="Título del material"
                          maxLength={150}
                          className="h-8 border-transparent bg-transparent px-1 font-medium shadow-none hover:border-input focus-visible:border-ring"
                          onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== m.titulo && void cambiar(m, { titulo: e.target.value.trim() })}
                        />
                        <p className="px-1 text-xs text-muted-foreground">
                          {esImg ? "Imagen / Lámina" : ETIQUETA_TIPO[m.tipo]}
                          {m.contenido !== null ? ` · ${m.contenido.length} caracteres` : ""}
                          {m.soloPadres && <span className="ml-1.5 rounded-full bg-warning/15 px-1.5 font-medium text-foreground">solo padres</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button type="button" variant="ghost" size="icon-sm" title="Ver contenido" aria-label={`Ver «${m.titulo}»`} onClick={() => setVisorIndice(idx)}>
                          <Eye />
                        </Button>
                        {m.imprimible && <BotonImprimir material={m} restantes={null} onUsada={() => {}} />}
                        {m.url && m.url.startsWith("/api/archivos/") && (
                          <Button asChild variant="ghost" size="icon-sm" title="Descargar" aria-label={`Descargar «${m.titulo}»`}>
                            <a href={urlDescarga(m.url)} download>
                              <Download />
                            </a>
                          </Button>
                        )}
                        {m.url && !m.url.startsWith("/api/archivos/") && (
                          <Button asChild variant="ghost" size="icon-sm" title="Abrir en pestaña nueva" aria-label={`Abrir «${m.titulo}»`}>
                            <a href={m.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    {expandido && esImg && m.url && (
                      <div className="pl-7">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.url} alt={m.titulo} className="max-h-64 w-auto rounded-lg border object-contain" />
                      </div>
                    )}

                    {expandido && m.tipo === "video" && m.vista.embedUrl && (
                      <div className="pl-7">
                        <div className="relative aspect-video max-w-xl overflow-hidden rounded-lg bg-black">
                          {m.vista.videoDirecto ? (
                            <video src={m.vista.embedUrl} controls className="size-full" />
                          ) : (
                            <iframe src={m.vista.embedUrl} title={m.titulo} className="absolute inset-0 size-full" allowFullScreen />
                          )}
                        </div>
                      </div>
                    )}

                    {expandido && m.contenido !== null && (
                      <div className="rounded-lg bg-muted/40 p-3 pl-7">
                        <MarkdownTexto texto={m.contenido} markdown={m.tipo === "markdown"} className="text-sm" />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pl-7 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Printer className="size-3.5" aria-hidden />
                        <span>Imprimible</span>
                        <NativeSelect size="sm" aria-label="Veces que puede imprimirlo" value={m.limiteImpresiones} onChange={(e) => cambiar(m, { limiteImpresiones: Number(e.target.value) })}>
                          {[0, 1, 2, 3, 5].map((n) => (
                            <NativeSelectOption key={n} value={n}>
                              {n === 0 ? "no" : n === 1 ? "1 vez" : `${n} veces`}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </span>
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={m.soloPadres} onChange={(e) => void cambiar(m, { soloPadres: e.target.checked, ...(e.target.checked ? { limiteImpresiones: 0 } : {}) })} className="size-3.5 accent-primary" />
                        Solo padres (clave de respuestas)
                      </label>
                    </div>
                    {m.imprimible && <ImpresionesDelMaterial materialId={m.id} />}
                  </div>
                </AdminItem>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="outline" className="w-full" onClick={() => setModoAgregar("texto")}>
        <Plus /> Agregar material o contenido
      </Button>

      <AgregarMaterial
        open={modoAgregar !== null}
        modoInicial={modoAgregar ?? "texto"}
        destino={destino}
        contexto={contexto}
        onClose={() => setModoAgregar(null)}
        onCreado={() => {
          setModoAgregar(null);
          void cargar();
        }}
      />

      <VisorMaterial
        lista={lista ?? []}
        indice={visorIndice}
        onCambiar={setVisorIndice}
        onClose={() => setVisorIndice(null)}
        acciones={(m) => (m.imprimible ? <BotonImprimir material={m} restantes={null} onUsada={() => {}} /> : null)}
      />
    </section>
  );
}
