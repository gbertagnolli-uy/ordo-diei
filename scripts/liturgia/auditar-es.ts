// Auditoría del español de la liturgia (lane 258). SOLO LECTURA: recorre Bloques_Liturgicos y cuenta
// bloques sin español, líneas «falta» y español que parece inglés. Uso:
//   npm run liturgia:auditar-es -- <archivo-salida.md>
import { writeFileSync } from "node:fs";
import type { Bloque, Segmento } from "../../src/lib/liturgia/tipos.ts";
import { pareceIngles } from "./parser.ts";

export type Problema = "sin-es" | "lineas-falta" | "parece-ingles";

const textoDe = (s: Segmento): string | null => ("v" in s ? s.v : null);

export function auditarBloque(b: Bloque): Problema[] {
  const p: Problema[] = [];
  if (b.es === null || b.esFalta) {
    p.push("sin-es");
    return p;
  }
  if (b.es.some((s) => s.t === "falta")) p.push("lineas-falta");
  if (b.es.some((s) => {
    const t = textoDe(s);
    return t !== null && pareceIngles(t);
  })) p.push("parece-ingles");
  return p;
}

type Ejemplo = { hash: string; la: string; es: string };
const MAX_EJEMPLOS = 40;

const resumen = (segs: Segmento[] | null) =>
  (segs ?? []).map((s) => textoDe(s) ?? (s.t === "falta" ? "[falta]" : "")).filter(Boolean).join(" / ").slice(0, 240);

export function informe(conteo: Record<Problema, number>, total: number, ejemplos: Record<Problema, Ejemplo[]>): string {
  const lineas = [
    "# Auditoría del español de Liturgia (lane 258)",
    "",
    `Generado: ${new Date().toISOString()} · bloques revisados: ${total}`,
    "",
    "| Problema | Bloques |",
    "|---|---|",
    ...(Object.keys(conteo) as Problema[]).map((k) => `| ${k} | ${conteo[k]} |`),
  ];
  for (const k of Object.keys(ejemplos) as Problema[]) {
    lineas.push("", `## ${k} (primeros ${MAX_EJEMPLOS})`, "");
    for (const e of ejemplos[k]) lineas.push(`- \`${e.hash}\` · LA: ${e.la} · ES: ${e.es || "—"}`);
  }
  return lineas.join("\n") + "\n";
}

async function main() {
  const salida = process.argv[2];
  if (!salida) throw new Error("Falta el archivo de salida: npm run liturgia:auditar-es -- <archivo.md>");
  const prisma = (await import("../../src/lib/prisma.ts")).default;
  const conteo: Record<Problema, number> = { "sin-es": 0, "lineas-falta": 0, "parece-ingles": 0 };
  const ejemplos: Record<Problema, Ejemplo[]> = { "sin-es": [], "lineas-falta": [], "parece-ingles": [] };
  let total = 0;
  let cursor: string | undefined;
  for (;;) {
    const lote = await prisma.bloqueLiturgico.findMany({
      take: 1000,
      orderBy: { hash: "asc" },
      ...(cursor ? { skip: 1, cursor: { hash: cursor } } : {}),
    });
    if (lote.length === 0) break;
    for (const fila of lote) {
      total++;
      const b = fila.datos as unknown as Bloque;
      for (const p of auditarBloque(b)) {
        conteo[p]++;
        if (ejemplos[p].length < MAX_EJEMPLOS) ejemplos[p].push({ hash: fila.hash, la: resumen(b.la), es: resumen(b.es) });
      }
    }
    cursor = lote[lote.length - 1].hash;
  }
  writeFileSync(salida, informe(conteo, total, ejemplos));
  console.log(`✓ ${total} bloques revisados → ${salida}`);
  await prisma.$disconnect();
}

// Mismo criterio que generar.ts: main solo corre al ejecutar el script (no al importarlo desde el test)
if (process.argv[1]?.replace(/\\/g, "/").endsWith("liturgia/auditar-es.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
