"use client";

// Premio grupal (lane 274): los padres lo configuran de antemano; los vales se entregan solos al terminar el período.
import { useCallback, useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { PremioGrupalVista } from "@/lib/engagement/premioGrupalServidor";

const ESTADO: Record<PremioGrupalVista["estado"], string> = {
  proximo: "Próximo",
  "en-curso": "En curso",
  "por-evaluar": "Por evaluar",
  logrado: "Logrado",
  "no-logrado": "No logrado",
};

export function PanelPremioGrupal() {
  const [premios, setPremios] = useState<PremioGrupalVista[] | null>(null);
  const [form, setForm] = useState({ titulo: "", descripcion: "", porcentajeMeta: "80", desde: "", hasta: "" });
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/premio-grupal?todos=1", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(d.error || "No se pudieron cargar los premios");
      setPremios([]);
      return;
    }
    setPremios(d.premios);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async () => {
    setEnviando(true);
    try {
      const res = await fetch("/api/premio-grupal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, porcentajeMeta: Number(form.porcentajeMeta) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo crear");
        return;
      }
      toast.success("Premio grupal creado");
      setForm({ titulo: "", descripcion: "", porcentajeMeta: "80", desde: "", hasta: "" });
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  const archivar = async (id: number) => {
    if (!confirm("¿Archivar este premio? Deja de verse y no se evalúa.")) return;
    const res = await fetch("/api/premio-grupal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) toast.error("No se pudo archivar");
    await cargar();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo premio grupal</CardTitle>
          <CardDescription>Si los hijos completan el % de sus tareas del período, cada uno recibe el vale.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pg-titulo">Vale por…</Label>
            <Input id="pg-titulo" placeholder="una salida al parque" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pg-desc">Descripción (opcional)</Label>
            <Textarea id="pg-desc" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-meta">Meta (% de tareas completadas)</Label>
            <Input id="pg-meta" type="number" min={1} max={100} value={form.porcentajeMeta} onChange={(e) => setForm({ ...form, porcentajeMeta: e.target.value })} />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label htmlFor="pg-desde">Desde</Label>
            <Input id="pg-desde" type="date" value={form.desde} onChange={(e) => setForm({ ...form, desde: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-hasta">Hasta</Label>
            <Input id="pg-hasta" type="date" value={form.hasta} onChange={(e) => setForm({ ...form, hasta: e.target.value })} />
          </div>
          <Button className="sm:col-span-2" onClick={crear} disabled={enviando}>
            {enviando && <Spinner />} Crear premio
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Premios</CardTitle>
        </CardHeader>
        <CardContent>
          {premios === null ? (
            <Spinner />
          ) : premios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay premios grupales.</p>
          ) : (
            <ul className="divide-y">
              {premios.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">Vale por {p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.desde} → {p.hasta} · meta {p.porcentajeMeta} % · van {p.porcentaje} % ({p.hechas}/{p.total})
                    </p>
                    <Progress value={p.porcentaje} className="h-1" />
                  </div>
                  <Badge variant={p.activo ? "secondary" : "outline"}>{p.activo ? ESTADO[p.estado] : "Archivado"}</Badge>
                  {p.activo && (
                    <Button variant="ghost" size="icon-sm" aria-label={`Archivar ${p.titulo}`} onClick={() => archivar(p.id)}>
                      <Archive />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
