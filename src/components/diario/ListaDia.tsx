"use client";
// Diario (lane 272): entradas del día seleccionado. UX basada en theachoem/storypad@a76825e (lib/views/home).
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { animoDe } from "./animo";
import { EditorTexto } from "./editor/EditorTexto";

const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function Tarjeta({
  e,
  tipo,
  onEditar,
  onBorrar,
}: {
  e: EntradaVista;
  tipo: TipoDiario;
  onEditar: (e: EntradaVista) => void;
  onBorrar: (e: EntradaVista) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const animo = animoDe(e.animo);
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
        {animo && (
          <span className="text-xl" title={animo.etiqueta} aria-label={`Ánimo: ${animo.etiqueta}`}>
            {animo.emoji}
          </span>
        )}
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
  onEditar,
  onBorrar,
}: {
  entradas: EntradaVista[];
  tipo: TipoDiario;
  onEditar: (e: EntradaVista) => void;
  onBorrar: (e: EntradaVista) => void;
}) {
  if (!entradas.length) return <p className="py-8 text-center text-sm text-muted-foreground">No hay entradas este día.</p>;
  return (
    <div className="flex flex-col gap-3">
      {entradas.map((e) => (
        <Tarjeta key={e.id} e={e} tipo={tipo} onEditar={onEditar} onBorrar={onBorrar} />
      ))}
    </div>
  );
}
