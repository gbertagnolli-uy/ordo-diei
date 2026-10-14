import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  aplicarRespaldoIdioma,
  parsearCabecera,
  parsearDocumento,
  pareceIngles,
  slug,
} from "./parser.ts";
import type { Segmento } from "../../src/lib/liturgia/tipos.ts";

const DIR = fileURLToPath(new URL("./__fixtures__/", import.meta.url));
const leer = (n: string) => readFileSync(`${DIR}${n}.html`, "utf8");

// ---- título del día (SPEC §12): los textos exactos de Divinum Officium

test("título 14-10-2026 / 1906 (Laudes)", () => {
  const t = parsearCabecera(leer("laudes-1906-2026-10-14"));
  assert.ok(t);
  assert.equal(t.titulo, "S. Callisti Papæ et Martyris");
  assert.equal(t.rango, "Duplex");
  assert.equal(t.color, "rojo");
  assert.equal(
    t.lineas[0],
    "Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris",
  );
});

test("título 15-10-2026 / 1570 es Feria (Sta. Teresa no está en el calendario de 1570)", () => {
  const t = parsearCabecera(leer("laudes-1570-2026-10-15"));
  assert.ok(t);
  assert.match(t.titulo, /^Feria Quinta infra Hebdomadam XX/);
  assert.equal(t.rango, "Feria");
  assert.equal(t.color, "verde");
});

test("las tres versiones difieren el 14-10-2026 (Vísperas)", () => {
  const v1570 = parsearCabecera(leer("vespera-1570-2026-10-14"));
  const v1888 = parsearCabecera(leer("vespera-1888-2026-10-14"));
  assert.equal(v1570?.titulo, "S. Callisti Papæ et Martyris");
  assert.equal(v1570?.rango, "Semiduplex");
  assert.equal(v1888?.titulo, "S. Teresiæ Virginis");
  assert.equal(v1888?.lineas[0], "Commemoratio: S. Callisti Papæ et Martyris");
  assert.equal(v1888?.color, "blanco");
});

// ---- estructura

test("Laudes 1906: secciones en el orden de DO y bloques bilingües", () => {
  const { documento, bloques } = parsearDocumento(leer("laudes-1906-2026-10-14"), "hora");
  assert.deepEqual(
    documento.secciones.map((s) => s.clave),
    [
      "incipit",
      "psalmi",
      "capitulum-hymnus-versus",
      "canticum-benedictus",
      "oratio",
      "conclusio",
      "antiphona-finalis-b-m-v",
    ],
  );
  const incipit = bloques.get(documento.secciones[0].bloques[0])!;
  assert.deepEqual(incipit.la.find((s) => s.t === "versiculo"), {
    t: "versiculo",
    v: "Deus ✠ in adjutórium meum inténde.",
  });
  assert.deepEqual(incipit.es?.find((s) => s.t === "versiculo"), {
    t: "versiculo",
    v: "Dios ✠ mío, ven en mi auxilio.",
  });
  assert.equal(documento.secciones[0].tituloEs, "Rito de entrada");
});

test("salmos: título, números de verso y antífona quedan tipados", () => {
  const { documento, bloques } = parsearDocumento(leer("laudes-1906-2026-10-14"), "hora");
  const salmos = documento.secciones.find((s) => s.clave === "psalmi")!;
  const segs = salmos.bloques.flatMap((h) => bloques.get(h)!.la);
  assert.ok(segs.some((s) => s.t === "antifona" && s.v.startsWith("Qui me conféssus")));
  assert.ok(segs.some((s) => s.t === "titulo" && s.v === "Psalmus 92"));
  assert.ok(segs.some((s) => s.t === "verso" && s.num === "92:1"));
});

test("las capitulares decoradas se re-unen con su palabra", () => {
  const { bloques } = parsearDocumento(leer("laudes-1906-2026-10-14"), "hora");
  const todo = [...bloques.values()].flatMap((b) => b.la);
  const textos = todo.filter((s): s is Extract<Segmento, { v: string }> => "v" in s).map((s) => s.v);
  assert.ok(textos.some((v) => v.startsWith("Glória Patri")));
  assert.ok(textos.some((v) => v.startsWith("Tui precátus múnere")));
});

test("«N.» del Canon no se confunde con un título de sección", () => {
  const { documento } = parsearDocumento(leer("missa-1906-2026-10-14"), "missa");
  assert.ok(!documento.secciones.some((s) => s.tituloLa === "N."));
});

// ---- Misa: «propio» vs ordinario (SPIKE §9.5)

test("Misa 1906: el propio del día se marca por sección", () => {
  const { documento, bloques } = parsearDocumento(leer("missa-1906-2026-10-14"), "missa");
  const propias = documento.secciones.filter((s) => s.propio).map((s) => s.clave);
  assert.deepEqual(propias, [
    "introitus",
    "oratio",
    "lectio",
    "graduale",
    "evangelium",
    "offertorium",
    "secreta",
    "praefatio",
    "communio",
    "postcommunio",
  ]);
  const introito = documento.secciones.find((s) => s.clave === "introitus")!;
  const b = bloques.get(introito.bloques[0])!;
  assert.ok(b.la.some((s) => s.t === "texto" && s.v.startsWith("Státuit ei Dóminus")));
});

