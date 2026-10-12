"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, CheckCheck, Sprout, User, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import type { ItemSolicitud, Solicitudes, TipoSolicitud } from "@/lib/habitos/aprobaciones";
import { HabitoIcon } from "./HabitoIcon";

type Fila = ItemSolicitud & { nombre: string; icono: string; detalle: string };

const DETALLE: Record<TipoSolicitud, string> = {
  habito: "Quiere crear este hábito y empezarlo",
  adopcion: "Quiere empezar este hábito",
  registro: "Marcó como hecho",
};

const clave = (i: ItemSolicitud) => `${i.tipo}-${i.id}`;

const filasDe = (u: Solicitudes["usuarios"][number]): Fila[] => [
  ...u.habitos.map((h) => ({ tipo: "habito" as const, id: h.id, nombre: h.nombre, icono: h.icono, detalle: DETALLE.habito })),
  ...u.adopciones.map((a) => ({ tipo: "adopcion" as const, id: a.id, nombre: a.nombre, icono: a.icono, detalle: DETALLE.adopcion })),
  ...u.registros.map((r) => ({
    tipo: "registro" as const,
    id: r.id,
    nombre: r.nombre,
    icono: r.icono,
    detalle: `${DETALLE.registro} · ${format(parseISO(r.fecha), "EEEE d", { locale: es })}`,
  })),
];

/**
 * Revisión de solicitudes de hábitos (vault/APROBACION_HABITOS.md). Aprobar y rechazar es
 * optimista: la fila desaparece al instante y la petición va por detrás, sin recargar la página.
 * "Aprobar todo" resuelve de una vez todo lo de un hijo (o de la familia) para no cargar a los padres.
 */
export function SolicitudesHabitos({ inicial }: { inicial: Solicitudes }) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState(inicial.usuarios);
  const [error, setError] = useState<string | null>(null);

  const total = usuarios.reduce((n, u) => n + filasDe(u).length, 0);
  if (total === 0 && !error) return null;

  const resolver = async (accion: "aprobar" | "rechazar", items: ItemSolicitud[]) => {
    const claves = new Set(items.map(clave));
    const antes = usuarios;
    setError(null);
    setUsuarios((us) =>
      us
        .map((u) => ({
          ...u,
          habitos: u.habitos.filter((x) => !claves.has(clave({ tipo: "habito", id: x.id }))),
          adopciones: u.adopciones.filter((x) => !claves.has(clave({ tipo: "adopcion", id: x.id }))),
          registros: u.registros.filter((x) => !claves.has(clave({ tipo: "registro", id: x.id }))),
        }))
        .filter((u) => filasDe(u).length > 0)
    );
    try {
      const res = await fetch("/api/habitos/aprobaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, items: items.map(({ tipo, id }) => ({ tipo, id })) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setUsuarios(antes);
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  };

  const todas = usuarios.flatMap(filasDe);

  return (
    <Card className="mb-6 gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sprout className="size-4 text-primary" /> Hábitos por aprobar ({total})
        </CardTitle>
        {usuarios.length > 1 && (
          <Button size="sm" onClick={() => resolver("aprobar", todas)}>
            <CheckCheck /> Aprobar todo
          </Button>
        )}
      </CardHeader>
      {error && <p className="border-b px-6 py-2 text-sm text-destructive">{error}</p>}
      {usuarios.map((u) => {
        const filas = filasDe(u);
        return (
          <section key={u.usuario.id} className="border-b last:border-b-0">
            <div className="flex items-center gap-3 px-6 pt-3">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={u.usuario.fotoUrl ?? undefined} alt={u.usuario.nombre} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary"><User className="size-4" /></AvatarFallback>
              </Avatar>
              <span className="flex-1 font-medium text-primary">{u.usuario.nombre}</span>
              <Badge variant="secondary">{filas.length}</Badge>
              <Button size="sm" variant="outline" onClick={() => resolver("aprobar", filas)}>
                <CheckCheck /> Aprobar todo
              </Button>
            </div>
            <ItemGroup className="gap-0">
              {filas.map((f) => (
                <Item key={clave(f)} className="rounded-none px-6 py-2">
                  <ItemMedia variant="icon">
                    <HabitoIcon name={f.icono} className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{f.nombre}</ItemTitle>
                    <ItemDescription>{f.detalle}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Rechazar ${f.nombre}`}
                      onClick={() => resolver("rechazar", [f])}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X /> Rechazar
                    </Button>
                    <Button
                      size="sm"
                      aria-label={`Aprobar ${f.nombre}`}
                      onClick={() => resolver("aprobar", [f])}
                      className="bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]"
                    >
                      <Check /> Aprobar
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </section>
        );
      })}
    </Card>
  );
}
