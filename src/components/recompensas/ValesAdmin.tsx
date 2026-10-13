"use client";

// Vales de la familia (vault/LANE_86_VALES.md): los padres ven cuáles se usaron y pueden restaurar uno
// arrancado sin querer. Se usa en el panel de premios sorpresa y en el de premios familiares.
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RotateCcw, Ticket, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/lib/toast";
import type { ValeAdminVista } from "@/lib/recompensas/vales";

const fecha = (iso: string) => format(new Date(iso), "d 'de' MMMM, HH:mm", { locale: es });

export function ValesAdmin() {
  const [vales, setVales] = useState<ValeAdminVista[] | null>(null);
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/vales", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudieron cargar los vales");
      setVales(json.vales);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los vales");
      setVales([]);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const restaurar = async (id: number) => {
    setOcupadoId(id);
    try {
      const res = await fetch(`/api/recompensas/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "restaurar" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo restaurar el vale");
      toast.success("Vale restaurado: vuelve a estar sin usar");
      await cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo restaurar el vale");
    } finally {
      setOcupadoId(null);
    }
  };

  if (!vales || vales.length === 0) return null;

  return (
    <Card className="mt-6 gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="size-4 text-primary" /> Vales ({vales.length})
        </CardTitle>
      </CardHeader>
      <ItemGroup className="gap-0 divide-y">
        {vales.map((v) => (
          <Item key={v.id} className="rounded-none px-6 py-3">
            <ItemMedia>
              <Avatar className="size-10 rounded-lg">
                <AvatarImage src={v.usuario.fotoUrl ?? undefined} alt={v.usuario.nombre} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  <User className="size-5" />
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="flex flex-wrap items-center gap-2">
                {v.usuario.nombre} · Vale por {v.texto}
                <Badge variant={v.usadoEn ? "secondary" : "outline"}>{!v.abierto ? "Sin abrir" : v.usadoEn ? "Usado" : "Sin usar"}</Badge>
              </ItemTitle>
              <ItemDescription>
                {v.origen ? `${v.origen} · ` : ""}ganado el {fecha(v.ganadaEn)}
                {v.usadoEn && <> · usado el {fecha(v.usadoEn)}</>}
              </ItemDescription>
            </ItemContent>
            {v.usadoEn && (
              <ItemActions>
                <Button size="sm" variant="outline" disabled={ocupadoId !== null} onClick={() => restaurar(v.id)}>
                  {ocupadoId === v.id ? <Spinner /> : <RotateCcw className="size-4" />} Restaurar
                </Button>
              </ItemActions>
            )}
          </Item>
        ))}
      </ItemGroup>
    </Card>
  );
}
