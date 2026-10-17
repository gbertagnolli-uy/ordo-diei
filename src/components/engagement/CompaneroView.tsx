"use client";

// Pantalla del compañero (lane 220): su escena y tres pestañas — Mejoras (qué se abre con el próximo nivel),
// Accesorios (comprar y poner) y Álbum (las poses que ya aprendió). Sin economía propia: el nivel es el de siempre.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Frame, Heart, LayoutGrid, Lock, Palette, Sparkles, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ElegirCompanero, enviarCompanero, FestejarNivel, NombrarCompanero } from "@/components/engagement/CompaneroAcciones";
import { EscenaCompanero, rutaDePose } from "@/components/engagement/EscenaCompanero";
import { ImagenConRespaldo } from "@/components/engagement/ImagenConRespaldo";
import { ACCESORIOS, motivoNoCompra, RAREZAS, RUTA_IMAGEN, textoPrecio, type Accesorio } from "@/lib/engagement/accesorios";
import { datosDePersonaje, POSES, type Personaje, type Pose } from "@/lib/engagement/companero";
import type { CompaneroVista } from "@/lib/engagement/companeroServidor";
import { toast } from "@/lib/toast";

const MENSAJE_MOTIVO = { nivel: (a: Accesorio) => `Se abre en el nivel ${a.nivel}`, saldo: () => "Te faltan monedas", "ya-lo-tenes": () => "" } as const;

function Miniatura({ a }: { a: Accesorio }) {
  return (
    <ImagenConRespaldo
      srcs={[RUTA_IMAGEN(a)]}
      alt=""
      className="size-full object-cover"
      respaldo={<span aria-hidden className="text-2xl">{a.emoji}</span>}
    />
  );
}

