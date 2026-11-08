"use client";
// Diario (lane 285): hoja de filtros de la búsqueda. Portado de vendor/storypad/lib/views/search/filter/search_filter_content.dart (theachoem/storypad@a76825e):
// años con conteo, etiquetas por categoría con conteo y favorita/fijada de tres estados; de vendor/moodiary (…/search_page.dart, ZhuJHua/moodiary@2c552dd):
// categoría y rango de fechas; de vendor/Daily_You (…/tag_picker_dialog.dart, Demizo/Daily_You@7cc237d): etiquetas «alguna / todas / sin etiquetas».
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { rangoDePreset, presetDe, sumarDias, type FiltroBusqueda, type ModoEtiquetas, type PresetFecha } from "@/lib/diario/busqueda";
import { aplanarArbol, armarSecciones } from "@/lib/diario/etiquetas";
import { ANIMOS, FECHA_MINIMA } from "@/lib/diario/reglas";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { cn } from "@/lib/utils";
import { ChipEtiqueta } from "./etiquetas/ChipEtiqueta";

const PRESETS: { valor: PresetFecha; texto: string }[] = [
  { valor: "todo", texto: "Todo" },
  { valor: "7dias", texto: "7 días" },
  { valor: "30dias", texto: "30 días" },
  { valor: "anio", texto: "Este año" },
  { valor: "rango", texto: "Personalizado" },
];

const MODOS: { valor: ModoEtiquetas; texto: string }[] = [
  { valor: "alguna", texto: "Con alguna" },
  { valor: "todas", texto: "Con todas" },
  { valor: "ninguna", texto: "Sin etiquetas" },
];

const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

function Opcion({ activa, onClick, children, titulo }: { activa: boolean; onClick: () => void; children: React.ReactNode; titulo?: string }) {
  return (
    <Button type="button" size="sm" variant={activa ? "default" : "outline"} aria-pressed={activa} title={titulo} onClick={onClick}>
      {children}
    </Button>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-primary">{titulo}</h3>
      {children}
    </section>
  );
}

/** storypad `CheckboxListTile(tristate: true)`: sin filtro, solo las marcadas o solo las no marcadas. */
function TresEstados({ valor, onCambio, si, no }: { valor: boolean | null; onCambio: (v: boolean | null) => void; si: string; no: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Opcion activa={valor === null} onClick={() => onCambio(null)}>
        Todas
      </Opcion>
      <Opcion activa={valor === true} onClick={() => onCambio(true)}>
        {si}
      </Opcion>
      <Opcion activa={valor === false} onClick={() => onCambio(false)}>
        {no}
      </Opcion>
    </div>
  );
}

