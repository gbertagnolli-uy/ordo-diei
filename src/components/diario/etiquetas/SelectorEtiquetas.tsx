"use client";
// Diario (lane 284): elegir las etiquetas de una entrada. Portado de vendor/Daily_You/lib/widgets/tag_picker_dialog.dart (modo «attach»),
// tag_attachment_source.dart y tag_grouped_chip_list.dart (Demizo/Daily_You@7cc237d): las puestas arriba (con ✕ y, en los contadores, el valor),
// búsqueda por nombre o categoría, «crear desde la búsqueda», orden manual o por uso y el catálogo agrupado por categoría.
// La regla de una sola por categoría (sentimiento, clima) viene de storypad (`multiSelect`, theachoem/storypad@a76825e).
import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Plus, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { armarSecciones, limpiarNombre, porOrden, type EtiquetaPuesta } from "@/lib/diario/etiquetas";
import type { Catalogo, EtiquetaVista, GrupoVista } from "@/lib/diario/servidor-catalogo";
import { ChipEtiqueta } from "./ChipEtiqueta";
import { EditarEtiqueta } from "./Editores";
import { IconoEtiqueta } from "./iconos";
import { ValorContador } from "./ValorContador";
import type { AccionesCatalogo } from "./useCatalogo";

type Orden = "manual" | "uso";
const CLAVE_ORDEN = "diario.etiquetas.orden";

const leerOrden = (): Orden => {
  try {
    return localStorage.getItem(CLAVE_ORDEN) === "uso" ? "uso" : "manual";
  } catch {
    return "manual";
  }
};

