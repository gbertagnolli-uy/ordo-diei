// Diario (lane 292): corre la importación en el navegador: catálogo, fotos y entradas por lotes (decisión I1).
// Es el `runImport` de vendor/Daily_You/lib/utils/imports/import_runner.dart (Demizo/Daily_You@7cc237d) con el servidor en lugar de la base local.
import type { TipoDiario } from "@/lib/diario/reglas";
import { catalogoDelPaquete } from "@/lib/diario/importar/catalogo";
import { extensionDe, nombreDe } from "@/lib/diario/importar/comun";
import { entradaALote, partirEnLotes, type EntradaLote, type ResultadoCatalogo, type ResultadoLote } from "@/lib/diario/importar/lote";
import type { Archivos, PaqueteImport } from "@/lib/diario/importar/tipos";
import { markdownADocumento } from "./markdown-a-doc";

const MAX_BYTES_FOTO = 4 * 1024 * 1024;
const EN_PARALELO = 3;
const TIPOS: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".heic": "image/heic", ".heif": "image/heif" };

export type Fase = "catalogo" | "fotos" | "entradas";

export interface Progreso {
  fase: Fase;
  hecho: number;
  total: number;
}

export interface InformeImport {
  creadas: number;
  duplicadas: number;
  rechazadas: { titulo: string; motivo: string }[];
  fotosSubidas: number;
  fotosOmitidas: number;
  avisos: string[];
  cancelada: boolean;
}

async function pedir<T>(cuerpo: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/diario/importar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof d.error === "string" ? d.error : "No se pudo importar");
  return d as T;
}

/** Sube una foto por /api/upload (la misma de las fotos de la entrada). Devuelve la URL, o el motivo si no se pudo. */
async function subirFoto(ruta: string, bytes: Uint8Array): Promise<{ url: string } | { motivo: string }> {
  const tipo = TIPOS[extensionDe(ruta)];
  if (!tipo) return { motivo: `${nombreDe(ruta)}: formato de imagen no soportado` };
  if (bytes.length > MAX_BYTES_FOTO) return { motivo: `${nombreDe(ruta)}: pesa más de 4 MB` };
  const form = new FormData();
  form.append("file", new File([bytes as BlobPart], nombreDe(ruta), { type: tipo }));
  try {
    const r = await fetch("/api/upload", { method: "POST", body: form });
    const d = await r.json().catch(() => ({}));
    return r.ok && typeof d.url === "string" ? { url: d.url } : { motivo: `${nombreDe(ruta)}: ${typeof d.error === "string" ? d.error : "no se pudo subir"}` };
  } catch {
    return { motivo: `${nombreDe(ruta)}: no se pudo subir` };
  }
}

export async function ejecutarImportacion(
  tipo: TipoDiario,
  paquete: PaqueteImport,
  archivos: Archivos,
  onProgreso: (p: Progreso) => void,
  cancelado: () => boolean,
): Promise<InformeImport> {
  const informe: InformeImport = { creadas: 0, duplicadas: 0, rechazadas: [], fotosSubidas: 0, fotosOmitidas: 0, avisos: [...paquete.avisos], cancelada: false };

  // 1 · Categorías de etiquetas, etiquetas y categorías
  onProgreso({ fase: "catalogo", hecho: 0, total: 1 });
  const cat = await pedir<ResultadoCatalogo>({ tipo, accion: "catalogo", catalogo: catalogoDelPaquete(paquete) });
  informe.avisos.push(...cat.avisos.map((a) => `No se pudo crear: ${a}`));
  onProgreso({ fase: "catalogo", hecho: 1, total: 1 });

  // 2 · Fotos, una vez cada una
  const rutas = [...new Set(paquete.entradas.flatMap((e) => [...e.fotos, ...e.imagenes]))];
  const urls = new Map<string, string | null>();
  const motivos = new Set<string>();
  let hechas = 0;
  onProgreso({ fase: "fotos", hecho: 0, total: rutas.length });
  for (let i = 0; i < rutas.length && !cancelado(); i += EN_PARALELO) {
    await Promise.all(
      rutas.slice(i, i + EN_PARALELO).map(async (ruta) => {
        const bytes = archivos.get(ruta);
        const r = bytes ? await subirFoto(ruta, bytes) : { motivo: `${nombreDe(ruta)}: no está en el archivo` };
        if ("url" in r) {
          urls.set(ruta, r.url);
          informe.fotosSubidas++;
        } else {
          urls.set(ruta, null);
          informe.fotosOmitidas++;
          motivos.add(r.motivo);
        }
        onProgreso({ fase: "fotos", hecho: ++hechas, total: rutas.length });
      }),
    );
  }
  if (motivos.size) informe.avisos.push(`Fotos que no se importaron: ${[...motivos].slice(0, 5).join("; ")}${motivos.size > 5 ? "…" : ""}`);
  if (cancelado()) return { ...informe, cancelada: true };
  if (paquete.fotosFaltantes) informe.avisos.push(`${paquete.fotosFaltantes} fotos que el archivo nombra no estaban dentro`);

  // 3 · Entradas, por lotes
  const lote = paquete.entradas.map((e) => ({ e, l: entradaALote(e, urls, markdownADocumento) }));
  const lotes = partirEnLotes(lote, (x) => JSON.stringify(x.l).length);
  let enviadas = 0;
  onProgreso({ fase: "entradas", hecho: 0, total: lote.length });
  for (const grupo of lotes) {
    if (cancelado()) return { ...informe, cancelada: true };
    const r = await pedir<ResultadoLote>({ tipo, accion: "entradas", entradas: grupo.map((x) => x.l satisfies EntradaLote) });
    informe.creadas += r.creadas;
    informe.duplicadas += r.duplicadas;
    for (const x of r.rechazadas) {
      const en = grupo[x.indice]?.e;
      informe.rechazadas.push({ titulo: en ? `${en.fecha ?? en.instante?.slice(0, 10) ?? "sin fecha"}${en.titulo ? ` · ${en.titulo}` : ""}` : "Entrada", motivo: x.motivo });
    }
    enviadas += grupo.length;
    onProgreso({ fase: "entradas", hecho: enviadas, total: lote.length });
  }
  return informe;
}
