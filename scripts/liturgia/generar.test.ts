import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { claveHora, diasEntre, esquemaDB, filaDia, importarVolcado, mapConcurrente, parsearArgs, type Acumulado } from "./generar.ts";

test("diasEntre incluye ambos extremos y cruza el fin de año", () => {
  assert.deepEqual(diasEntre("2026-12-30", "2027-01-02"), ["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
  assert.equal(diasEntre("2026-01-01", "2027-12-31").length, 730);
  assert.deepEqual(diasEntre("2026-10-14", "2026-10-14"), ["2026-10-14"]);
});

test("claveHora", () => assert.equal(claveHora("2026-10-14", "Laudes"), "2026-10-14/Laudes"));

test("filaDia: título, color y tiempo del 14-10-2026 (1906)", () => {
  const f = filaDia(
    "1906",
    "2026-10-14",
    {
      titulo: "S. Callisti Papæ et Martyris",
      rango: "Duplex",
      lineas: ["Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris"],
      color: "rojo",
    },
    new Map([["S. Callisti Papæ et Martyris", "S. Calixto, Papa y Mártir"]]),
  );
  assert.equal(f.tituloEs, "S. Calixto, Papa y Mártir");
  assert.equal(f.tiempo, "pentecostes");
  assert.equal(f.dominical, false);
  assert.equal(filaDia("1906", "2026-10-18", { titulo: "x", rango: "", lineas: [], color: "blanco" }).dominical, true);
});

test("mapConcurrente respeta el límite y el orden de los resultados", async () => {
  let activos = 0;
  let maximo = 0;
  const r = await mapConcurrente([1, 2, 3, 4, 5, 6], 2, async (x) => {
    activos++;
    maximo = Math.max(maximo, activos);
    await new Promise((ok) => setTimeout(ok, 5));
    activos--;
    return x * 10;
  });
  assert.deepEqual(r, [10, 20, 30, 40, 50, 60]);
  assert.ok(maximo <= 2);
});

test("parsearArgs: valores por defecto, versiones inválidas y ensayo por defecto", () => {
  const a = parsearArgs([]);
  assert.deepEqual(a.versiones, ["1906", "1888", "1570"]);
  assert.equal(a.escribir, false);
  assert.equal(a.concurrencia, 8);
  assert.throws(() => parsearArgs(["--versiones", "1960"]));
  const b = parsearArgs(["--versiones", "1906", "--desde", "2026-10-01", "--hasta", "2026-10-31", "--libros", "--escribir"]);
  assert.equal(b.libros, true);
  assert.equal(b.escribir, true);
});

test("esquemaDB califica con el schema de la URL (el SQL crudo no lo hereda del adaptador)", () => {
  assert.equal(esquemaDB("postgresql://u:p@h:5432/db?schema=family_tasker"), '"family_tasker"');
  assert.equal(esquemaDB("postgresql://u:p@h:5432/db"), '"public"');
  assert.equal(esquemaDB('postgresql://u:p@h/db?schema=a"b'), '"a""b"');
});

test("importarVolcado entrega primero los bloques y después días y documentos", async () => {
  const dir = mkdtempSync(join(tmpdir(), "liturgia-"));
  writeFileSync(join(dir, "bloques.jsonl"), JSON.stringify({ hash: "h1", datos: { la: [], es: null } }) + "\n");
  writeFileSync(join(dir, "dias.jsonl"), JSON.stringify({ version: "1906", fecha: "2026-10-14" }) + "\n");
  writeFileSync(join(dir, "documentos.jsonl"), JSON.stringify({ version: "1906", tipo: "hora", clave: "x" }) + "\n");
  const orden: string[] = [];
  await importarVolcado(dir, async (l: Acumulado) => {
    orden.push(`${l.bloques.size}/${l.dias.length}/${l.documentos.length}`);
  });
  assert.deepEqual(orden, ["1/0/0", "0/1/1"]);
});
