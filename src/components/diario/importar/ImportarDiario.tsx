"use client";
// Diario (lane 292): importar entradas de un respaldo. Portado de vendor/Daily_You/lib/pages/settings/backup_restore_settings.dart + utils/imports/import_registry.dart
// (Demizo/Daily_You@7cc237d) y de vendor/moodiary/.../presentation/markdown_import_page.dart (ZhuJHua/moodiary@2c552dd): elegir el archivo, ver qué trae y confirmar.
import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { MAX_BYTES_ARCHIVO_IMPORTAR, abrirArchivo, leerArchivos, resumirPaquete, type ResumenImport } from "@/lib/diario/importar/detectar";
import { NOMBRES_FORMATO, ImportacionError, type Archivos, type PaqueteImport } from "@/lib/diario/importar/tipos";
import type { TipoDiario } from "@/lib/diario/reglas";
import { toast } from "@/lib/toast";
import { ejecutarImportacion, type InformeImport, type Progreso } from "./ejecutar";

const FASES = { catalogo: "Preparando etiquetas y categorías", fotos: "Subiendo fotos", entradas: "Escribiendo entradas" } as const;

type Estado =
  | { paso: "elegir" }
  | { paso: "revisar"; nombre: string; paquete: PaqueteImport; archivos: Archivos; resumen: ResumenImport }
  | { paso: "importando"; progreso: Progreso | null }
  | { paso: "listo"; informe: InformeImport };

const fechaCorta = (f: string | null) => (f ? f.split("-").reverse().join("/") : "—");

