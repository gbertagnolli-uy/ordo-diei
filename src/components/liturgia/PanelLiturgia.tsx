import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PANTALLAS_LITURGIA } from "./navegacion";

/** Panel «Liturgia»: un solo lugar para llegar a todas las pantallas litúrgicas. */
export function PanelLiturgia() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Liturgia</h1>
        <p className="text-sm text-muted-foreground">Calendario, Misal, Breviario y devociones según el rito tradicional.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PANTALLAS_LITURGIA.map(({ href, label, tooltip, descripcion, icon: Icon }) => (
          <Link key={href} href={href} className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="font-heading text-base">{label}</CardTitle>
                <CardDescription>
                  <span className="block text-xs uppercase tracking-wide">{tooltip}</span>
                  {descripcion}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