function FilaAccesorio({ a, datos }: { a: Accesorio; datos: CompaneroVista }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const suyo = datos.suyos.includes(a.clave);
  const puesto = a.tipo === "fondo" ? datos.equipados.fondo === a.clave : datos.equipados.objetos.includes(a.clave);
  const motivo = motivoNoCompra(a, datos.suyos, datos.nivel.numero, datos.saldos);
  const sinLugar = a.tipo === "objeto" && !puesto && datos.equipados.objetos.length >= datos.ranuras.total;

  async function accion(cuerpo: Record<string, unknown>, ok?: string) {
    setOcupado(true);
    try {
      await enviarCompanero(cuerpo);
      if (ok) toast.success(ok);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Item variant="outline" size="sm">
      <ItemMedia variant="image" className="size-12 bg-muted/60">
        <Miniatura a={a} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {a.nombre} <Badge variant="outline">{RAREZAS[a.rareza].nombre}</Badge>
        </ItemTitle>
        <ItemDescription>{suyo ? a.descripcion : `${a.descripcion} · ${textoPrecio(a)}`}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {suyo ? (
          a.tipo === "fondo" ? (
            <Button size="sm" variant={puesto ? "secondary" : "outline"} disabled={ocupado || puesto} onClick={() => accion({ accion: "equipar", clave: a.clave, puesto: true })}>
              {puesto ? "Puesto" : "Poner"}
            </Button>
          ) : (
            <Button size="sm" variant={puesto ? "secondary" : "outline"} disabled={ocupado || sinLugar} title={sinLugar ? "No tenés más lugar: sacá otro objeto" : undefined} onClick={() => accion({ accion: "equipar", clave: a.clave, puesto: !puesto })}>
              {ocupado && <Spinner />} {puesto ? "Sacar" : "Poner"}
            </Button>
          )
        ) : motivo === "nivel" || motivo === "saldo" ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {motivo === "nivel" && <Lock className="size-3" />} {MENSAJE_MOTIVO[motivo](a)}
          </span>
        ) : (
          <Button size="sm" disabled={ocupado || datos.sancionado} onClick={() => accion({ accion: "comprar", clave: a.clave }, `${a.nombre}: ¡ya es tuyo!`)}>
            {ocupado && <Spinner />} Comprar
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}

function Mejoras({ datos }: { datos: CompaneroVista }) {
  const { nivel, poses, ranuras, marco, relacion } = datos;
  const proximosAccesorios = ACCESORIOS.filter((a) => a.nivel > nivel.numero).sort((x, y) => x.nivel - y.nivel).slice(0, 3);
  const nivelDelMarco = marco < 4 ? (marco + 1) * 5 : null;
  const filas = [
    ...(poses.proxima ? [{ nivel: poses.proxima.nivel, icono: UserRound, titulo: `Aprende una pose: ${poses.proxima.nombre}`, texto: "Tu compañero te va a mostrar algo nuevo." }] : []),
    ...(ranuras.proximaEnNivel ? [{ nivel: ranuras.proximaEnNivel, icono: LayoutGrid, titulo: "Un lugar más para objetos", texto: `Hoy podés poner ${ranuras.total} a la vez.` }] : []),
    ...(nivelDelMarco ? [{ nivel: nivelDelMarco, icono: Frame, titulo: "Un marco nuevo para su escena", texto: "Cada 5 niveles cambia el marco." }] : []),
    ...proximosAccesorios.map((a) => ({ nivel: a.nivel, icono: Palette, titulo: `Se abre: ${a.nombre}`, texto: `${RAREZAS[a.rareza].nombre} · ${textoPrecio(a)}` })),
  ].sort((x, y) => x.nivel - y.nivel);

  return (
    <div className="space-y-3">
      <Card className="gap-3 py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <Heart className="size-4" /> {relacion.titulo}
          </CardTitle>
          <CardDescription>
            {datos.diasJuntos} {datos.diasJuntos === 1 ? "día" : "días"} juntos
            {relacion.proximo && ` · ${relacion.proximo.faltan === 1 ? "falta 1 día" : `faltan ${relacion.proximo.faltan} días`} para ser «${relacion.proximo.titulo}»`}
          </CardDescription>
        </CardHeader>
      </Card>
      {filas.length === 0 ? (
        <p className="text-sm text-muted-foreground">¡Ya desbloqueaste todo lo que hay por ahora! Pronto vienen más sorpresas.</p>
      ) : (
        <ItemGroup className="gap-2">
          {filas.map((f) => (
            <Item key={`${f.nivel}-${f.titulo}`} variant="outline" size="sm">
              <ItemMedia variant="icon">
                <f.icono />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{f.titulo}</ItemTitle>
                <ItemDescription>{f.texto}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge variant="secondary">Nivel {f.nivel}</Badge>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </div>
  );
}

function Accesorios({ datos }: { datos: CompaneroVista }) {
  return (
    <div className="space-y-4">
      {datos.sancionado && (
        <Alert variant="destructive">
          <Lock />
          <AlertTitle>Accesorios cerrados por hoy</AlertTitle>
          <AlertDescription>Por el mal comportamiento de hoy no se puede comprar por 1 día. Lo que ya tenés lo podés poner igual.</AlertDescription>
        </Alert>
      )}
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Escenario</h3>
        <ItemGroup className="gap-2">
          {ACCESORIOS.filter((a) => a.tipo === "fondo").map((a) => <FilaAccesorio key={a.clave} a={a} datos={datos} />)}
        </ItemGroup>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium">
          Objetos <span className="font-normal text-muted-foreground">· {datos.equipados.objetos.length} de {datos.ranuras.total} puestos</span>
        </h3>
        <ItemGroup className="gap-2">
          {ACCESORIOS.filter((a) => a.tipo === "objeto").map((a) => <FilaAccesorio key={a.clave} a={a} datos={datos} />)}
        </ItemGroup>
      </section>
    </div>
  );
}

function Album({ datos, personaje, onVer }: { datos: CompaneroVista; personaje: Personaje; onVer: (p: Pose) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {POSES.map((p) => {
        const abierta = datos.poses.desbloqueadas.includes(p.clave);
        return (
          <Card key={p.clave} className="gap-2 overflow-hidden py-3">
            <CardContent className="space-y-2 px-3">
              <button
                type="button"
                disabled={!abierta}
                onClick={() => onVer(p.clave)}
                aria-label={abierta ? `Ver la pose ${p.nombre}` : `${p.nombre}: bloqueada hasta el nivel ${p.nivel}`}
                className="flex aspect-[3/4] w-full items-end justify-center overflow-hidden rounded-md bg-muted/60 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <ImagenConRespaldo
                  srcs={[rutaDePose(personaje, p.clave)]}
                  alt=""
                  className={abierta ? "h-full w-auto object-contain" : "h-full w-auto object-contain opacity-30 brightness-0"}
                  respaldo={<span aria-hidden className={abierta ? "self-center text-5xl" : "self-center text-5xl opacity-30 grayscale"}>{datosDePersonaje(personaje).emoji}</span>}
                />
              </button>
              <div>
                <p className="flex items-center gap-1 text-sm font-medium">
                  {!abierta && <Lock className="size-3" />} {p.nombre}
                </p>
                <p className="text-xs text-muted-foreground">{abierta ? p.cuando : `Se aprende en el nivel ${p.nivel}`}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function CompaneroView({ datos }: { datos: CompaneroVista }) {
  const { quien, personaje, nombre, nivel, relacion, racha, nivelNuevo, equipados, marco, pose, frase } = datos;
  const [poseVista, setPoseVista] = useState<Pose | null>(null);

  if (!personaje) {
    return (
      <Card className="mx-auto max-w-xl gap-3 py-6 text-center">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Elegí quién te acompaña</CardTitle>
          <CardDescription>Tu compañero te recibe cada día, celebra tus logros y crece con tu nivel.</CardDescription>
        </CardHeader>
        <CardContent>
          <ElegirCompanero actual={null} etiqueta="Elegir mi compañero" />
        </CardContent>
      </Card>
    );
  }

  const poseActual = poseVista ?? pose;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="space-y-3">
        <EscenaCompanero key={`${poseActual}-${equipados.fondo}-${equipados.objetos.join()}`} personaje={personaje} pose={poseActual} equipados={equipados} marco={marco} quien={quien} frase={poseVista ? undefined : frase} className="mx-auto max-w-xs md:max-w-none" />
        <Card className="gap-3 py-4">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate font-heading text-lg font-medium">
                  {nombre} <NombrarCompanero nombreActual={nombre} />
                </p>
                <p className="text-sm text-muted-foreground">{relacion.titulo}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary">Nivel {nivel.numero}</Badge>
                {racha > 1 && (
                  <Badge>
                    <Flame className="size-3" /> {racha} días
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Progress value={nivel.avance} aria-label={`Avance hacia el nivel ${nivel.numero + 1}`} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {nivel.titulo} · {nivel.xpEnNivel} / {nivel.xpDelTramo} XP · a {nivel.faltan} XP del nivel {nivel.numero + 1}
              </p>
            </div>
            {nivelNuevo && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                <span>
                  <Sparkles className="mr-1 inline size-4" /> ¡Subiste al nivel {nivel.numero}!
                </span>
                <FestejarNivel />
              </div>
            )}
            <ElegirCompanero actual={personaje} nombreActual={nombre} etiqueta="Cambiar de compañero" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mejoras" className="min-w-0">
        <TabsList className="w-full">
          <TabsTrigger value="mejoras">Mejoras</TabsTrigger>
          <TabsTrigger value="accesorios">Accesorios</TabsTrigger>
          <TabsTrigger value="album">Álbum</TabsTrigger>
        </TabsList>
        <TabsContent value="mejoras" className="pt-3">
          <Mejoras datos={datos} />
        </TabsContent>
        <TabsContent value="accesorios" className="pt-3">
          <Accesorios datos={datos} />
        </TabsContent>
        <TabsContent value="album" className="pt-3">
          <Album datos={datos} personaje={personaje} onVer={(p) => setPoseVista(p)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
