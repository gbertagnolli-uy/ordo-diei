"use client";

// Premios reclamables (vault/HABITO_LIBRO.md D8–D9): reclamar los propios y, para padres, entregar los de la familia.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Gift, Hourglass, Medal, PackageCheck, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CoolMode } from "@/components/ui/cool-mode";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { RecompensaVista } from "@/lib/recompensas/server";
import { toast } from "@/lib/toast";
import { Separator } from "@/components/ui/separator";
import { ValeTicket } from "./ValeTicket";
import { CofreDelDia } from "./CofreDelDia";
import { mismoDia } from "@/lib/comportamiento/cofreHorario";
import { ModalAperturaSobre, type ResultadoCompraSobre } from "@/components/cartas/ModalAperturaSobre";
import { ModalSorpresa, type ResultadoSorpresa, type TipoSorpresa } from "./ModalSorpresa";

type Datos = { propias: RecompensaVista[]; porEntregar: RecompensaVista[] };

const ESTADOS = {
  disponible: { label: "Para reclamar", icon: Gift },
  reclamado: { label: "Esperando entrega", icon: Hourglass },
  entregado: { label: "Entregado", icon: PackageCheck },
} as const;

// Estable entre renders: CoolMode reinicia el efecto si cambian las opciones
const CONFITES = { particle: "🎁", size: 14 };

// Ilustración de la tarjeta según el tipo de premio (public/premios)
const IMAGEN = { cofre: "/premios/cofre.webp", reconocimiento: "/premios/medalla.webp" } as Record<string, string>;

const fecha = (iso: string) => format(new Date(iso), "d 'de' MMMM", { locale: es });
const fechaCorta = (iso: string) => format(new Date(iso), "d MMM yyyy", { locale: es });

