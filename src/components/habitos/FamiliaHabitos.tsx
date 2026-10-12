"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ETAPAS } from "@/lib/habitos/catalogo";
import type { EstadoUsuario, HabitoVista } from "@/lib/habitos/server";
import { HabitoIcon } from "./HabitoIcon";
import { toast } from "@/lib/toast";

export interface Miembro {
  id: number;
  nombre: string;
  rolFamiliar: string;
  fotoUrl: string | null;
}

const DIAS_ATRAS = 7;

export function FamiliaHabitos({
  miembros,
  estados,
  catalogo,
  hoy,
  onAbrirAgregarPara,
}: {
  miembros: Miembro[];
  estados: EstadoUsuario[];
  catalogo: HabitoVista[];
  hoy: string;
  onAbrirAgregarPara: (miembroId: number) => void;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  // Oraciones del sistema para "Hicimos juntos"
  const oracionesJuntas = catalogo.filter(
    (h) => h.categoria === "oracion" && h.clave !== null
  );

  const [habitoSeleccionadoId, setHabitoSeleccionadoId] = useState<number>(
    oracionesJuntas.find((h) => h.clave === "completorium")?.id ?? oracionesJuntas[0]?.id ?? 0
  );
  const [fecha, setFecha] = useState(hoy);
  const [presentes, setPresentes] = useState<number[]>(miembros.map((m) => m.id));

  const togglePresente = (id: number) => {
    setPresentes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRegistrarJuntos = async () => {
    if (presentes.length === 0 || !habitoSeleccionadoId) return;
    setOcupado(true);
    try {
      const res = await fetch("/api/habitos/registro", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitoId: habitoSeleccionadoId,
          marca: "hecho",
          fecha,
          usuarioIds: presentes,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Error al registrar en familia");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setOcupado(false);
    }
  };

  const fechasValidas = Array.from({ length: DIAS_ATRAS + 1 }, (_, i) => {
    const f = format(addDays(parseISO(hoy), -i), "yyyy-MM-dd");
    return {
      valor: f,
      label: i === 0 ? "Hoy" : i === 1 ? "Ayer" : format(parseISO(f), "EEEE d 'de' MMMM", { locale: es }),
    };
  });

  const estadoDe = (id: number) => estados.find((e) => e.usuarioId === id);

  return (
    <div className="space-y-6">
      {/* Tarjeta: Hicimos juntos */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Hicimos juntos</CardTitle>
          <CardDescription>
            Registrá la oración o práctica compartida para toda la familia en un solo toque.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>¿Qué rezamos o hicimos juntos?</FieldLabel>
              <ToggleGroup
                type="single"
                value={String(habitoSeleccionadoId)}
                onValueChange={(val) => val && setHabitoSeleccionadoId(Number(val))}
                className="flex-wrap justify-start gap-1.5"
              >
                {oracionesJuntas.map((h) => (
                  <ToggleGroupItem key={h.id} value={String(h.id)} size="sm" className="gap-1.5">
                    <HabitoIcon name={h.icono} className="size-3.5" />
                    <span>{h.nombre}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Fecha</FieldLabel>
              <div className="w-full sm:w-64">
                <NativeSelect value={fecha} onChange={(e) => setFecha(e.target.value)}>
                  {fechasValidas.map((f) => (
                    <NativeSelectOption key={f.valor} value={f.valor}>
                      {f.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </Field>

            <Field>
              <FieldLabel>Presentes ({presentes.length} de {miembros.length})</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {miembros.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={presentes.includes(m.id)}
                      onCheckedChange={() => togglePresente(m.id)}
                    />
                    <span className="truncate">{m.nombre}</span>
                  </label>
                ))}
              </div>
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter className="justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Registra como hecho en la fecha seleccionada para los presentes.
          </div>
          <Button
            disabled={ocupado || presentes.length === 0}
            onClick={handleRegistrarJuntos}
          >
            {ocupado ? <Spinner /> : <Users className="size-4" />} Registrar para todos
          </Button>
        </CardFooter>
      </Card>

      {/* Tabla por miembro */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Hábitos de la familia</CardTitle>
          <CardDescription>
            Seguimiento de cada miembro: hábitos activos, progreso de hoy y etapas alcanzadas.
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Miembro</TableHead>
                <TableHead>Hábitos activos</TableHead>
                <TableHead>Hoy (cumplidos / programados)</TableHead>
                <TableHead>Etapas</TableHead>
                <TableHead className="text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {miembros.map((m) => {
                const est = estadoDe(m.id);
                const habitos = est?.habitos || [];
                const programadosHoy = habitos.filter((h) => h.programadoHoy);
                const hechosHoy = programadosHoy.filter((h) => h.hoy === "hecho");

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

                    <TableCell>
                      <span className="font-semibold tabular-nums">{habitos.length}</span>{" "}
                      <span className="text-muted-foreground text-xs">hábitos</span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-medium">
                          {hechosHoy.length} de {programadosHoy.length}
                        </span>
                        {programadosHoy.length > 0 && hechosHoy.length === programadosHoy.length && (
                          <Badge variant="secondary" className="gap-1 text-[11px] bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success)]">
                            <Check className="size-3" /> Todo listo
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {habitos.slice(0, 3).map((h) => (
                          <Badge key={h.habitoId} variant="outline" className="text-[10px] py-0">
                            {h.nombre.split(" ")[0]}: {ETAPAS[h.etapa]}
                          </Badge>
                        ))}
                        {habitos.length > 3 && (
                          <span className="text-[11px] text-muted-foreground self-center">
                            +{habitos.length - 3} más
                          </span>
                        )}
                        {habitos.length === 0 && (
                          <span className="text-xs text-muted-foreground">Sin hábitos</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onAbrirAgregarPara(m.id)}
                      >
                        <Plus className="size-3.5" /> Agregar hábito
                      </Button>
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
