"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, MoreHorizontal, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ETAPAS, HABITOS, type HabitoId } from "@/lib/oracion/catalogo";
import type { EstadoOracion } from "@/lib/oracion/server";

export interface Miembro {
  id: number;
  nombre: string;
  rolFamiliar: string;
  fotoUrl: string | null;
}

const COLUMNAS: HabitoId[] = ["matutinum", "rosario", "completorium"];
const DIAS_ATRAS = 7;

async function enviar(url: string, method: string, body: object) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Error al guardar");
}

// Vista de padres: el camino de cada miembro y registro de la oración en familia.
export function FamiliaOracion({ miembros, estados, hoy }: { miembros: Miembro[]; estados: EstadoOracion[]; hoy: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const estadoDe = (id: number) => estados.find((e) => e.usuarioId === id)?.plan ?? null;

  const accion = async (clave: string, fn: () => Promise<void>) => {
    setOcupado(clave);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="space-y-6">
      <RezamosJuntos miembros={miembros} hoy={hoy} ocupado={ocupado === "juntos"} onRegistrar={(body) => accion("juntos", () => enviar("/api/oracion/registro", "PUT", body))} />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">El camino de cada uno</CardTitle>
          <CardDescription>Cada miembro avanza a su ritmo. Hoy: ✓ rezado, — pendiente.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Miembro</TableHead>
                {COLUMNAS.map((h) => <TableHead key={h}>{HABITOS[h].nombre}</TableHead>)}
                <TableHead className="w-12 pr-6"><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {miembros.map((m) => {
                const plan = estadoDe(m.id);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={m.fotoUrl ?? undefined} alt="" className="object-cover" />
                          <AvatarFallback>{m.nombre[0]}</AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="font-medium">{m.nombre}</p>
                          <p className="text-xs text-muted-foreground">{m.rolFamiliar}</p>
                        </div>
                      </div>
                    </TableCell>
                    {plan ? (
                      COLUMNAS.map((id) => {
                        const h = plan.habitos.find((x) => x.habito === id);
                        if (!h) return <TableCell key={id} className="text-xs text-muted-foreground">Aún no habilitada</TableCell>;
                        return (
                          <TableCell key={id}>
                            <div className="flex items-center gap-1.5">
                              <Badge variant={h.etapa === "retomando" ? "outline" : "secondary"}>{ETAPAS[h.etapa]}</Badge>
                              <span className={h.hoy === "hecho" ? "text-[var(--success)]" : "text-muted-foreground"} aria-label={h.hoy ? "Registrado hoy" : "Pendiente hoy"}>
                                {h.hoy ? <Check className="size-4" /> : "—"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {id === "rosario" ? `${h.pasoActual.titulo} · ` : ""}
                              {Math.round(h.constancia * 100)} %
                            </p>
                          </TableCell>
                        );
                      })
                    ) : (
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">Todavía no comenzó el camino</TableCell>
                    )}
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${m.nombre}`} disabled={ocupado === `m${m.id}`}>
                            {ocupado === `m${m.id}` ? <Spinner /> : <MoreHorizontal />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!plan && (
                            <DropdownMenuItem onSelect={() => accion(`m${m.id}`, () => enviar("/api/oracion", "POST", { usuarioIds: [m.id] }))}>
                              Comenzar el camino hoy
                            </DropdownMenuItem>
                          )}
                          {plan?.matutinumBloqueado && (
                            <DropdownMenuItem onSelect={() => accion(`m${m.id}`, () => enviar("/api/oracion", "POST", { usuarioIds: [m.id], matutinumDesde: hoy }))}>
                              Habilitar las oraciones de la mañana
                            </DropdownMenuItem>
                          )}
                          {plan && !plan.matutinumBloqueado && (
                            <DropdownMenuItem disabled>Las tres oraciones están habilitadas</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Registro en un paso de una oración rezada en familia (por defecto, Completorium de hoy, todos).
function RezamosJuntos({
  miembros,
  hoy,
  ocupado,
  onRegistrar,
}: {
  miembros: Miembro[];
  hoy: string;
  ocupado: boolean;
  onRegistrar: (body: { habito: HabitoId; fecha: string; marca: "hecho"; usuarioIds: number[] }) => void;
}) {
  const [habito, setHabito] = useState<HabitoId>("completorium");
  const [fecha, setFecha] = useState(hoy);
  const [elegidos, setElegidos] = useState<number[]>(miembros.map((m) => m.id));

  const fechas = Array.from({ length: DIAS_ATRAS + 1 }, (_, i) => format(addDays(parseISO(hoy), -i), "yyyy-MM-dd"));
  const etiqueta = (f: string, i: number) => (i === 0 ? "Hoy" : i === 1 ? "Ayer" : format(parseISO(f), "EEEE d", { locale: es }));
  const alternar = (id: number, si: boolean) => setElegidos((prev) => (si ? [...prev, id] : prev.filter((x) => x !== id)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg"><Users className="size-5" /> Rezamos juntos</CardTitle>
        <CardDescription>Registrá la oración en familia para todos los presentes de una vez. También sirve para cargar días recientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field>
              <FieldLabel>Oración</FieldLabel>
              <ToggleGroup type="single" variant="outline" value={habito} onValueChange={(v) => v && setHabito(v as HabitoId)} className="w-full">
                {(["completorium", "rosario", "matutinum"] as HabitoId[]).map((h) => (
                  <ToggleGroupItem key={h} value={h} className="flex-1">{HABITOS[h].nombre}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="rezamos-fecha">Día</FieldLabel>
              <NativeSelect id="rezamos-fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} className="capitalize">
                {fechas.map((f, i) => <NativeSelectOption key={f} value={f}>{etiqueta(f, i)}</NativeSelectOption>)}
              </NativeSelect>
            </Field>
          </div>
          <Field>
            <FieldLabel>Presentes</FieldLabel>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {miembros.map((m) => (
                <Field key={m.id} orientation="horizontal" className="w-auto">
                  <Checkbox id={`presente-${m.id}`} checked={elegidos.includes(m.id)} onCheckedChange={(v) => alternar(m.id, v === true)} />
                  <FieldLabel htmlFor={`presente-${m.id}`} className="font-normal">{m.nombre}</FieldLabel>
                </Field>
              ))}
            </div>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end">
        <Button disabled={ocupado || elegidos.length === 0} onClick={() => onRegistrar({ habito, fecha, marca: "hecho", usuarioIds: elegidos })}>
          {ocupado ? <Spinner /> : <Check />} Registrar para {elegidos.length} {elegidos.length === 1 ? "persona" : "personas"}
        </Button>
      </CardFooter>
    </Card>
  );
}
