"use client";
// Diario (lane 289): los recuerdos del día, en un carrusel arriba de la lista. Portado de vendor/Daily_You/lib/widgets/flashback_card.dart
// y del inicio (lib/pages/home_page.dart) (Demizo/Daily_You@7cc237d): una tarjeta por grupo con su título, la cantidad de entradas, hasta cuatro portadas y un adelanto del texto.
import { History } from "lucide-react";
import { portadaDe } from "@/lib/diario/calendario";
import type { OpcionesRecuerdos } from "@/lib/diario/recuerdos";
import type { GrupoRecuerdoVista } from "@/lib/diario/servidor-linea";
import { fechaLarga } from "../estadisticas/controles";

const ADELANTO = 120;

function Tarjeta({ grupo, ocultarImagenes, onAbrir }: { grupo: GrupoRecuerdoVista; ocultarImagenes: boolean; onAbrir: (g: GrupoRecuerdoVista) => void }) {
  const primera = grupo.entradas[0].entrada;
  const portadas = ocultarImagenes ? [] : grupo.entradas.flatMap((e) => portadaDe(e.entrada) ?? []).slice(0, 4);
  const texto = (primera.titulo ? `${primera.titulo}. ` : "") + primera.texto.replace(/\s+/g, " ").trim();
  return (
    <li className="shrink-0">
      <button type="button" onClick={() => onAbrir(grupo)} className="flex h-36 w-60 flex-col gap-1 overflow-hidden rounded-xl border bg-card p-3 text-left transition hover:bg-muted">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{grupo.titulo}</span>
          {grupo.entradas.length > 1 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{grupo.entradas.length}</span>}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {grupo.entradas.length === 1 && grupo.entradas[0].etiqueta !== grupo.titulo ? `${grupo.entradas[0].etiqueta} · ` : ""}
          {fechaLarga(primera.fecha)}
        </span>
        <span className="flex min-h-0 flex-1 gap-2">
          <span className="line-clamp-4 min-w-0 flex-1 text-xs">{texto.length > ADELANTO ? `${texto.slice(0, ADELANTO).trimEnd()}…` : texto || "(sin texto)"}</span>
          {portadas.length > 0 && (
            <span className="grid shrink-0 grid-cols-2 gap-0.5 self-start">
              {portadas.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload
                <img key={url} src={url} alt="" className={portadas.length === 1 ? "col-span-2 size-16 rounded-md object-cover" : "size-8 rounded-sm object-cover"} />
              ))}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

export function SeccionRecuerdos({ grupos, opciones, onAbrir }: { grupos: GrupoRecuerdoVista[]; opciones: OpcionesRecuerdos; onAbrir: (g: GrupoRecuerdoVista) => void }) {
  if (!grupos.length) return null;
  return (
    <section aria-label="Recuerdos" className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <History className="size-4 text-primary" aria-hidden /> Recuerdos
      </h2>
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {grupos.map((g) => (
          <Tarjeta key={g.clave} grupo={g} ocultarImagenes={opciones.ocultarImagenes} onAbrir={onAbrir} />
        ))}
      </ul>
    </section>
  );
}
