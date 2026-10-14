// Generador de la liturgia: ejecuta Divinum Officium (Perl original) y guarda el resultado estructurado.
// La app en Vercel solo LEE de la base; esto corre en una PC o en la GitHub Action mensual (SPEC liturgia §2–§3).
//
//   node scripts/liturgia/generar.ts --versiones 1906,1888,1570 --desde 2026-01-01 --hasta 2027-12-31
//        [--solo-calendario] [--libros] [--concurrencia 8] [--volcar <dir>] [--escribir]
//
// Sin `--escribir` es un ensayo: genera todo en memoria, mide y (con --volcar) deja JSON en disco; NO toca la base.
// Con `--escribir` hace upsert idempotente en las tablas nuevas (escritura masiva en la base de producción:
// la primera carga requiere el OK del usuario, ver vault/nuevas-features/lanes/PENDIENTES_REPOSO_LITURGIA.md).
import { appendFileSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  aISO,
  diaDeSemana,
  fechaDeISO,
  sumarDias,
  tiempoLiturgico,
} from "../../src/lib/liturgia/calendario.ts";
import {
  HORAS,
  VERSIONES,
  esVersionLiturgica,
  type Bloque,
  type Documento,
  type Hora,
  type TipoDocumento,
  type TituloDia,
  type VersionLiturgica,
} from "../../src/lib/liturgia/tipos.ts";
import { DO_WWW, ejecutarHora, ejecutarLibros, ejecutarMisa, limitarProcesos, verificarInstalacion } from "./do.ts";
import { combinarKalendarios, parsearKalendario, type EntradaKalendario } from "./kalendarios.ts";
import { aplicarRespaldoIdioma, hashBloque, pareceIngles, parsearCabecera, parsearDocumento } from "./parser.ts";
import {
  construirLibro,
  construirMartirologio,
  parsearSalmo,
  type Macros,
} from "./textoLibro.ts";

export const DO_COMMIT = "32be5f267276b12256e015b2423b01606be149f5";

// ---------------------------------------------------------------- tipos de salida

export type FilaDia = {
  version: VersionLiturgica;
  fecha: string;
  titulo: string;
  tituloEs: string | null;
  rango: string;
  lineas: string[];
  color: string;
  tiempo: string;
  dominical: boolean;
};

export type FilaDocumento = {
  version: VersionLiturgica;
  tipo: TipoDocumento | "kalendarium";
  clave: string;
  fecha: string | null;
  titulo: unknown;
  secciones: unknown;
};

export type Acumulado = {
  dias: FilaDia[];
  documentos: FilaDocumento[];
  bloques: Map<string, Bloque>;
};

// ---------------------------------------------------------------- utilidades puras (con pruebas)

export function diasEntre(desdeISO: string, hastaISO: string): string[] {
  const out: string[] = [];
  let f = fechaDeISO(desdeISO);
  const fin = aISO(fechaDeISO(hastaISO));
  while (aISO(f) <= fin) {
    out.push(aISO(f));
    f = sumarDias(f, 1);
  }
  return out;
}

export function claveHora(iso: string, hora: Hora): string {
  return `${iso}/${hora}`;
}

export function filaDia(
  version: VersionLiturgica,
  iso: string,
  t: TituloDia,
  mapaTitulosEs?: Map<string, string>,
): FilaDia {
  const f = fechaDeISO(iso);
  return {
    version,
    fecha: iso,
    titulo: t.titulo,
    tituloEs: mapaTitulosEs?.get(t.titulo) ?? null,
    rango: t.rango,
    lineas: t.lineas,
    color: t.color,
    tiempo: tiempoLiturgico(f),
    dominical: diaDeSemana(f) === 0,
  };
}

export async function mapConcurrente<T, R>(items: T[], n: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const trabajadores = Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async () => {
    for (;;) {
      const k = i++;
      if (k >= items.length) return;
      out[k] = await fn(items[k], k);
    }
  });
  await Promise.all(trabajadores);
  return out;
}

