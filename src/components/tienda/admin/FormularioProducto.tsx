"use client";

// Formulario de producto para padres, con vista previa en vivo de la tarjeta (SPEC §10.3)
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { CLAVES_MONEDA, MONEDAS, type Moneda, type OpcionPrecio } from "@/lib/tienda/monedas";
import { diasParaJuntar } from "@/lib/tienda/precios";
import type { Requisito } from "@/lib/tienda/requisitos";
import type { ProductoAdminVista, ProductoVista } from "@/lib/tienda/server";
import { TarjetaProducto } from "../TarjetaProducto";

export type OpcionesFormulario = {
  usuarios: { id: number; nombre: string; rol: string }[];
  cartas: { id: number; nombre: string }[];
  productos: { id: number; titulo: string }[];
};

type Estado = {
  tipo: "fisico" | "vale";
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precios: OpcionPrecio[];
  requisitos: Requisito[];
  stockTotal: string;
  limiteUsuario: string;
  periodoLimite: "siempre" | "dia" | "semana" | "mes";
  disponibleDesde: string;
  disponibleHasta: string;
  destinatarios: number[];
  requiereAprobacion: boolean;
  descuentoRacha: boolean;
  destacado: boolean;
  activo: boolean;
};

const VACIO: Estado = {
  tipo: "fisico",
  titulo: "",
  descripcion: "",
  imagenUrl: "",
  precios: [{ costos: [{ moneda: "puntos", monto: 300 }] }],
  requisitos: [],
  stockTotal: "",
  limiteUsuario: "",
  periodoLimite: "siempre",
  disponibleDesde: "",
  disponibleHasta: "",
  destinatarios: [],
  requiereAprobacion: false,
  descuentoRacha: false,
  destacado: false,
  activo: true,
};

const aLocal = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const aIso = (fecha: string, finDelDia = false) => (fecha ? new Date(`${fecha}T${finDelDia ? "23:59:59" : "00:00:00"}`).toISOString() : null);

export function desdeProducto(p: ProductoAdminVista | null, copia = false): Estado {
  if (!p) return VACIO;
  return {
    tipo: p.tipo === "vale" ? "vale" : "fisico",
    titulo: copia ? `${p.titulo} (copia)` : p.titulo,
    descripcion: p.descripcion ?? "",
    imagenUrl: p.imagenUrl ?? "",
    precios: p.precios,
    requisitos: p.requisitos,
    stockTotal: p.stockTotal?.toString() ?? "",
    limiteUsuario: p.limiteUsuario?.toString() ?? "",
    periodoLimite: p.periodoLimite as Estado["periodoLimite"],
    disponibleDesde: aLocal(p.disponibleDesde),
    disponibleHasta: aLocal(p.disponibleHasta),
    destinatarios: p.destinatarios ?? [],
    requiereAprobacion: p.requiereAprobacion,
    descuentoRacha: p.descuentoRacha,
    destacado: p.destacado,
    activo: p.activo,
  };
}

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-xl border p-4">
      <legend className="px-1 font-heading text-sm font-semibold">{titulo}</legend>
      {ayuda && <p className="-mt-1 text-xs text-muted-foreground">{ayuda}</p>}
      {children}
    </fieldset>
  );
}

const REQUISITO_NUEVO: Record<string, () => Requisito> = {
  nivel: () => ({ tipo: "nivel", min: 5 }),
  xp: () => ({ tipo: "xp", min: 1000 }),
  racha: () => ({ tipo: "racha", dias: 7 }),
  tareas: () => ({ tipo: "tareas", cantidad: 20 }),
  coleccion: () => ({ tipo: "coleccion", cantidad: 10 }),
  carta: () => ({ tipo: "carta", cartaId: 0, gradoMin: 1 }),
  compraPrevia: () => ({ tipo: "compraPrevia", productoId: 0 }),
  rol: () => ({ tipo: "rol", roles: ["Hijo", "Hija"] }),
  padre: () => ({ tipo: "padre" }),
};

