// Resumen al pie de «Mis premios»: lo que tiene el usuario y lo que generó hoy.
import { Coins, Flame, Layers, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumenDia as Resumen } from "@/lib/recompensas/resumen";

const fmt = (n: number) => n.toLocaleString("es");
const mas = (n: number) => (n > 0 ? `+${fmt(n)}` : "0");

export function ResumenDia({ resumen }: { resumen: Resumen }) {
  const celdas = [
    { label: "Puntos", icon: Coins, total: fmt(resumen.totales.puntos), hoy: mas(resumen.hoy.puntos) },
    { label: "XP", icon: Star, total: fmt(resumen.totales.xp), hoy: mas(resumen.hoy.xp) },
    { label: "Incienso", icon: Flame, total: fmt(resumen.totales.incienso), hoy: mas(resumen.hoy.incienso) },
    { label: "Fragmentos", icon: Layers, total: null, hoy: mas(resumen.hoy.fragmentos) },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Tu día</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {celdas.map((c) => (
          <div key={c.label} className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <c.icon className="size-4" /> {c.label}
            </p>
            <p className="font-heading text-2xl font-semibold tabular-nums">{c.hoy}</p>
            <p className="text-xs text-muted-foreground">{c.total === null ? "ganados hoy" : `hoy · en total ${c.total}`}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