function agregarBloques(acum: Acumulado, bloques: Map<string, Bloque>) {
  for (const [h, b] of bloques) if (!acum.bloques.has(h)) acum.bloques.set(h, b);
}

// ---------------------------------------------------------------- pasos

/**
 * Latín → español del `[Officium]` de Sancti/Tempora: da `Titulo_Es` cuando DO lo trae (si no, null).
 * Se lee del área `missa`: en `horas` el `[Officium]` español repite el latín (SPIKE_MOTOR §6).
 */
async function mapaTitulosEs(version: VersionLiturgica): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  for (const carpeta of ["Sancti", "Tempora"]) {
    const archivos = readdirSync(join(DO_WWW, "missa", "Latin", carpeta))
      .filter((f) => f.endsWith(".txt"))
      .map((f) => `${carpeta}/${f}`);
    const [la, es] = await Promise.all([
      ejecutarLibros(version, "Latin", "missa", archivos),
      ejecutarLibros(version, "Espanol", "missa", archivos),
    ]);
    for (const a of archivos) {
      const tl = la.get(a)?.["Officium"]?.trim();
      const te = es.get(a)?.["Officium"]?.trim();
      if (tl && te && tl !== te && !pareceIngles(te)) mapa.set(tl, te);
    }
  }
  return mapa;
}

async function macrosDe(version: VersionLiturgica, idioma: "Latin" | "Espanol"): Promise<Macros> {
  const m = await ejecutarLibros(version, idioma, "horas", ["Psalterium/Common/Prayers.txt"]);
  const crudo = m.get("Psalterium/Common/Prayers.txt") ?? {};
  return new Map(Object.entries(crudo).map(([k, v]) => [k, v] as [string, string]));
}

function registrarLibro(
  acum: Acumulado,
  version: VersionLiturgica,
  clave: string,
  r: { documento: Documento; bloques: Map<string, Bloque> } | null,
) {
  if (!r || r.documento.secciones.length === 0) return;
  agregarBloques(acum, r.bloques);
  acum.documentos.push({
    version,
    tipo: "libro",
    clave,
    fecha: null,
    titulo: r.documento.titulo,
    secciones: r.documento.secciones,
  });
}