export function ImportarDiario({ tipo, onTerminado, onCerrar }: { tipo: TipoDiario; onTerminado: () => void; onCerrar: () => void }) {
  const [estado, setEstado] = useState<Estado>({ paso: "elegir" });
  const [error, setError] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const cancelar = useRef(false);
  const entrada = useRef<HTMLInputElement>(null);

  async function elegir(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES_ARCHIVO_IMPORTAR) {
      setError(`El archivo pesa ${Math.round(file.size / 1048576)} MB y el máximo es ${MAX_BYTES_ARCHIVO_IMPORTAR / 1048576} MB`);
      return;
    }
    setLeyendo(true);
    try {
      const archivos = abrirArchivo(file.name, new Uint8Array(await file.arrayBuffer()));
      const paquete = leerArchivos(archivos);
      setEstado({ paso: "revisar", nombre: file.name, paquete, archivos, resumen: resumirPaquete(paquete) });
    } catch (e) {
      setError(e instanceof ImportacionError || e instanceof Error ? e.message : "No se pudo leer el archivo");
    } finally {
      setLeyendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function importar(paquete: PaqueteImport, archivos: Archivos) {
    cancelar.current = false;
    setEstado({ paso: "importando", progreso: null });
    try {
      const informe = await ejecutarImportacion(tipo, paquete, archivos, (progreso) => setEstado({ paso: "importando", progreso }), () => cancelar.current);
      setEstado({ paso: "listo", informe });
      if (informe.creadas > 0) onTerminado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo importar");
      setEstado({ paso: "elegir" });
    }
  }

  const ocupado = estado.paso === "importando";
  return (
    <Dialog open onOpenChange={(abierto) => !abierto && !ocupado && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar al diario</DialogTitle>
          <DialogDescription>{tipo === "personal" ? "Las entradas quedan en tu diario personal." : "Las entradas quedan en el diario de la familia, a tu nombre."}</DialogDescription>
        </DialogHeader>

        {estado.paso === "elegir" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Se reconoce solo el formato: un respaldo de Ordo Diei (.json o .zip), Daily You, Daylio, Daybook, Diaro, MyBrain, OneShot, Pixels, o notas en Markdown (.md o un .zip con varias). Una entrada que ya está
              (misma fecha y hora) no se repite.
            </p>
            <input ref={entrada} type="file" accept=".json,.zip,.md,.markdown,application/json,application/zip" className="sr-only" id="importar-archivo" onChange={(e) => void elegir(e.target.files?.[0])} />
            <Button variant="outline" disabled={leyendo} onClick={() => entrada.current?.click()}>
              {leyendo ? <Loader2 className="animate-spin" /> : <FileUp />} Elegir archivo
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}

        {estado.paso === "revisar" && (
          <>
            <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
              <p className="font-medium break-all">{estado.nombre}</p>
              <p className="text-muted-foreground">Formato: {NOMBRES_FORMATO[estado.paquete.formato]}</p>
              <ul className="flex flex-col gap-1">
                <li>
                  <strong>{estado.resumen.entradas}</strong> entradas
                  {estado.resumen.desde && (
                    <span className="text-muted-foreground">
                      {" "}
                      · del {fechaCorta(estado.resumen.desde)} al {fechaCorta(estado.resumen.hasta)}
                    </span>
                  )}
                </li>
                {estado.resumen.etiquetas > 0 && <li>{estado.resumen.etiquetas} etiquetas y contadores</li>}
                {estado.resumen.categorias > 0 && <li>{estado.resumen.categorias} categorías</li>}
                {estado.resumen.conFotos > 0 && <li>{estado.resumen.conFotos} entradas con fotos</li>}
              </ul>
              {(estado.paquete.avisos.length > 0 || estado.paquete.fotosFaltantes > 0) && (
                <ul className="list-disc pl-5 text-xs text-muted-foreground">
                  {estado.paquete.avisos.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                  {estado.paquete.fotosFaltantes > 0 && <li>{estado.paquete.fotosFaltantes} fotos que el archivo nombra no estaban dentro.</li>}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEstado({ paso: "elegir" })}>
                Elegir otro
              </Button>
              <Button onClick={() => void importar(estado.paquete, estado.archivos)}>Importar {estado.resumen.entradas} entradas</Button>
            </DialogFooter>
          </>
        )}

        {estado.paso === "importando" && (
          <>
            <div className="flex flex-col gap-2" role="status" aria-live="polite">
              <p className="text-sm">{estado.progreso ? FASES[estado.progreso.fase] : "Empezando…"}</p>
              <Progress value={estado.progreso && estado.progreso.total > 0 ? (estado.progreso.hecho / estado.progreso.total) * 100 : 0} />
              {estado.progreso && (
                <p className="text-xs text-muted-foreground">
                  {estado.progreso.hecho} de {estado.progreso.total}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => (cancelar.current = true)}>
                Cancelar
              </Button>
            </DialogFooter>
          </>
        )}

        {estado.paso === "listo" && (
          <>
            <div className="flex flex-col gap-2 text-sm" role="status">
              <p className="font-medium">{estado.informe.cancelada ? "Importación cancelada" : "Importación lista"}</p>
              <ul className="flex flex-col gap-1">
                <li>
                  <strong>{estado.informe.creadas}</strong> entradas nuevas
                </li>
                {estado.informe.duplicadas > 0 && <li>{estado.informe.duplicadas} ya estaban</li>}
                {estado.informe.fotosSubidas > 0 && <li>{estado.informe.fotosSubidas} fotos subidas</li>}
                {estado.informe.rechazadas.length > 0 && <li className="text-destructive">{estado.informe.rechazadas.length} no se pudieron escribir</li>}
              </ul>
              {estado.informe.rechazadas.length > 0 && (
                <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-xs text-muted-foreground">
                  {estado.informe.rechazadas.slice(0, 20).map((r, i) => (
                    <li key={i}>
                      {r.titulo}: {r.motivo}
                    </li>
                  ))}
                  {estado.informe.rechazadas.length > 20 && <li>…y {estado.informe.rechazadas.length - 20} más</li>}
                </ul>
              )}
              {estado.informe.avisos.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-muted-foreground">
                  {estado.informe.avisos.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button onClick={onCerrar}>Cerrar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
