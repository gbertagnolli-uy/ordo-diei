"use client";
// Diario (lane 284): administrar etiquetas, categorías de etiquetas y categorías de entrada.
// Portado de vendor/Daily_You/lib/pages/settings/tags_settings.dart (Demizo/Daily_You@7cc237d): categorías plegables, etiquetas con su conteo
// de entradas, editar, crear y reordenar. Daily You reordena arrastrando; acá se usan botones subir/bajar (decisión E5, sirven con teclado y táctil).
// La pestaña de categorías de entrada sale de moodiary (vendor/moodiary/.../category_repository.dart, ZhuJHua/moodiary@2c552dd).
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, FolderPlus, Pencil, Plus, TagIcon } from "lucide-react";
import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aplanarArbol, armarSecciones, porOrden } from "@/lib/diario/etiquetas";
import type { CategoriaVista, EtiquetaVista, GrupoVista } from "@/lib/diario/servidor-catalogo";
import { ChipEtiqueta } from "./ChipEtiqueta";
import { EditarCategoria, EditarEtiqueta, EditarGrupo } from "./Editores";
import { IconoEtiqueta } from "./iconos";
import type { AccionesCatalogo } from "./useCatalogo";

type Dialogo =
  | { clase: "etiqueta"; etiqueta?: EtiquetaVista; grupoInicial?: number | null }
  | { clase: "grupo"; grupo?: GrupoVista }
  | { clase: "categoria"; categoria?: CategoriaVista }
  | null;

const entradas = (n: number) => `${n} ${n === 1 ? "entrada" : "entradas"}`;