async function generarLibros(version: VersionLiturgica, acum: Acumulado, log: (s: string) => void) {
  const [macrosLa, macrosEs] = await Promise.all([macrosDe(version, "Latin"), macrosDe(version, "Espanol")]);
  const lista = (area: "horas" | "missa", carpeta: string) =>
    readdirSync(join(DO_WWW, area, "Latin", carpeta))
      .filter((f) => f.endsWith(".txt"))
      .map((f) => `${carpeta}/${f}`);
  const grupos: { area: "horas" | "missa"; archivos: string[]; prefijo: string }[] = [
    { area: "horas", archivos: [...lista("horas", "Sancti"), ...lista("horas", "Tempora"), ...lista("horas", "Commune")], prefijo: "" },
    { area: "missa", archivos: [...lista("missa", "Sancti"), ...lista("missa", "Tempora"), ...lista("missa", "Commune")], prefijo: "Missa/" },
    { area: "horas", archivos: ["Psalterium/Common/Prayers.txt", "Psalterium/Mariaant.txt"], prefijo: "" },
    { area: "missa", archivos: ["Ordo/Ordo.txt", "Ordo/Prayers.txt", "Ordo/Prefationes.txt"], prefijo: "Missa/" },
  ];
  for (const g of grupos) {
    const [la, es] = await Promise.all([
      ejecutarLibros(version, "Latin", g.area, g.archivos),
      ejecutarLibros(version, "Espanol", g.area, g.archivos),
    ]);
    for (const a of g.archivos) {
      const clave = g.prefijo + a.replace(/\.txt$/, "");
      registrarLibro(acum, version, clave, construirLibro(la.get(a) ?? null, es.get(a) ?? null, macrosLa, macrosEs));
    }
    log(`  ${version} · ${g.area}: ${g.archivos.length} libros`);
  }
  // Salterio: Psalm<N>.txt no tiene cabeceras [Sección]; cada línea es «92:1a texto»
  const salmos = readdirSync(join(DO_WWW, "horas", "Latin", "Psalterium", "Psalmorum")).filter((f) => /^Psalm.*\.txt$/.test(f));
  for (const f of salmos) {
    const n = f.replace(/^Psalm/, "").replace(/\.txt$/, "");
    const leer = (idioma: string) => {
      try {
        return readFileSync(join(DO_WWW, "horas", idioma, "Psalterium", "Psalmorum", f), "utf8");
      } catch {
        return "";
      }
    };
    const la = parsearSalmo(leer("Latin"));
    const es = parsearSalmo(leer("Espanol"));
    if (la.length === 0) continue;
    const b = aplicarRespaldoIdioma(la, es);
    const h = hashBloque(b);
    acum.bloques.set(h, b);
    acum.documentos.push({
      version,
      tipo: "libro",
      clave: `Psalterium/${n}`,
      fecha: null,
      titulo: null,
      secciones: [{ clave: "psalmus", tituloLa: `Psalmus ${n}`, tituloEs: `Salmo ${n}`, bloques: [h] }],
    });
  }
  log(`  ${version} · Salterio: ${salmos.length} salmos`);
  // Martirologio (un documento por MM-DD; no depende del año)
  const dias = readdirSync(join(DO_WWW, "horas", "Latin", "Martyrologium")).filter((f) => /^\d\d-\d\d\.txt$/.test(f));
  const archivosM = dias.map((f) => `Martyrologium/${f}`);
  const [mLa, mEs] = await Promise.all([
    ejecutarLibros(version, "Latin", "horas", archivosM),
    ejecutarLibros(version, "Espanol", "horas", archivosM),
  ]);
  for (const a of archivosM) {
    const r = construirMartirologio(mLa.get(a) ?? null, mEs.get(a) ?? null);
    if (!r) continue;
    agregarBloques(acum, r.bloques);
    acum.documentos.push({
      version,
      tipo: "martyrologium",
      clave: a.replace(/^Martyrologium\//, "").replace(/\.txt$/, ""),
      fecha: null,
      titulo: null,
      secciones: r.documento.secciones,
    });
  }
  log(`  ${version} · Martirologio: ${archivosM.length} días`);
}

function kalendarium(version: VersionLiturgica): EntradaKalendario[] {
  const por: Partial<Record<VersionLiturgica, EntradaKalendario[]>> = {};
  for (const v of VERSIONES) {
    try {
      por[v] = parsearKalendario(readFileSync(join(DO_WWW, "Tabulae", "Kalendaria", `${v}.txt`), "utf8"));
    } catch {
      por[v] = [];
    }
  }
  return combinarKalendarios(por, version);
}

export type Opciones = {
  versiones: VersionLiturgica[];
  desde: string;
  hasta: string;
  soloCalendario: boolean;
  libros: boolean;
  concurrencia: number;
  volcar?: string;
  /** Carga en la base lo que dejó `--volcar` en una corrida anterior (sin volver a ejecutar Perl). */
  importar?: string;
  escribir: boolean;
};

/** Días por lote: acota la memoria (el resultado de cada lote se entrega y se descarta). */
const DIAS_POR_LOTE = 31;

export type AlLote = (lote: Acumulado) => Promise<void>;

export async function generar(op: Opciones, alLote: AlLote, log: (s: string) => void = console.log): Promise<void> {
  verificarInstalacion();
  limitarProcesos(op.concurrencia);
  const fechas = diasEntre(op.desde, op.hasta);
  for (const version of op.versiones) {
    log(`▶ Versión ${version}: ${fechas.length} días (${op.soloCalendario ? "solo calendario" : "textos completos"})`);
    const titulosEs = await mapaTitulosEs(version);
    for (let i = 0; i < fechas.length; i += DIAS_POR_LOTE) {
      const lote = fechas.slice(i, i + DIAS_POR_LOTE);
      const acum: Acumulado = { dias: [], documentos: [], bloques: new Map() };
      await mapConcurrente(lote, op.concurrencia, async (iso) => {
        // Laudes da el título del día; con textos completos también se guarda el documento.
        const htmlLaudes = await ejecutarHora(iso, version, "Laudes");
        const cab = parsearCabecera(htmlLaudes);
        if (!cab) throw new Error(`Sin cabecera en Laudes ${version} ${iso}`);
        acum.dias.push(filaDia(version, iso, cab, titulosEs));
        if (op.soloCalendario) return;
        const horas = await Promise.all(
          HORAS.map(async (hora) => (hora === "Laudes" ? htmlLaudes : await ejecutarHora(iso, version, hora))),
        );
        HORAS.forEach((hora, k) => {
          const r = parsearDocumento(horas[k], "hora");
          agregarBloques(acum, r.bloques);
          acum.documentos.push({
            version,
            tipo: "hora",
            clave: claveHora(iso, hora),
            fecha: iso,
            titulo: r.documento.titulo,
            secciones: r.documento.secciones,
          });
        });
        const misa = parsearDocumento(await ejecutarMisa(iso, version), "missa");
        agregarBloques(acum, misa.bloques);
        acum.documentos.push({
          version,
          tipo: "missa",
          clave: iso,
          fecha: iso,
          titulo: misa.documento.titulo,
          secciones: misa.documento.secciones,
        });
      });
      acum.dias.sort((a, b) => a.fecha.localeCompare(b.fecha));
      if (i === 0) {
        acum.documentos.push({ version, tipo: "kalendarium", clave: version, fecha: null, titulo: kalendarium(version), secciones: [] });
      }
      await alLote(acum);
      log(`  ${version}: ${Math.min(i + DIAS_POR_LOTE, fechas.length)}/${fechas.length} días`);
    }
    if (op.libros) {
      const acum: Acumulado = { dias: [], documentos: [], bloques: new Map() };
      await generarLibros(version, acum, log);
      await alLote(acum);
    }
  }
}

// ---------------------------------------------------------------- estadísticas, volcado y base

export class Estadisticas {
  dias = 0;
  documentos = 0;
  porTipo = new Map<string, number>();
  hashes = new Set<string>();
  bloquesVistos = 0;
  bytesBloquesUnicos = 0;
  bytesDocumentos = 0;

  sumar(l: Acumulado) {
    this.dias += l.dias.length;
    this.documentos += l.documentos.length;
    for (const d of l.documentos) {
      this.porTipo.set(d.tipo, (this.porTipo.get(d.tipo) ?? 0) + 1);
      this.bytesDocumentos += Buffer.byteLength(JSON.stringify(d.secciones)) + Buffer.byteLength(JSON.stringify(d.titulo));
    }
    for (const [h, b] of l.bloques) {
      this.bloquesVistos++;
      if (!this.hashes.has(h)) {
        this.hashes.add(h);
        this.bytesBloquesUnicos += Buffer.byteLength(JSON.stringify(b));
      }
    }
  }

  resumen(): string {
    return [
      `Días: ${this.dias}`,
      `Documentos: ${this.documentos} (${[...this.porTipo].map(([t, n]) => `${t}: ${n}`).join(", ")})`,
      `Bloques únicos: ${this.hashes.size} de ${this.bloquesVistos} vistos por lote (${(this.bytesBloquesUnicos / 1e6).toFixed(1)} MB de JSON)`,
      `Secciones + títulos de documentos: ${(this.bytesDocumentos / 1e6).toFixed(1)} MB de JSON`,
    ].join("\n");
  }
}

function volcarLote(l: Acumulado, dir: string) {
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, "dias.jsonl"), l.dias.map((x) => JSON.stringify(x)).join("\n") + (l.dias.length ? "\n" : ""));
  appendFileSync(join(dir, "documentos.jsonl"), l.documentos.map((x) => JSON.stringify(x)).join("\n") + (l.documentos.length ? "\n" : ""));
  appendFileSync(
    join(dir, "bloques.jsonl"),
    [...l.bloques].map(([hash, datos]) => JSON.stringify({ hash, datos })).join("\n") + (l.bloques.size ? "\n" : ""),
  );
}

