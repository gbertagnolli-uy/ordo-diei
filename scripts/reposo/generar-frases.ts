// Genera los datos de las frases del reposo (SPEC idle-marco-fotos §6):
//   src/data/reposo/citas-biblicas.json   latín (Vulgata Clementina) + español (Torres Amat) + referencia
//   src/data/reposo/catecismo-pio-x.json  Catecismo Mayor de San Pío X completo (el filtro de largo es del mazo)
// Nunca se tipea un versículo a mano: salen de las fuentes descargadas (`scripts/reposo/descargar-fuentes.sh`) y de
// dos archivos curados en vault/nuevas-features/idle-marco-fotos/ref/:
//   seleccion-citas.txt          las referencias elegidas (D51)
//   torres-amat-correcciones.txt «Libro cap,vers | texto»: corrige el OCR de un pasaje (reemplaza al extraído)
//
//   node scripts/reposo/generar-frases.ts [--borrador] [--solo-catecismo]
//     --borrador  no escribe: imprime, por cada cita, el latín y el español extraídos para revisarlos
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parsearCatecismo, type PreguntaCatecismo } from "./catecismo.ts";
import { limpiarPregunta } from "./catecismo-ocr.ts";
import { idDeReferencia, parsearSeleccion, referenciaLegible, type Referencia } from "./citas.ts";
import { LIBROS, type Libro } from "./libros.ts";
import {
  SEP_CUERPO,
  alinearCapitulos,
  cortarCapitulos,
  limpiarVersiculo,
  parrafosDeVersiculos,
  type VersiculosCapitulo,
} from "./torres-amat.ts";
import { cargarLibro, limpiarLatin, textoLatin, type LibroVulgata } from "./vulgata.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE = join(RAIZ, ".cache", "reposo");
const REF = join(RAIZ, "vault", "nuevas-features", "idle-marco-fotos", "ref");
const SALIDA = join(RAIZ, "src", "data", "reposo");

/** Largos máximos para que nada se corte ni haga scroll en el reposo (SPEC §4.3). */
export const LIMITE_LATIN = 220;
export const LIMITE_ESPANOL = 300;

export type CitaBiblica = {
  id: string;
  libro: string;
  capitulo: number;
  desde: number;
  hasta: number;
  la: string;
  es: string;
  ref: string;
};

// ---------------------------------------------------------------- texto español

/** Límite de palabra que entiende las tildes (`\\b` de JS no las trata como letras). */
const L = "A-Za-záéíóúñÁÉÍÓÚÑüÜ";
const P = (re: string) => new RegExp(`(?<![${L}])${re}(?![${L}])`, "g");

/** Ortografía actual de las tildes más evidentes y de «Christo»; las palabras son las de la edición. */
const MODERNIZAR: [RegExp, string | ((m: string) => string)][] = [
  [P("á"), "a"],
  [P("Á"), "A"],
  [P("ó"), "o"],
  [P("Ó"), "O"],
  [P("é"), "e"],
  [P("ú"), "u"],
  [P("Hé"), "He"],
  [/Jesu-?\s*[Cc]hristo/g, "Jesucristo"],
  [/Jesu-?\s*[Cc]risto/g, "Jesucristo"],
  [P("Jesus"), "Jesús"],
  [P("hácia"), "hacia"],
  [P("mia"), "mía"],
  [P("mias"), "mías"],
  [P("mios"), "míos"],
  [P("mio"), "mío"],
  [P("Christo"), "Cristo"],
  [/\b[Cc]hristian/g, (m: string) => `${m[0]}ristian`],
  [P("mió"), "mío"],
  [P("miós"), "míos"],
  [P("piés"), "pies"],
  [P("pié"), "pie"],
  [P("tí"), "ti"],
  [P("dió"), "dio"],
  [P("vió"), "vio"],
  [P("fué"), "fue"],
  [P("fuí"), "fui"],
  [P("guió"), "guio"],
  [P("Syon"), "Sión"],
  [P("sábio"), "sabio"],
  [P("sábios"), "sabios"],
  [P("sóberbia"), "soberbia"],
  // sin tilde en la edición, y sin ambigüedad (mas/aun/solo no se tocan)
  [P("dia"), "día"],
  [P("Dia"), "Día"],
  [P("dias"), "días"],
  [P("tambien"), "también"],
  [P("asi"), "así"],
  [P("Asi"), "Así"],
  [P("alli"), "allí"],
  [P("aqui"), "aquí"],
  [P("ahi"), "ahí"],
  [P("jamas"), "jamás"],
  [P("ademas"), "además"],
  [P("despues"), "después"],
  [P("ningun"), "ningún"],
  [P("estan"), "están"],
  [P("habia"), "había"],
  [P("habian"), "habían"],
  [P("hacia"), "hacia"],
];

