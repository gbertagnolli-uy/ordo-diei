"use client";
// Diario (lane 293): compartir una entrada como imagen o como Markdown. Portado de vendor/moodiary/packages/feature/moodiary_export/lib/src/presentation/
// {share_sheet,image_export_page}.dart (ZhuJHua/moodiary@2c552dd): vista previa de la tarjeta, claro u oscuro, marca de agua, guardar o compartir el PNG
// y compartir el texto en Markdown. «Guardar en el álbum» no existe en la web: el PNG se descarga y el sistema decide dónde queda.
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, FileText, Image as ImagenIcono, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { markdownParaCompartir, nombreDeCompartido } from "@/lib/diario/compartido";
import { nivelDe, nombreDeNivel } from "@/lib/diario/escala";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { OPCIONES_TARJETA, esOpcionesTarjeta, type DatosTarjeta } from "@/lib/diario/tarjeta";
import { toast } from "@/lib/toast";
import { usePreferencia } from "../estadisticas/controles";
import { useEscala } from "../EscalaAnimo";
import { caminoDe } from "../ListaDia";
import { dibujarTarjeta, type TarjetaDibujada } from "./dibujarTarjeta";

/** Colores para el chip de ánimo cuando el nivel no trae uno propio (el canvas no entiende `var(--…)`). */
const COLOR_ANIMO: Record<number, string> = { 1: "#C0392B", 2: "#D68910", 3: "#7F8C8D", 4: "#7A9A3A", 5: "#2E8B57" };
const esHex = (c: string | null): c is string => !!c && /^#[0-9a-f]{6}$/i.test(c.trim());

type Resultado = { clave: string; url: string; tarjeta: TarjetaDibujada };

