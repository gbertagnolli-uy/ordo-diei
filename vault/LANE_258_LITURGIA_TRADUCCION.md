---
lane: 258
titulo: Corregir la traducción al español de Liturgia
plane: "#10"
estado: integrada
rama: task/lane-258-liturgia-traduccion
agente: "-"
actualizado: 2026-11-07
---

# Lane 258 — Corregir la traducción al español de Liturgia

## Especificación
Plane #10: «Corregir traducción al español de los textos de Liturgia» (sin descripción ni ejemplos).

Cómo está hoy (verificado):
- Los textos salen de **Divinum Officium** (columna latina + columna «Espanol»). `scripts/liturgia/generar.ts` los parsea y guarda cada fila como un **bloque** `{ la, es, esFalta? }` en `Bloques_Liturgicos`, identificado por el SHA-256 del bloque (`hash`). Los documentos (horas, misa, martirologio, libros) solo guardan listas de hashes.
- Cuando DO no trae español o lo trae en inglés, `aplicarRespaldoIdioma` deja `es = null` / `esFalta` o segmentos `{ t: "falta" }` (la UI dice «sin traducción»).
- No sabemos qué errores ve Gabriel: puede ser (a) líneas sin traducir, (b) restos en inglés, (c) traducción española de DO con errores o arcaísmos. Las tres se resuelven con el mismo mecanismo.

Plan en tres fases:
1. **Auditoría** (script de solo lectura): cuántos bloques tienen `es = null`, cuántos tienen líneas «falta» y cuántos parecen inglés, con ejemplos y su hash. Informe en el vault (`LITURGIA_AUDITORIA_ES.md`).
2. **Capa de correcciones** en el código: un mapa `hash → segmentos en español` que reemplaza el `es` del bloque al servirlo. No toca la base ni regenera nada, y sobrevive a cualquier regeneración (el hash del bloque no cambia mientras DO no cambie el texto).
3. **Contenido**: las correcciones las da o aprueba Gabriel (o salen de una fuente que él indique). **Ningún agente traduce por su cuenta** textos litúrgicos.

## Decisiones
- D1 · Corrección por hash de bloque, en un módulo TS versionado (no en la base): reversible, revisable en el PR y sin tocar producción (D-BP4).
- D2 · La corrección reemplaza **todo** el `es` del bloque y apaga `esFalta`. Los segmentos se escriben con los mismos tipos (`texto`, `versiculo`, `responsorio`, `antifona`, `verso`, `titulo`, `rubrica`, `cruz`) y en el mismo orden que el `la`.
- D3 · La auditoría lee la base (solo `SELECT`); la corre el orquestador, no agy.

## Arquitectura
- `scripts/liturgia/auditar-es.ts` (nuevo): función pura `auditarBloque()` + `main` que recorre `Bloques_Liturgicos` en lotes y escribe el informe.
- `scripts/liturgia/auditar-es.test.ts` (nuevo).
- `src/lib/liturgia/correccionesEs.ts` (nuevo): `CORRECCIONES_ES` y `aplicarCorreccion()`.
- `src/lib/liturgia/correccionesEs.test.ts` (nuevo).
- `src/lib/liturgia/lecturas.ts` › `resolverDocumento`: aplica la corrección.
- `package.json`: script `liturgia:auditar-es`.

## Archivos en alcance
- `scripts/liturgia/auditar-es.ts` · `scripts/liturgia/auditar-es.test.ts`
- `src/lib/liturgia/correccionesEs.ts` · `src/lib/liturgia/correccionesEs.test.ts`
- `src/lib/liturgia/lecturas.ts` · `package.json`

## Microtareas

### Fase 1 — auditoría

#### M1 · Script [agy]
- [x] hecha (agy)

Archivos: `scripts/liturgia/auditar-es.ts` (crear con este contenido exacto)
```ts
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
```
Verificación: `npx tsc --noEmit`. Si `pareceIngles` no está exportada de `./parser.ts`, **STOP**.

#### M2 · Tests [agy]
- [x] hecha (agy)

Archivos: `scripts/liturgia/auditar-es.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { auditarBloque, informe } from "./auditar-es.ts";

test("auditarBloque: sin español", () => {
  assert.deepEqual(auditarBloque({ la: [{ t: "texto", v: "Deus in adjutórium" }], es: null, esFalta: true }), ["sin-es"]);
});

test("auditarBloque: líneas falta e inglés", () => {
  const p = auditarBloque({
    la: [{ t: "texto", v: "Dóminus vobíscum" }, { t: "texto", v: "Orémus" }],
    es: [{ t: "falta" }, { t: "texto", v: "The Lord be with you and with the spirit of the people" }],
  });
  assert.deepEqual(p, ["lineas-falta", "parece-ingles"]);
});

test("auditarBloque: español correcto no tiene problemas", () => {
  assert.deepEqual(auditarBloque({ la: [{ t: "texto", v: "Dóminus vobíscum" }], es: [{ t: "texto", v: "El Señor esté con vosotros" }] }), []);
});

test("informe: incluye la tabla de conteos", () => {
  const md = informe({ "sin-es": 2, "lineas-falta": 1, "parece-ingles": 0 }, 10, { "sin-es": [], "lineas-falta": [], "parece-ingles": [] });
  assert.match(md, /\| sin-es \| 2 \|/);
});
```
Verificación: `npm test`. Si el test de inglés falla porque `pareceIngles` no reconoce la frase, **no cambies el detector**: cambiá la frase del test por una de `scripts/liturgia/parser.test.ts` que ya se detecte como inglés y anotalo.

#### M3 · Script npm [agy]
- [x] hecha (agy)

