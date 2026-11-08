import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFINICIONES,
  HERRAMIENTAS,
  decodificarArgs,
  definicionDe,
  esHerramienta,
  idsDe,
  itemsDe,
  modoPermisoDe,
  necesitaConfirmacion,
  nivelDe,
  omitida,
  registroDe,
  resumenDe,
  type Herramienta,
} from "./herramientas.ts";

test("cada herramienta tiene definición con esquema de objeto, y a la inversa", () => {
  assert.deepEqual(DEFINICIONES.map((d) => d.nombre).sort(), [...HERRAMIENTAS].sort());
  for (const d of DEFINICIONES) {
    assert.equal((d.esquema as { type: string }).type, "object", d.nombre);
    assert.ok(d.descripcion.length > 20, d.nombre);
  }
  assert.equal(definicionDe("nada"), undefined);
  assert.ok(esHerramienta("getDiary") && !esHerramienta("runJavascript") && !esHerramienta(3));
});

test("niveles: lectura, escritura y destructivo (moodiary assistantToolTier)", () => {
  const lecturas: Herramienta[] = ["searchDiaries", "getDiary", "diaryOverview", "listCategories"];
  for (const h of lecturas) assert.equal(nivelDe(h, {}), "read", h);
  for (const h of ["createDiary", "createCategory", "updateCategory"] as const) assert.equal(nivelDe(h, {}), "write", h);
  assert.equal(nivelDe("deleteCategory", {}), "destructive");
  // D7: acá borrar una entrada es permanente
  assert.equal(nivelDe("deleteDiary", { ids: [1] }), "destructive");
  // Cambiar el texto pisa lo que había; cambiar solo el ánimo o el título no
  assert.equal(nivelDe("updateDiary", { items: [{ id: 1, content: "nuevo" }] }), "destructive");
  assert.equal(nivelDe("updateDiary", { items: [{ id: 1, title: "t", mood: 4 }] }), "write");
  assert.equal(nivelDe("updateDiary", { items: [{ id: 1 }, { id: 2, content: "x" }] }), "destructive");
});

test("permisos: confirm pide para todo lo que escribe, auto solo para lo destructivo, full no pide", () => {
  assert.deepEqual(["read", "write", "destructive"].map((n) => necesitaConfirmacion("confirm", n as never)), [false, true, true]);
  assert.deepEqual(["read", "write", "destructive"].map((n) => necesitaConfirmacion("auto", n as never)), [false, false, true]);
  assert.deepEqual(["read", "write", "destructive"].map((n) => necesitaConfirmacion("full", n as never)), [false, false, false]);
  assert.equal(modoPermisoDe("auto"), "auto");
  assert.equal(modoPermisoDe("raro"), "confirm");
  assert.equal(modoPermisoDe(undefined), "confirm");
});

test("ids e items: acepta lista, objeto suelto o ids repartidos", () => {
  assert.deepEqual(idsDe({ ids: [3, " 4 ", "", 3] }), ["3", "4"]);
  assert.deepEqual(idsDe({ id: 7 }), ["7"]);
  assert.deepEqual(idsDe({}), []);
  assert.deepEqual(itemsDe({ items: [{ a: 1 }, 5, { b: 2 }] }), [{ a: 1 }, { b: 2 }]);
  assert.deepEqual(itemsDe({ items: { a: 1 } }), [{ a: 1 }]);
  assert.deepEqual(itemsDe({ ids: [1, 2], tipo: "x" }), [
    { tipo: "x", id: "1" },
    { tipo: "x", id: "2" },
  ]);
  assert.deepEqual(itemsDe({ query: "q" }), [{ query: "q" }]);
});

test("omitida avisa que no hay que reintentar", () => {
  assert.match(omitida("deleteDiary"), /^Skipped: the user declined deleteDiary\. Do not retry it/);
});

test("decodificarArgs tolera vacío, basura y valores que no son objeto", () => {
  assert.deepEqual(decodificarArgs(""), {});
  assert.deepEqual(decodificarArgs("{no"), {});
  assert.deepEqual(decodificarArgs("[1]"), {});
  assert.deepEqual(decodificarArgs('{"a":1}'), { a: 1 });
});

test("resumen de una línea por herramienta", () => {
  assert.equal(resumenDe("searchDiaries", { query: "playa", startDate: "2026-01-01", endDate: "2026-02-01" }, "3 matches:\nid=1"), "3 entradas · playa · 2026-01-01 – 2026-02-01");
  assert.equal(resumenDe("searchDiaries", {}, "No diaries match keywords \"x\"."), "Sin resultados");
  assert.equal(resumenDe("searchDiaries", {}, "at least 20 matches; the first 8 follow."), "20 entradas");
  assert.equal(resumenDe("getDiary", { ids: [1, 2] }, "id=1"), "Leyó 2 entradas");
  assert.equal(resumenDe("diaryOverview", {}, "Total entries=12\nspan=..."), "12 entradas");
  assert.equal(resumenDe("listCategories", {}, "id=1 name=A\nid=2 name=B"), "2 categorías");
  assert.equal(resumenDe("createDiary", { items: [{ title: "Hola", content: "x" }] }, "Created"), "Hola");
  assert.equal(resumenDe("createDiary", { items: [{ content: "x" }, { content: "y" }] }, "Created"), "2 entradas nuevas");
  assert.equal(resumenDe("deleteDiary", { ids: [1] }, "Deleted"), "Borró una entrada");
  assert.equal(resumenDe("deleteDiary", { ids: [1, 2, 3] }, "Deleted"), "Borró 3 entradas");
  assert.equal(resumenDe("updateDiary", { items: [{ id: 1 }] }, "Updated"), "Entrada editada");
  assert.equal(resumenDe("createDiary", {}, "Failed: nope"), "Falló");
  assert.equal(resumenDe("deleteDiary", {}, omitida("deleteDiary")), "Rechazada");
});

test("registro de lo ya ejecutado: solo las llamadas terminadas", () => {
  assert.equal(registroDe([]), "");
  const r = registroDe([
    { id: "a", nombre: "searchDiaries", args: '{"query":"playa"}', resultado: "2 matches:\nid=1\nid=2", hecha: true },
    { id: "b", nombre: "getDiary", args: "", resultado: "", hecha: false },
    { id: "c", nombre: "diaryOverview", args: "", resultado: "Total entries=5", hecha: true },
  ]);
  assert.equal(r, '[tools already run]\n- searchDiaries({"query":"playa"}) → 2 entradas · playa\n- diaryOverview({}) → 5 entradas');
});
