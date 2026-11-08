"use client";
// Diario (lane 272): entradas del día seleccionado. UX basada en theachoem/storypad@a76825e (lib/views/home).
import { useState } from "react";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Marcas, TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import type { Catalogo, CategoriaVista } from "@/lib/diario/servidor-catalogo";
import { nivelDe, nombreDeNivel } from "@/lib/diario/escala";
import { EditorTexto } from "./editor/EditorTexto";
import { PanelEnlaces } from "./enlaces/PanelEnlaces";
import { fechaLarga } from "./estadisticas/controles";
import { GlifoAnimo, useEscala } from "./EscalaAnimo";
import { ChipEtiqueta } from "./etiquetas/ChipEtiqueta";
import { MarcasEntrada } from "./MarcasEntrada";

const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** «Fe › Misa › Domingo»: la categoría con sus madres. */
export function caminoDe(id: number, categorias: CategoriaVista[]): CategoriaVista[] {
  const camino: CategoriaVista[] = [];
  for (let c = categorias.find((x) => x.id === id); c && camino.length < 5; c = c.padreId != null ? categorias.find((x) => x.id === c!.padreId) : undefined) camino.unshift(c);
  return camino;
}

function Tarjeta({
  e,
  tipo,
  catalogo,
  onEditar,
  onBorrar,
  onMarcar,
}: {
  e: EntradaVista;
  tipo: TipoDiario;
  catalogo: Catalogo | null;
  onEditar: (e: EntradaVista) => void;
  onBorrar: (e: EntradaVista) => void;
  onMarcar: (e: EntradaVista, marcas: Marcas) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const [verEnlaces, setVerEnlaces] = useState(false);
  const nivel = nivelDe(useEscala(), e.animo);
  const categoria = catalogo && e.categoriaId != null ? caminoDe(e.categoriaId, catalogo.categorias) : [];
  const chips = catalogo ? e.etiquetas.flatMap((t) => catalogo.etiquetas.filter((x) => x.id === t.id).map((x) => ({ etiqueta: x, valor: t.valor }))) : [];
  const largo = e.texto.length > 280 || e.texto.split("\n").length > 4;
  return (
    <article className="rounded-xl border bg-card p-4">
      <header className="mb-2 flex items-center gap-2">
        {tipo === "familiar" && (
          <Avatar className="size-7">
            {e.autor.fotoUrl && <AvatarImage src={e.autor.fotoUrl} alt="" />}
            <AvatarFallback>{e.autor.nombre.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          {tipo === "familiar" && <p className="truncate text-sm font-medium">{e.autor.nombre}</p>}
          <p className="text-xs text-muted-foreground">{hora(e.hora)}</p>
        </div>
        {nivel && (
          <span title={nombreDeNivel(nivel)} role="img" aria-label={`Ánimo: ${nombreDeNivel(nivel)}`}>
            <GlifoAnimo nivel={nivel} tamano={22} />
          </span>
        )}
        {e.enlaces > 0 && (
          <Button variant="ghost" size="sm" aria-label={`Enlaces (${e.enlaces})`} aria-expanded={verEnlaces} onClick={() => setVerEnlaces(!verEnlaces)}>
            <Link2 /> {e.enlaces}
          </Button>
        )}
        <MarcasEntrada favorita={e.favorita} fijada={e.fijada} editable={e.puedoEditar} onCambiar={(m) => onMarcar(e, m)} />
        {e.puedoEditar && (
          <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => onEditar(e)}>
            <Pencil />
          </Button>
        )}
        {e.puedoBorrar && (
          <Button variant="ghost" size="icon-sm" aria-label="Borrar" onClick={() => onBorrar(e)}>
            <Trash2 />
          </Button>
        )}
      </header>
      {e.titulo && <h3 className="mb-1 font-semibold">{e.titulo}</h3>}
      {categoria.length > 0 && (
        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 shrink-0 rounded-full border" style={{ backgroundColor: categoria[categoria.length - 1].color ?? "transparent" }} aria-hidden />
          {categoria.map((c) => c.nombre).join(" › ")}
        </p>
      )}
      {e.contenido ? (
        // Entrada con formato (lane 283): se muestra con el mismo editor, solo lectura. Plegada a unas 6 líneas.
        <div className={`text-sm ${abierta ? "" : "max-h-36 overflow-hidden"}`}>
          <EditorTexto key={`${e.id}-${e.editadaEn}`} inicial={{ contenido: e.contenido, texto: e.texto }} editable={false} />
        </div>
      ) : (
        <p className={`whitespace-pre-line text-sm ${abierta ? "" : "line-clamp-4"}`}>{e.texto}</p>
      )}
      {largo && (
        <button type="button" className="mt-1 text-sm text-primary" onClick={() => setAbierta(!abierta)}>
          {abierta ? "ver menos" : "ver más"}
        </button>
      )}
      {verEnlaces && e.enlaces > 0 && <PanelEnlaces tipo={tipo} entradaId={e.id} />}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map(({ etiqueta, valor }) => (
            <ChipEtiqueta key={etiqueta.id} etiqueta={etiqueta} valor={valor} pequeno />
          ))}
        </div>
      )}
      {e.fotos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {e.fotos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload */}
              <img src={url} alt="" className="size-20 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export function ListaDia({
  entradas,
  tipo,
  catalogo,
  onEditar,
  onBorrar,
  onMarcar,
  vacio = "No hay entradas este día.",
  agrupar = false,
}: {
  entradas: EntradaVista[];
  tipo: TipoDiario;
  catalogo: Catalogo | null;
  onEditar: (e: EntradaVista) => void;
  onBorrar: (e: EntradaVista) => void;
  onMarcar: (e: EntradaVista, marcas: Marcas) => void;
  /** Qué decir cuando no hay entradas. */
  vacio?: string;
  /** Con varios días (todo el mes): un título con la fecha antes de cada día (lane 288, storypad «todas del mes»). */
  agrupar?: boolean;
}) {
  if (!entradas.length) return <p className="py-8 text-center text-sm text-muted-foreground">{vacio}</p>;
  // Las fijadas van arriba del día (storypad `pinnedStories`); el resto conserva su orden
  const ordenadas = agrupar ? entradas : [...entradas].sort((a, b) => Number(b.fijada) - Number(a.fijada));
  return (
    <div className="flex flex-col gap-3">
      {ordenadas.map((e, i) => (
        <div key={e.id} className="flex flex-col gap-3">
          {agrupar && (i === 0 || ordenadas[i - 1].fecha !== e.fecha) && <h3 className="pt-1 text-sm font-medium text-muted-foreground">{fechaLarga(e.fecha)}</h3>}
          <Tarjeta e={e} tipo={tipo} catalogo={catalogo} onEditar={onEditar} onBorrar={onBorrar} onMarcar={onMarcar} />
        </div>
      ))}
    </div>
  );
}
