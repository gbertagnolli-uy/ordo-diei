"use client";

// Bitácora de comportamiento (solo padres): registrar cómo se porta cada hijo, con premios o penitencias.
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Gift, HeartHandshake, Plus, ScrollText, ThumbsDown, ThumbsUp, Trash2, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/lib/toast";
import { textoItem, type ItemPremio } from "@/lib/comportamiento/premios";
import type { ComportamientoVista } from "@/lib/comportamiento/server";

type Usuario = { id: number; nombre: string; rolFamiliar: string; fotoUrl: string | null };
type CartaOpcion = { id: number; nombre: string };
type TipoItem = ItemPremio["tipo"];

const TIPOS_ITEM: { id: TipoItem; label: string }[] = [
  { id: "puntos", label: "Puntos" },
  { id: "incienso", label: "Incienso" },
  { id: "xp", label: "XP" },
  { id: "carta", label: "Carta o fragmentos" },
  { id: "exoneracion", label: "Exonerar de una tarea" },
  { id: "extra", label: "Premio extra (fuera de la app)" },
];

const ESTADO_PREMIO = {
  disponible: "Sin abrir",
  reclamado: "Abierto · falta entregar",
  entregado: "Abierto",
} as const;

const fecha = (iso: string) => format(new Date(iso), "d 'de' MMMM, HH:mm", { locale: es });