const bajar = (blob: Blob, nombre: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** `navigator.share` se cancela con un `AbortError`: no es un fallo. */
const cancelo = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

export function CompartirEntrada({ entrada, tipo, catalogo, onCerrar }: { entrada: EntradaVista; tipo: TipoDiario; catalogo: Catalogo | null; onCerrar: () => void }) {
  const escala = useEscala();
  const [opciones, setOpciones] = usePreferencia("diario.tarjeta", OPCIONES_TARJETA, esOpcionesTarjeta);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { datos, md } = useMemo(() => {
    const nivel = nivelDe(escala, entrada.animo);
    const nombreAnimo = nivel ? nombreDeNivel(nivel) : null;
    const camino = catalogo && entrada.categoriaId != null ? caminoDe(entrada.categoriaId, catalogo.categorias) : [];
    const categoria = camino.length ? { nombre: camino.map((c) => c.nombre).join(" › "), color: esHex(camino[camino.length - 1].color) ? camino[camino.length - 1].color : null } : null;
    const etiquetas = catalogo
      ? entrada.etiquetas.flatMap((t) => catalogo.etiquetas.filter((x) => x.id === t.id).map((x) => (t.valor ? `${x.nombre}: ${t.valor}` : x.nombre)))
      : [];
    const d: DatosTarjeta = {
      fecha: entrada.fecha,
      hora: entrada.hora,
      titulo: entrada.titulo,
      animo: nivel && nombreAnimo ? { nombre: nombreAnimo, color: esHex(nivel.color) ? nivel.color : (COLOR_ANIMO[nivel.valor] ?? "#7F8C8D") } : null,
      categoria,
      etiquetas,
      contenido: entrada.contenido,
      texto: entrada.texto,
      fotos: entrada.fotos,
    };
    const texto = markdownParaCompartir({ fecha: entrada.fecha, hora: entrada.hora, titulo: entrada.titulo, texto: entrada.texto, contenido: entrada.contenido, animo: nombreAnimo, categoria: categoria?.nombre ?? null, etiquetas });
    return { datos: d, md: texto };
  }, [entrada, escala, catalogo]);

  const clave = `${entrada.id}-${entrada.editadaEn}-${opciones.oscuro}-${opciones.marcaDeAgua}-${opciones.escala}-${escala.map((n) => n.valor + (n.etiqueta ?? "") + (n.color ?? "")).join()}`;

  useEffect(() => {
    let vivo = true;
    dibujarTarjeta(datos, opciones)
      .then((tarjeta) => {
        const url = URL.createObjectURL(tarjeta.blob);
        if (!vivo) return URL.revokeObjectURL(url);
        setError(null);
        setResultado({ clave, url, tarjeta });
      })
      .catch((e) => vivo && setError(e instanceof Error ? e.message : "No se pudo armar la imagen"));
    return () => {
      vivo = false;
    };
    // `clave` resume entrada, opciones y escala
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps

  const url = resultado?.url;
  useEffect(() => (url ? () => URL.revokeObjectURL(url) : undefined), [url]);

  const lista = resultado && resultado.clave === clave ? resultado : null;
  const nombrePng = nombreDeCompartido(entrada.fecha, entrada.hora, "png");
  const nombreMd = nombreDeCompartido(entrada.fecha, entrada.hora, "md");

  async function compartirImagen() {
    if (!lista) return;
    const archivo = new File([lista.tarjeta.blob], nombrePng, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: entrada.titulo ?? "Diario" });
      } else {
        bajar(lista.tarjeta.blob, nombrePng);
        toast.success("Tu navegador no puede compartir archivos: se guardó la imagen.");
      }
    } catch (e) {
      if (!cancelo(e)) toast.error("No se pudo compartir la imagen");
    }
  }

  async function compartirMarkdown() {
    try {
      if (navigator.share) await navigator.share({ text: md, title: entrada.titulo ?? "Diario" });
      else {
        await navigator.clipboard.writeText(md);
        toast.success("Tu navegador no puede compartir: se copió el texto.");
      }
    } catch (e) {
      if (!cancelo(e)) toast.error("No se pudo compartir el texto");
    }
  }

  async function copiarMarkdown() {
    try {
      await navigator.clipboard.writeText(md);
      toast.success("Texto copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir {tipo === "familiar" ? "la entrada" : "mi entrada"}</DialogTitle>
          <DialogDescription>Una imagen con la entrada tal como se ve, o el texto en Markdown.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-40 place-items-center overflow-hidden rounded-lg border bg-muted/40 p-3" aria-busy={!lista}>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : lista ? (
            <div className="max-h-[42vh] w-full overflow-y-auto">
              {/* eslint-disable-next-line @next/next/no-img-element -- es una imagen local armada en el navegador */}
              <img src={lista.url} alt="Vista previa de la tarjeta" className="mx-auto w-full max-w-[22.5rem] rounded-md shadow-md" />
            </div>
          ) : (
            <Spinner />
          )}
        </div>
        {lista?.tarjeta.truncada && <p className="text-xs text-muted-foreground">La entrada es muy larga: la imagen muestra el principio y sigue con «…». El texto en Markdown la lleva completa.</p>}
        {!!lista?.tarjeta.omitidas && <p className="text-xs text-muted-foreground">{lista.tarjeta.omitidas === 1 ? "Una imagen no se pudo cargar y quedó como aviso." : `${lista.tarjeta.omitidas} imágenes no se pudieron cargar y quedaron como aviso.`}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Label className="flex items-center justify-between gap-2">
            Fondo oscuro
            <Switch checked={opciones.oscuro} onCheckedChange={(oscuro) => setOpciones({ ...opciones, oscuro })} />
          </Label>
          <Label className="flex items-center justify-between gap-2">
            Marca de agua
            <Switch checked={opciones.marcaDeAgua} onCheckedChange={(marcaDeAgua) => setOpciones({ ...opciones, marcaDeAgua })} />
          </Label>
          <Label className="col-span-2 flex items-center justify-between gap-2">
            Nitidez
            <NativeSelect size="sm" value={opciones.escala} onChange={(e) => setOpciones({ ...opciones, escala: Number(e.target.value) })} aria-label="Nitidez de la imagen">
              <NativeSelectOption value={1}>Normal (1×)</NativeSelectOption>
              <NativeSelectOption value={2}>Alta (2×)</NativeSelectOption>
              <NativeSelectOption value={3}>Máxima (3×)</NativeSelectOption>
            </NativeSelect>
          </Label>
        </div>
        {lista && lista.tarjeta.escala < opciones.escala && <p className="text-xs text-muted-foreground">Por lo larga que es, la imagen se armó a {lista.tarjeta.escala}× para que el navegador la admita.</p>}

        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <ImagenIcono className="size-4" aria-hidden /> Imagen
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!lista} onClick={() => void compartirImagen()}>
              <Share2 /> Compartir
            </Button>
            <Button variant="outline" disabled={!lista} onClick={() => lista && bajar(lista.tarjeta.blob, nombrePng)}>
              <Download /> Guardar
            </Button>
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium">
            <FileText className="size-4" aria-hidden /> Markdown
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void compartirMarkdown()}>
              <Share2 /> Compartir
            </Button>
            <Button variant="outline" onClick={() => void copiarMarkdown()}>
              <Copy /> Copiar
            </Button>
            <Button variant="outline" onClick={() => bajar(new Blob([md], { type: "text/markdown;charset=utf-8" }), nombreMd)}>
              <Download /> Descargar
            </Button>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
