"use client";

import { useState } from "react";
import { Check, ChevronDown, Clock, MoreHorizontal, Undo2, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { CLAVE_LIBRO, ETAPAS, type Marca } from "@/lib/habitos/catalogo";
import type { EstadoHabito } from "@/lib/habitos/server";
import { HabitoIcon } from "./HabitoIcon";
import { LibroProgreso, PaginasHecho, type DatosLibro } from "./LibroLectura";

const pct = (n: number) => `${Math.round(n * 100)} %`;

export function HabitoCard({
  h,
  misterios,
  ocupado,
  puedeEditar,
  onRegistrar,
  onAjustar,
  onDejarDePracticar,
  onEditar,
  onArchivar,
  onCargarLibro,
}: {
  h: EstadoHabito;
  misterios: readonly string[];
  ocupado: boolean;
  puedeEditar: boolean;
  onRegistrar: (
    habitoId: number,
    marca: Marca | null,
    nota?: string,
    paginas?: number
  ) => Promise<{ puntos: number; xp: number; pendiente?: boolean } | void>;
  onAjustar?: (habito: EstadoHabito) => void;
  onDejarDePracticar?: (habitoId: number) => void;
  onEditar?: (habito: EstadoHabito) => void;
  onArchivar?: (habitoId: number) => void;
  onCargarLibro?: (habitoId: number, datos: DatosLibro) => Promise<boolean>;
}) {
  const [recompensaFlotante, setRecompensaFlotante] = useState<{ puntos: number; xp: number; pendiente?: boolean } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<"justificado" | "no" | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [notaOpcional, setNotaOpcional] = useState("");

  const hecho = h.hoy === "hecho";
  const justificado = h.hoy === "justificado";
  const noHecho = h.hoy === "no";
  const meta = h.pasoActual.diasParaSubir;
  const muestraIdentidad = h.etapa === "consolidacion" || h.etapa === "firme";
  const esLibro = h.clave === CLAVE_LIBRO;

  const handleMarcar = async (marca: Marca | null, nota?: string, paginas?: number) => {
    setPopoverOpen(false);
    const res = await onRegistrar(h.habitoId, marca, nota, paginas);
    if (res && marca === "hecho") {
      setRecompensaFlotante(res);
      setTimeout(() => setRecompensaFlotante(null), 3500);
    }
  };

  const abrirNotaPopover = (tipo: "justificado" | "no", texto: string) => {
    setMotivoSeleccionado(tipo);
    setMotivoTexto(texto);
    setNotaOpcional("");
    setPopoverOpen(true);
  };

  const confirmarConNota = () => {
    if (!motivoSeleccionado) return;
    const notaFinal = notaOpcional.trim() ? `${motivoTexto}: ${notaOpcional.trim()}` : motivoTexto;
    handleMarcar(motivoSeleccionado, notaFinal);
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all duration-200",
        !h.programadoHoy && "opacity-60 bg-muted/20 border-dashed",
        hecho && "border-[color-mix(in_srgb,var(--success)_40%,transparent)] shadow-xs",
        (justificado || noHecho) && "border-muted"
      )}
    >
      {/* Toast flotante de recompensas */}
      {recompensaFlotante && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute -top-3 right-4 z-10 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
          {recompensaFlotante.pendiente
            ? "Esperando aprobación"
            : h.categoria === "oracion"
            ? `+${recompensaFlotante.xp} XP`
            : `+${recompensaFlotante.puntos} pts · +${recompensaFlotante.xp} XP`}
        </div>
      )}

      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground">
            <HabitoIcon name={h.icono} className="size-4" />
          </div>
          <CardDescription className="truncate">
            Después de {h.ancla}
          </CardDescription>
        </div>

        <div>
          <CardTitle className="font-heading text-xl">{h.nombre}</CardTitle>
          {muestraIdentidad && (
            <p className="mt-1 text-xs italic text-muted-foreground">{h.identidad}</p>
          )}
        </div>

        <CardAction className="flex items-center gap-1.5">
          {!h.aprobado ? (
            <Badge variant="outline" className="text-muted-foreground">Esperando aprobación</Badge>
          ) : !h.programadoHoy ? (
            <Badge variant="outline" className="text-muted-foreground">Hoy libre</Badge>
          ) : (
            <Badge variant={h.etapa === "retomando" ? "outline" : "secondary"}>
              {ETAPAS[h.etapa]}
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Opciones del hábito">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onAjustar && (
                <DropdownMenuItem onClick={() => onAjustar(h)}>
                  Ajustar días y receta
                </DropdownMenuItem>
              )}
              {onDejarDePracticar && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`¿Dejar de practicar ${h.nombre}? Tu progreso quedará guardado.`)) {
                      onDejarDePracticar(h.habitoId);
                    }
                  }}
                >
                  Dejar de practicar
                </DropdownMenuItem>
              )}
              {puedeEditar && (
                <>
                  <DropdownMenuSeparator />
                  {onEditar && (
                    <DropdownMenuItem onClick={() => onEditar(h)}>
                      Editar hábito
                    </DropdownMenuItem>
                  )}
                  {onArchivar && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`¿Archivar el hábito ${h.nombre}? Nadie en la familia podrá adoptarlo.`)) {
                          onArchivar(h.habitoId);
                        }
                      }}
                    >
                      Archivar hábito
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tu receta de hoy</p>
          <p className="font-heading text-lg font-semibold text-primary">{h.pasoActual.titulo}</p>
          {h.pasoActual.misterios > 0 && (
            <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground">
              {misterios.slice(0, h.pasoActual.misterios).map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          )}
        </div>

        {esLibro && onCargarLibro && (
          <LibroProgreso h={h} ocupado={ocupado} onCargarLibro={(datos) => onCargarLibro(h.habitoId, datos)} />
        )}

        <div className="mt-auto space-y-3 text-sm">
          {meta !== null && !h.completo && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Días seguidos para el próximo paso</span>
                <span className="tabular-nums font-medium">{h.seguidos}/{meta}</span>
              </div>
              <Progress value={(h.seguidos / meta) * 100} />
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Constancia</span>
            <span className="tabular-nums font-medium text-foreground">{pct(h.constancia)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        {!h.aprobado ? (
          <span className="flex flex-1 items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" /> Un padre tiene que aprobar que empieces este hábito.
          </span>
        ) : h.hoy ? (
          <>
            <span
              className={cn(
                "flex flex-1 items-center gap-1.5 text-sm font-medium",
                hecho && "text-[var(--success)]",
                justificado && "text-muted-foreground",
                noHecho && "text-destructive"
              )}
            >
              {hecho && <Check className="size-4" />}
              {justificado && <AlertCircle className="size-4" />}
              {noHecho && <X className="size-4" />}
              {hecho
                ? esLibro && h.paginasHoy
                  ? `Hecho hoy · ${h.paginasHoy} ${h.paginasHoy === 1 ? "página" : "páginas"}`
                  : "Hecho hoy"
                + (h.hoyPendiente ? " · esperando aprobación" : "")
                : justificado
                ? "Omitido hoy"
                : "No realizado"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={ocupado}
              onClick={() => handleMarcar(null)}
            >
              {ocupado ? <Spinner /> : <Undo2 className="size-4" />} Deshacer
            </Button>
          </>
        ) : (
          <>
            {esLibro ? (
              <PaginasHecho
                meta={h.pasoActual.meta ?? 1}
                ocupado={ocupado}
                onConfirmar={(paginas) => handleMarcar("hecho", undefined, paginas)}
              />
            ) : (
              <Button
                className="flex-1"
                disabled={ocupado}
                onClick={() => handleMarcar("hecho")}
              >
                {ocupado ? <Spinner /> : <Check className="size-4" />} Hecho
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={ocupado}>
                  No pude <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Omitir (justificado)</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => abrirNotaPopover("justificado", "Enfermedad")}>
                  Enfermedad
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => abrirNotaPopover("justificado", "Viaje")}>
                  Viaje
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>No lo hice</DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => abrirNotaPopover("no", "No lo hice")}
                >
                  No lo hice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Popover para nota opcional */}
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <span className="sr-only">Agregar nota</span>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-3" align="end">
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">
                    {motivoSeleccionado === "justificado" ? "Omitir día" : "Marcar como no realizado"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Motivo: <span className="font-semibold">{motivoTexto}</span>. Podés sumar una nota opcional:
                  </p>
                </div>
                <Textarea
                  placeholder="Nota u observación (opcional)..."
                  value={notaOpcional}
                  onChange={(e) => setNotaOpcional(e.target.value)}
                  className="text-xs resize-none"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button size="xs" variant="outline" onClick={() => setPopoverOpen(false)}>
                    Cancelar
                  </Button>
                  <Button size="xs" onClick={confirmarConNota}>
                    Confirmar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
