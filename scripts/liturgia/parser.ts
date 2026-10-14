// HTML de Divinum Officium (officium.pl / missa.pl con content=1) → Documento estructurado (SPEC liturgia §4).
// Puro y sin dependencias: se prueba con HTML real guardado en __fixtures__/.
// Formato de entrada verificado en vault/nuevas-features/liturgia/SPIKE_MOTOR.md §9.1.
import { createHash } from "node:crypto";
import type {
  Bloque,
  ColorLiturgico,
  Documento,
  Seccion,
  Segmento,
  TituloDia,
} from "../../src/lib/liturgia/tipos.ts";

export type ModoDocumento = "hora" | "missa";

export type DocumentoParseado = {
  documento: Documento;
  /** Bloques únicos de este documento, por hash (para guardarlos una sola vez). */
  bloques: Map<string, Bloque>;
};

// ---------------------------------------------------------------- utilidades de texto

const ENTIDADES: Record<string, string> = {
  nbsp: " ",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}

/** Quita las etiquetas, decodifica entidades y normaliza los espacios. */
export function aTexto(html: string): string {
  return decodificarEntidades(html.replace(/<[^>]*>/g, ""))
    .replace(/[ \t\r\n]+/g, " ")
    .trim();
}

export function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/gi, "ae")
    .replace(/œ/gi, "oe")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hashBloque(b: Bloque): string {
  return createHash("sha256").update(JSON.stringify(b)).digest("hex");
}

// ---------------------------------------------------------------- cabecera (título del día)

const COLORES_DO: Record<string, ColorLiturgico> = {
  red: "rojo",
  green: "verde",
  purple: "morado",
  grey: "negro",
  gray: "negro",
  blue: "blanco",
  black: "blanco",
};