const NOMBRE_REQUISITO: Record<string, string> = {
  nivel: "Nivel", xp: "XP total", racha: "Racha (días)", tareas: "Tareas completadas", coleccion: "Cartas consagradas",
  carta: "Consagrar una carta", compraPrevia: "Comprar antes otro producto", rol: "Solo para…", padre: "Lo desbloquea un padre",
};

function EditorRequisito({ r, onCambio, onQuitar, opciones }: { r: Requisito; onCambio: (r: Requisito) => void; onQuitar: () => void; opciones: OpcionesFormulario }) {
  const numero = (valor: number, cambia: (n: number) => void, etiqueta: string) => (
    <Input type="number" min={1} inputMode="numeric" aria-label={etiqueta} value={valor || ""} onChange={(e) => cambia(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-28" />
  );
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
      <Badge variant="secondary">{NOMBRE_REQUISITO[r.tipo]}</Badge>
      {r.tipo === "nivel" && numero(r.min, (n) => onCambio({ ...r, min: n }), "Nivel mínimo")}
      {r.tipo === "xp" && numero(r.min, (n) => onCambio({ ...r, min: n }), "XP mínimo")}
      {r.tipo === "racha" && numero(r.dias, (n) => onCambio({ ...r, dias: n }), "Días de racha")}
      {r.tipo === "tareas" && numero(r.cantidad, (n) => onCambio({ ...r, cantidad: n }), "Cantidad de tareas")}
      {r.tipo === "coleccion" && numero(r.cantidad, (n) => onCambio({ ...r, cantidad: n }), "Cantidad de cartas")}
      {r.tipo === "carta" && (
        <>
          <NativeSelect aria-label="Carta" value={r.cartaId} onChange={(e) => onCambio({ ...r, cartaId: Number(e.target.value) })} className="w-48">
            <NativeSelectOption value={0}>Elegí una carta…</NativeSelectOption>
            {opciones.cartas.map((c) => <NativeSelectOption key={c.id} value={c.id}>{c.nombre}</NativeSelectOption>)}
          </NativeSelect>
          <NativeSelect aria-label="Grado mínimo" value={r.gradoMin} onChange={(e) => onCambio({ ...r, gradoMin: Number(e.target.value) })} className="w-28">
            {[1, 2, 3, 4].map((g) => <NativeSelectOption key={g} value={g}>Grado {["", "I", "II", "III", "IV"][g]}</NativeSelectOption>)}
          </NativeSelect>
        </>
      )}
      {r.tipo === "compraPrevia" && (
        <NativeSelect aria-label="Producto" value={r.productoId} onChange={(e) => onCambio({ ...r, productoId: Number(e.target.value) })} className="w-56">
          <NativeSelectOption value={0}>Elegí un producto…</NativeSelectOption>
          {opciones.productos.map((p) => <NativeSelectOption key={p.id} value={p.id}>{p.titulo}</NativeSelectOption>)}
        </NativeSelect>
      )}
      {r.tipo === "rol" && (
        <span className="flex flex-wrap gap-3">
          {["Padre", "Madre", "Hijo", "Hija"].map((rol) => (
            <label key={rol} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={r.roles.includes(rol)} onChange={(e) => onCambio({ ...r, roles: e.target.checked ? [...r.roles, rol] : r.roles.filter((x) => x !== rol) })} />
              {rol}
            </label>
          ))}
        </span>
      )}
      {r.tipo === "padre" && <span className="text-xs text-muted-foreground">Después podés desbloquearlo persona por persona.</span>}
      <Button type="button" variant="ghost" size="icon-sm" onClick={onQuitar} className="ml-auto" aria-label="Quitar requisito"><Trash2 /></Button>
    </li>
  );
}

export function FormularioProducto({
  abierto,
  producto,
  copia,
  opciones,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  producto: ProductoAdminVista | null;
  copia?: boolean;
  opciones: OpcionesFormulario;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const sistema = producto?.origen === "sistema";
  const [f, setF] = useState<Estado>(() => desdeProducto(producto, copia));
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const [verBloqueada, setVerBloqueada] = useState(false);

  const set = <K extends keyof Estado>(k: K, v: Estado[K]) => setF((p) => ({ ...p, [k]: v }));
  const setCosto = (i: number, j: number, cambio: Partial<{ moneda: Moneda; monto: number }>) =>
    set("precios", f.precios.map((o, a) => (a !== i ? o : { costos: o.costos.map((c, b) => (b !== j ? c : { ...c, ...cambio })) })));

  async function subirImagen(file: File) {
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen");
      set("imagenUrl", data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  }

  const cuerpo = () => ({
    tipo: f.tipo,
    titulo: f.titulo,
    descripcion: f.descripcion || null,
    imagenClave: f.imagenUrl || null,
    categoria: f.tipo === "vale" ? "vales" : "premios",
    precios: f.precios,
    requisitos: f.requisitos,
    stockTotal: f.stockTotal ? Number(f.stockTotal) : null,
    limiteUsuario: f.limiteUsuario ? Number(f.limiteUsuario) : null,
    periodoLimite: f.periodoLimite,
    disponibleDesde: aIso(f.disponibleDesde),
    disponibleHasta: aIso(f.disponibleHasta, true),
    destinatarios: f.destinatarios,
    requiereAprobacion: f.requiereAprobacion,
    descuentoRacha: f.descuentoRacha,
    destacado: f.destacado,
    activo: f.activo,
  });

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const editando = producto && !copia;
      const body = sistema ? { activo: f.activo, destacado: f.destacado, requisitos: f.requisitos } : cuerpo();
      const res = await fetch(editando ? `/api/admin/tienda/productos/${producto!.id}` : "/api/admin/tienda/productos", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      toast.success(editando ? "Producto actualizado" : "Producto creado", f.titulo);
      onGuardado();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  // Vista previa: la misma tarjeta que ven los hijos, con el estado que se quiere comprobar
  const vista = useMemo<ProductoVista>(() => ({
    id: 0,
    tipo: f.tipo,
    sistemaClave: producto?.sistemaClave ?? null,
    titulo: f.titulo || "Título del producto",
    descripcion: f.descripcion,
    imagenUrl: f.imagenUrl || null,
    categoria: f.tipo === "vale" ? "vales" : "premios",
    destacado: f.destacado,
    estado: verBloqueada && f.requisitos.length > 0 ? "bloqueado" : "comprable",
    opciones: (sistema ? producto!.precios : f.precios).map((o) => ({ costos: o.costos, alcanza: true, faltan: [] })),
    opcionSugerida: 0,
    requisitos: f.requisitos.map((r) => ({ texto: NOMBRE_REQUISITO[r.tipo], cumplido: false, actual: 0, objetivo: 1 })),
    stockRestante: f.stockTotal ? Number(f.stockTotal) : null,
    limite: null,
    disponibleDesde: null,
    disponibleHasta: null,
    requiereAprobacion: f.requiereAprobacion,
    esMeta: false,
  }), [f, producto, sistema, verBloqueada]);

  const valido = sistema || (f.titulo.trim().length >= 2 && f.precios.length > 0 && f.precios.every((o) => o.costos.length > 0 && o.costos.every((c) => c.monto >= 1)) && f.requisitos.every((r) => (r.tipo !== "carta" || r.cartaId > 0) && (r.tipo !== "compraPrevia" || r.productoId > 0) && (r.tipo !== "rol" || r.roles.length > 0)));

  return (
    <Sheet open={abierto} onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-heading">{producto && !copia ? (sistema ? "Producto del sistema" : "Editar producto") : "Nuevo producto"}</SheetTitle>
          <SheetDescription>{sistema ? "El precio sale de la economía de cartas. Podés ocultarlo, destacarlo o pedir requisitos extra." : "Lo que cargues aparece en la Tienda de la familia."}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-4 rounded-xl bg-muted/40 p-3">
            <div className="w-40 shrink-0"><TarjetaProducto p={vista} onAbrir={() => undefined} className="pointer-events-none" /></div>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Vista previa</span>
              <span>Así lo ven en la Tienda.</span>
              {f.requisitos.length > 0 && (
                <label className="flex items-center gap-2"><Switch size="sm" checked={verBloqueada} onCheckedChange={setVerBloqueada} />Ver bloqueado</label>
              )}
            </div>
          </div>

          {!sistema && (
            <>
              <Seccion titulo="Básico">
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <NativeSelect value={f.tipo} onChange={(e) => set("tipo", e.target.value as Estado["tipo"])}>
                    <NativeSelectOption value="fisico">Premio físico (se entrega)</NativeSelectOption>
                    <NativeSelectOption value="vale">Vale (un ticket para canjear)</NativeSelectOption>
                  </NativeSelect>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="p-titulo">{f.tipo === "vale" ? "Vale por…" : "Título"}</Label>
                  <Input id="p-titulo" value={f.titulo} maxLength={80} onChange={(e) => set("titulo", e.target.value)} placeholder={f.tipo === "vale" ? "Una película en familia" : "Bicicleta nueva"} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="p-desc">Descripción (opcional)</Label>
                  <Textarea id="p-desc" value={f.descripcion} maxLength={400} onChange={(e) => set("descripcion", e.target.value)} rows={2} />
                </div>
                <div className="flex items-center gap-3">
                  <input ref={archivo} type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && subirImagen(e.target.files[0])} />
                  <Button type="button" variant="outline" size="sm" onClick={() => archivo.current?.click()} disabled={subiendo} className="gap-1.5">
                    {subiendo ? <Spinner /> : <ImagePlus className="size-4" />}{f.imagenUrl ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                  {f.imagenUrl && <Button type="button" variant="ghost" size="sm" onClick={() => set("imagenUrl", "")}>Quitar</Button>}
                </div>
              </Seccion>

              <Seccion titulo="Precio" ayuda="Cada forma de pago es independiente: la persona elige una. Dentro de una forma, las monedas se pagan juntas.">
                {f.precios.map((o, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Forma de pago {i + 1}</span>
                      {f.precios.length > 1 && <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar forma de pago" onClick={() => set("precios", f.precios.filter((_, a) => a !== i))}><Trash2 /></Button>}
                    </div>
                    {o.costos.map((c, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <NativeSelect aria-label="Moneda" value={c.moneda} onChange={(e) => setCosto(i, j, { moneda: e.target.value as Moneda })} className="w-44">
                          {CLAVES_MONEDA.map((m) => <NativeSelectOption key={m} value={m} disabled={o.costos.some((x, b) => b !== j && x.moneda === m)}>{MONEDAS[m].nombre}</NativeSelectOption>)}
                        </NativeSelect>
                        <Input type="number" min={1} inputMode="numeric" aria-label="Monto" value={c.monto || ""} onChange={(e) => setCosto(i, j, { monto: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} className="w-28" />
                        {o.costos.length > 1 && <Button type="button" variant="ghost" size="icon-sm" aria-label="Quitar moneda" onClick={() => set("precios", f.precios.map((x, a) => (a !== i ? x : { costos: x.costos.filter((_, b) => b !== j) })))}><Trash2 /></Button>}
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      {o.costos.length < CLAVES_MONEDA.length ? (
                        <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => {
                          const libre = CLAVES_MONEDA.find((m) => !o.costos.some((c) => c.moneda === m))!;
                          set("precios", f.precios.map((x, a) => (a !== i ? x : { costos: [...x.costos, { moneda: libre, monto: 1 }] })));
                        }}><Plus className="size-3.5" />Sumar otra moneda</Button>
                      ) : <span />}
                      {diasParaJuntar(o) !== null && <span className="text-xs text-muted-foreground">≈ {diasParaJuntar(o)} días de juntar puntos</span>}
                    </div>
                  </div>
                ))}
                {f.precios.length < 6 && (
                  <Button type="button" variant="outline" size="sm" className="w-fit gap-1" onClick={() => set("precios", [...f.precios, { costos: [{ moneda: "estrellas", monto: 1 }] }])}><Plus className="size-4" />Otra forma de pagar</Button>
                )}
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Aplicar el descuento por racha a los puntos</span>
                  <Switch checked={f.descuentoRacha} onCheckedChange={(v) => set("descuentoRacha", v)} />
                </label>
              </Seccion>

              <Seccion titulo="Disponibilidad" ayuda="Lo escaso se resuelve acá: poco stock, un límite por persona o una fecha.">
                <div className="grid grid-cols-2 items-end gap-3">
                  <div className="grid gap-1.5"><Label htmlFor="p-stock">Stock (vacío = sin tope)</Label><Input id="p-stock" type="number" min={1} value={f.stockTotal} onChange={(e) => set("stockTotal", e.target.value)} /></div>
                  <div className="grid gap-1.5"><Label htmlFor="p-limite">Máx. por persona</Label><Input id="p-limite" type="number" min={1} value={f.limiteUsuario} onChange={(e) => set("limiteUsuario", e.target.value)} /></div>
                </div>
                {f.limiteUsuario && (
                  <div className="grid gap-1.5">
                    <Label>Ese límite es…</Label>
                    <NativeSelect value={f.periodoLimite} onChange={(e) => set("periodoLimite", e.target.value as Estado["periodoLimite"])}>
                      <NativeSelectOption value="siempre">En total</NativeSelectOption>
                      <NativeSelectOption value="dia">Por día</NativeSelectOption>
                      <NativeSelectOption value="semana">Por semana</NativeSelectOption>
                      <NativeSelectOption value="mes">Por mes</NativeSelectOption>
                    </NativeSelect>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label htmlFor="p-desde">Disponible desde</Label><Input id="p-desde" type="date" value={f.disponibleDesde} onChange={(e) => set("disponibleDesde", e.target.value)} /></div>
                  <div className="grid gap-1.5"><Label htmlFor="p-hasta">Hasta</Label><Input id="p-hasta" type="date" value={f.disponibleHasta} onChange={(e) => set("disponibleHasta", e.target.value)} /></div>
                </div>
                <div className="grid gap-1.5">
                  <Label>¿Para quién? (nadie marcado = todos)</Label>
                  <div className="flex flex-wrap gap-3">
                    {opciones.usuarios.map((u) => (
                      <label key={u.id} className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" checked={f.destinatarios.includes(u.id)} onChange={(e) => set("destinatarios", e.target.checked ? [...f.destinatarios, u.id] : f.destinatarios.filter((x) => x !== u.id))} />
                        {u.nombre}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Necesita mi aprobación antes de entregarse</span>
                  <Switch checked={f.requiereAprobacion} onCheckedChange={(v) => set("requiereAprobacion", v)} />
                </label>
              </Seccion>
            </>
          )}

          <Seccion titulo="Para desbloquearlo" ayuda="Si hay requisitos, el producto se ve en grises con un candado hasta cumplirlos.">
            {f.requisitos.length > 0 && (
              <ul className="flex flex-col gap-2">
                {f.requisitos.map((r, i) => (
                  <EditorRequisito key={i} r={r} opciones={opciones} onCambio={(n) => set("requisitos", f.requisitos.map((x, a) => (a === i ? n : x)))} onQuitar={() => set("requisitos", f.requisitos.filter((_, a) => a !== i))} />
                ))}
              </ul>
            )}
            <NativeSelect aria-label="Sumar requisito" value="" onChange={(e) => e.target.value && set("requisitos", [...f.requisitos, REQUISITO_NUEVO[e.target.value]()])} className="w-full sm:w-72">
              <NativeSelectOption value="">+ Sumar un requisito…</NativeSelectOption>
              {Object.entries(NOMBRE_REQUISITO).map(([k, n]) => <NativeSelectOption key={k} value={k}>{n}</NativeSelectOption>)}
            </NativeSelect>
          </Seccion>

          <Seccion titulo="Visibilidad">
            <label className="flex items-center justify-between gap-3 text-sm"><span>Destacado (aparece primero)</span><Switch checked={f.destacado} onCheckedChange={(v) => set("destacado", v)} /></label>
            <label className="flex items-center justify-between gap-3 text-sm"><span>Visible en la Tienda</span><Switch checked={f.activo} onCheckedChange={(v) => set("activo", v)} /></label>
          </Seccion>

          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter className="sticky bottom-0 flex-row justify-end gap-2 border-t bg-popover p-4">
          <Button variant="outline" onClick={onCerrar} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} disabled={!valido || guardando} className="gap-2">{guardando && <Spinner />}Guardar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