export function FiltrosBusqueda({
  abierto,
  filtro,
  onFiltro,
  onLimpiar,
  onCerrar,
  catalogo,
  conteoEtiquetas,
  anios,
  hoy,
}: {
  abierto: boolean;
  filtro: FiltroBusqueda;
  onFiltro: (cambios: Partial<FiltroBusqueda>) => void;
  onLimpiar: () => void;
  onCerrar: () => void;
  catalogo: Catalogo | null;
  /** Cuántas entradas del resultado actual tienen cada etiqueta. */
  conteoEtiquetas: Map<number, number>;
  anios: { anio: number; n: number }[];
  hoy: string;
}) {
  const secciones = useMemo(() => (catalogo ? armarSecciones(catalogo.grupos, catalogo.etiquetas) : []), [catalogo]);
  const arbol = useMemo(() => (catalogo ? aplanarArbol(catalogo.categorias) : []), [catalogo]);
  const preset = presetDe(filtro.desde, filtro.hasta, hoy);

  function elegirPreset(p: PresetFecha) {
    if (p === "rango") onFiltro({ desde: filtro.desde ?? sumarDias(hoy, -30), hasta: filtro.hasta ?? hoy });
    else onFiltro(rangoDePreset(p, hoy));
  }

  function cambiarFecha(lado: "desde" | "hasta", valor: string) {
    const v = valor || null;
    const otro = lado === "desde" ? filtro.hasta : filtro.desde;
    // Si queda al revés, el otro extremo se mueve con él
    if (v && otro && (lado === "desde" ? v > otro : v < otro)) onFiltro({ desde: v, hasta: v });
    else onFiltro({ [lado]: v });
  }

  return (
    <Sheet open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4">
          <Seccion titulo="Fecha">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Opcion key={p.valor} activa={preset === p.valor} onClick={() => elegirPreset(p.valor)}>
                  {p.texto}
                </Opcion>
              ))}
            </div>
            {preset === "rango" && (
              <div className="grid grid-cols-2 gap-3">
                <Label className="flex flex-col items-start gap-1">
                  Desde
                  <Input type="date" value={filtro.desde ?? ""} min={FECHA_MINIMA} max={hoy} onChange={(e) => cambiarFecha("desde", e.target.value)} />
                </Label>
                <Label className="flex flex-col items-start gap-1">
                  Hasta
                  <Input type="date" value={filtro.hasta ?? ""} min={FECHA_MINIMA} max={hoy} onChange={(e) => cambiarFecha("hasta", e.target.value)} />
                </Label>
              </div>
            )}
          </Seccion>

          {anios.length > 0 && (
            <Seccion titulo="Años">
              <div className="flex flex-wrap gap-2">
                {anios.map((a) => (
                  <Opcion key={a.anio} activa={filtro.anios.includes(a.anio)} onClick={() => onFiltro({ anios: alternar(filtro.anios, a.anio) })}>
                    {a.anio} <span className="opacity-70">({a.n})</span>
                  </Opcion>
                ))}
              </div>
            </Seccion>
          )}

          <Seccion titulo="Ánimo">
            <div className="flex gap-2">
              {ANIMOS.map((a) => (
                <Opcion key={a.valor} activa={filtro.animos.includes(a.valor)} titulo={a.etiqueta} onClick={() => onFiltro({ animos: alternar(filtro.animos, a.valor) })}>
                  <span aria-hidden>{a.emoji}</span>
                  <span className="sr-only">{a.etiqueta}</span>
                </Opcion>
              ))}
            </div>
          </Seccion>

          <Seccion titulo="Etiquetas">
            <div className="flex flex-wrap gap-2">
              {MODOS.map((m) => (
                <Opcion key={m.valor} activa={filtro.etiquetaModo === m.valor} onClick={() => onFiltro({ etiquetaModo: m.valor, ...(m.valor === "ninguna" ? { etiquetas: [] } : {}) })}>
                  {m.texto}
                </Opcion>
              ))}
            </div>
            {filtro.etiquetaModo !== "ninguna" &&
              (secciones.length ? (
                secciones.map((s) => (
                  <div key={s.grupo?.id ?? "sueltas"} className="flex flex-col gap-1.5">
                    {s.grupo && <p className="text-xs font-medium text-muted-foreground">{s.grupo.nombre}</p>}
                    <div className="flex flex-wrap gap-2">
                      {s.etiquetas.map((e) => {
                        const activa = filtro.etiquetas.includes(e.id);
                        return (
                          <span key={e.id} className="inline-flex items-center gap-1">
                            <span className={cn("rounded-2xl", activa && "ring-2 ring-primary ring-offset-1 ring-offset-background")}>
                              <ChipEtiqueta etiqueta={e} pequeno onClick={() => onFiltro({ etiquetas: alternar(filtro.etiquetas, e.id) })} />
                            </span>
                            <span className="text-xs text-muted-foreground">{conteoEtiquetas.get(e.id) ?? 0}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Todavía no hay etiquetas.</p>
              ))}
          </Seccion>

          <Seccion titulo="Categoría">
            <NativeSelect
              className="w-full"
              aria-label="Categoría"
              value={filtro.sinCategoria ? "sin" : (filtro.categoriaId ?? "")}
              onChange={(e) => {
                const v = e.target.value;
                onFiltro({ categoriaId: v && v !== "sin" ? Number(v) : null, sinCategoria: v === "sin" });
              }}
            >
              <NativeSelectOption value="">Todas</NativeSelectOption>
              <NativeSelectOption value="sin">Sin categoría</NativeSelectOption>
              {arbol.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {"— ".repeat(c.nivel - 1)}
                  {c.nombre}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {filtro.categoriaId !== null && <p className="text-xs text-muted-foreground">Incluye las categorías de adentro.</p>}
          </Seccion>

          <Seccion titulo="Favoritas">
            <TresEstados valor={filtro.favorita} onCambio={(v) => onFiltro({ favorita: v })} si="Solo favoritas" no="Sin favoritas" />
          </Seccion>
          <Seccion titulo="Fijadas">
            <TresEstados valor={filtro.fijada} onCambio={(v) => onFiltro({ fijada: v })} si="Solo fijadas" no="Sin fijar" />
          </Seccion>
        </div>
        <SheetFooter className="flex-row justify-between gap-2">
          <Button variant="outline" onClick={onLimpiar}>
            Limpiar filtros
          </Button>
          <Button onClick={onCerrar}>Listo</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