export function MisPremios({ inicial, esPadre }: { inicial: Datos; esPadre: boolean }) {
  const router = useRouter();
  const [datos, setDatos] = useState(inicial);
  const [abierto, setAbierto] = useState<RecompensaVista | null>(null);
  const [pedido, setPedido] = useState("");
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);
  // Vales arrancados que el servidor todavía no confirmó (el ticket se ve usado de inmediato)
  const [arrancados, setArrancados] = useState<number[]>([]);
  // Premio sorpresa en apertura: el modal 3D se muestra de inmediato y el resultado llega del servidor
  const [sorpresa, setSorpresa] = useState<{ titulo: string; tipo: TipoSorpresa; resultado: ResultadoSorpresa | null } | null>(null);

  // El refresco automático del dashboard trae premios nuevos; no se pisa lo que se está abriendo
  useEffect(() => {
    if (ocupadoId === null && sorpresa === null) setDatos(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial]);

  // Fragmentos ganados: al cerrar el premio sorpresa se muestran con el mismo modal que los sobres
  const [sobre, setSobre] = useState<ResultadoCompraSobre | null>(null);

  // Con premios sin abrir, baja los modelos 3D ya para que el modal abra al instante
  const haySorpresas = datos.propias.some((r) => r.sorpresa);
  useEffect(() => {
    if (haySorpresas) void import("./Regalo3D").then((m) => m.precargar());
  }, [haySorpresas]);

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
      setDatos({ propias: json.propias, porEntregar: json.porEntregar });
      router.refresh(); // insignia de la barra lateral y banner
      return json.apertura ?? true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el premio");
      return false;
    } finally {
      setOcupadoId(null);
    }
  };

  const abrirSorpresa = async (r: RecompensaVista) => {
    const tipo: TipoSorpresa = r.tipo === "cofre" ? "cofre" : r.tipo === "reconocimiento" ? "reconocimiento" : "regalo";
    setSorpresa({ titulo: r.titulo, tipo, resultado: null });
    const res = await accion(r.id, { accion: "abrir" });
    if (res && typeof res === "object") setSorpresa({ titulo: r.titulo, tipo, resultado: res as ResultadoSorpresa });
    else setSorpresa(null); // falló: el toast ya avisó
  };

  const usarVale = async (id: number) => {
    setArrancados((prev) => [...prev, id]);
    try {
      const res = await fetch(`/api/recompensas/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "usar" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo usar el vale");
      setDatos({ propias: json.propias, porEntregar: json.porEntregar });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo usar el vale");
    } finally {
      setArrancados((prev) => prev.filter((x) => x !== id));
    }
  };

  const reclamar = async () => {
    if (!abierto) return;
    if (await accion(abierto.id, { accion: "reclamar", pedido })) setAbierto(null);
  };

  const elegir = (r: RecompensaVista) => {
    if (r.estado !== "disponible" || ocupadoId !== null) return;
    if (r.sorpresa) return void abrirSorpresa(r);
    setPedido("");
    setAbierto(r);
  };

  const tarjeta = (r: RecompensaVista) => {
    // Vale ya abierto: se muestra como ticket para arrancar
    if (r.tipo === "vale" && r.estado !== "disponible") {
      return (
        <ValeTicket key={r.id} vale={arrancados.includes(r.id) && !r.usadoEn ? { ...r, usadoEn: new Date().toISOString() } : r} onUsar={() => usarVale(r.id)} />
      );
    }
    const reconocimiento = r.tipo === "reconocimiento";
    const disponible = r.estado === "disponible";
    const estado = reconocimiento && !disponible ? { label: "Reconocimiento", icon: Medal } : ESTADOS[r.estado];
    const pie =
      reconocimiento && !disponible
        ? `Recibido el ${fecha(r.ganadaEn)}${r.entregadaPor ? ` de ${r.entregadaPor.nombre}` : ""}`
        : r.estado === "entregado" && r.entregadaEn
        ? `Entregado el ${fecha(r.entregadaEn)}${r.entregadaPor ? ` por ${r.entregadaPor.nombre}` : ""}`
        : r.estado === "reclamado" && r.reclamadaEn
        ? `Reclamado el ${fecha(r.reclamadaEn)} · tus papás ya lo ven`
        : `Ganado el ${fecha(r.ganadaEn)} · tocá para ${r.sorpresa ? "abrirlo" : "reclamarlo"}`;
    const card = (
      <Card
        key={r.id}
        role={disponible ? "button" : undefined}
        tabIndex={disponible ? 0 : undefined}
        onClick={() => elegir(r)}
        onKeyDown={(e) => {
          if (disponible && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            elegir(r);
          }
        }}
        className={cn(
          "relative flex-row gap-0 overflow-hidden py-0 transition-all",
          disponible && "cursor-pointer border-primary/40 hover:border-primary hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none",
          r.estado === "entregado" && !reconocimiento && "opacity-70"
        )}
      >
        {/* Imagen a la izquierda: fondo blanco propio para que el degradé de la ilustración se funda */}
        {!disponible && (r.reclamadaEn ?? r.entregadaEn) && (
          <span className="absolute top-2 right-3 z-10 text-[10px] text-muted-foreground">{fechaCorta((r.reclamadaEn ?? r.entregadaEn)!)}</span>
        )}
        <div className="relative w-32 shrink-0 self-stretch bg-white sm:w-48">
          <Image src={IMAGEN[r.tipo] ?? "/premios/regalo.webp"} alt="" fill unoptimized loading="eager" sizes="(min-width: 640px) 192px, 128px" className={cn("object-contain [mask-image:linear-gradient(to_right,black_70%,transparent_96%)]", reconocimiento && "scale-90")} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 p-4 text-left sm:p-5">
          <Badge variant={disponible || reconocimiento ? "default" : "secondary"}>
            <estado.icon className="size-3" /> {estado.label}
          </Badge>
          <div className="space-y-0.5">
            <h3 className="font-heading text-lg leading-tight font-medium">{r.sorpresa ? (r.tipo === "cofre" ? "Cofre sorpresa" : r.tipo === "vale" ? "Vale sorpresa" : r.tipo === "reconocimiento" ? "Reconocimiento" : "Premio sorpresa") : r.titulo}</h3>
            {r.origen && <p className="text-sm text-muted-foreground">{r.sorpresa && r.tipo === "comportamiento" ? `Por: ${r.titulo}` : r.origen}</p>}
          </div>
          {r.contenido && r.contenido.length > 0 && (
            <ul className="list-inside list-disc text-sm">
              {r.contenido.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
          {r.pedido && (
            <p className="text-sm text-muted-foreground">
              Pediste <span className="font-medium text-foreground">«{r.pedido}»</span>
            </p>
          )}
          {r.sorpresa && (
            <CoolMode options={CONFITES}>
              <Button
                size="sm"
                disabled={ocupadoId !== null}
                onClick={(e) => {
                  e.stopPropagation(); // la tarjeta entera también abre el premio
                  elegir(r);
                }}
              >
                {ocupadoId === r.id ? <Spinner /> : <Gift className="size-4" />} {r.tipo === "cofre" ? "Abrir cofre" : r.tipo === "reconocimiento" ? "Reclamar reconocimiento" : "Reclamar premio"}
              </Button>
            </CoolMode>
          )}
          <p className="text-xs text-muted-foreground">{pie}</p>
        </div>
      </Card>
    );
    // Ya reclamado: cada click en la tarjeta lanza regalitos
    return disponible ? card : (
      <CoolMode key={r.id} options={CONFITES} className="block">
        {card}
      </CoolMode>
    );
  };

  // Los cofres no van con los premios por reclamar: tienen su propia sección con cuenta regresiva
  const cofresSinAbrir = datos.propias.filter((r) => r.tipo === "cofre" && r.estado === "disponible");
  const porReclamar = datos.propias.filter((r) => r.estado === "disponible" && r.tipo !== "cofre");
  const abiertoHoy = datos.propias.some((r) => r.tipo === "cofre" && r.reclamadaEn !== null && mismoDia(new Date(r.reclamadaEn).getTime(), Date.now()));
  const reclamados = datos.propias
    .filter((r) => r.estado !== "disponible")
    .sort((a, b) => new Date(b.reclamadaEn ?? b.ganadaEn).getTime() - new Date(a.reclamadaEn ?? a.ganadaEn).getTime());

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
                    {r.contenido?.length ? r.contenido.join(" · ") : r.pedido ? <>Pidió «{r.pedido}»</> : r.origen}
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

      {/* Premios propios: primero lo que falta reclamar y, aparte, lo ya reclamado */}
      {datos.propias.length === 0 && (
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
      )}

      {porReclamar.length > 0 && <div className="grid grid-cols-1 gap-4">{porReclamar.map(tarjeta)}</div>}

      {/* Entre lo que falta reclamar y lo ya reclamado: el cofre diario, siempre a la vista */}
      <CofreDelDia
        hayCofre={cofresSinAbrir.length > 0}
        abiertoHoy={abiertoHoy}
        ocupado={ocupadoId !== null}
        abriendo={cofresSinAbrir.length > 0 && ocupadoId === cofresSinAbrir[0].id}
        masPendientes={Math.max(0, cofresSinAbrir.length - 1)}
        onAbrir={() => cofresSinAbrir[0] && elegir(cofresSinAbrir[0])}
      />

      {reclamados.length > 0 && (
        <section className="space-y-4" aria-labelledby="premios-reclamados">
          <Separator />
          <h2 id="premios-reclamados" className="flex items-center gap-2 font-heading text-lg font-medium">
            <PackageCheck className="size-5 text-primary" /> Reclamados
          </h2>
          <div className="grid grid-cols-1 gap-4">{reclamados.map(tarjeta)}</div>
        </section>
      )}

      <ModalSorpresa titulo={sorpresa?.titulo ?? null} tipo={sorpresa?.tipo} resultado={sorpresa?.resultado ?? null} onCerrar={() => {
          const cartas = sorpresa?.resultado?.cartasAfectadas ?? [];
          if (cartas.length > 0) {
            setSobre({
              nombreSobre: sorpresa?.titulo,
              nuevoSaldoPuntos: 0,
              nuevoSaldoIncienso: 0,
              mostrarSaldos: false,
              totalInciensoGanado: sorpresa?.resultado?.totalInciensoGanado ?? 0,
              cartasAfectadas: cartas,
            });
          }
          setSorpresa(null);
        }}
      />
      <ModalAperturaSobre open={sobre !== null} onOpenChange={(a) => !a && setSobre(null)} resultado={sobre} />

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
