"use client";

// Cartas que alcanzaron un grado nuevo y esperan que el usuario lo reclame (D20).
import { Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { claveReclamo, useReclamoCarta } from "@/components/cartas/useReclamoCarta";
import { TEXTOS_CARTAS } from "@/lib/cartas/textos";
import type { CartaPorReclamar } from "@/lib/recompensas/resumen";

export function CartasPorReclamar({ cartas }: { cartas: CartaPorReclamar[] }) {
  const { reclamar, reclamando, modal } = useReclamoCarta();
  if (cartas.length === 0) return modal;

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center gap-2 border-b py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4 text-primary" /> Cartas para reclamar ({cartas.length})
          </CardTitle>
        </CardHeader>
        <ItemGroup className="gap-0 divide-y">
          {cartas.map((c) => {
            const clave = claveReclamo({ tipo: "grado", cartaId: c.cartaId });
            const grado = TEXTOS_CARTAS.gradosRomanos[c.gradoDisponible as 1 | 2 | 3 | 4];
            return (
              <Item key={c.cartaId} className="rounded-none px-6 py-3">
                <ItemMedia className="text-amber-500">
                  <Sparkles className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{c.nombre}</ItemTitle>
                  <ItemDescription>{c.gradoDisponible === 1 ? "Lista para desbloquear" : `Alcanzó el Grado ${grado}`}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="sm" disabled={reclamando !== null} onClick={() => reclamar({ tipo: "grado", cartaId: c.cartaId })}>
                    {reclamando === clave ? <Spinner /> : <Sparkles className="size-4" />} Reclamar
                  </Button>
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </Card>
      {modal}
    </>
  );
}
