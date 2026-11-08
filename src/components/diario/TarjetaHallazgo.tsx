"use client";
// Diario (lane 285): tarjeta de un resultado de búsqueda. Portado de vendor/moodiary/…/presentation/search/search_result_card.dart (ZhuJHua/moodiary@2c552dd):
// título y extracto con las coincidencias resaltadas; fecha, ánimo, categoría y etiquetas como en la lista del diario.
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Marcas, TipoDiario } from "@/lib/diario/reglas";
import type { HallazgoVista } from "@/lib/diario/servidor-busqueda";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { animoDe } from "./animo";
import { ChipEtiqueta } from "./etiquetas/ChipEtiqueta";
import { caminoDe } from "./ListaDia";
import { MarcasEntrada } from "./MarcasEntrada";
import { TextoResaltado } from "./TextoResaltado";

const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fechaLarga = (clave: string) => new Date(`${clave}T12:00:00`).toLocaleDateString("es-UY", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function TarjetaHallazgo({
  h,
  tipo,
  catalogo,
  onAbrir,
  onEditar,
  onMarcar,
}: {
  h: HallazgoVista;
  tipo: TipoDiario;
  catalogo: Catalogo | null;
  /** Ir al día de la entrada en el diario. */
  onAbrir: () => void;
  onEditar: () => void;
  onMarcar: (marcas: Marcas) => void;
}) {
  const e = h.entrada;
  const animo = animoDe(e.animo);
  const categoria = catalogo && e.categoriaId != null ? caminoDe(e.categoriaId, catalogo.categorias) : [];
  const chips = catalogo ? e.etiquetas.flatMap((t) => catalogo.etiquetas.filter((x) => x.id === t.id).map((x) => ({ etiqueta: x, valor: t.valor }))) : [];
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
          <p className="text-xs text-muted-foreground">
            {fechaLarga(e.fecha)} · {hora(e.hora)}
          </p>
        </div>
        {animo && (
          <span className="text-xl" title={animo.etiqueta} aria-label={`Ánimo: ${animo.etiqueta}`}>
            {animo.emoji}
          </span>
        )}
        <MarcasEntrada favorita={e.favorita} fijada={e.fijada} editable={e.puedoEditar} onCambiar={onMarcar} />
        {e.puedoEditar && (
          <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={onEditar}>
            <Pencil />
          </Button>
        )}
      </header>
      <button type="button" onClick={onAbrir} className="block w-full text-left" title="Ver en el diario">
        {h.titulo && (
          <h3 className="mb-1 font-semibold">
            <TextoResaltado segmentos={h.titulo} />
          </h3>
        )}
        {h.extracto.length > 0 && (
          <p className="text-sm break-words">
            <TextoResaltado segmentos={h.extracto} />
          </p>
        )}
      </button>
      {categoria.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 shrink-0 rounded-full border" style={{ backgroundColor: categoria[categoria.length - 1].color ?? "transparent" }} aria-hidden />
          {categoria.map((c) => c.nombre).join(" › ")}
        </p>
      )}
      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map(({ etiqueta, valor }) => (
            <ChipEtiqueta key={etiqueta.id} etiqueta={etiqueta} valor={valor} pequeno />
          ))}
        </div>
      )}
    </article>
  );
}
