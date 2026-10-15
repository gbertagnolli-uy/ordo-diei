// Lecturas de los 15 misterios del Rosario, en latín, tomadas de la Vulgata Clementina (epub de Wikisource latín,
// «Vulgata Clementina», 1598; CC BY-SA 3.0 / GFDL). Genera src/data/liturgia/rosarium-lecturas.json (SPEC liturgia §10.8).
//   node scripts/liturgia/rosarium-lecturas.ts "<ruta al .epub>"      (requiere `unzip`)
// Las referencias salen de la lista de pasajes del texto «Mysteries for Rosary Meditation / Meditationes Rosarii» que
// aportó el usuario (2026-10-14); donde ese texto da un tramo muy largo (la Pasión entera, Hch 1,13–2,42…) se tomó el
// pasaje principal del misterio (marcado «recorte» abajo). El texto no se escribe a mano: sale del epub.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ARCHIVO_EPUB, leerLibroEpub } from "../reposo/verificar-vulgata-epub.ts";
import { LIBROS } from "../reposo/libros.ts";

type Pasaje = [libro: string, capitulo: number, desde: number, hasta: number];
export type LecturaMisterio = { ref: string; libro: string; capitulo: number; desde: number; hasta: number; la: string };
export type GrupoLecturas = "gaudiosa" | "dolorosa" | "gloriosa";

/** grupo → misterio I..V → pasajes (en el orden en que se muestran). */
export const PASAJES: Record<GrupoLecturas, Pasaje[][]> = {
  gaudiosa: [
    [["Lc", 1, 26, 38]], // Anunciación (Mt 1,18 y Lc 1,26-38)
    [["Lc", 1, 39, 45]], // Visitación: el texto da solo Lc 1,39; se completa hasta el saludo de Isabel (recorte)
    [["Lc", 2, 6, 19]], // Natividad
    [["Lc", 2, 21, 39]], // Presentación
    [["Lc", 2, 41, 51]], // Niño perdido y hallado
  ],
  dolorosa: [
    [["Mt", 26, 36, 46]], // Agonía en el Huerto (el texto da Mt 26,36-57: recorte)
    [["Mt", 27, 26, 26], ["Jo", 19, 1, 1]], // Flagelación
    [["Mt", 27, 27, 31], ["Jo", 19, 2, 3]], // Coronación de espinas (el texto da Mt 27,22-31: recorte)
    [["Jo", 19, 16, 17], ["Lc", 23, 26, 31]], // Cruz a cuestas
    [["Jo", 19, 25, 30]], // Crucifixión (el texto da toda la Pasión: recorte)
  ],
  gloriosa: [
    [["Mt", 28, 1, 10]], // Resurrección
    [["Lc", 24, 50, 53], ["Act", 1, 9, 11]], // Ascensión (el texto da Act 1,5-11: recorte)
    [["Act", 2, 1, 4]], // Pentecostés (el texto da Act 1,13–2,42: recorte)
    [["Ct", 2, 10, 10], ["Ps", 44, 10, 12], ["Ps", 131, 8, 8]], // Asunción
    [["Apc", 12, 1, 1]], // Coronación (el texto da Apc 11,19–12,1)
  ],
};

export function referencia([libro, cap, d, h]: Pasaje): string {
  const nombre = LIBROS.find((l) => l.codigo === libro)?.nombre ?? libro;
  return `${nombre} ${cap}, ${d === h ? d : `${d}-${h}`}`;
}

// El epub marca quién habla con «&lt;Sponsus&gt;»: no es parte del texto sagrado y se quita.
const arreglarPuntuacion = (s: string) =>
  s.replace(/&lt;[^&]*&gt;/g, " ").replace(/&quot;/g, '"').replace(/\s+([;:?!,.])/g, "$1").replace(/\s+/g, " ").trim();

function main() {
  const epub = process.argv[2];
  if (!epub) throw new Error("Uso: node scripts/liturgia/rosarium-lecturas.ts <vulgata.epub>");
  const libros = new Map<string, Map<number, Map<number, string>>>();
  const libro = (cod: string) => {
    if (!libros.has(cod)) {
      const f = ARCHIVO_EPUB[cod];
      if (!f) throw new Error(`Sin mapeo al epub para ${cod}`);
      libros.set(cod, leerLibroEpub(execFileSync("unzip", ["-p", epub, `OPS/${f}.xhtml`], { encoding: "utf8", maxBuffer: 64 << 20 })));
    }
    return libros.get(cod)!;
  };

  const salida: Record<string, unknown> = {
    fuente: "Vulgata Clementina (1598), edición de Wikisource latín (CC BY-SA 3.0 / GFDL), numeración de la Vulgata",
  };
  for (const grupo of Object.keys(PASAJES) as GrupoLecturas[]) {
    salida[grupo] = PASAJES[grupo].map((pasajes, i) => ({
      numero: i + 1,
      lecturas: pasajes.map((p): LecturaMisterio => {
        const [cod, cap, d, h] = p;
        const vers: string[] = [];
        for (let v = d; v <= h; v++) {
          const t = libro(cod).get(cap)?.get(v);
          if (!t) throw new Error(`Falta ${cod} ${cap},${v} en el epub`);
          vers.push(t);
        }
        return { ref: referencia(p), libro: cod, capitulo: cap, desde: d, hasta: h, la: arreglarPuntuacion(vers.join(" ")) };
      }),
    }));
  }
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const dir = join(raiz, "src", "data", "liturgia");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "rosarium-lecturas.json"), JSON.stringify(salida, null, 1) + "\n");
  console.log("✓ src/data/liturgia/rosarium-lecturas.json");
}

if (process.argv[1]?.endsWith("liturgia/rosarium-lecturas.ts")) main();