/** Intercambia el elemento `i` con su vecino en la dirección dada. */
function mover(ids: number[], i: number, dir: -1 | 1): number[] | null {
  const j = i + dir;
  if (j < 0 || j >= ids.length) return null;
  const nuevo = [...ids];
  [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
  return nuevo;
}

function Flechas({ i, total, onMover, nombre }: { i: number; total: number; onMover: (dir: -1 | 1) => void; nombre: string }) {
  return (
    <span className="flex shrink-0">
      <Button type="button" variant="ghost" size="icon-xs" aria-label={`Subir ${nombre}`} disabled={i === 0} onClick={() => onMover(-1)}>
        <ChevronUp />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" aria-label={`Bajar ${nombre}`} disabled={i === total - 1} onClick={() => onMover(1)}>
        <ChevronDown />
      </Button>
    </span>
  );
}

export function AdministrarDiario({ acciones, pestanaInicial = "etiquetas", onCerrar }: { acciones: AccionesCatalogo; pestanaInicial?: "etiquetas" | "categorias"; onCerrar: () => void }) {
  const catalogo = acciones.catalogo;
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [plegados, setPlegados] = useState<Set<number | null>>(new Set());

  const datos = useMemo(() => {
    if (!catalogo) return null;
    const grupos = [...catalogo.grupos].sort(porOrden);
    const etiquetas = [...catalogo.etiquetas].sort(porOrden);
    // Como en Daily You, las categorías vacías también se muestran; las sueltas, solo si hay alguna
    const secciones = armarSecciones(grupos, etiquetas);
    const conGrupo = grupos.map((g) => ({ grupo: g, etiquetas: secciones.find((s) => s.grupo?.id === g.id)?.etiquetas ?? [] }));
    const sueltas = secciones.find((s) => s.grupo == null)?.etiquetas ?? [];
    return { grupos, conGrupo, sueltas, arbol: aplanarArbol(catalogo.categorias) };
  }, [catalogo]);

  const alternar = (id: number | null) =>
    setPlegados((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Funciones que devuelven JSX (no componentes): así no se vuelven a montar en cada render
  const filaEtiqueta = (e: EtiquetaVista, i: number, lista: EtiquetaVista[]) => {
    return (
      <li key={e.id} className="flex items-center gap-2 py-1 pl-7">
        <button type="button" disabled={!e.puedoEditar} onClick={() => setDialogo({ clase: "etiqueta", etiqueta: e })} className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default" aria-label={`Editar ${e.nombre}`}>
          <ChipEtiqueta etiqueta={e} pequeno />
          <span className="shrink-0 text-xs text-muted-foreground">{entradas(e.usos)}</span>
        </button>
        <Flechas
          i={i}
          total={lista.length}
          nombre={e.nombre}
          onMover={(dir) => {
            const ids = mover(lista.map((x) => x.id), i, dir);
            if (ids) void acciones.reordenar("etiquetas", ids);
          }}
        />
      </li>
    );
  };

  const seccion = (grupo: GrupoVista | null, lista: EtiquetaVista[], indice?: number) => {
    const plegado = plegados.has(grupo?.id ?? null);
    return (
      <section key={grupo?.id ?? "sueltas"} className="rounded-xl border">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Button type="button" variant="ghost" size="icon-xs" aria-label={plegado ? "Desplegar" : "Plegar"} aria-expanded={!plegado} onClick={() => alternar(grupo?.id ?? null)}>
            {plegado ? <ChevronRight /> : <ChevronDown />}
          </Button>
          {grupo ? <IconoEtiqueta icono={grupo.icono} tipoIcono={grupo.tipoIcono} reemplazo={Folder} color={grupo.color} tamano={18} /> : <TagIcon className="size-4 text-muted-foreground" aria-hidden />}
          <span className="min-w-0 flex-1 truncate font-medium">{grupo?.nombre ?? "Sin categoría"}</span>
          {grupo?.seleccionUnica && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">una sola</span>}
          <span className="text-xs text-muted-foreground">{lista.length}</span>
          {grupo && (
            <>
              <Button type="button" variant="ghost" size="icon-xs" aria-label={`Agregar etiqueta a ${grupo.nombre}`} onClick={() => setDialogo({ clase: "etiqueta", grupoInicial: grupo.id })}>
                <Plus />
              </Button>
              {grupo.puedoEditar && (
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Editar ${grupo.nombre}`} onClick={() => setDialogo({ clase: "grupo", grupo })}>
                  <Pencil />
                </Button>
              )}
              <Flechas
                i={indice ?? 0}
                total={datos?.grupos.length ?? 0}
                nombre={grupo.nombre}
                onMover={(dir) => {
                  const ids = mover((datos?.grupos ?? []).map((g) => g.id), indice ?? 0, dir);
                  if (ids) void acciones.reordenar("grupos", ids);
                }}
              />
            </>
          )}
        </div>
        {!plegado && (lista.length ? <ul className="pb-1">{lista.map((e, i) => filaEtiqueta(e, i, lista))}</ul> : <p className="pb-2 pl-9 text-xs text-muted-foreground">Sin etiquetas</p>)}
      </section>
    );
  };

  return (
    <Sheet open onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Etiquetas y categorías</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          {!catalogo || !datos ? (
            <p className="py-8 text-center text-muted-foreground">Cargando…</p>
          ) : (
            <Tabs defaultValue={pestanaInicial}>
              <TabsList>
                <TabsTrigger value="etiquetas">Etiquetas</TabsTrigger>
                <TabsTrigger value="categorias">Categorías de entrada</TabsTrigger>
              </TabsList>

              <TabsContent value="etiquetas" className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogo({ clase: "grupo" })}>
                    <FolderPlus /> Categoría
                  </Button>
                  <Button type="button" onClick={() => setDialogo({ clase: "etiqueta" })}>
                    <Plus /> Etiqueta
                  </Button>
                </div>
                {catalogo.etiquetas.length === 0 && catalogo.grupos.length === 0 && <p className="py-6 text-center text-muted-foreground">Todavía no hay etiquetas</p>}
                {datos.sueltas.length > 0 && seccion(null, datos.sueltas)}
                {datos.conGrupo.map((s, i) => seccion(s.grupo, s.etiquetas, i))}
              </TabsContent>

              <TabsContent value="categorias" className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Cada entrada puede tener una categoría. Podés anidarlas hasta 3 niveles.</p>
                <div>
                  <Button type="button" onClick={() => setDialogo({ clase: "categoria" })}>
                    <Plus /> Categoría
                  </Button>
                </div>
                {datos.arbol.length === 0 && <p className="py-6 text-center text-muted-foreground">Todavía no hay categorías de entrada</p>}
                <ul className="flex flex-col">
                  {datos.arbol.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 py-1" style={{ paddingLeft: (c.nivel - 1) * 20 }}>
                      <span className="size-3 shrink-0 rounded-full border" style={{ backgroundColor: c.color ?? "transparent" }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{c.nombre}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{entradas(c.usos)}</span>
                      {c.puedoEditar && (
                        <Button type="button" variant="ghost" size="icon-xs" aria-label={`Editar ${c.nombre}`} onClick={() => setDialogo({ clase: "categoria", categoria: c })}>
                          <Pencil />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {catalogo && dialogo?.clase === "etiqueta" && (
          <EditarEtiqueta
            key={dialogo.etiqueta?.id ?? "nueva"}
            etiqueta={dialogo.etiqueta}
            grupoInicial={dialogo.grupoInicial ?? null}
            grupos={datos?.grupos ?? []}
            onCerrar={() => setDialogo(null)}
            onGuardar={async (cuerpo) => (dialogo.etiqueta ? acciones.editar("etiquetas", dialogo.etiqueta.id, cuerpo) : (await acciones.crear("etiquetas", cuerpo)) != null)}
            onBorrar={dialogo.etiqueta ? () => acciones.borrar("etiquetas", dialogo.etiqueta!.id) : undefined}
          />
        )}
        {catalogo && dialogo?.clase === "grupo" && (
          <EditarGrupo
            key={dialogo.grupo?.id ?? "nuevo"}
            grupo={dialogo.grupo}
            cuantasEtiquetas={catalogo.etiquetas.filter((e) => e.grupoId === dialogo.grupo?.id).length}
            usosTotales={catalogo.etiquetas.filter((e) => e.grupoId === dialogo.grupo?.id).reduce((n, e) => n + e.usos, 0)}
            onCerrar={() => setDialogo(null)}
            onGuardar={async (cuerpo) => (dialogo.grupo ? acciones.editar("grupos", dialogo.grupo.id, cuerpo) : (await acciones.crear("grupos", cuerpo)) != null)}
            onBorrar={dialogo.grupo ? () => acciones.borrar("grupos", dialogo.grupo!.id) : undefined}
          />
        )}
        {catalogo && dialogo?.clase === "categoria" && (
          <EditarCategoria
            key={dialogo.categoria?.id ?? "nueva"}
            categoria={dialogo.categoria}
            categorias={catalogo.categorias}
            onCerrar={() => setDialogo(null)}
            onGuardar={async (cuerpo) => (dialogo.categoria ? acciones.editar("categorias", dialogo.categoria.id, cuerpo) : (await acciones.crear("categorias", cuerpo)) != null)}
            onBorrar={dialogo.categoria ? () => acciones.borrar("categorias", dialogo.categoria!.id) : undefined}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
