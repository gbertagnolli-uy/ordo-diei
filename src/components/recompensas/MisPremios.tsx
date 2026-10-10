"use client";

// Premios reclamables (vault/HABITO_LIBRO.md D8–D9): reclamar los propios y, para padres, entregar los de la familia.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookMarked, Check, Gift, Hourglass, PackageCheck, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { RecompensaVista } from "@/lib/recompensas/server";

type Datos = { propias: RecompensaVista[]; porEntregar: RecompensaVista[] };

const ESTADOS = {
  disponible: { label: "Para reclamar", icon: Gift },
  reclamado: { label: "Esperando entrega", icon: Hourglass },
  entregado: { label: "Entregado", icon: PackageCheck },
} as const;

const fecha = (iso: string) => format(new Date(iso), "d 'de' MMMM", { locale: es });

export function MisPremios({ inicial, esPadre }: { inicial: Datos; esPadre: boolean }) {
  const router = useRouter();
  const [datos, setDatos] = useState(inicial);
  const [abierto, setAbierto] = useState<RecompensaVista | null>(null);
  const [pedido, setPedido] = useState("");
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);

  const accion = async (id: number, body: Record<string, unknown>) => {
    setOcupadoId(id);
    try {
      const res = await fetch(`/api/recompensas/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo actualizar el premio");
      setDatos(json);
      router.refresh(); // insignia de la barra lateral
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo actualizar el premio");
      return false;
    } finally {
      setOcupadoId(null);
    }
  };

  const reclamar = async () => {
    if (!abierto) return;
    if (await accion(abierto.id, { accion: "reclamar", pedido })) setAbierto(null);
  };

  const pideLibro = abierto?.tipo === "libro";

  return (
    <div className="space-y-8">
      {/* Padres: reclamos de la familia que esperan entrega */}
      {esPadre && datos.porEntregar.length > 0 && (
        <Card className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hourglass className="size-4 text-primary" /> Para entregar ({datos.porEntregar.length})
            </CardTitle>
          </CardHeader>
          <ItemGroup className="gap-0 divide-y">
            {datos.porEntregar.map((r) => (
              <Item key={r.id} className="rounded-none px-6 py-3">
                <ItemMedia>
                  <Avatar className="size-10 rounded-lg">
                    <AvatarImage src={r.usuario.fotoUrl ?? undefined} alt={r.usuario.nombre} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      <User className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {r.usuario.nombre} · {r.titulo}
                  </ItemTitle>
                  <ItemDescription>
                    {r.pedido ? <>Pidió «{r.pedido}»</> : r.origen}
                    {r.reclamadaEn && <> · reclamado el {fecha(r.reclamadaEn)}</>}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="sm" disabled={ocupadoId !== null} onClick={() => accion(r.id, { accion: "entregar" })}>
                    {ocupadoId === r.id ? <Spinner /> : <Check className="size-4" />} Marcar entregado
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </Card>
      )}

      {/* Premios propios */}
      {datos.propias.length === 0 ? (
        <Empty className="border bg-card py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Gift className="size-5 text-primary" />
            </EmptyMedia>
            <EmptyTitle>Todavía no ganaste premios</EmptyTitle>
            <EmptyDescription>
              Los premios llegan con tus hábitos: por ejemplo, al terminar un libro en «Leer un libro» ganás uno nuevo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {datos.propias.map((r) => {
            const estado = ESTADOS[r.estado];
            const Icono = r.tipo === "libro" ? BookMarked : Gift;
            const disponible = r.estado === "disponible";
            return (
              <Card
                key={r.id}
                role={disponible ? "button" : undefined}
                tabIndex={disponible ? 0 : undefined}
                onClick={() => {
                  if (!disponible) return;
                  setPedido("");
                  setAbierto(r);
                }}
                onKeyDown={(e) => {
                  if (disponible && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setPedido("");
                    setAbierto(r);
                  }
                }}
                className={cn(
                  "transition-all",
                  disponible && "cursor-pointer border-primary/40 hover:border-primary hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none",
                  r.estado === "entregado" && "opacity-70"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icono className="size-5" />
                    </div>
                    <Badge variant={disponible ? "default" : "secondary"}>
                      <estado.icon className="size-3" /> {estado.label}
                    </Badge>
                  </div>
                  <CardTitle className="font-heading text-lg">{r.titulo}</CardTitle>
                  {r.origen && <CardDescription>{r.origen}</CardDescription>}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {r.pedido && (
                    <p>
                      Pediste <span className="font-medium text-foreground">«{r.pedido}»</span>
                    </p>
                  )}
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  {r.estado === "entregado" && r.entregadaEn
                    ? `Entregado el ${fecha(r.entregadaEn)}${r.entregadaPor ? ` por ${r.entregadaPor.nombre}` : ""}`
                    : r.estado === "reclamado" && r.reclamadaEn
                    ? `Reclamado el ${fecha(r.reclamadaEn)} · tus papás ya lo ven`
                    : `Ganado el ${fecha(r.ganadaEn)} · tocá para reclamarlo`}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={abierto !== null} onOpenChange={(o) => !o && setAbierto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Reclamar: {abierto?.titulo}</DialogTitle>
            <DialogDescription>
              {pideLibro
                ? "Contanos qué libro querés. Tus papás van a ver el pedido para conseguírtelo."
                : "Tus papás van a ver el pedido para entregártelo."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pedido-premio">{pideLibro ? "¿Qué libro querés?" : "Comentario (opcional)"}</Label>
            <Textarea
              id="pedido-premio"
              value={pedido}
              maxLength={200}
              rows={2}
              onChange={(e) => setPedido(e.target.value)}
              placeholder={pideLibro ? "Ej. Harry Potter y la piedra filosofal" : ""}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(null)}>
              Cancelar
            </Button>
            <Button disabled={ocupadoId !== null || (pideLibro && !pedido.trim())} onClick={reclamar}>
              {ocupadoId !== null ? <Spinner /> : <Gift className="size-4" />} Reclamar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
