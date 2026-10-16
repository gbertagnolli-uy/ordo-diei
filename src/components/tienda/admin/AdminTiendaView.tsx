"use client";

// Administración de la Tienda para padres (SPEC §10): productos y compras
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, EyeOff, Package, Pencil, Plus, Trash2, Undo2, X } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/toast";
import type { CompraAdminVista, ProductoAdminVista } from "@/lib/tienda/server";
import { ArteProducto } from "../ArteProducto";
import { Precio } from "../Moneda";
import { FormularioProducto, type OpcionesFormulario } from "./FormularioProducto";

const TIPO: Record<string, string> = { sobre: "Sobre", fragmentos: "Fragmentos", fisico: "Premio físico", vale: "Vale" };

async function llamar(url: string, metodo: string, cuerpo?: unknown) {
  const res = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo completar la acción");
  return data;
}

export function AdminTiendaView({ productos, compras, opciones }: { productos: ProductoAdminVista[]; compras: CompraAdminVista[]; opciones: OpcionesFormulario }) {
  const router = useRouter();
  const [editando, setEditando] = useState<{ producto: ProductoAdminVista | null; copia: boolean } | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);

  const refrescar = useCallback(() => router.refresh(), [router]);
  const porAprobar = compras.filter((c) => c.estado === "pendiente_aprobacion");
  const porEntregar = compras.filter((c) => c.estado === "completada" && c.recompensaId !== null && !c.entregada && c.tipo === "fisico");

  async function accion(id: number, fn: () => Promise<unknown>, ok: string) {
    setOcupado(id);
    try {
      await fn();
      toast.success(ok);
      refrescar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar la acción");
    } finally {
      setOcupado(null);
    }
  }

  const eliminar = (p: ProductoAdminVista) => {
    if (!confirm(p.ventas > 0 ? `«${p.titulo}» ya tiene compras: se va a ocultar, no borrar. ¿Seguir?` : `¿Eliminar «${p.titulo}»?`)) return;
    accion(p.id, () => llamar(`/api/admin/tienda/productos/${p.id}`, "DELETE"), p.ventas > 0 ? "Producto oculto" : "Producto eliminado");
  };

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Tienda">
        <Button size="sm" className="gap-1.5" onClick={() => setEditando({ producto: null, copia: false })}><Plus className="size-4" />Nuevo producto</Button>
      </PageHeader>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pt-6 pb-28 sm:px-6">
        <Tabs defaultValue={porAprobar.length > 0 ? "compras" : "productos"}>
          <TabsList>
            <TabsTrigger value="productos">Productos <Badge variant="secondary" className="tabular-nums">{productos.length}</Badge></TabsTrigger>
            <TabsTrigger value="compras">Compras {porAprobar.length + porEntregar.length > 0 && <Badge className="tabular-nums">{porAprobar.length + porEntregar.length}</Badge>}</TabsTrigger>
          </TabsList>

          <TabsContent value="productos" className="mt-4 flex flex-col gap-2">
            {productos.length === 0 && (
              <Empty><EmptyHeader><EmptyMedia variant="icon"><Package /></EmptyMedia><EmptyTitle>Sin productos</EmptyTitle><EmptyDescription>Creá el primero con «Nuevo producto».</EmptyDescription></EmptyHeader></Empty>
            )}
            {productos.map((p) => (
              <article key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg">
                  <div className={p.activo ? "size-full" : "size-full grayscale"}>
                    <ArteProducto p={{ tipo: p.tipo as never, sistemaClave: p.sistemaClave, imagenUrl: p.imagenUrl, titulo: p.titulo }} />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="truncate font-heading text-base font-semibold">{p.titulo}</h3>
                    <Badge variant="outline">{TIPO[p.tipo] ?? p.tipo}</Badge>
                    {p.origen === "sistema" && <Badge variant="secondary">Sistema</Badge>}
                    {p.destacado && <Badge className="bg-amber-500 text-amber-950">Destacado</Badge>}
                    {!p.activo && <Badge variant="destructive" className="gap-1"><EyeOff className="size-3" />Oculto</Badge>}
                    {p.requisitos.length > 0 && <Badge variant="outline">🔒 {p.requisitos.length}</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {p.precios[0] && <Precio costos={p.precios[0].costos} className="text-sm text-foreground" />}
                    {p.precios.length > 1 && <span>+{p.precios.length - 1} forma(s) de pago</span>}
                    {p.stockTotal !== null && <span>Stock {p.stockRestante}/{p.stockTotal}</span>}
                    <span>{p.ventas} {p.ventas === 1 ? "compra" : "compras"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch checked={p.activo} disabled={ocupado === p.id} aria-label={`${p.titulo} visible`} onCheckedChange={(v) => accion(p.id, () => llamar(`/api/admin/tienda/productos/${p.id}`, "PATCH", p.origen === "sistema" ? { activo: v } : { ...cuerpoDe(p), activo: v }), v ? "Ahora se ve en la Tienda" : "Ocultado de la Tienda")} />
                  <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditando({ producto: p, copia: false })}><Pencil /></Button>
                  {p.origen !== "sistema" && (
                    <>
                      <Button variant="ghost" size="icon-sm" aria-label="Duplicar" onClick={() => setEditando({ producto: p, copia: true })}><Copy /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Eliminar" disabled={ocupado === p.id} onClick={() => eliminar(p)}><Trash2 /></Button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="compras" className="mt-4 flex flex-col gap-6">
            <Bloque titulo="Por aprobar" vacio="No hay compras esperando tu aprobación." compras={porAprobar} ocupado={ocupado}
              acciones={(c) => (
                <>
                  <Button size="sm" className="gap-1" disabled={ocupado === c.id} onClick={() => accion(c.id, () => llamar(`/api/admin/tienda/compras/${c.id}`, "PATCH", { accion: "aprobar" }), "Compra aprobada")}><Check className="size-4" />Aprobar</Button>
                  <Button size="sm" variant="outline" className="gap-1" disabled={ocupado === c.id} onClick={() => accion(c.id, () => llamar(`/api/admin/tienda/compras/${c.id}`, "PATCH", { accion: "rechazar" }), "Rechazada: se devolvieron las monedas")}><X className="size-4" />Rechazar</Button>
                </>
              )} />
            <Bloque titulo="Por entregar" vacio="No hay premios para entregar." compras={porEntregar} ocupado={ocupado}
              acciones={(c) => (
                <>
                  <Button size="sm" className="gap-1" disabled={ocupado === c.id} onClick={() => accion(c.id, () => llamar(`/api/recompensas/${c.recompensaId}`, "POST", { accion: "entregar" }), "Marcado como entregado")}><Check className="size-4" />Entregado</Button>
                  <Button size="sm" variant="outline" className="gap-1" disabled={ocupado === c.id} onClick={() => confirm("¿Cancelar y devolver las monedas?") && accion(c.id, () => llamar(`/api/admin/tienda/compras/${c.id}`, "PATCH", { accion: "cancelar" }), "Cancelada: se devolvieron las monedas")}><Undo2 className="size-4" />Cancelar</Button>
                </>
              )} />
            <Bloque titulo="Historial" vacio="Todavía no hubo compras." compras={compras} ocupado={ocupado} historial />
          </TabsContent>
        </Tabs>
      </main>

      {editando && (
        <FormularioProducto
          key={`${editando.producto?.id ?? "nuevo"}-${editando.copia}`}
          abierto
          producto={editando.producto}
          copia={editando.copia}
          opciones={opciones}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            refrescar();
          }}
        />
      )}
    </div>
  );
}

/** Cuerpo completo de un producto manual para volver a guardarlo cambiando un solo campo */
function cuerpoDe(p: ProductoAdminVista) {
  return {
    tipo: p.tipo,
    titulo: p.titulo,
    descripcion: p.descripcion,
    imagenClave: p.imagenUrl,
    categoria: p.tipo === "vale" ? "vales" : "premios",
    precios: p.precios,
    requisitos: p.requisitos,
    stockTotal: p.stockTotal,
    limiteUsuario: p.limiteUsuario,
    periodoLimite: p.periodoLimite,
    disponibleDesde: p.disponibleDesde,
    disponibleHasta: p.disponibleHasta,
    destinatarios: p.destinatarios,
    requiereAprobacion: p.requiereAprobacion,
    descuentoRacha: p.descuentoRacha,
    destacado: p.destacado,
  };
}

const ESTADO: Record<string, string> = { completada: "Comprado", pendiente_aprobacion: "Por aprobar", rechazada: "Rechazada", cancelada: "Cancelada" };

function Bloque({ titulo, vacio, compras, acciones, historial, ocupado }: { titulo: string; vacio: string; compras: CompraAdminVista[]; acciones?: (c: CompraAdminVista) => React.ReactNode; historial?: boolean; ocupado: number | null }) {
  return (
    <section className="flex flex-col gap-2" aria-busy={ocupado !== null}>
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      {compras.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border">
          {compras.slice(0, historial ? 30 : undefined).map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-3">
              <Avatar className="size-9"><AvatarImage src={c.usuario.fotoUrl ?? undefined} alt="" className="object-cover" /><AvatarFallback>{c.usuario.nombre.charAt(0)}</AvatarFallback></Avatar>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{c.titulo}</span>
                <span className="text-xs text-muted-foreground">{c.usuario.nombre} · {new Date(c.createdAt).toLocaleDateString("es-UY", { day: "numeric", month: "short" })}</span>
              </span>
              <Precio costos={c.costos} className="text-sm" />
              {historial ? <Badge variant={c.estado === "completada" ? "secondary" : "outline"}>{ESTADO[c.estado] ?? c.estado}{c.entregada ? " · entregado" : ""}</Badge> : <span className="flex gap-2">{acciones?.(c)}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
