"use client";
// Diario (lane 291): exportar el diario. Portado de vendor/Daily_You/lib/pages/settings/backup_restore_settings.dart (Demizo/Daily_You@7cc237d)
// y de vendor/moodiary/packages/feature/moodiary_export/lib/src/presentation/ (ZhuJHua/moodiary@2c552dd): formato, alcance (todo, rango de fechas o categoría), con o sin fotos.
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { FORMATOS_EXPORT, type FormatoExport } from "@/lib/diario/exportar";
import { SIN_CATEGORIA } from "@/lib/diario/linea";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { Catalogo } from "@/lib/diario/servidor-catalogo";
import { toast } from "@/lib/toast";
import { opcionesDeCategoria } from "../linea/LineaDeTiempo";

/** El nombre que mandó el servidor en `Content-Disposition`. */
const nombreDe = (r: Response, defecto: string) => /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? defecto;

export function ExportarDiario({ tipo, catalogo, onCerrar }: { tipo: TipoDiario; catalogo: Catalogo | null; onCerrar: () => void }) {
  const [formato, setFormato] = useState<FormatoExport>("markdown");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fotos, setFotos] = useState(true);
  const [unir, setUnir] = useState(false);
  const [exportando, setExportando] = useState(false);
  const categorias = opcionesDeCategoria(catalogo);
  const invalido = !!desde && !!hasta && desde > hasta;

  async function exportar() {
    setExportando(true);
    try {
      const p = new URLSearchParams({ tipo, formato });
      if (desde) p.set("desde", desde);
      if (hasta) p.set("hasta", hasta);
      if (categoria) p.set("categoria", categoria);
      if (fotos) p.set("fotos", "1");
      if (formato === "markdown" && unir) p.set("unir", "1");
      const r = await fetch(`/api/diario/exportar?${p}`);
      if (!r.ok) throw new Error(((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? "No se pudo exportar");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreDe(r, `diario-${tipo}.${formato}`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.success("Exportación lista");
      onCerrar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo exportar");
    } finally {
      setExportando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(a) => !a && !exportando && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar el diario</DialogTitle>
          <DialogDescription>{tipo === "personal" ? "Se exportan solo tus entradas." : "Se exportan las entradas de toda la familia, con el nombre de quien las escribió."}</DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Formato</legend>
          {FORMATOS_EXPORT.map((f) => (
            <label key={f.valor} className="flex cursor-pointer items-start gap-2 rounded-lg border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="formato-exportar" className="mt-1" checked={formato === f.valor} onChange={() => setFormato(f.valor)} />
              <span className="flex flex-col">
                <span className="text-sm">{f.titulo}</span>
                <span className="text-xs text-muted-foreground">{f.detalle}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Qué entradas</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Desde
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-invalid={invalido} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Hasta
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-invalid={invalido} />
            </label>
          </div>
          {invalido && <p className="text-xs text-destructive">«Desde» no puede ser posterior a «hasta».</p>}
          {categorias.length > 0 && (
            <NativeSelect aria-label="Categoría" className="w-full" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas las categorías</option>
              <option value={SIN_CATEGORIA}>Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </NativeSelect>
          )}
          <p className="text-xs text-muted-foreground">Sin fechas ni categoría se exporta todo. Una categoría incluye sus subcategorías.</p>
        </div>

        <div className="flex flex-col gap-3 border-t pt-3">
          <label className="flex items-center gap-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm">Incluir las fotos y los archivos</span>
              <span className="text-xs text-muted-foreground">Se descarga un .zip con las carpetas «fotos» y «adjuntos» (notas de voz, audios, videos y documentos).</span>
            </span>
            <Switch checked={fotos} onCheckedChange={setFotos} aria-label="Incluir las fotos y los archivos" />
          </label>
          {formato === "markdown" && (
            <label className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm">Unir todo en un solo archivo</span>
                <span className="text-xs text-muted-foreground">Si no, es una nota por entrada (en un .zip).</span>
              </span>
              <Switch checked={unir} onCheckedChange={setUnir} aria-label="Unir todo en un solo archivo" />
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar} disabled={exportando}>
            Cancelar
          </Button>
          <Button onClick={exportar} disabled={exportando || invalido}>
            {exportando ? <Spinner /> : <Download />} Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
