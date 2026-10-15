"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, ImageDown, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { textoAtribucion } from "@/lib/reposo/unsplash";

type Estado = {
  config: {
    segundosLogin: number;
    segundosSesion: number;
    unsplashConsulta: string | null;
    tamPool: number;
    mostrarRefCatecismo: boolean;
    ultimaSincronia: string | null;
  };
  pool: { activas: number; ocultas: number; total: number; sinAvisar: number };
  claveCargada: boolean;
};

type FotoAdmin = { id: string; url: string; autor: string; urlAutor: string; urlFoto: string; activa: boolean; oculta: boolean; orientacion: string };

/** Miniatura: la misma URL de Unsplash con un ancho chico (hotlinking, sin re-servir). */
function miniatura(url: string) {
  const u = new URL(url);
  u.searchParams.set("w", "320");
  return u.toString();
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo completar la acción");
  return cuerpo as T;
}

/** Panel «Reposo» (SPEC idle-marco-fotos §5.5): tiempos, consulta de Unsplash, pool y fotos ocultas. */
export function PanelReposo() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [fotos, setFotos] = useState<FotoAdmin[]>([]);
  const [form, setForm] = useState({ segundosLogin: "15", segundosSesion: "60", unsplashConsulta: "", tamPool: "150", mostrarRefCatecismo: true });
  const [guardando, setGuardando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aplicarEstado = useCallback((e: Estado) => {
    setEstado(e);
    setForm({
      segundosLogin: String(e.config.segundosLogin),
      segundosSesion: String(e.config.segundosSesion),
      unsplashConsulta: e.config.unsplashConsulta ?? "",
      tamPool: String(e.config.tamPool),
      mostrarRefCatecismo: e.config.mostrarRefCatecismo,
    });
  }, []);

  const cargar = useCallback(async () => {
    try {
      const [e, f] = await Promise.all([api<Estado>("/api/admin/reposo"), api<FotoAdmin[]>("/api/admin/reposo/fotos")]);
      aplicarEstado(e);
      setFotos(f);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [aplicarEstado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const nuevo = await api<Estado>("/api/admin/reposo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segundosLogin: Number(form.segundosLogin),
          segundosSesion: Number(form.segundosSesion),
          unsplashConsulta: form.unsplashConsulta.trim() || null,
          tamPool: Number(form.tamPool),
          mostrarRefCatecismo: form.mostrarRefCatecismo,
        }),
      });
      aplicarEstado(nuevo);
      toast.success("Configuración guardada");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const refrescar = async () => {
    setRefrescando(true);
    try {
      const r = await api<{ ok: boolean; motivo?: string; nuevas?: number }>("/api/admin/reposo/refrescar", { method: "POST" });
      if (r.ok) toast.success(`Pool actualizado: ${r.nuevas ?? 0} fotos nuevas`);
      else toast.error(r.motivo ?? "No se pudo actualizar el pool");
      await cargar();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRefrescando(false);
    }
  };

  const alternarOculta = async (f: FotoAdmin) => {
    try {
      await api("/api/admin/reposo/fotos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: f.id, oculta: !f.oculta }),
      });
      await cargar();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (error && !estado) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>No se pudo cargar el panel</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!estado) {
    return (
      <div className="flex justify-center p-10">
        <Spinner />
      </div>
    );
  }

  const set = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <div className="space-y-6">
      {!estado.claveCargada && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Falta la clave de Unsplash</AlertTitle>
          <AlertDescription>
            Cargá <code>UNSPLASH_ACCESS_KEY</code> en las variables de entorno del servidor. Mientras tanto el reposo muestra el fondo de partículas.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Pantalla de reposo</CardTitle>
          <CardDescription>Cuánto espera antes de aparecer y qué muestra.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={guardar}>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="reposo-login">Segundos de inactividad en el login</FieldLabel>
                  <Input id="reposo-login" type="number" min={10} max={300} required value={form.segundosLogin} onChange={set("segundosLogin")} />
                  <FieldDescription>Entre 10 y 300.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="reposo-sesion">Segundos de inactividad con sesión abierta</FieldLabel>
                  <Input id="reposo-sesion" type="number" min={10} max={300} required value={form.segundosSesion} onChange={set("segundosSesion")} />
                  <FieldDescription>Entre 10 y 300.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="reposo-consulta">Búsqueda en Unsplash</FieldLabel>
                  <Input id="reposo-consulta" maxLength={100} placeholder="Vacía = tema Nature" value={form.unsplashConsulta} onChange={set("unsplashConsulta")} />
                  <FieldDescription>Si escribís algo, reemplaza al tema Nature en la próxima actualización.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="reposo-pool">Fotos en el pool</FieldLabel>
                  <Input id="reposo-pool" type="number" min={20} max={500} required value={form.tamPool} onChange={set("tamPool")} />
                  <FieldDescription>Se desactivan las más viejas al pasarse (20 a 500).</FieldDescription>
                </Field>
              </div>
              <Field orientation="horizontal">
                <Switch id="reposo-ref" checked={form.mostrarRefCatecismo} onCheckedChange={(v) => setForm((f) => ({ ...f, mostrarRefCatecismo: v }))} />
                <FieldLabel htmlFor="reposo-ref">Mostrar la referencia del Catecismo</FieldLabel>
              </Field>
              <div>
                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Fotos</CardTitle>
          <CardDescription>
            {estado.pool.activas} activas · {estado.pool.ocultas} ocultas
            {estado.config.ultimaSincronia && <> · última actualización {new Date(estado.config.ultimaSincronia).toLocaleString("es-AR")}</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={refrescar} disabled={refrescando || !estado.claveCargada}>
              {refrescando ? <Spinner /> : <ImageDown />}
              Cargar fotos ahora
            </Button>
            {estado.pool.sinAvisar > 0 && <Badge variant="secondary">{estado.pool.sinAvisar} con aviso de descarga pendiente</Badge>}
          </div>

          {fotos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay fotos. Pulsá «Cargar fotos ahora» o esperá la actualización diaria.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {fotos.map((f) => (
                <li key={f.id} className="space-y-1.5">
                  <div className="relative overflow-hidden rounded-lg border bg-muted">
                    {/* Hotlinking: se muestra la URL de Unsplash tal cual, sin pasar por next/image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={miniatura(f.url)}
                      alt={`Foto de ${f.autor}`}
                      loading="lazy"
                      className={`aspect-[4/3] w-full object-cover ${f.oculta || !f.activa ? "opacity-40 grayscale" : ""}`}
                    />
                    {f.oculta && <Badge className="absolute left-2 top-2">Oculta</Badge>}
                    {!f.oculta && !f.activa && <Badge variant="secondary" className="absolute left-2 top-2">Fuera del pool</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    <a href={f.urlAutor} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                      {textoAtribucion(f)}
                    </a>
                  </p>
                  <Button variant="outline" size="xs" className="w-full" onClick={() => alternarOculta(f)}>
                    {f.oculta ? <Eye /> : <EyeOff />}
                    {f.oculta ? "Mostrar" : "Ocultar"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