export function EncabezadoSeccion({ grupo }: { grupo: GrupoVista }) {
  return (
    <h3 className="mt-2 mb-1 flex items-center gap-1.5 text-sm font-semibold">
      <IconoEtiqueta icono={grupo.icono} tipoIcono={grupo.tipoIcono} color={grupo.color} />
      <span className="truncate">{grupo.nombre}</span>
      {grupo.seleccionUnica && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">una sola</span>}
    </h3>
  );
}

export function SelectorEtiquetas({
  acciones,
  puestas,
  onCambio,
  onAdministrar,
  onCerrar,
}: {
  acciones: AccionesCatalogo;
  puestas: EtiquetaPuesta[];
  onCambio: (p: EtiquetaPuesta[]) => void;
  onAdministrar: () => void;
  onCerrar: () => void;
}) {
  const catalogo = acciones.catalogo;
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>(leerOrden);
  const [valorDe, setValorDe] = useState<{ etiqueta: EtiquetaVista; inicial: string | null } | null>(null);
  const [creando, setCreando] = useState<string | null>(null);

  const datos = useMemo(() => {
    if (!catalogo) return null;
    const grupos = [...catalogo.grupos].sort(porOrden);
    const etiquetas = [...catalogo.etiquetas].sort(orden === "uso" ? (a, b) => b.usos - a.usos || porOrden(a, b) : porOrden);
    const ids = new Set(puestas.map((p) => p.id));
    return {
      grupos,
      puestas: armarSecciones(grupos, etiquetas.filter((e) => ids.has(e.id))),
      disponibles: armarSecciones(grupos, etiquetas.filter((e) => !ids.has(e.id)), busqueda),
      porId: new Map(etiquetas.map((e) => [e.id, e])),
    };
  }, [catalogo, puestas, orden, busqueda]);

  function cambiarOrden(o: Orden) {
    setOrden(o);
    try {
      localStorage.setItem(CLAVE_ORDEN, o);
    } catch {
      /* sin almacenamiento: queda solo en esta sesión */
    }
  }

  /** Pone la etiqueta. En un grupo de «una sola», reemplaza a la que hubiera de ese grupo. */
  function poner(e: Pick<EtiquetaVista, "id" | "grupoId">, valor: string | null, grupos: GrupoVista[], etiquetasDe: (id: number) => Pick<EtiquetaVista, "grupoId"> | undefined) {
    const unica = e.grupoId != null && grupos.find((g) => g.id === e.grupoId)?.seleccionUnica;
    const resto = puestas.filter((p) => p.id !== e.id && !(unica && etiquetasDe(p.id)?.grupoId === e.grupoId));
    onCambio([...resto, { id: e.id, valor }]);
  }

  if (!catalogo || !datos) {
    return (
      <Dialog open onOpenChange={(a) => !a && onCerrar()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Etiquetas</DialogTitle>
          </DialogHeader>
          <p className="py-6 text-center text-muted-foreground">Cargando…</p>
        </DialogContent>
      </Dialog>
    );
  }

  const valorActual = (id: number) => puestas.find((p) => p.id === id)?.valor ?? null;
  const elegir = (e: EtiquetaVista) => {
    if (e.tipo === "contador") setValorDe({ etiqueta: e, inicial: null });
    else poner(e, null, datos.grupos, (id) => datos.porId.get(id));
  };
  const q = limpiarNombre(busqueda);
  const hayIgual = catalogo.etiquetas.some((e) => e.nombre.toLowerCase() === q.toLowerCase());

  return (
    <Dialog open onOpenChange={(a) => !a && onCerrar()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Etiquetas</DialogTitle>
        </DialogHeader>

        {datos.puestas.length > 0 && (
          <div className="flex flex-col" aria-label="Etiquetas puestas">
            {datos.puestas.map((s) => (
              <section key={s.grupo?.id ?? "sueltas"}>
                {s.grupo && <EncabezadoSeccion grupo={s.grupo} />}
                <div className="flex flex-wrap gap-1.5">
                  {s.etiquetas.map((e) => (
                    <ChipEtiqueta
                      key={e.id}
                      etiqueta={e}
                      valor={valorActual(e.id)}
                      onClick={e.tipo === "contador" ? () => setValorDe({ etiqueta: e, inicial: valorActual(e.id) }) : undefined}
                      onQuitar={() => onCambio(puestas.filter((p) => p.id !== e.id))}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar o crear una etiqueta…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar etiquetas" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={orden === "manual" ? "Ordenadas a mano. Cambiar a más usadas" : "Ordenadas por uso. Cambiar a orden manual"}
            title={orden === "manual" ? "Orden manual" : "Más usadas primero"}
            aria-pressed={orden === "uso"}
            onClick={() => cambiarOrden(orden === "manual" ? "uso" : "manual")}
          >
            <ArrowDownWideNarrow />
          </Button>
        </div>
        {q && !hayIgual && (
          <Button type="button" variant="secondary" onClick={() => setCreando(q)}>
            <Plus /> Crear «{q}»
          </Button>
        )}

        <div className="flex flex-col">
          {datos.disponibles.length === 0 && <p className="py-4 text-center text-muted-foreground">{q ? "Sin resultados" : "Ya pusiste todas las etiquetas"}</p>}
          {datos.disponibles.map((s) => (
            <section key={s.grupo?.id ?? "sueltas"}>
              {s.grupo && <EncabezadoSeccion grupo={s.grupo} />}
              <div className="flex flex-wrap gap-1.5">
                {s.etiquetas.map((e) => (
                  <ChipEtiqueta key={e.id} etiqueta={e} onClick={() => elegir(e)} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="sm:mr-auto" onClick={onAdministrar}>
            <Settings2 /> Administrar
          </Button>
          <Button type="button" onClick={onCerrar}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>

      {valorDe && (
        <ValorContador
          nombre={valorDe.etiqueta.nombre}
          inicial={valorDe.inicial}
          sugeridos={valorDe.etiqueta.valoresFrecuentes}
          onCerrar={() => setValorDe(null)}
          onElegir={(v) => {
            poner(valorDe.etiqueta, v, datos.grupos, (id) => datos.porId.get(id));
            setValorDe(null);
          }}
        />
      )}
      {creando !== null && (
        <EditarEtiqueta
          nombreInicial={creando}
          grupos={catalogo.grupos}
          onCerrar={() => setCreando(null)}
          onGuardar={async (cuerpo) => {
            const id = await acciones.crear("etiquetas", cuerpo);
            if (id == null) return false;
            setBusqueda("");
            // Como en Daily You, la recién creada queda puesta en la entrada (los contadores piden su valor)
            const nueva = { id, grupoId: (cuerpo.grupoId as number | null) ?? null, nombre: String(cuerpo.nombre), tipo: cuerpo.tipo, valoresFrecuentes: [] } as Pick<EtiquetaVista, "id" | "grupoId" | "nombre" | "tipo" | "valoresFrecuentes">;
            if (nueva.tipo === "contador") setValorDe({ etiqueta: nueva as EtiquetaVista, inicial: null });
            else poner(nueva, null, (acciones.catalogo ?? catalogo).grupos as Catalogo["grupos"], (idX) => datos.porId.get(idX));
            return true;
          }}
        />
      )}
    </Dialog>
  );
}
