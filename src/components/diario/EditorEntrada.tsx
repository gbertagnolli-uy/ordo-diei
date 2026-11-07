"use client";
// Diario (lane 272): hoja para escribir o editar una entrada. UX basada en Demizo/Daily_You@7cc237d (lib/pages/edit_entry_page.dart).
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DIAS_ATRAS, MAX_FOTOS, MAX_TEXTO, MAX_TITULO, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { SelectorAnimo } from "./SelectorAnimo";

const restarDias = (fecha: string, n: number) => new Date(Date.parse(`${fecha}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

/** Se monta con una `key` nueva cada vez que se abre, así el estado inicial sale de las props. */
export function EditorEntrada({
  abierto,
  tipo,
  entrada,
  fecha,
  hoy,
  onGuardado,
  onCerrar,
}: {
  abierto: boolean;
  tipo: TipoDiario;
  entrada?: EntradaVista;
  fecha: string;
  hoy: string;
  onGuardado: () => void;
  onCerrar: () => void;
}) {
  const [animo, setAnimo] = useState<number | null>(entrada?.animo ?? null);
  const [titulo, setTitulo] = useState(entrada?.titulo ?? "");
  const [texto, setTexto] = useState(entrada?.texto ?? "");
  const [fotos, setFotos] = useState<string[]>(entrada?.fotos ?? []);
  const [dia, setDia] = useState(entrada?.fecha ?? fecha);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setSubiendo(true);
    try {
      const nuevas: string[] = [];
      for (const f of Array.from(archivos).slice(0, MAX_FOTOS - fotos.length)) {
        const form = new FormData();
        form.append("file", f);
        const r = await fetch("/api/upload", { method: "POST", body: form });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo subir la foto");
        nuevas.push(d.url);
      }
      setFotos((x) => [...x, ...nuevas]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    try {
      const cuerpo = { tipo, fecha: dia, titulo, texto, animo, fotos };
      const r = await fetch(entrada ? `/api/diario/${entrada.id}` : "/api/diario", {
        method: entrada ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar");
      toast.success(entrada ? "Entrada actualizada" : "Entrada guardada");
      onGuardado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{entrada ? "Editar entrada" : "Nueva entrada"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <SelectorAnimo valor={animo} onCambio={setAnimo} />
          <label className="flex flex-col gap-1 text-sm">
            Fecha
            <Input type="date" value={dia} min={restarDias(hoy, MAX_DIAS_ATRAS)} max={hoy} onChange={(e) => setDia(e.target.value)} />
          </label>
          <Input placeholder="Título (opcional)" value={titulo} maxLength={MAX_TITULO} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea placeholder="¿Qué pasó hoy?" value={texto} maxLength={MAX_TEXTO} rows={8} onChange={(e) => setTexto(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {fotos.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload */}
                <img src={url} alt="" className="size-20 rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => setFotos((x) => x.filter((u) => u !== url))}
                  className="absolute -top-2 -right-2 rounded-full bg-background p-0.5 shadow"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {fotos.length < MAX_FOTOS && (
              <label className="flex size-20 cursor-pointer items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted">
                <ImagePlus aria-hidden />
                <span className="sr-only">Agregar foto</span>
                <input type="file" accept="image/*" multiple className="hidden" disabled={subiendo} onChange={(e) => void subir(e.target.files)} />
              </label>
            )}
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={() => void guardar()} disabled={guardando || subiendo || !texto.trim()}>
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