export function modernizar(s: string): string {
  let t = s;
  for (const [re, por] of MODERNIZAR) t = t.replace(re, por as string);
  // los «—» de la edición separan lo que el traductor añade para aclarar; no son de uso actual
  return t.replace(/\s*—\s*/g, " ").replace(/\s+([,.;:!?»)])/g, "$1");
}

/** Un final «,», «;» o «:» se cierra con punto: el pasaje se muestra como cita, no como frase a medias. */
export function cerrarFrase(s: string): string {
  const t = s.replace(/\s+$/, "").replace(/[,;:]$/, ".");
  return /[\p{L}\d)]$/u.test(t) ? `${t}.` : t;
}

export function textoEspanol(
  caps: VersiculosCapitulo,
  desde: number,
  hasta: number,
  reemplazos: [string, string][] = [],
): string | null {
  const partes: string[] = [];
  for (let v = desde; v <= hasta; v++) {
    const t = caps.get(v);
    if (t === undefined) return null;
    if (t.includes(SEP_CUERPO)) {
      // salmo: «título SEP cuerpo»; solo el cuerpo es el versículo
      partes.push(limpiarVersiculo(t.split(SEP_CUERPO)[1]));
    } else partes.push(limpiarVersiculo(t));
  }
  const juntos = partes.join(" ").replace(/\s+/g, " ").trim();
  // un versículo cortado por un salto de página termina en una letra o en un guion: no se publica sin corregirlo
  if (!juntos || /[A-Za-záéíóúñ¬-]$/.test(juntos)) return null;
  // las correcciones se escriben sobre el texto ya modernizado (lo que se ve en el borrador)
  let texto = modernizar(juntos);
  for (const [antes, despues] of reemplazos) {
    if (!texto.includes(antes)) throw new Error(`La corrección «${antes}» no aparece en el pasaje extraído`);
    texto = texto.split(antes).join(despues);
  }
  return cerrarFrase(texto);
}

// ---------------------------------------------------------------- carga de fuentes

export function cargarTorresAmat(
  dir: string,
  codigos: string[],
  vulgata: Map<string, LibroVulgata>,
): Map<string, Map<number, VersiculosCapitulo>> {
  const out = new Map<string, Map<number, VersiculosCapitulo>>();
  const archivos = new Map<string, string[]>();
  for (const codigo of codigos) {
    const libro: Libro | undefined = LIBROS.find((l) => l.codigo === codigo);
    if (!libro?.archivo) continue;
    if (!archivos.has(libro.archivo)) archivos.set(libro.archivo, readFileSync(join(dir, `${libro.archivo}.txt`), "utf8").split(/\r?\n/));
    const lat = vulgata.get(codigo)!;
    const capsLat = [...lat.keys()].sort((a, b) => a - b);
    const esperado = capsLat.map((c) => Math.max(...lat.get(c)!.keys()));
    const latinPorCapitulo = capsLat.map((c) => [...lat.get(c)!.values()].map(limpiarLatin).join(" "));
    const lineas = archivos.get(libro.archivo)!.slice(libro.ini, libro.fin);
    const detectados = cortarCapitulos(parrafosDeVersiculos(lineas));
    out.set(codigo, alinearCapitulos(detectados, esperado, latinPorCapitulo));
  }
  return out;
}

export type Correccion =
  | { tipo: "texto"; texto: string }
  | { tipo: "reemplazos"; pares: [string, string][] }
  | { tipo: "omitir"; motivo: string };

/**
 * Correcciones del OCR, una por línea:
 *   Libro cap,vers  == texto completo       reemplaza el pasaje entero
 *   Libro cap,vers  | antes => después      reemplaza un fragmento (varias líneas por pasaje)
 *   Libro cap,vers  !! motivo               no se publica
 */
export function leerCorrecciones(texto: string): Map<string, Correccion> {
  const m = new Map<string, Correccion>();
  for (const l of texto.split(/\r?\n/)) {
    const t = l.trim();
    if (!t || t.startsWith("#")) continue;
    const r = /^(\S+ \d+,\d+(?:-\d+)?)\s*(==|\||!!)\s*([\s\S]*)$/.exec(t);
    if (!r) throw new Error(`Corrección inválida: «${t.slice(0, 50)}»`);
    const [, ref, op, resto] = r;
    if (op === "==") m.set(ref, { tipo: "texto", texto: resto });
    else if (op === "!!") m.set(ref, { tipo: "omitir", motivo: resto });
    else {
      const i = resto.indexOf("=>");
      if (i < 0) throw new Error(`Falta «=>» en: «${t.slice(0, 50)}»`);
      const par: [string, string] = [resto.slice(0, i).trim(), resto.slice(i + 2).trim()];
      const previo = m.get(ref);
      if (previo?.tipo === "reemplazos") previo.pares.push(par);
      else m.set(ref, { tipo: "reemplazos", pares: [par] });
    }
  }
  return m;
}

