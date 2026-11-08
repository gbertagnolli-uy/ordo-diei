"use client";
// Diario (lane 289): un nodo de la línea de tiempo — fecha a la izquierda, el eje con un punto del color del ánimo y la entrada a la derecha.
// Portado de vendor/moodiary/.../presentation/widget/timeline_tile.dart y timeline_view.dart (ZhuJHua/moodiary@2c552dd): el punto toma el color del ánimo
// (hueco si no hay), el tramo hacia el nodo siguiente es un degradé entre los dos colores y, si se salta un día entero, el eje se corta con una línea punteada.
import { Heart, Pin } from "lucide-react";
import { imagenesDe } from "@/lib/diario/contenido";
import { nivelDe } from "@/lib/diario/escala";
import type { NodoLinea } from "@/lib/diario/linea";
import type { EntradaVista } from "@/lib/diario/servidor";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { colorDe, useEscala } from "../EscalaAnimo";
import { ChipEtiqueta } from "../etiquetas/ChipEtiqueta";
import { caminoDe } from "../ListaDia";
import { ClimaYLugar } from "../lugares/ContextoLugares";

const MAX_IMAGENES = 3;
const MAX_ETIQUETAS = 4;
const SIN_ANIMO = "var(--border)";

const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fechaCorta = (clave: string) => new Date(`${clave}T12:00:00`).toLocaleDateString("es-UY", { day: "numeric", month: "short", year: "numeric" });

/** Todas las imágenes de la entrada: las fotos subidas y las que están dentro del texto. */
const imagenesDeEntrada = (e: EntradaVista): string[] => [...new Set([...e.fotos, ...(e.contenido ? imagenesDe(e.contenido) : [])])];

function ColumnaFecha({ fecha, inicioDeDia }: { fecha: string; inicioDeDia: boolean }) {
  if (!inicioDeDia) return <div />;
  const d = new Date(`${fecha}T12:00:00`);
  return (
    <div className="pt-1 text-center leading-tight">
      <p className="text-lg font-semibold">{Number(fecha.slice(8))}</p>
      <p className="text-xs text-muted-foreground uppercase">{d.toLocaleDateString("es-UY", { weekday: "short" }).replace(".", "")}</p>
    </div>
  );
}

export function NodoLineaTiempo({
  nodo,
  siguiente,
  ultimo,
  catalogo,
  porEdicion,
  onAbrir,
}: {
  nodo: NodoLinea<EntradaVista>;
  /** El nodo de abajo (para el degradé del eje); `null` si es el último. */
  siguiente: NodoLinea<EntradaVista> | null;
  ultimo: boolean;
  catalogo: Catalogo | null;
  /** Con «Última edición» la fecha de la izquierda es la de edición, y la fecha de la entrada va en el texto. */
  porEdicion: boolean;
  onAbrir: (fecha: string) => void;
}) {
  const escala = useEscala();
  const e = nodo.item.entrada;
  const colorDeNodo = (n: NodoLinea<EntradaVista>) => {
    const nivel = nivelDe(escala, n.item.entrada.animo);
    return nivel ? colorDe(nivel) : SIN_ANIMO;
  };
  const color = colorDeNodo(nodo);
  const colorSiguiente = siguiente && !siguiente.corteAntes ? colorDeNodo(siguiente) : color;
  const conAnimo = e.animo !== null && nivelDe(escala, e.animo) !== null;
  const imagenes = imagenesDeEntrada(e);
  const categoria = catalogo && e.categoriaId != null ? caminoDe(e.categoriaId, catalogo.categorias) : [];
  const chips = catalogo ? e.etiquetas.flatMap((t) => catalogo.etiquetas.filter((x) => x.id === t.id).map((x) => ({ etiqueta: x, valor: t.valor }))) : [];
  const texto = e.texto.replace(/\s+/g, " ").trim();

  return (
    <>
      {nodo.corteAntes && (
        <li className="grid grid-cols-[3.5rem_1.5rem_1fr] gap-x-2" aria-hidden>
          <div />
          <div className="mx-auto h-8 w-0 border-l-2 border-dashed border-border" />
          <div />
        </li>
      )}
      <li className="grid grid-cols-[3.5rem_1.5rem_1fr] gap-x-2">
        <ColumnaFecha fecha={nodo.item.sello.fecha} inicioDeDia={nodo.inicioDeDia} />
        <div className="relative" aria-hidden>
          {!ultimo && <span className="absolute top-5 -bottom-0 left-1/2 w-0.5 -translate-x-1/2" style={{ backgroundImage: `linear-gradient(to bottom, ${color}, ${colorSiguiente})` }} />}
          <span
            className={cn("absolute left-1/2 -translate-x-1/2 rounded-full border-2", nodo.inicioDeDia ? "top-2.5 size-3.5" : "top-3 size-2.5")}
            style={{ borderColor: color, backgroundColor: conAnimo ? color : "var(--background)" }}
          />
        </div>
        <button type="button" onClick={() => onAbrir(e.fecha)} className="mb-3 flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-3 text-left transition hover:bg-muted">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{porEdicion ? `Entrada del ${fechaCorta(e.fecha)} · ${hora(e.hora)}` : hora(nodo.item.sello.hora)}</span>
            {categoria.length > 0 && (
              <span className="flex min-w-0 items-center gap-1">
                <span className="size-2 shrink-0 rounded-full border" style={{ backgroundColor: categoria[categoria.length - 1].color ?? "transparent" }} />
                <span className="truncate">{categoria.map((c) => c.nombre).join(" › ")}</span>
              </span>
            )}
            <span className="ml-auto flex shrink-0 gap-1">
              {e.favorita && <Heart className="size-3.5 fill-current text-destructive" aria-label="Favorita" />}
              {e.fijada && <Pin className="size-3.5 fill-current text-primary" aria-label="Fijada" />}
            </span>
          </span>
          {e.titulo && <span className="text-sm font-semibold">{e.titulo}</span>}
          <ClimaYLugar clima={e.clima} lugarId={e.lugarId} />
          <span className="line-clamp-3 text-sm">{texto || (imagenes.length ? "" : "(sin texto)")}</span>
          {imagenes.length > 0 && (
            <span className="mt-1 flex gap-1.5">
              {imagenes.slice(0, MAX_IMAGENES).map((url, i) => (
                <span key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload */}
                  <img src={url} alt="" className="size-16 rounded-lg object-cover" />
                  {i === MAX_IMAGENES - 1 && imagenes.length > MAX_IMAGENES && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/55 text-sm font-medium text-white">+{imagenes.length - MAX_IMAGENES}</span>
                  )}
                </span>
              ))}
            </span>
          )}
          {chips.length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1.5">
              {chips.slice(0, MAX_ETIQUETAS).map(({ etiqueta, valor }) => (
                <ChipEtiqueta key={etiqueta.id} etiqueta={etiqueta} valor={valor} pequeno />
              ))}
              {chips.length > MAX_ETIQUETAS && <span className="self-center text-xs text-muted-foreground">+{chips.length - MAX_ETIQUETAS}</span>}
            </span>
          )}
        </button>
      </li>
    </>
  );
}
