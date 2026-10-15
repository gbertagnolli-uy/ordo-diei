"use client";

// Propio de Ordo (lane 166, M1): «Pegá lo que tengas». Una sola caja: el padre pega un enlace (YouTube, Drive, Docs, PDF, ePub,
// una web) o escribe/pega texto o markdown; la app detecta qué es, trae el título y muestra una vista previa. Sin elegir
// tipo, sin subir nada. El tipo se puede corregir (p. ej. un archivo de Drive que es un PDF).
import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ETIQUETA_TIPO, TIPOS_MATERIAL, detectarMaterial, esEnlace, vistaMaterial, type MaterialDetectado, type TipoMaterial } from "@/lib/homeschooling/material";
import { api } from "@/lib/homeschooling/roost/services/http";
import type { Destino, MaterialVista } from "@/lib/homeschooling/servidor/materiales";
import { toast } from "@/lib/toast";
import IconoMaterial from "./IconoMaterial";

const LIMITES = [0, 1, 2, 3, 5];

export default function AgregarMaterial({
  open,
  destino,
  contexto,
  onClose,
  onCreado,
}: {
  open: boolean;
  destino: Destino;
  /** Para qué es: «Matemática: páginas 3 a 5», «Leo, 14 de octubre» */
  contexto?: string;
  onClose: () => void;
  onCreado: (m: MaterialVista) => void;
}) {
  const [entrada, setEntrada] = useState("");
  const [titulo, setTitulo] = useState("");
  const tituloEditado = useRef(false);
  const [tipo, setTipo] = useState<TipoMaterial>("texto");
  const [limite, setLimite] = useState(2);
  const [detectando, setDetectando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [det, setDet] = useState<MaterialDetectado | null>(null);
  const pedido = useRef(0);

  useEffect(() => {
    if (!open) return;
    setEntrada("");
    setTitulo("");
    tituloEditado.current = false;
    setTipo("texto");
    setLimite(2);
    setDet(null);
  }, [open]);

  // Detección inmediata en el cliente; el título de la página llega después (sin bloquear)
  useEffect(() => {
    const texto = entrada.trim();
    if (!texto) {
      setDet(null);
      return;
    }
    const local = detectarMaterial(texto);
    setDet(local);
    setTipo(local.tipo);
    if (!tituloEditado.current) setTitulo(local.titulo);
    if (!esEnlace(texto)) return;
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
  }, [entrada]);

  const vista = det ? vistaMaterial({ tipo, proveedor: det.proveedor, externoId: det.externoId, url: det.url }) : null;
  const esTexto = !!det && det.contenido !== null;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entrada.trim()) return;
    setGuardando(true);
    try {
      const creado = await api<MaterialVista>("/api/homeschooling/materiales", {
        method: "POST",
        body: { destino, entrada: entrada.trim(), titulo: titulo.trim() || null, tipo, limiteImpresiones: limite },
      });
      toast.success("Material agregado");
      onCreado(creado);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar el material");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !guardando && onClose()}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agregar material</DialogTitle>
          <DialogDescription>{contexto ? `Para ${contexto}. ` : ""}Pegá un enlace (YouTube, Drive, Google Docs, PDF, ePub, una web) o escribí el texto. La app detecta lo demás.</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mat-entrada">Pegá lo que tengas</Label>
            <Textarea
              id="mat-entrada"
              autoFocus
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              rows={entrada.includes("\n") || entrada.length > 90 ? 8 : 3}
              placeholder={"https://docs.google.com/document/d/…\nhttps://youtu.be/…\no escribí: «Leé el capítulo 3 y copiá el resumen en el cuaderno»"}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Los archivos grandes quedan en Drive o YouTube: acá solo se guarda el enlace. En Drive, compartilos con «cualquiera con el enlace».</p>
          </div>

          {det && (
            <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <IconoMaterial tipo={tipo} className="size-5 text-primary" />
                {ETIQUETA_TIPO[tipo]}
                {detectando && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    <Spinner className="size-3" /> Buscando el título…
                  </span>
                )}
              </div>

              {vista?.embedUrl && tipo === "video" && det.proveedor !== "web" && (
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <iframe src={vista.embedUrl} className="absolute inset-0 size-full" title="Vista previa del video" allowFullScreen />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
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
                  <Label htmlFor="mat-tipo">Tipo</Label>
                  <NativeSelect id="mat-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMaterial)}>
                    {TIPOS_MATERIAL.filter((t) => (esTexto ? t === "texto" || t === "markdown" : t !== "texto" && t !== "markdown")).map((t) => (
                      <NativeSelectOption key={t} value={t}>
                        {ETIQUETA_TIPO[t]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
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
            <Button type="submit" disabled={guardando || !entrada.trim()}>
              {guardando && <Spinner />} Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