export function ComportamientoAdmin({
  inicial,
  usuarios,
  cartas,
}: {
  inicial: ComportamientoVista[];
  usuarios: Usuario[];
  cartas: CartaOpcion[];
}) {
  const [registros, setRegistros] = useState(inicial);
  const [filtro, setFiltro] = useState<string>("todos");
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Formulario
  const [destinatarios, setDestinatarios] = useState<number[]>([]);
  const [tipo, setTipo] = useState<"Positivo" | "Negativo">("Positivo");
  const [titulo, setTitulo] = useState("");
  const [evaluacion, setEvaluacion] = useState("");
  const [items, setItems] = useState<ItemPremio[]>([]);
  const [penitencia, setPenitencia] = useState("");
  const [puntosPenalizados, setPuntosPenalizados] = useState("");

  // Constructor de un premio
  const [tipoItem, setTipoItem] = useState<TipoItem>("puntos");
  const [cantidad, setCantidad] = useState("");
  const [textoLibre, setTextoLibre] = useState("");
  const [cartaId, setCartaId] = useState("");
  const [modoCarta, setModoCarta] = useState<"completa" | "fragmentos">("completa");

  const visibles = useMemo(
    () => (filtro === "todos" ? registros : registros.filter((r) => String(r.usuario.id) === filtro)),
    [registros, filtro]
  );

  const alternarDestinatario = (id: number) =>
    setDestinatarios((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const reiniciar = () => {
    setDestinatarios([]);
    setTitulo("");
    setEvaluacion("");
    setItems([]);
    setPenitencia("");
    setPuntosPenalizados("");
    setCantidad("");
    setTextoLibre("");
  };

  const agregarItem = () => {
    const n = Number(cantidad);
    let item: ItemPremio;
    if (tipoItem === "puntos" || tipoItem === "incienso" || tipoItem === "xp") {
      if (!Number.isInteger(n) || n < 1) return toast.error("Indicá una cantidad entera mayor a 0");
      item = { tipo: tipoItem, cantidad: n };
    } else if (tipoItem === "carta") {
      const carta = cartas.find((c) => String(c.id) === cartaId);
      if (!carta) return toast.error("Elegí una carta");
      if (modoCarta === "fragmentos" && (!Number.isInteger(n) || n < 1)) return toast.error("Indicá cuántos fragmentos");
      item = { tipo: "carta", cartaId: carta.id, nombre: carta.nombre, modo: modoCarta, ...(modoCarta === "fragmentos" ? { cantidad: n } : {}) };
    } else {
      const t = textoLibre.trim();
      if (!t) return toast.error("Escribí de qué se trata");
      item = { tipo: tipoItem, texto: t };
    }
    setItems((prev) => [...prev, item]);
    setCantidad("");
    setTextoLibre("");
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/comportamiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioIds: destinatarios,
          tipo,
          titulo,
          evaluacion,
          ...(tipo === "Positivo" ? { premios: items } : { penitencia, puntosPenalizados }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo guardar");
      setRegistros(json);
      setAbierto(false);
      reiniciar();
      toast.success(tipo === "Positivo" && items.length > 0 ? "Registrado: el premio sorpresa ya está en «Mis premios»" : "Comportamiento registrado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (r: ComportamientoVista) => {
    const aviso =
      r.estadoPremio === "disponible"
        ? "¿Eliminar este registro? Su premio sorpresa todavía no se abrió y también se va a quitar."
        : "¿Eliminar este registro de la bitácora?";
    if (!confirm(aviso)) return;
    try {
      const res = await fetch(`/api/comportamiento/${r.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo eliminar");
      setRegistros(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  };

  const listo = destinatarios.length > 0 && titulo.trim() !== "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NativeSelect value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por miembro">
          <NativeSelectOption value="todos">Toda la familia</NativeSelectOption>
          {usuarios.map((u) => (
            <NativeSelectOption key={u.id} value={String(u.id)}>
              {u.nombre}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button onClick={() => setAbierto(true)}>
          <Plus className="size-4" /> Registrar comportamiento
        </Button>
      </div>

      {visibles.length === 0 ? (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartHandshake className="size-5 text-primary" />
            </EmptyMedia>
            <EmptyTitle>La bitácora está vacía</EmptyTitle>
            <EmptyDescription>
              Anotá lo bueno y lo que hay que corregir que no está en ningún hábito ni tarea, y dejá un premio sorpresa cuando corresponda.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup className="gap-0 divide-y rounded-xl border bg-card">
          {visibles.map((r) => (
            <Item key={r.id} className="items-start rounded-none px-4 py-4 sm:px-6">
              <ItemMedia>
                <Avatar className="size-10 rounded-lg">
                  <AvatarImage src={r.usuario.fotoUrl ?? undefined} alt={r.usuario.nombre} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    <User className="size-5" />
                  </AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemContent className="gap-1.5">
                <ItemTitle className="flex flex-wrap items-center gap-2">
                  {r.titulo}
                  <Badge variant={r.tipo === "Positivo" ? "default" : "destructive"}>
                    {r.tipo === "Positivo" ? <ThumbsUp className="size-3" /> : <ThumbsDown className="size-3" />}
                    {r.tipo === "Positivo" ? "Positivo" : "A corregir"}
                  </Badge>
                </ItemTitle>
                <ItemDescription className="line-clamp-none">
                  {r.usuario.nombre} · {fecha(r.createdAt)} · por {r.registradoPor.nombre}
                </ItemDescription>
                {r.evaluacion && <p className="text-sm">{r.evaluacion}</p>}
                {r.premios.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Gift className="size-3.5 text-primary" />
                    {r.premios.map((p, i) => (
                      <Badge key={i} variant="secondary">
                        {textoItem(p)}
                      </Badge>
                    ))}
                    {r.estadoPremio && <span className="text-xs text-muted-foreground">· {ESTADO_PREMIO[r.estadoPremio]}</span>}
                  </div>
                )}
                {r.tipo === "Negativo" && (r.penitencia || r.puntosPenalizados > 0) && (
                  <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <ScrollText className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {r.penitencia && <>Penitencia: {r.penitencia}</>}
                      {r.penitencia && r.puntosPenalizados > 0 && " · "}
                      {r.puntosPenalizados > 0 && <>−{r.puntosPenalizados} puntos</>}
                    </span>
                  </p>
                )}
              </ItemContent>
              <ItemActions>
                <Button variant="ghost" size="icon" aria-label="Eliminar registro" onClick={() => eliminar(r)}>
                  <Trash2 className="size-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar comportamiento</DialogTitle>
            <DialogDescription>Para lo que importa en casa y no está en ningún hábito ni tarea.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <fieldset className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <legend className="text-sm leading-none font-medium">¿De quién?</legend>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setDestinatarios(destinatarios.length === usuarios.length ? [] : usuarios.map((u) => u.id))}
                >
                  {destinatarios.length === usuarios.length ? "Quitar a todos" : "Elegir a todos"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {usuarios.map((u) => (
                  <Label
                    key={u.id}
                    htmlFor={`comp-u-${u.id}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox id={`comp-u-${u.id}`} checked={destinatarios.includes(u.id)} onCheckedChange={() => alternarDestinatario(u.id)} />
                    {u.nombre}
                  </Label>
                ))}
              </div>
              {destinatarios.length > 1 && (
                <p className="text-xs text-muted-foreground">Cada uno recibe su propio registro y su propio premio sorpresa.</p>
              )}
            </fieldset>

            <ToggleGroup
              type="single"
              variant="outline"
              value={tipo}
              onValueChange={(v) => v && setTipo(v as "Positivo" | "Negativo")}
              className="w-full"
            >
              <ToggleGroupItem value="Positivo" className="flex-1 gap-1.5">
                <ThumbsUp className="size-4" /> Premiar
              </ToggleGroupItem>
              <ToggleGroupItem value="Negativo" className="flex-1 gap-1.5">
                <ThumbsDown className="size-4" /> Penitencia
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="space-y-1.5">
              <Label htmlFor="comp-titulo">Comportamiento</Label>
              <Input
                id="comp-titulo"
                value={titulo}
                maxLength={120}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={tipo === "Positivo" ? "Ej. Ayudó a su hermana con la tarea" : "Ej. Le contestó mal a la abuela"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comp-eval">Evaluación (opcional)</Label>
              <Textarea
                id="comp-eval"
                value={evaluacion}
                maxLength={1000}
                rows={3}
                onChange={(e) => setEvaluacion(e.target.value)}
                placeholder="Cómo lo viste, qué esperás de ahora en más…"
                className="resize-none"
              />
            </div>

            {tipo === "Positivo" ? (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Premios sorpresa</p>
                {items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((p, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {textoItem(p)}
                        <button
                          type="button"
                          aria-label="Quitar premio"
                          className="rounded-full p-0.5 hover:bg-foreground/10"
                          onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <NativeSelect className="w-full" value={tipoItem} onChange={(e) => setTipoItem(e.target.value as TipoItem)} aria-label="Tipo de premio">
                  {TIPOS_ITEM.map((t) => (
                    <NativeSelectOption key={t.id} value={t.id}>
                      {t.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>

                {tipoItem === "carta" && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <NativeSelect className="flex-1" value={cartaId} onChange={(e) => setCartaId(e.target.value)} aria-label="Carta">
                      <NativeSelectOption value="">Elegí una carta…</NativeSelectOption>
                      {cartas.map((c) => (
                        <NativeSelectOption key={c.id} value={String(c.id)}>
                          {c.nombre}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect value={modoCarta} onChange={(e) => setModoCarta(e.target.value as "completa" | "fragmentos")} aria-label="Cuánto">
                      <NativeSelectOption value="completa">Carta completa</NativeSelectOption>
                      <NativeSelectOption value="fragmentos">Fragmentos</NativeSelectOption>
                    </NativeSelect>
                  </div>
                )}

                <div className="flex gap-2">
                  {(tipoItem === "exoneracion" || tipoItem === "extra") && (
                    <Input
                      value={textoLibre}
                      maxLength={200}
                      onChange={(e) => setTextoLibre(e.target.value)}
                      placeholder={tipoItem === "exoneracion" ? "Ej. Lavar los platos hoy" : "Ej. Permiso para ver una película, un helado…"}
                    />
                  )}
                  {(tipoItem === "puntos" || tipoItem === "incienso" || tipoItem === "xp" || (tipoItem === "carta" && modoCarta === "fragmentos")) && (
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder={tipoItem === "carta" ? "Cantidad de fragmentos" : "Cantidad"}
                    />
                  )}
                  <Button type="button" variant="outline" onClick={agregarItem} className="shrink-0">
                    <Plus className="size-4" /> Agregar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Puntos, incienso, XP y cartas se acreditan solos cuando el niño abre su premio. Lo demás lo ves en «Para entregar».
                </p>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="comp-pen">Penitencia (opcional)</Label>
                  <Input
                    id="comp-pen"
                    value={penitencia}
                    maxLength={200}
                    onChange={(e) => setPenitencia(e.target.value)}
                    placeholder="Ej. Pedir perdón y ordenar el living"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="comp-pts">Quitar puntos (opcional)</Label>
                  <Input
                    id="comp-pts"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={puntosPenalizados}
                    onChange={(e) => setPuntosPenalizados(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button disabled={!listo || guardando} onClick={guardar}>
              {guardando && <Spinner />} Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