const TAM_LOTE = 400;
const trozos = <T,>(xs: T[]) =>
  Array.from({ length: Math.ceil(xs.length / TAM_LOTE) }, (_, i) => xs.slice(i * TAM_LOTE, (i + 1) * TAM_LOTE));

type PrismaCliente = (typeof import("../../src/lib/prisma.ts"))["default"];

/** El SQL crudo no usa el `schema` del adaptador (sí lo usa el ORM): hay que calificar las tablas con él. */
export function esquemaDB(url = process.env.DATABASE_URL): string {
  const nombre = url ? new URL(url).searchParams.get("schema") : null;
  return `"${(nombre ?? "public").replace(/"/g, '""')}"`;
}

export async function escribirLote(
  prisma: Pick<PrismaCliente, "$executeRawUnsafe">,
  l: Acumulado,
  esquema = esquemaDB(),
) {
  for (const t of trozos([...l.bloques].map(([hash, datos]) => ({ hash, datos })))) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${esquema}."Bloques_Liturgicos" ("Hash","Datos")
       SELECT x."hash", x."datos" FROM jsonb_to_recordset($1::jsonb) AS x("hash" text, "datos" jsonb)
       ON CONFLICT ("Hash") DO NOTHING`,
      JSON.stringify(t),
    );
  }
  for (const t of trozos(l.dias)) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${esquema}."Dias_Liturgicos" ("Version","Fecha","Titulo","Titulo_Es","Rango","Lineas","Color","Tiempo","Dominical")
       SELECT x."version", x."fecha"::date, x."titulo", x."tituloEs", x."rango", x."lineas", x."color", x."tiempo", x."dominical"
       FROM jsonb_to_recordset($1::jsonb) AS x("version" text, "fecha" text, "titulo" text, "tituloEs" text, "rango" text, "lineas" jsonb, "color" text, "tiempo" text, "dominical" boolean)
       ON CONFLICT ("Version","Fecha") DO UPDATE SET "Titulo"=EXCLUDED."Titulo","Titulo_Es"=EXCLUDED."Titulo_Es","Rango"=EXCLUDED."Rango",
         "Lineas"=EXCLUDED."Lineas","Color"=EXCLUDED."Color","Tiempo"=EXCLUDED."Tiempo","Dominical"=EXCLUDED."Dominical"`,
      JSON.stringify(t),
    );
  }
  for (const t of trozos(l.documentos)) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${esquema}."Documentos_Liturgicos" ("Version","Tipo","Clave","Fecha","Titulo","Secciones")
       SELECT x."version", x."tipo", x."clave", x."fecha"::date, COALESCE(x."titulo", 'null'::jsonb), x."secciones"
       FROM jsonb_to_recordset($1::jsonb) AS x("version" text, "tipo" text, "clave" text, "fecha" text, "titulo" jsonb, "secciones" jsonb)
       ON CONFLICT ("Version","Tipo","Clave") DO UPDATE SET "Fecha"=EXCLUDED."Fecha","Titulo"=EXCLUDED."Titulo","Secciones"=EXCLUDED."Secciones"`,
      JSON.stringify(t),
    );
  }
}

/** Relee los .jsonl de `--volcar` y los entrega por lotes (los días y documentos van con sus bloques). */
export async function importarVolcado(dir: string, alLote: AlLote, tam = 2000): Promise<void> {
  const leer = (n: string) => {
    try {
      return readFileSync(join(dir, n), "utf8").split("\n").filter(Boolean);
    } catch {
      return [];
    }
  };
  const bloques = leer("bloques.jsonl").map((l) => JSON.parse(l) as { hash: string; datos: Bloque });
  const dias = leer("dias.jsonl").map((l) => JSON.parse(l) as FilaDia);
  const documentos = leer("documentos.jsonl").map((l) => JSON.parse(l) as FilaDocumento);
  // primero los bloques (los documentos solo guardan sus hashes), después días y documentos
  for (let i = 0; i < bloques.length; i += tam) {
    await alLote({ dias: [], documentos: [], bloques: new Map(bloques.slice(i, i + tam).map((b) => [b.hash, b.datos])) });
  }
  for (let i = 0; i < Math.max(dias.length, documentos.length); i += tam) {
    await alLote({ dias: dias.slice(i, i + tam), documentos: documentos.slice(i, i + tam), bloques: new Map() });
  }
}

// ---------------------------------------------------------------- CLI

export function parsearArgs(argv: string[]): Opciones {
  const get = (k: string) => {
    const i = argv.indexOf(`--${k}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const tiene = (k: string) => argv.includes(`--${k}`);
  const versiones = (get("versiones") ?? "1906,1888,1570").split(",").map((v) => v.trim());
  for (const v of versiones) if (!esVersionLiturgica(v)) throw new Error(`Versión inválida: ${v} (usá 1906, 1888 o 1570)`);
  const hoy = new Date();
  const desde = get("desde") ?? `${hoy.getUTCFullYear()}-01-01`;
  const hasta = get("hasta") ?? `${hoy.getUTCFullYear() + 1}-12-31`;
  fechaDeISO(desde);
  fechaDeISO(hasta);
  return {
    versiones: versiones as VersionLiturgica[],
    desde,
    hasta,
    soloCalendario: tiene("solo-calendario"),
    libros: tiene("libros"),
    concurrencia: Number(get("concurrencia") ?? 8),
    volcar: get("volcar"),
    importar: get("importar"),
    escribir: tiene("escribir"),
  };
}

