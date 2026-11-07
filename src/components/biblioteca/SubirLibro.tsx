"use client";
// Portado de vendor/homebranch-web/src/entities/book/ui/{AddBookButton,UploadProgressDialog,useBookUpload}.ts(x)
// (lane 270, fase 2): elegir varios archivos, subirlos de a uno con su estado (pendiente, subiendo, agregado,
// falló) y reintentar los que fallaron. Cada archivo es un libro: /api/upload (modo estudio, ≤ 4 MB) y después
// POST /api/biblioteca/libros. Audiolibros, carpetas y archivos grandes esperan a LANE_277 (D1).
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { esAudio, formatoDe } from "@/lib/biblioteca/reglas";

type Estado = "pendiente" | "subiendo" | "agregado" | "fallo";
type Fila = { nombre: string; estado: Estado; error?: string };

const MAX_BYTES = 4 * 1024 * 1024;
const ACEPTA = ".epub,.pdf,.mobi,.azw,.azw3,.cbz,.cbr,.fb2";

const tituloDe = (nombre: string) => nombre.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim() || nombre;

async function subirUno(archivo: File) {
  const formato = formatoDe(archivo.name, archivo.type);
  if (!formato || esAudio(formato)) throw new Error("Formato no admitido (ePub, PDF, MOBI, AZW, AZW3, CBZ, CBR o FB2)");
  if (archivo.size > MAX_BYTES) throw new Error("El archivo supera los 4 MB");
  const form = new FormData();
  form.append("modo", "estudio");
  form.append("file", archivo);
  const sub = await fetch("/api/upload", { method: "POST", body: form });
  const subida = await sub.json().catch(() => ({}));
  if (!sub.ok || !subida.url) throw new Error(subida.error || "No se pudo subir el archivo");
  const res = await fetch("/api/biblioteca/libros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      titulo: tituloDe(archivo.name),
      nombreArchivo: archivo.name,
      archivos: [{ url: subida.url, formato, bytes: archivo.size }],
    }),
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error || "No se pudo agregar el libro");
}

function InsigniaEstado({ estado }: { estado: Estado }) {
  if (estado === "pendiente") return <Badge variant="secondary">Pendiente</Badge>;
  if (estado === "subiendo")
    return (
      <span className="flex items-center gap-1">
        <Spinner className="size-3" />
        <Badge variant="outline">Subiendo</Badge>
      </span>
    );
  if (estado === "agregado") return <Badge>Agregado</Badge>;
  return <Badge variant="destructive">Falló</Badge>;
}

export function SubirLibro() {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const archivos = useRef<File[]>([]);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const poner = (i: number, cambio: Partial<Fila>) => setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, ...cambio } : f)));

  async function correr(indices: number[]) {
    setSubiendo(true);
    setAbierto(true);
    for (const i of indices) poner(i, { estado: "pendiente", error: undefined });
    for (const i of indices) {
      poner(i, { estado: "subiendo" });
      try {
        await subirUno(archivos.current[i]);
        poner(i, { estado: "agregado" });
      } catch (e) {
        poner(i, { estado: "fallo", error: e instanceof Error ? e.message : "Falló la subida" });
      }
    }
    setSubiendo(false);
    router.refresh();
  }

  function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const lista = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!lista.length || subiendo) return;
    archivos.current = lista;
    setFilas(lista.map((f) => ({ nombre: f.name, estado: "pendiente" })));
    void correr(lista.map((_, i) => i));
  }

  const hechos = filas.filter((f) => f.estado === "agregado" || f.estado === "fallo").length;
  const agregados = filas.filter((f) => f.estado === "agregado").length;
  const fallidos = filas.flatMap((f, i) => (f.estado === "fallo" ? [i] : []));

  return (
    <>
      <input ref={entrada} type="file" accept={ACEPTA} multiple className="hidden" onChange={elegir} />
      <Button className="min-h-11" disabled={subiendo} onClick={() => entrada.current?.click()}>
        <Plus /> Agregar libros
      </Button>
      <Dialog open={abierto} onOpenChange={(o) => !subiendo && setAbierto(o)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" showCloseButton={!subiendo}>
          <DialogHeader>
            <DialogTitle>
              {subiendo
                ? `Subiendo ${filas.length} ${filas.length === 1 ? "libro" : "libros"}…`
                : fallidos.length
                  ? "La subida necesita atención"
                  : "Subida terminada"}
            </DialogTitle>
          </DialogHeader>
          <Progress value={filas.length ? (hechos / filas.length) * 100 : 0} aria-label="Libros procesados" />
          <p role="status" aria-live="polite" className="text-sm">
            {hechos} de {filas.length} procesados{subiendo ? ". Dejá esta ventana abierta mientras se suben." : "."}
          </p>
          <ul className="flex flex-col gap-2">
            {filas.map((f, i) => (
              <li key={`${f.nombre}-${i}`} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-sm">{f.nombre}</span>
                  <InsigniaEstado estado={f.estado} />
                </div>
                {f.estado === "fallo" && f.error && <p className="text-xs text-destructive">{f.error}</p>}
              </li>
            ))}
          </ul>
          {!subiendo && (
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {agregados > 0 && <p className="text-sm">{agregados === 1 ? "Se agregó 1 libro." : `Se agregaron ${agregados} libros.`}</p>}
              {fallidos.length > 0 && (
                <>
                  <p className="text-sm text-destructive">
                    {fallidos.length === 1 ? "1 libro no se pudo subir." : `${fallidos.length} libros no se pudieron subir.`} Los que se agregaron quedan.
                  </p>
                  <Button variant="outline" className="min-h-11" onClick={() => void correr(fallidos)}>
                    Reintentar los que fallaron
                  </Button>
                </>
              )}
              <Button className="min-h-11 self-end" onClick={() => setAbierto(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
