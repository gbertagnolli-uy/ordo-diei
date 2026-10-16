"use client";

// Registrar la conducta del día de un hijo (solo padres): selector de hijo, de día y nivel con el mismo
// selector que la dificultad de las tareas.
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { SelectorNivel } from "@/components/SelectorNivel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_NOTA_CONDUCTA, NIVEL_CONDUCTA_DEFAULT, NIVELES_CONDUCTA, etiquetaConducta } from "@/lib/conducta/niveles";
import type { DiaConducta } from "@/lib/conducta/server";
import { toast } from "@/lib/toast";
import { COLORES_CONDUCTA } from "./colores";
import { TiraConducta } from "./TiraConducta";

export type HijoConducta = { id: number; nombre: string };

export function RegistroConducta({ hijos, hoy, recientes: inicial }: { hijos: HijoConducta[]; hoy: string; recientes: Record<number, DiaConducta[]> }) {
  const [hijoId, setHijoId] = useState<number>(hijos[0]?.id ?? 0);
  const [fecha, setFecha] = useState(hoy);
  const [nivel, setNivel] = useState<number>(NIVEL_CONDUCTA_DEFAULT);
  const [nota, setNota] = useState("");
  const [recientes, setRecientes] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [yaRegistrado, setYaRegistrado] = useState(false);

  // Al cambiar de hijo o de día se precarga lo que ya estaba registrado.
  useEffect(() => {
    if (!hijoId || !fecha) return;
    let vigente = true;
    fetch(`/api/conducta?usuarioId=${hijoId}&fecha=${fecha}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DiaConducta | null) => {
        if (!vigente) return;
        setYaRegistrado(!!d);
        setNivel(d?.nivel ?? NIVEL_CONDUCTA_DEFAULT);
        setNota(d?.nota ?? "");
      })
      .catch(() => vigente && setYaRegistrado(false));
    return () => { vigente = false; };
  }, [hijoId, fecha]);

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/conducta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: hijoId, nivel, nota, fecha }),
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "No se pudo guardar");
      const dia = datos as DiaConducta;
      setRecientes((prev) => ({ ...prev, [hijoId]: [...(prev[hijoId] ?? []).filter((r) => r.fecha !== dia.fecha), dia].sort((a, b) => a.fecha.localeCompare(b.fecha)) }));
      setYaRegistrado(true);
      const nombre = hijos.find((h) => h.id === hijoId)?.nombre ?? "";
      toast.success(`Conducta de ${nombre} guardada: ${etiquetaConducta(dia.nivel)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  if (hijos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay hijos en la familia para registrar.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Conducta del día</CardTitle>
          <CardDescription>Elegí al hijo, el día y cómo se portó.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="conducta-hijo">Hijo</FieldLabel>
                <NativeSelect id="conducta-hijo" value={hijoId} onChange={(e) => setHijoId(Number(e.target.value))}>
                  {hijos.map((h) => <NativeSelectOption key={h.id} value={h.id}>{h.nombre}</NativeSelectOption>)}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="conducta-fecha">Día</FieldLabel>
                <Input id="conducta-fecha" type="date" max={hoy} value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="conducta-nivel" className="flex items-center gap-2"><HeartHandshake className="size-4 text-primary" /> Conducta</FieldLabel>
              <SelectorNivel
                id="conducta-nivel"
                niveles={NIVELES_CONDUCTA}
                valor={nivel}
                onChange={setNivel}
                colores={COLORES_CONDUCTA}
                ariaLabel="Nivel de conducta"
                alto={208}
                llenarAlMontar
                fluidez={{ viscosidad: 0.1, salpicadura: 0.55, inclinacion: 0.7 }}
              />
              {yaRegistrado && <FieldDescription>Ya había una conducta registrada ese día: al guardar se corrige.</FieldDescription>}
            </Field>
            <Field>
              <FieldLabel htmlFor="conducta-nota">Nota (opcional)</FieldLabel>
              <Textarea id="conducta-nota" rows={3} maxLength={MAX_NOTA_CONDUCTA} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Qué pasó, qué se felicita, qué hay que corregir…" />
            </Field>
            <Button onClick={guardar} disabled={guardando}>{guardando && <Spinner />} Guardar conducta</Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Últimos 14 días</CardTitle>
          <CardDescription>Gris: sin registro. Pasá el cursor sobre un día para ver la nota.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hijos.map((h) => {
            const dias = recientes[h.id] ?? [];
            return (
              <div key={h.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{h.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {dias.length ? `Último: ${format(parseISO(dias[dias.length - 1].fecha), "d MMM", { locale: es })}, ${etiquetaConducta(dias[dias.length - 1].nivel)}` : "Sin registros"}
                  </span>
                </div>
                <TiraConducta registros={dias} hasta={hoy} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