async function main() {
  const op = parsearArgs(process.argv.slice(2));
  const t0 = Date.now();
  if (op.escribir && process.env.LITURGIA_CONFIRMADO !== "si") {
    throw new Error(
      "Escribir en la base de producción requiere LITURGIA_CONFIRMADO=si (la primera carga pide el OK del usuario).",
    );
  }
  const stats = new Estadisticas();
  let prisma: PrismaCliente | null = null;
  let bloquesAntes = 0;
  if (op.escribir) {
    prisma = (await import("../../src/lib/prisma.ts")).default;
    bloquesAntes = await prisma.bloqueLiturgico.count();
    console.log("Escribiendo en la base (upsert idempotente, por lotes)…");
  }
  const alLote: AlLote = async (lote) => {
    stats.sumar(lote);
    if (op.volcar) volcarLote(lote, op.volcar);
    if (prisma) await escribirLote(prisma, lote);
  };
  if (op.importar) await importarVolcado(op.importar, alLote);
  else await generar(op, alLote);
  console.log(stats.resumen());
  if (prisma) {
    const bloquesDespues = await prisma.bloqueLiturgico.count();
    await prisma.generacionLiturgica.create({
      data: {
        doCommit: DO_COMMIT,
        versiones: op.versiones.join(","),
        desde: new Date(`${op.desde}T00:00:00Z`),
        hasta: new Date(`${op.hasta}T00:00:00Z`),
        documentos: stats.documentos,
        bloques: bloquesDespues - bloquesAntes,
      },
    });
    await prisma.$disconnect();
    console.log(`Bloques nuevos en la base: ${bloquesDespues - bloquesAntes}`);
  } else {
    console.log("(ensayo: no se escribió nada en la base; agregá --escribir con LITURGIA_CONFIRMADO=si)");
  }
  console.log(`Listo en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

if (process.argv[1]?.endsWith("liturgia/generar.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
