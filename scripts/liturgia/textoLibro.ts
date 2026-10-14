// Texto crudo de los archivos «de libro» de DO (Sancti/Tempora/Commune/Psalterium/Ordo, ya resueltos por
// setupstring en do-libro.pl) → Segmento[]. Ver SPIKE_MOTOR.md §6 y §9.
import type { Bloque, Documento, Seccion, Segmento } from "../../src/lib/liturgia/tipos.ts";
import { aplicarRespaldoIdioma, hashBloque, slug } from "./parser.ts";

export type Macros = Map<string, string>;

const FUNCIONES: Record<string, string> = {
  gloria: "Gloria",
  gloria1: "Gloria1",
  tedeum: "Te Deum",
  alleluia: "Alleluia",
};

function limpiar(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** `;;1`, `;;92;93` (números de salmo) se descartan; `;;Duplex;;3` (rango) se une con « · ». */
function sinCampos(s: string): string {
  if (!s.includes(";;")) return s;
  const [texto, ...campos] = s.split(";;");
  const utiles = campos.map((c) => c.trim()).filter((c) => c && !/^[\d,;\s]+$/.test(c));
  return [texto.trim(), ...utiles].filter(Boolean).join(" · ");
}

export function parsearTextoDO(texto: string, macros?: Macros, profundidad = 0): Segmento[] {
  const out: Segmento[] = [];
  for (const cruda of texto.split(/\r?\n/)) {
    const l = cruda.trim();
    if (!l || l === "_" || l.startsWith("#")) continue;
    let m: RegExpExecArray | null;
    if (l.startsWith("@")) continue; // referencia sin resolver
    if ((m = /^\$(.+)$/.exec(l))) {
      const cuerpo = macros?.get(m[1].trim());
      if (cuerpo && profundidad < 3) out.push(...parsearTextoDO(cuerpo, macros, profundidad + 1));
      continue;
    }
    if ((m = /^&(\w+)/.exec(l))) {
      const nombre = FUNCIONES[m[1].toLowerCase()];
      const cuerpo = nombre ? macros?.get(nombre) : undefined;
      if (cuerpo && profundidad < 3) out.push(...parsearTextoDO(cuerpo, macros, profundidad + 1));
      continue;
    }
    if ((m = /^!+\s*(.*)$/.exec(l))) {
      const v = limpiar(m[1]);
      if (v) out.push({ t: "rubrica", v });
      continue;
    }
    if ((m = /^[Vv]\.\s*(.*)$/.exec(l))) {
      out.push({ t: "versiculo", v: limpiar(sinCampos(m[1])) });
      continue;
    }
    if ((m = /^[Rr]\.(?:br\.)?\s*(.*)$/.exec(l))) {
      out.push({ t: "responsorio", v: limpiar(sinCampos(m[1])) });
      continue;
    }
    if ((m = /^(\d+:\d+[a-z]?(?:-\d+[a-z]?)?)\s+(.*)$/.exec(l))) {
      out.push({ t: "verso", num: m[1], v: limpiar(m[2]) });
      continue;
    }
    const v = limpiar(sinCampos(l));
    if (v === "✠") out.push({ t: "cruz" });
    else if (v) out.push({ t: "texto", v });
  }
  return out;
}

export type SeccionesCrudas = Record<string, string> | null;

/** Combina el archivo latino y el español (mismo conjunto de secciones) en un Documento. */
export function construirLibro(
  latin: SeccionesCrudas,
  espanol: SeccionesCrudas,
  macrosLa?: Macros,
  macrosEs?: Macros,
): { documento: Documento; bloques: Map<string, Bloque> } | null {
  if (!latin) return null;
  const bloques = new Map<string, Bloque>();
  const secciones: Seccion[] = [];
  const usadas = new Set<string>();
  for (const clave of Object.keys(latin).sort(ordenSecciones)) {
    const la = parsearTextoDO(latin[clave], macrosLa);
    const textoEs = espanol?.[clave];
    const es = textoEs ? parsearTextoDO(textoEs, macrosEs) : [];
    if (la.length === 0 && es.length === 0) continue;
    const b = aplicarRespaldoIdioma(la, es);
    const h = hashBloque(b);
    if (!bloques.has(h)) bloques.set(h, b);
    let k = slug(clave) || "seccion";
    while (usadas.has(k)) k += "-";
    usadas.add(k);
    secciones.push({ clave: k, tituloLa: clave, tituloEs: null, bloques: [h] });
  }
  return { documento: { titulo: null, secciones }, bloques };
}

const PRIORIDAD = ["Officium", "Rank", "Rule", "Invit", "Hymnus", "Ant", "Oratio", "Lectio", "Introitus", "Graduale"];
function ordenSecciones(a: string, b: string): number {
  const pa = PRIORIDAD.findIndex((p) => a.startsWith(p));
  const pb = PRIORIDAD.findIndex((p) => b.startsWith(p));
  const ra = pa === -1 ? 99 : pa;
  const rb = pb === -1 ? 99 : pb;
  return ra - rb || a.localeCompare(b, "la", { numeric: true });
}

/** Psalm92.txt (sin cabeceras `[Seccion]`): cada línea `92:1a texto`. */
export function parsearSalmo(texto: string): Segmento[] {
  return parsearTextoDO(texto);
}

/**
 * Martirologio del día: `Titulus` + `Martyrologium` (con RESOLVE_ALL de setupstring, las entradas ya
 * vienen una tras otra, separadas por una línea en blanco; la versión 1570 omite algunas). Un bloque por entrada.
 * Nota (D52): el español de DO es una adaptación con datos actuales; el latín es el tradicional.
 */
export function construirMartirologio(
  latin: SeccionesCrudas,
  espanol: SeccionesCrudas,
): { documento: Documento; bloques: Map<string, Bloque> } | null {
  if (!latin) return null;
  const bloques = new Map<string, Bloque>();
  const secciones: Seccion[] = [];
  const guardar = (b: Bloque) => {
    const h = hashBloque(b);
    if (!bloques.has(h)) bloques.set(h, b);
    return h;
  };
  const titulus = parsearTextoDO(latin["Titulus"] ?? "");
  if (titulus.length) {
    const es = parsearTextoDO(espanol?.["Titulus"] ?? "");
    secciones.push({
      clave: "titulus",
      tituloLa: "Titulus",
      tituloEs: null,
      bloques: [guardar(aplicarRespaldoIdioma(titulus, es))],
    });
  }
  const entradas = (t: string | undefined) =>
    (t ?? "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  const la = entradas(latin["Martyrologium"]);
  const es = entradas(espanol?.["Martyrologium"]);
  const hashes: string[] = [];
  if (la.length === es.length) {
    la.forEach((p, i) => hashes.push(guardar(aplicarRespaldoIdioma(parsearTextoDO(p), parsearTextoDO(es[i])))));
  } else {
    // sin paridad entre columnas no se puede alinear entrada por entrada: un solo bloque
    hashes.push(
      guardar(aplicarRespaldoIdioma(la.flatMap((p) => parsearTextoDO(p)), es.flatMap((p) => parsearTextoDO(p)))),
    );
  }
  secciones.push({ clave: "martyrologium", tituloLa: "Martyrologium", tituloEs: null, bloques: hashes });
  return { documento: { titulo: null, secciones }, bloques };
}