Archivos: `package.json`
Precondición: `grep -c '"liturgia:generar":' package.json` → `1`.
Pasos: reemplazar la línea `    "liturgia:generar": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/liturgia/generar.ts"` por:
```json
    "liturgia:generar": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/liturgia/generar.ts",
    "liturgia:auditar-es": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/liturgia/auditar-es.ts"
```
(Hoy es el último script del bloque `scripts`, seguido de `  },`.) Verificación: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`.

#### M4 · Correr la auditoría [orquestador]
- [x] hecha → `LITURGIA_AUDITORIA_ES.md`
`npm run liturgia:auditar-es -- ../../vault/LITURGIA_AUDITORIA_ES.md` (solo lectura). Resumir los números en Hallazgos y **mostrarle a Gabriel** los ejemplos para que diga qué quiere corregir y con qué fuente.

### Fase 2 — capa de correcciones

#### M5 · Módulo de correcciones [agy]
- [x] hecha (agy)

Archivos: `src/lib/liturgia/correccionesEs.ts` (crear con este contenido exacto)
```ts
// Correcciones al español de la liturgia (lane 258, Plane #10). Clave = hash del bloque (Bloques_Liturgicos);
// valor = el español completo de ese bloque, segmento por segmento, en el mismo orden que el latín.
// Solo se cargan correcciones dadas o aprobadas por Gabriel: los agentes NO traducen (vault/LANE_258).
import type { Bloque, Segmento } from "./tipos.ts";

export const CORRECCIONES_ES: Readonly<Record<string, Segmento[]>> = {
  // "<hash sha-256>": [{ t: "texto", v: "…" }],
};

export function aplicarCorreccion(hash: string, bloque: Bloque, correcciones: Readonly<Record<string, Segmento[]>> = CORRECCIONES_ES): Bloque {
  const es = correcciones[hash];
  if (!es) return bloque;
  return { ...bloque, es, esFalta: false };
}
```

#### M6 · Tests [agy]
- [x] hecha (agy)

Archivos: `src/lib/liturgia/correccionesEs.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { aplicarCorreccion } from "./correccionesEs.ts";

const bloque = { la: [{ t: "texto" as const, v: "Dóminus vobíscum" }], es: null, esFalta: true };

test("sin corrección devuelve el mismo bloque", () => {
  assert.equal(aplicarCorreccion("abc", bloque, {}), bloque);
});

test("con corrección reemplaza el español y apaga esFalta", () => {
  const r = aplicarCorreccion("abc", bloque, { abc: [{ t: "texto", v: "El Señor esté con vosotros" }] });
  assert.deepEqual(r.es, [{ t: "texto", v: "El Señor esté con vosotros" }]);
  assert.equal(r.esFalta, false);
  assert.deepEqual(r.la, bloque.la);
});
```

#### M7 · Aplicarla al servir [agy]
- [x] hecha (agy)

Archivos: `src/lib/liturgia/lecturas.ts`
Precondición: `grep -c '      return b ? \[b\] : \[\];' src/lib/liturgia/lecturas.ts` → `1`.
Pasos:
1. Debajo de `import type { DocumentoResuelto, Hora, SeccionResuelta, TituloDia, VersionLiturgica } from "./tipos.ts";` agregar `import { aplicarCorreccion } from "./correccionesEs.ts";`
2. Reemplazar `      return b ? [b] : [];` por `      return b ? [aplicarCorreccion(h, b)] : [];`
Verificación: gates (los tests de `lecturas.test.ts` tienen que seguir en verde).

### Fase 3 — contenido (orquestador + Gabriel)

#### M8 · Cargar correcciones [orquestador]
- [ ] hecha
Por cada corrección que dé o apruebe Gabriel: buscar el hash en el informe o en la base (`SELECT "Hash" FROM "Bloques_Liturgicos" WHERE "Datos"::text LIKE '%<texto latino>%'`), escribir la entrada en `CORRECCIONES_ES` con segmentos del mismo tipo y orden que `la`, y anotar la fuente en Hallazgos. Si Gabriel elige una fuente completa (otra traducción publicada), se arma un lote y agy solo **transcribe** entradas ya armadas por el orquestador.

## Criterios de aceptación
- Existe el informe de auditoría con números reales.
- Una corrección cargada se ve en la app (hora, misa o libro que use ese bloque) sin regenerar ni tocar la base.
- Ningún texto litúrgico fue traducido por un agente.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint scripts/liturgia/auditar-es.ts scripts/liturgia/auditar-es.test.ts src/lib/liturgia/correccionesEs.ts src/lib/liturgia/correccionesEs.test.ts src/lib/liturgia/lecturas.ts`

## Pendientes
- Gabriel: ejemplos concretos de lo que está mal y la fuente para corregir (después de M4).

## Hallazgos
- Auditoría 2026-11-07 (31 979 bloques de `Bloques_Liturgicos`, solo lectura): **sin-es 1906** (bloque sin español: muchos son rótulos de calendario en latín como «Dominica V Post Epiphaniam», y también lecturas/antífonas completas) · **lineas-falta 3289** (español con líneas «[falta]», incluidas lecturas largas y el martirologio) · **parece-ingles 0** (no quedó inglés detectable). El problema real es español incompleto, no inglés: Gabriel decide qué se corrige primero y con qué fuente (M8).

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #10
- 2026-11-07 · claude (orquestador) · INICIO · worktree creado, M1–M3 y M5–M7 delegadas a agy (M4 queda al orquestador)
- 2026-11-07 · claude (orquestador) · avance · M1–M3, M5–M7 por agy (cada línea = spec), gates: tsc 0 · eslint 0 · npm test 579/0/51; commit 08daad3. M4 corrida (ver Hallazgos). Falta M8 (correcciones: requiere decisión de Gabriel) y push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #75 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