export type ResultadoCitas = { citas: CitaBiblica[]; omitidas: { ref: string; motivo: string }[] };

export function armarCitas(
  refs: Referencia[],
  vulgata: Map<string, LibroVulgata>,
  ta: Map<string, Map<number, VersiculosCapitulo>>,
  correcciones: Map<string, Correccion>,
): ResultadoCitas {
  const citas: CitaBiblica[] = [];
  const omitidas: { ref: string; motivo: string }[] = [];
  for (const r of refs) {
    const clave = `${r.libro} ${r.capitulo},${r.desde}${r.hasta !== r.desde ? `-${r.hasta}` : ""}`;
    const lib = vulgata.get(r.libro);
    const la = lib ? textoLatin(lib, r.capitulo, r.desde, r.hasta) : null;
    if (!la) {
      omitidas.push({ ref: clave, motivo: "sin latín en la Vulgata" });
      continue;
    }
    const corr = correcciones.get(clave);
    if (corr?.tipo === "omitir") {
      omitidas.push({ ref: clave, motivo: corr.motivo });
      continue;
    }
    const es: string | null =
      corr?.tipo === "texto" ? corr.texto : textoEspanol(ta.get(r.libro)?.get(r.capitulo) ?? new Map(), r.desde, r.hasta, corr?.tipo === "reemplazos" ? corr.pares : []);
    if (!es) {
      omitidas.push({ ref: clave, motivo: "sin español de Torres Amat (o cortado por un salto de página)" });
      continue;
    }
    const laFinal = cerrarFrase(la);
    const esFinal = cerrarFrase(es);
    if (laFinal.length > LIMITE_LATIN || esFinal.length > LIMITE_ESPANOL) {
      omitidas.push({ ref: clave, motivo: `supera el largo máximo (latín ${laFinal.length}/${LIMITE_LATIN}, español ${esFinal.length}/${LIMITE_ESPANOL})` });
      continue;
    }
    citas.push({
      id: idDeReferencia(r),
      libro: r.libro,
      capitulo: r.capitulo,
      desde: r.desde,
      hasta: r.hasta,
      la: laFinal,
      es: esFinal,
      ref: referenciaLegible(r),
    });
  }
  return { citas, omitidas };
}

// ---------------------------------------------------------------- catecismo

export function armarCatecismo(texto: string): PreguntaCatecismo[] {
  return parsearCatecismo(texto)
    .map(limpiarPregunta)
    .filter((p): p is PreguntaCatecismo => p !== null);
}

// ---------------------------------------------------------------- CLI

function main() {
  const borrador = process.argv.includes("--borrador");
  const soloCatecismo = process.argv.includes("--solo-catecismo");
  for (const f of ["catecismo/catecismo-1973.txt", "vulgata/Ps.lat", "torres-amat/AI158.txt"]) {
    if (!existsSync(join(CACHE, f))) throw new Error(`Falta ${f}: corré scripts/reposo/descargar-fuentes.sh`);
  }
  mkdirSync(SALIDA, { recursive: true });

  const catecismo = armarCatecismo(readFileSync(join(CACHE, "catecismo", "catecismo-1973.txt"), "utf8"));
  if (!borrador) {
    writeFileSync(join(SALIDA, "catecismo-pio-x.json"), JSON.stringify(catecismo, null, 1) + "\n");
    console.log(`Catecismo: ${catecismo.length} preguntas`);
  }
  if (soloCatecismo) return;

  const refs = parsearSeleccion(readFileSync(join(REF, "seleccion-citas.txt"), "utf8"));
  const codigos = [...new Set(refs.map((r) => r.libro))];
  const vulgata = new Map(codigos.map((c) => [c, cargarLibro(join(CACHE, "vulgata"), c)]));
  const ta = cargarTorresAmat(join(CACHE, "torres-amat"), codigos, vulgata);
  const correcciones = leerCorrecciones(readFileSync(join(REF, "torres-amat-correcciones.txt"), "utf8"));
  const { citas, omitidas } = armarCitas(refs, vulgata, ta, correcciones);

  if (borrador) {
    for (const c of citas) console.log(`## ${c.libro} ${c.capitulo},${c.desde}-${c.hasta}\n  LA ${c.la}\n  ES ${c.es}`);
  } else {
    writeFileSync(join(SALIDA, "citas-biblicas.json"), JSON.stringify(citas, null, 1) + "\n");
  }
  console.error(`Citas: ${citas.length} de ${refs.length} propuestas`);
  for (const o of omitidas) console.error(`  omitida ${o.ref}: ${o.motivo}`);
}

if (process.argv[1]?.endsWith("reposo/generar-frases.ts")) main();
