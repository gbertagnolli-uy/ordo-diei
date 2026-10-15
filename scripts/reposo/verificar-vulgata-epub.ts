// Verificación cruzada del latín de las citas del reposo contra una segunda edición de la Vulgata Clementina:
// el epub de Wikisource latín («Vulgata Clementina», 1598; CC BY-SA 3.0 / GFDL). Solo lee: no escribe datos.
//   node scripts/reposo/verificar-vulgata-epub.ts "<ruta al .epub>"      (requiere `unzip`)
// Compara, por cada cita, el latín de src/data/reposo/citas-biblicas.json (VulSearch/BibleGet) con el del epub,
// ignorando mayúsculas, tildes, puntuación y las variantes u/v, i/j, ae/æ.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Código de libro (el de `libros.ts`) → fragmento del nombre del archivo del epub (OPS/cNN_Vulgata_Clementina_<…>.xhtml). */
export const ARCHIVO_EPUB: Record<string, string> = {
  Gn: "c6_Vulgata_Clementina_Liber_Genesis", Ex: "c7_Vulgata_Clementina_Liber_Exodus", Dt: "c10_Vulgata_Clementina_Liber_Deuteronomii",
  Jos: "c11_Vulgata_Clementina_Liber_Josue", "1Rg": "c14_Vulgata_Clementina_Liber_I_Regum", Tob: "c22_Vulgata_Clementina_Liber_Tobiae",
  Job: "c25_Vulgata_Clementina_Liber_Job", Ps: "c26_Vulgata_Clementina_Liber_Psalmorum", Pr: "c27_Vulgata_Clementina_Liber_Proverbiorum",
  Ecl: "c28_Vulgata_Clementina_Liber_Ecclesiastes", Sap: "c30_Vulgata_Clementina_Liber_Sapientiae", Sir: "c31_Vulgata_Clementina_Liber_Ecclesiasticus",
  Is: "c32_Vulgata_Clementina_Prophetia_Isaiae", Jr: "c33_Vulgata_Clementina_Prophetia_Jeremiae", "2Mcc": "c51_Vulgata_Clementina_Liber_II_Machabaeorum",
  Mt: "c52_Vulgata_Clementina_Evangelium_Secundum_Matthaeum", Mc: "c53_Vulgata_Clementina_Evangelium_Secundum_Marcum",
  Lc: "c54_Vulgata_Clementina_Evangelium_Secundum_Lucam", Jo: "c55_Vulgata_Clementina_Evangelium_Secundum_Joannem",
  Act: "c56_Vulgata_Clementina_Acta_Apostolorum", Rom: "c57_Vulgata_Clementina_Pauli_Epistola_ad_Romanos",
  "1Cor": "c58_Vulgata_Clementina_Pauli_Epistola_ad_Corinthios_I", "2Cor": "c59_Vulgata_Clementina_Pauli_Epistola_ad_Corinthios_II",
  Gal: "c60_Vulgata_Clementina_Pauli_Epistola_ad_Galatas", Eph: "c61_Vulgata_Clementina_Pauli_Epistola_ad_Ephesios",
  Phlp: "c62_Vulgata_Clementina_Pauli_Epistola_ad_Philippenses", Col: "c63_Vulgata_Clementina_Pauli_Epistola_ad_Colossenses",
  "1Thes": "c64_Vulgata_Clementina_Pauli_Epistola_ad_Thessalonicenses_I", "2Thes": "c65_Vulgata_Clementina_Pauli_Epistola_ad_Thessalonicenses_II",
  "1Tim": "c66_Vulgata_Clementina_Pauli_Epistola_ad_Timotheum_I", "2Tim": "c67_Vulgata_Clementina_Pauli_Epistola_ad_Timotheum_II",
  Tit: "c68_Vulgata_Clementina_Pauli_Epistola_ad_Titum", Hbr: "c70_Vulgata_Clementina_Pauli_Epistola_ad_Hebraeos",
  Jac: "c71_Vulgata_Clementina_Jacobi_Epistola", "1Ptr": "c72_Vulgata_Clementina_Petri_Epistola_I", "1Jo": "c74_Vulgata_Clementina_Joannis_Epistola_I",
  Apc: "c78_Vulgata_Clementina_Apocalypsis",
};

export function normalizarLatin(s: string): string {
  return s
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/œ|\u009c/g, "oe")
    .replace(/j/g, "i").replace(/v/g, "u")
    .replace(/[^a-z]/g, "");
}

const sinEtiquetas = (h: string) =>
  h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim();

/** capítulo → (versículo → texto) a partir del xhtml de un libro del epub. */
export function leerLibroEpub(xhtml: string): Map<number, Map<number, string>> {
  const out = new Map<number, Map<number, string>>();
  const partes = xhtml.split(/<h2[^>]*>\s*Caput\s+(\d+)\s*<\/h2>/);
  for (let i = 1; i < partes.length; i += 2) {
    const vers = new Map<number, string>();
    const re = /<sup>\s*(\d+)\s*<\/sup>([\s\S]*?)(?=<sup>\s*\d+\s*<\/sup>|<\/p>|<\/section>)/g;
    for (const m of partes[i + 1].matchAll(re)) vers.set(Number(m[1]), sinEtiquetas(m[2]));
    out.set(Number(partes[i]), vers);
  }
  return out;
}

function main() {
  const epub = process.argv[2];
  if (!epub) throw new Error("Uso: node scripts/reposo/verificar-vulgata-epub.ts <vulgata.epub>");
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const citas = JSON.parse(readFileSync(join(raiz, "src", "data", "reposo", "citas-biblicas.json"), "utf8")) as {
    id: string; libro: string; capitulo: number; desde: number; hasta: number; la: string;
  }[];
  const libros = new Map<string, Map<number, Map<number, string>>>();
  const libro = (cod: string) => {
    if (!libros.has(cod)) {
      const f = ARCHIVO_EPUB[cod];
      if (!f) throw new Error(`Sin mapeo al epub para ${cod}`);
      libros.set(cod, leerLibroEpub(execFileSync("unzip", ["-p", epub, `OPS/${f}.xhtml`], { encoding: "utf8", maxBuffer: 64 << 20 })));
    }
    return libros.get(cod)!;
  };

  let iguales = 0;
  const distintas: string[] = [];
  for (const c of citas) {
    const vers = libro(c.libro).get(c.capitulo);
    const rango: string[] = [];
    for (let v = c.desde; v <= c.hasta; v++) rango.push(vers?.get(v) ?? "");
    const epubTxt = normalizarLatin(rango.join(" "));
    const nuestra = normalizarLatin(c.la);
    if (epubTxt === nuestra || epubTxt.includes(nuestra)) iguales++;
    else distintas.push(`${c.id}\n   app : ${c.la}\n   epub: ${rango.join(" ")}`);
  }
  console.log(`Citas: ${citas.length} · iguales (normalizadas): ${iguales} · distintas: ${distintas.length}`);
  for (const d of distintas) console.log(d);
}

if (process.argv[1]?.endsWith("reposo/verificar-vulgata-epub.ts")) main();