/** `<P ALIGN=CENTER><FONT COLOR="red">S. Callisti … ~ Duplex</FONT><br/><I>…Tempora: …</I></P>` */
export function parsearCabecera(html: string): TituloDia | null {
  const m = /<P ALIGN="?CENTER"?>([\s\S]*?)<\/P>/i.exec(html);
  if (!m) return null;
  const partes = m[1].split(/<br\s*\/?>/i);
  const primera = partes[0];
  const texto = aTexto(primera);
  if (!texto) return null;
  const [titulo, ...resto] = texto.split(" ~ ");
  const colorM = /<FONT COLOR=["']?([a-z]+)["']?>/i.exec(primera);
  const color = (colorM && COLORES_DO[colorM[1].toLowerCase()]) || "blanco";
  const lineas = partes
    .slice(1)
    .map(aTexto)
    .filter((l) => l.length > 0);
  return { titulo: titulo.trim(), rango: resto.join(" ~ ").trim(), lineas, color };
}

// ---------------------------------------------------------------- líneas de una celda

type Linea = { tipo: "titulo"; nombre: string; nota: string } | { tipo: "seg"; seg: Segmento };

// Capital decorada (+2, o +1 en algunos himnos): va pegada a la palabra, a diferencia de un título de sección.
const RE_CAPITULAR = /<FONT SIZE='\+[12]' COLOR="red"><B><I>([^<])<\/I><\/B><\/FONT>(?=[A-Za-zÀ-ÿ])/g;
const RE_TITULO = /<FONT SIZE='\+1' COLOR="red"><B><I>(.*?)<\/I><\/B><\/FONT>/;
// Marcas cortas en rojo dentro del texto («N.» en el Canon): no son títulos de sección.
const RE_MARCA_CORTA = /<FONT SIZE='\+1' COLOR="red"><B><I>([^<]{1,3})<\/I><\/B><\/FONT>/g;
const RE_NAV = /<DIV ALIGN='right'>[\s\S]*?<\/DIV>/g;
const RE_ROJO_ITALICA = /^<FONT COLOR="red"><I>([\s\S]*?)<\/I><\/FONT>\s*([\s\S]*)$/;
const RE_VERSO = /^<FONT SIZE='1' COLOR="red">([^<]*)<\/FONT>\s*([\s\S]*)$/;
const RE_NUM_VERSO = /^\d+:\d+[a-z]?(?:-\d+[a-z]?)?$/i;
const RE_TITULO_SALMO = /^(Psalmus|Psalm|Salmo|Canticum|Cántico|Cant\.|Hymnus|Himno)\b/i;

function lineaDeHtml(l: string): Linea | null {
  const t = l.trim();
  if (!t) return null;
  let m: RegExpExecArray | null;
  if ((m = RE_ROJO_ITALICA.exec(t))) {
    const marca = aTexto(m[1]);
    const resto = aTexto(m[2]);
    if (marca === "℣." || marca === "℣") return seg({ t: "versiculo", v: resto });
    if (marca === "℟." || marca === "℟") return seg({ t: "responsorio", v: resto });
    if (marca === "Ant." || marca === "Ant") return seg({ t: "antifona", v: resto });
    if (RE_TITULO_SALMO.test(marca) && (resto === "" || /^\[\d+\]$/.test(resto))) {
      return seg({ t: "titulo", v: marca });
    }
    return seg({ t: "rubrica", v: aTexto(t) });
  }
  if ((m = RE_VERSO.exec(t))) {
    const num = aTexto(m[1]);
    const resto = aTexto(m[2]);
    if (RE_NUM_VERSO.test(num) && resto) return seg({ t: "verso", num, v: resto });
    if (!resto) return seg({ t: "rubrica", v: num });
  }
  // toda la línea en rojo chico = rúbrica; si el rojo es solo un marcador («S.», «M.») y sigue texto, es texto
  if (/^<FONT SIZE='1' COLOR="red">(?:(?!<\/FONT>)[\s\S])*<\/FONT>\s*$/.test(t)) {
    return seg({ t: "rubrica", v: aTexto(t) });
  }
  const texto = aTexto(t);
  if (!texto) return null;
  if (texto === "✠") return seg({ t: "cruz" });
  return seg({ t: "texto", v: texto });
}

function seg(s: Segmento): Linea | null {
  if ("v" in s && s.v === "") return null;
  return { tipo: "seg", seg: s };
}

export function lineasDeCelda(celda: string): Linea[] {
  const limpio = celda.replace(RE_NAV, "").replace(RE_CAPITULAR, "$1").replace(RE_MARCA_CORTA, "$1");
  const out: Linea[] = [];
  for (const cruda of limpio.split(/<br\s*\/?>/i)) {
    let resto = cruda.replace(/[\r\n]+/g, " ");
    // un título puede venir pegado a otras líneas o en medio de la celda
    for (;;) {
      const m = RE_TITULO.exec(resto);
      if (!m) break;
      const antes = resto.slice(0, m.index);
      const despues = resto.slice(m.index + m[0].length);
      const l = lineaDeHtml(antes);
      if (l) out.push(l);
      const nota = aTexto(despues).replace(/^\{(.*)\}$/, "$1");
      out.push({ tipo: "titulo", nombre: aTexto(m[1]), nota });
      resto = "";
      break;
    }
    if (resto) {
      const l = lineaDeHtml(resto);
      if (l) out.push(l);
    }
  }
  return out;
}

// ---------------------------------------------------------------- respaldo de idioma (D52)

const PALABRAS_INGLES = new Set(
  "the of and to who his he that with for is shall thou thee thy unto my our us we be are was by from this which him her their they have has all not but as on at an".split(
    " ",
  ),
);
const PALABRAS_ESPANOL = new Set(
  "el la los las de que y en del con por se es su un una al lo para como sus mi tu nos os vos sea ser son fue".split(
    " ",
  ),
);
const ENCABEZADOS_INGLES = /^(Martyrology|At the Nocturn|Lesson|Gospel|Epistle|Reading|Commemoration)\b/i;
const LIBROS_INGLES =
  "James|Luke|Matthew|Matt|Mark|John|Proverbs|Wisdom|Sirach|Ecclesiasticus|Isaiah|Jeremiah|Ezekiel|Daniel|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|Peter|Jude|Revelation|Apocalypse|Acts|Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Tobit|Judith|Esther|Job|Psalms?|Ecclesiastes|Canticles|Lamentations|Baruch|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Maccabees";
const RE_REF_INGLES = new RegExp(`^(?:[123] )?(?:${LIBROS_INGLES})\\s+\\d+[:\\d,\\-; ]*\\.?$`, "i");
const RE_REFERENCIA = /^(?:[123] )?[A-Za-zñÑ.]+ \d+(?:[:,.\-; ]+\d+[a-z]?)*\.?$/;

function palabras(s: string): string[] {
  return s.toLowerCase().match(/[a-záéíóúñü']+/g) ?? [];
}

export function pareceIngles(s: string): boolean {
  if (ENCABEZADOS_INGLES.test(s)) return true;
  if (RE_REF_INGLES.test(s.trim())) return true;
  const w = palabras(s);
  const e = w.filter((x) => PALABRAS_INGLES.has(x)).length;
  const sp = w.filter((x) => PALABRAS_ESPANOL.has(x)).length;
  return e >= 2 && e > sp * 1.5;
}

function normalizar(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function textoDe(s: Segmento): string | null {
  switch (s.t) {
    case "texto":
    case "rubrica":
    case "versiculo":
    case "responsorio":
    case "antifona":
    case "verso":
      return s.v;
    default:
      return null;
  }
}

/**
 * Marca como `falta` las líneas españolas que DO rellenó con otro idioma (D52):
 * (a) idéntica a una línea latina del bloque (y no es una referencia bíblica),
 * (b) con aspecto de inglés (palabras funcionales, encabezados y referencias inglesas).
 * Si ninguna línea quedó traducida, `es = null` y `esFalta = true`.
 */
export function aplicarRespaldoIdioma(la: Segmento[], es: Segmento[]): Bloque {
  const latinas = new Set(
    la.map(textoDe).filter((x): x is string => !!x).map(normalizar),
  );
  let traducidas = 0;
  const marcadas = es.map<Segmento>((s) => {
    const v = textoDe(s);
    if (v === null) return s;
    const n = normalizar(v);
    const letras = (n.match(/[a-záéíóúñü]/g) ?? []).length;
    const esRef = RE_REFERENCIA.test(v.trim()) && !pareceIngles(v);
    const igualLatin = latinas.has(n) && letras >= 12 && !esRef;
    if (igualLatin || pareceIngles(v)) return { t: "falta" };
    traducidas++;
    return s;
  });
  if (es.length === 0 || traducidas === 0) {
    // un bloque de solo rúbricas/títulos sin par español no es una «falta de traducción»
    const soloMarcas = la.every((x) => x.t === "rubrica" || x.t === "titulo" || x.t === "cruz");
    return la.length === 0 || (es.length === 0 && soloMarcas) ? { la, es: null } : { la, es: null, esFalta: true };
  }
  return { la, es: marcadas };
}

// ---------------------------------------------------------------- documento

const PROPIOS_MISA = new Set([
  "introitus",
  "oratio",
  "lectio",
  "epistola",
  "graduale",
  "tractus",
  "alleluia",
  "alleluja",
  "sequentia",
  "evangelium",
  "offertorium",
  "secreta",
  "praefatio",
  "communio",
  "postcommunio",
  "commemoratio",
]);

type Chunk = { titulo: { nombre: string; nota: string } | null; segs: Segmento[] };

function trocear(lineas: Linea[]): { chunks: Chunk[]; titulos: number } {
  const chunks: Chunk[] = [{ titulo: null, segs: [] }];
  let titulos = 0;
  for (const l of lineas) {
    if (l.tipo === "titulo") {
      titulos++;
      chunks.push({ titulo: { nombre: l.nombre, nota: l.nota }, segs: [] });
    } else {
      chunks[chunks.length - 1].segs.push(l.seg);
    }
  }
  if (chunks[0].segs.length === 0 && chunks.length > 1) chunks.shift();
  return { chunks, titulos };
}

function claveUnica(base: string, usadas: Map<string, number>): string {
  const b = base || "ordo";
  const n = (usadas.get(b) ?? 0) + 1;
  usadas.set(b, n);
  return n === 1 ? b : `${b}-${n}`;
}

export function parsearDocumento(html: string, modo: ModoDocumento): DocumentoParseado {
  const titulo = parsearCabecera(html);
  const iTabla = html.search(/<TABLE/i);
  const cuerpo = iTabla >= 0 ? html.slice(iTabla) : "";
  const bloques = new Map<string, Bloque>();
  const secciones: Seccion[] = [];
  const usadas = new Map<string, number>();
  const estado: { actual: Seccion | null } = { actual: null };

  const abrir = (tituloLa: string, tituloEs: string | null, propio: boolean | undefined) => {
    const s: Seccion = {
      clave: claveUnica(slug(tituloLa), usadas),
      tituloLa,
      tituloEs,
      bloques: [],
    };
    if (propio !== undefined) s.propio = propio;
    secciones.push(s);
    estado.actual = s;
    return s;
  };
  const agregar = (s: Seccion, la: Segmento[], es: Segmento[]) => {
    if (la.length === 0 && es.length === 0) return;
    const b = aplicarRespaldoIdioma(la, es);
    const h = hashBloque(b);
    if (!bloques.has(h)) bloques.set(h, b);
    s.bloques.push(h);
  };

  for (const fila of cuerpo.matchAll(/<TR>([\s\S]*?)<\/TR>/gi)) {
    const celdas = [...fila[1].matchAll(/<TD[^>]*>([\s\S]*?)<\/TD>/gi)].map((c) => c[1]);
    if (celdas.length === 0) continue;
    const la = trocear(lineasDeCelda(celdas[0]));
    const es = trocear(lineasDeCelda(celdas[1] ?? ""));
    const alineado = la.titulos === es.titulos;

    if (alineado) {
      const n = Math.max(la.chunks.length, es.chunks.length);
      for (let i = 0; i < n; i++) {
        const cl = la.chunks[i] ?? { titulo: null, segs: [] };
        const ce = es.chunks[i] ?? { titulo: null, segs: [] };
        if (cl.titulo) {
          const propio =
            modo === "missa"
              ? PROPIOS_MISA.has(slug(cl.titulo.nombre)) && (cl.segs.length > 0 || ce.segs.length > 0)
              : undefined;
          const s = abrir(cl.titulo.nombre, ce.titulo ? ce.titulo.nombre : null, propio);
          if (cl.titulo.nota || ce.titulo?.nota) {
            agregar(
              s,
              cl.titulo.nota ? [{ t: "rubrica", v: cl.titulo.nota }] : [],
              ce.titulo?.nota ? [{ t: "rubrica", v: ce.titulo.nota }] : [],
            );
          }
          agregar(s, cl.segs, ce.segs);
        } else {
          let s: Seccion | null = estado.actual;
          if (modo === "missa") {
            if (!s || s.tituloLa !== "") s = abrir("", null, false);
          } else if (!s) {
            s = abrir("", null, undefined);
          }
          agregar(s, cl.segs, ce.segs);
        }
      }
    } else {
      // los títulos no coinciden entre columnas: la fila entera es un bloque y los títulos quedan dentro
      const aplanar = (c: { chunks: Chunk[] }) =>
        c.chunks.flatMap((ch) => [
          ...(ch.titulo ? [{ t: "titulo", v: ch.titulo.nombre } as Segmento] : []),
          ...ch.segs,
        ]);
      const primeraLa = la.chunks.find((c) => c.titulo)?.titulo;
      const primeraEs = es.chunks.find((c) => c.titulo)?.titulo;
      let s: Seccion | null = estado.actual;
      if (primeraLa) {
        const propio = modo === "missa" ? PROPIOS_MISA.has(slug(primeraLa.nombre)) : undefined;
        s = abrir(primeraLa.nombre, primeraEs?.nombre ?? null, propio);
        agregar(s, aplanar(la).slice(1), aplanar(es).slice(primeraEs ? 1 : 0));
      } else {
        if (!s) s = abrir("", null, modo === "missa" ? false : undefined);
        agregar(s, aplanar(la), aplanar(es));
      }
    }
  }

  return { documento: { titulo, secciones }, bloques };
}
