"use client";

// Partes de la tarjeta de "Leer un libro" (vault/HABITO_LIBRO.md): progreso del libro y selector de páginas.
import { useState } from "react";
import { Check, Gift, Minus, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { MAX_PAGINAS_DIA, MAX_PAGINAS_LIBRO } from "@/lib/habitos/catalogo";
import type { EstadoHabito } from "@/lib/habitos/server";

export type DatosLibro = { titulo: string; paginas: number };

/** Libro en curso con su barra de progreso, o aviso para cargar el próximo */
export function LibroProgreso({
  h,
  ocupado,
  onCargarLibro,
}: {
  h: EstadoHabito;
  ocupado: boolean;
  onCargarLibro: (datos: DatosLibro) => Promise<boolean>;
}) {
  const libro = h.libro;

  if (!libro) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed p-3 text-sm">
        {h.libroTerminado ? (
          <p className="flex items-start gap-2">
            <Gift className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Terminaste <strong>«{h.libroTerminado.titulo}»</strong>. Pedí tu libro nuevo en{" "}
              <Link href="/dashboard/mis-premios" className="font-medium text-primary underline-offset-4 hover:underline">
                Mis premios
              </Link>
              .
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">Todavía no cargaste qué libro estás leyendo.</p>
        )}
        <LibroForm ocupado={ocupado} onGuardar={onCargarLibro}>
          <Button size="sm" variant="outline" className="w-full">
            <Plus className="size-4" /> {h.libroTerminado ? "Empezar otro libro" : "Cargar libro"}
          </Button>
        </LibroForm>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium" title={libro.titulo}>
          {libro.titulo}
        </p>
        <LibroForm inicial={libro} ocupado={ocupado} onGuardar={onCargarLibro}>
          <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Corregir libro">
            <Pencil className="size-3.5" />
          </Button>
        </LibroForm>
      </div>
      <Progress value={libro.pct} aria-label="Páginas leídas del libro" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="tabular-nums">
          {Math.min(libro.leidas, libro.paginas)} de {libro.paginas} páginas
        </span>
        <span className="tabular-nums font-medium text-foreground">{libro.pct} %</span>
      </div>
    </div>
  );
}

/** Popover con nombre y páginas del libro: carga uno nuevo o corrige el que está en curso */
function LibroForm({
  inicial,
  ocupado,
  onGuardar,
  children,
}: {
  inicial?: DatosLibro;
  ocupado: boolean;
  onGuardar: (datos: DatosLibro) => Promise<boolean>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [paginas, setPaginas] = useState("");

  const n = Number(paginas);
  const valido = titulo.trim().length > 0 && Number.isInteger(n) && n >= 1 && n <= MAX_PAGINAS_LIBRO;

  const guardar = async () => {
    if (!valido) return;
    if (await onGuardar({ titulo: titulo.trim(), paginas: n })) setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setTitulo(inicial?.titulo ?? "");
          setPaginas(inicial ? String(inicial.paginas) : "");
        }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="end">
        <h4 className="text-sm font-medium">{inicial ? "Corregir libro" : "¿Qué libro vas a leer?"}</h4>
        <div className="space-y-1">
          <Label htmlFor="libro-form-titulo" className="text-xs">Nombre del libro</Label>
          <Input
            id="libro-form-titulo"
            value={titulo}
            maxLength={200}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. El principito"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="libro-form-paginas" className="text-xs">Cantidad de páginas</Label>
          <Input
            id="libro-form-paginas"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PAGINAS_LIBRO}
            value={paginas}
            onChange={(e) => setPaginas(e.target.value)}
            placeholder="Ej. 96"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button size="xs" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button size="xs" disabled={!valido || ocupado} onClick={guardar}>
            {ocupado ? <Spinner /> : <Check className="size-3.5" />} Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Botón "Hecho" que primero pregunta cuántas páginas se leyeron */
export function PaginasHecho({
  meta,
  ocupado,
  onConfirmar,
}: {
  meta: number;
  ocupado: boolean;
  onConfirmar: (paginas: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [paginas, setPaginas] = useState(meta);

  const ajustar = (n: number) => setPaginas(Math.min(MAX_PAGINAS_DIA, Math.max(1, n)));

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setPaginas(meta);
      }}
    >
      <PopoverTrigger asChild>
        <Button className="flex-1" disabled={ocupado}>
          {ocupado ? <Spinner /> : <Check className="size-4" />} Hecho
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">¿Cuántas páginas leíste?</h4>
          <p className="text-xs text-muted-foreground">Tu meta de hoy: {meta} páginas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Una página menos"
            disabled={paginas <= 1}
            onClick={() => ajustar(paginas - 1)}
          >
            <Minus className="size-4" />
          </Button>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PAGINAS_DIA}
            value={paginas}
            onChange={(e) => ajustar(Math.floor(Number(e.target.value) || 1))}
            className="text-center text-lg font-semibold tabular-nums"
            aria-label="Páginas leídas"
          />
          <Button variant="outline" size="icon" aria-label="Una página más" onClick={() => ajustar(paginas + 1)}>
            <Plus className="size-4" />
          </Button>
        </div>
        <Button
          className="w-full"
          disabled={ocupado}
          onClick={() => {
            setOpen(false);
            onConfirmar(paginas);
          }}
        >
          <Check className="size-4" /> Guardar {paginas} {paginas === 1 ? "página" : "páginas"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