test("Misa: la Epístola en inglés de DO queda como «sin traducción» y no se muestra (D52)", () => {
  const { documento, bloques } = parsearDocumento(leer("missa-1906-2026-10-14"), "missa");
  const lectio = documento.secciones.find((s) => s.clave === "lectio")!;
  const b = bloques.get(lectio.bloques[0])!;
  assert.ok(b.es);
  assert.ok(b.es.some((s) => s.t === "falta"));
  const json = JSON.stringify(b.es);
  assert.ok(!json.includes("Lesson from"));
  assert.ok(!/Beloved/.test(json));
});

// ---- respaldo de idioma

test("respaldo: ninguna línea inglesa llega como español en todo el corpus de fixtures", () => {
  for (const f of [
    "laudes-1906-2026-10-14",
    "missa-1906-2026-10-14",
    "vespera-1570-2026-10-14",
    "vespera-1888-2026-10-14",
    "laudes-1570-2026-10-15",
  ]) {
    const modo = f.startsWith("missa") ? "missa" : "hora";
    const { bloques } = parsearDocumento(leer(f), modo);
    for (const b of bloques.values()) {
      for (const s of b.es ?? []) {
        if ("v" in s) assert.equal(pareceIngles(s.v), false, `${f}: «${s.v.slice(0, 60)}» parece inglés`);
      }
    }
  }
});

test("respaldo: sección española ausente ⇒ es = null y esFalta", () => {
  const la: Segmento[] = [{ t: "texto", v: "Deus, in adjutórium meum inténde: Dómine, ad adjuvándum me festína." }];
  const igual = aplicarRespaldoIdioma(la, [
    { t: "texto", v: "Deus, in adjutórium meum inténde: Dómine, ad adjuvándum me festína." },
  ]);
  assert.equal(igual.es, null);
  assert.equal(igual.esFalta, true);
  const vacio = aplicarRespaldoIdioma(la, []);
  assert.equal(vacio.es, null);
  assert.equal(vacio.esFalta, true);
});

test("respaldo: una referencia bíblica igual en ambos idiomas no es una falta", () => {
  const la: Segmento[] = [{ t: "rubrica", v: "1 Mac 4:52-55" }, { t: "texto", v: "Beátus vir qui timet Dóminum." }];
  const es: Segmento[] = [{ t: "rubrica", v: "1 Mac 4:52-55" }, { t: "texto", v: "Dichoso el hombre que teme al Señor." }];
  const b = aplicarRespaldoIdioma(la, es);
  assert.deepEqual(b.es, es);
  assert.equal(b.esFalta, undefined);
});

test("respaldo: heurística de inglés", () => {
  assert.equal(pareceIngles("Lesson from the Book of St. James the Apostle"), true);
  assert.equal(pareceIngles("James 1:12-18."), true);
  assert.equal(pareceIngles("Martyrology {anticipated}"), true);
  assert.equal(pareceIngles("Al que me reconozca delante de los hombres, yo también lo reconoceré"), false);
  assert.equal(pareceIngles("Dóminus vobíscum."), false);
});

// ---- deduplicación

test("deduplicación: dos días seguidos comparten bloques", () => {
  const a = parsearDocumento(leer("laudes-1906-2026-10-13"), "hora");
  const b = parsearDocumento(leer("laudes-1906-2026-10-14"), "hora");
  const nuevos = [...b.bloques.keys()].filter((h) => !a.bloques.has(h)).length;
  // 13 (feria) y 14 (fiesta de mártir) difieren en el propio; el ordinario se comparte.
  // En un mes entero solo el 11 % de las filas es único (SPIKE_MOTOR §9.2).
  assert.ok(nuevos / b.bloques.size < 0.6, `${nuevos}/${b.bloques.size}`);
  assert.ok(nuevos < b.bloques.size);
});

test("slug: sin tildes ni ligaduras", () => {
  assert.equal(slug("Præfatio"), "praefatio");
  assert.equal(slug("Canticum: Benedictus"), "canticum-benedictus");
});

// ---- dorados: el documento completo no cambia sin que alguien lo decida
test("dorados del parser", () => {
  const archivos = [
    ["laudes-1906-2026-10-14", "hora"],
    ["missa-1906-2026-10-14", "missa"],
    ["vespera-1570-2026-10-14", "hora"],
    ["vespera-1888-2026-10-14", "hora"],
  ] as const;
  const actual: Record<string, unknown> = {};
  for (const [f, modo] of archivos) actual[f] = parsearDocumento(leer(f), modo).documento;
  const ruta = `${DIR}dorados.json`;
  if (process.env.ACTUALIZAR_DORADOS === "1" || !existsSync(ruta)) {
    writeFileSync(ruta, JSON.stringify(actual, null, 1) + "\n");
  }
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(readFileSync(ruta, "utf8")));
});
