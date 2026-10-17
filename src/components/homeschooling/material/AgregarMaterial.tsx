"use client";

// Propio de Ordo (lane 166, M1; ampliado en lane 230): agregar material de estudio para una clase, un día o un alumno.
// Soporta texto con formato (Markdown), subida de imágenes y archivos descargables (PDF, ePub, documentos), videos embebidos
// (YouTube, Vimeo, .mp4) y enlaces (Drive, Google Docs, web).
import { useEffect, useRef, useState } from "react";
import { AlignLeft, Bold, Eye, FileUp, Globe, Heading2, Image as ImageIcon, List, PlayCircle, Printer, Quote, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { esImagenMaterial, ETIQUETA_TIPO, TIPOS_MATERIAL, detectarMaterial, esEnlace, vistaMaterial, type MaterialDetectado, type TipoMaterial } from "@/lib/homeschooling/material";
import { api } from "@/lib/homeschooling/roost/services/http";
import { useBorrador } from "@/lib/homeschooling/useBorrador";
import type { Destino, MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import { subirArchivoEstudio } from "@/lib/subirImagen";
import { toast } from "@/lib/toast";
import IconoMaterial from "./IconoMaterial";
import MarkdownTexto from "./MarkdownTexto";

const LIMITES = [0, 1, 2, 3, 5];

export type ModoMaterial = "texto" | "imagen" | "video" | "archivo" | "enlace";

const MODOS: { id: ModoMaterial; etiqueta: string; icono: typeof AlignLeft; ayuda: string }[] = [
  { id: "texto", etiqueta: "Texto / Tarea", icono: AlignLeft, ayuda: "Escribí una lectura, consigna, explicación o ejercicios para el cuaderno." },
  { id: "imagen", etiqueta: "Imagen", icono: ImageIcon, ayuda: "Subí una imagen, lámina o mapa desde tu dispositivo o pegá su dirección." },
  { id: "video", etiqueta: "Video", icono: PlayCircle, ayuda: "Pegá un enlace de YouTube, Vimeo o un archivo de video (.mp4, .webm) para reproducirlo embebido." },
  { id: "archivo", etiqueta: "Archivo / Libro", icono: FileUp, ayuda: "Subí un documento descargable (PDF, ePub, Word, hoja de ejercicios) o enlazá Google Drive / Docs." },
  { id: "enlace", etiqueta: "Enlace web", icono: Globe, ayuda: "Pegá un enlace a una página web, artículo o recurso interactivo." },
];

export default function AgregarMaterial({
  open,
  destino,
  contexto,
  modoInicial = "texto",
  onClose,
  onCreado,
}: {
  open: boolean;
  destino: Destino;
  /** Para qué es: «Matemática: páginas 3 a 5», «Leo, 14 de octubre» */
  contexto?: string;
  modoInicial?: ModoMaterial;
  onClose: () => void;
  onCreado: (m: MaterialVista) => void;
}) {
  // Lo escrito queda como borrador en el navegador: si se cierra el diálogo o se recarga, vuelve (lane 190)
  const [entrada, setEntrada, borrarBorrador] = useBorrador(`material-${JSON.stringify(destino)}`);
  const [modo, setModo] = useState<ModoMaterial>(modoInicial);
  const [titulo, setTitulo] = useState("");
  const tituloEditado = useRef(false);
  const [tipo, setTipo] = useState<TipoMaterial>("texto");
  const [limite, setLimite] = useState(2);
  const [soloPadres, setSoloPadres] = useState(false);
  const [vistaPreviaMd, setVistaPreviaMd] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [detectando, setDetectando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [det, setDet] = useState<MaterialDetectado | null>(null);
  const pedido = useRef(0);
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setModo(modoInicial);
    setTitulo("");
    tituloEditado.current = false;
    setTipo(modoInicial === "video" ? "video" : modoInicial === "archivo" ? "pdf" : modoInicial === "enlace" ? "web" : modoInicial === "imagen" ? "archivo" : "texto");
    setLimite(2);
    setSoloPadres(false);
    setVistaPreviaMd(false);
    setDet(null);
  }, [open, modoInicial]);

  // Detección inmediata en el cliente; el título de la página llega después (sin bloquear)
  useEffect(() => {
    if (!open) return;
    const texto = entrada.trim();
    if (!texto) {
      setDet(null);
      return;
    }
    const local = detectarMaterial(texto);
    setDet(local);
    setTipo(local.tipo);
    if (!tituloEditado.current && local.titulo) setTitulo(local.titulo);
    if (!esEnlace(texto) || texto.startsWith("/api/archivos/")) return;
    const mio = ++pedido.current;
    setDetectando(true);
    const t = setTimeout(async () => {
      try {
        const r = await api<MaterialDetectado>("/api/homeschooling/materiales/detectar", { method: "POST", body: { entrada: texto } });
        if (mio !== pedido.current) return;
        setDet(r);
        if (!tituloEditado.current && r.titulo) setTitulo(r.titulo);
      } catch {
        // sin título de la página: queda el sugerido
      } finally {
        if (mio === pedido.current) setDetectando(false);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      setDetectando(false);
    };
  }, [entrada, open]);

  const alSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    try {
      const subido = await subirArchivoEstudio(file);
      setEntrada(subido.url);
      if (!tituloEditado.current) {
        const limpio = subido.nombre.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_+]+/g, " ").trim();
        if (limpio) setTitulo(limpio.charAt(0).toUpperCase() + limpio.slice(1));
      }
      toast.success(subido.categoria === "imagen" ? "Imagen cargada" : "Archivo cargado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setSubiendo(false);
    }
  };

  const insertarFormato = (prefijo: string, sufijo = "") => {
    setEntrada(`${entrada}${entrada && !entrada.endsWith("\n") && prefijo.startsWith("\n") ? "" : ""}${prefijo}${sufijo}`);
  };

  const vista = det ? vistaMaterial({ tipo, proveedor: det.proveedor, externoId: det.externoId, url: det.url }) : null;
  const esTexto = !!det && det.contenido !== null;
  const esImg = !!det && esImagenMaterial({ tipo, proveedor: det.proveedor, externoId: det.externoId, url: det.url });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrada.trim()) return;
    setGuardando(true);
    try {
      const creado = await api<MaterialVista>("/api/homeschooling/materiales", {
        method: "POST",
        body: { destino, entrada: entrada.trim(), titulo: titulo.trim() || null, tipo, limiteImpresiones: soloPadres ? 0 : limite, soloPadres },
      });
      toast.success("Material agregado");
      borrarBorrador();
      onCreado(creado);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar el material");
    } finally {
      setGuardando(false);
    }
  };

  const infoModo = MODOS.find((m) => m.id === modo) ?? MODOS[0];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar contenido o material</DialogTitle>
          <DialogDescription>{contexto ? `Para ${contexto}. ` : ""}Elegí el tipo de contenido para armar la clase o tarea.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5 border-b pb-3" role="tablist" aria-label="Tipo de contenido">
          {MODOS.map((m) => {
            const Icono = m.icono;
            const activo = modo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={activo}
                onClick={() => setModo(m.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activo ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icono className="size-3.5" />
                {m.etiqueta}
              </button>
            );
          })}
        </div>

        <form onSubmit={guardar} className="min-w-0 space-y-4">
          <p className="text-xs text-muted-foreground">{infoModo.ayuda}</p>

          {(modo === "imagen" || modo === "archivo") && (
            <div className="space-y-2">
              <input
                ref={inputArchivo}
                type="file"
                accept={modo === "imagen" ? "image/*" : "image/*,.pdf,.epub,.doc,.docx,.odt,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx"}
                onChange={alSubirArchivo}
                className="hidden"
              />
              {esImg && det?.url ? (
                <div className="relative overflow-hidden rounded-xl border bg-muted/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={det.url} alt="" className="mx-auto max-h-52 w-auto rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={() => setEntrada("")}
                    aria-label="Quitar archivo"
                    className="absolute top-2 right-2 rounded-full bg-foreground/75 p-1 text-background hover:bg-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={subiendo}
                  onClick={() => inputArchivo.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors hover:border-primary hover:bg-muted/40"
                >
                  {subiendo ? (
                    <Spinner className="size-6 text-primary" />
                  ) : (
                    <>
                      <Upload className="size-7 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {modo === "imagen" ? "Subir imagen o lámina desde tu dispositivo" : "Subir archivo descargable (PDF, ePub, documento o imagen ≤ 4 MB)"}
                      </span>
                      <span className="text-xs text-muted-foreground">O pegá un enlace directo debajo (Google Drive, Docs, web…)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {modo === "texto" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="mat-entrada">Contenido de la lectura o tarea</Label>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon-xs" title="Título" aria-label="Insertar título" onClick={() => insertarFormato("\n## Título\n")}>
                    <Heading2 />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" title="Negrita" aria-label="Insertar negrita" onClick={() => insertarFormato("**texto importante**")}>
                    <Bold />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" title="Lista" aria-label="Insertar lista" onClick={() => insertarFormato("\n- Punto 1\n- Punto 2\n")}>
                    <List />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-xs" title="Cita" aria-label="Insertar cita" onClick={() => insertarFormato("\n> Cita o texto para recordar\n")}>
                    <Quote />
                  </Button>
                  <Button type="button" variant={vistaPreviaMd ? "secondary" : "outline"} size="xs" onClick={() => setVistaPreviaMd((v) => !v)}>
                    <Eye className="size-3.5" /> {vistaPreviaMd ? "Editar" : "Vista previa"}
                  </Button>
                </div>
              </div>
              {vistaPreviaMd ? (
                <div className="min-h-36 rounded-xl border bg-card p-4">
                  <MarkdownTexto texto={entrada || "*Escribí el texto para ver la vista previa…*"} markdown />
                </div>
              ) : (
                <Textarea
                  id="mat-entrada"
                  autoFocus
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  rows={7}
                  placeholder={"## Lectura y actividad\n\n1. Leé atentamente el texto.\n2. Respondé las preguntas en tu cuaderno.\n\n**Importante:** Revisá la ortografía al terminar."}
                  className="field-sizing-fixed min-w-0 text-sm"
                />
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="mat-entrada">
                {modo === "video"
                  ? "Enlace del video (YouTube, Vimeo o archivo .mp4)"
                  : modo === "imagen"
                    ? "Dirección de la imagen (o subila arriba)"
                    : modo === "archivo"
                      ? "Dirección del documento o libro (Drive, Google Docs, PDF, ePub…)"
                      : "Enlace o contenido"}
              </Label>
              <Input
                id="mat-entrada"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder={
                  modo === "video"
                    ? "https://www.youtube.com/watch?v=… o https://vimeo.com/…"
                    : modo === "imagen"
                      ? "https://…/mapa.jpg"
                      : modo === "archivo"
                        ? "https://drive.google.com/file/d/… o https://docs.google.com/document/d/…"
                        : "https://…"
                }
              />
            </div>
          )}

          {det && (
            <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <IconoMaterial tipo={tipo} className="size-5 text-primary" />
                {esImg ? "Imagen / Lámina" : ETIQUETA_TIPO[tipo]}
                {detectando && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    <Spinner className="size-3" /> Buscando el título…
                  </span>
                )}
              </div>

              {vista?.embedUrl && tipo === "video" && (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                  {vista.videoDirecto ? (
                    <video src={vista.embedUrl} controls className="size-full" />
                  ) : (
                    <iframe src={vista.embedUrl} className="absolute inset-0 size-full" title="Vista previa del video" allowFullScreen />
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor="mat-titulo">Título</Label>
                  <Input
                    id="mat-titulo"
                    value={titulo}
                    onChange={(e) => {
                      setTitulo(e.target.value);
                      tituloEditado.current = true;
                    }}
                    maxLength={150}
                    placeholder="Cómo lo va a ver el alumno"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mat-tipo">Formato</Label>
                  <NativeSelect id="mat-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMaterial)}>
                    {TIPOS_MATERIAL.filter((t) => (esTexto ? t === "texto" || t === "markdown" : t !== "texto" && t !== "markdown")).map((t) => (
                      <NativeSelectOption key={t} value={t}>
                        {ETIQUETA_TIPO[t]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={soloPadres} onChange={(e) => setSoloPadres(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
                <span>
                  <span className="font-medium text-foreground">Solo para padres</span>
                  <span className="block text-xs text-muted-foreground">Clave de respuestas o guía del maestro: el hijo no la ve ni la imprime.</span>
                </span>
              </label>

              <div className={`flex flex-wrap items-center gap-2 text-sm ${soloPadres ? "pointer-events-none opacity-50" : ""}`}>
                <Printer className="size-4 text-muted-foreground" aria-hidden />
                <Label htmlFor="mat-limite" className="font-normal">
                  El alumno puede imprimirlo
                </Label>
                <NativeSelect id="mat-limite" size="sm" value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
                  {LIMITES.map((n) => (
                    <NativeSelectOption key={n} value={n}>
                      {n === 0 ? "no" : n === 1 ? "1 vez" : `${n} veces`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || subiendo || !entrada.trim()}>
              {guardando && <Spinner />} Agregar a la clase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
