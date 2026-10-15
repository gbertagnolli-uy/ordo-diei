import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_LECCIONES_POR_LOTE, parsearLinea, parsearLista } from "./listaLecciones.ts";

test("un enlace solo: sin título (se busca en la página)", () => {
  assert.deepEqual(parsearLinea("https://youtu.be/dQw4w9WgXcQ"), { titulo: "", url: "https://youtu.be/dQw4w9WgXcQ" });
  assert.deepEqual(parsearLinea("  - www.vimeo.com/123  "), { titulo: "", url: "www.vimeo.com/123" });
});

test("título y enlace en cualquier orden", () => {
  const esperado = { titulo: "El Credo", url: "https://youtu.be/x" };
  assert.deepEqual(parsearLinea("El Credo | https://youtu.be/x"), esperado);
  assert.deepEqual(parsearLinea("https://youtu.be/x | El Credo"), esperado);
  assert.deepEqual(parsearLinea("[El Credo](https://youtu.be/x)"), esperado);
  assert.deepEqual(parsearLinea("El Credo - https://youtu.be/x"), esperado);
  assert.deepEqual(parsearLinea("El Credo https://youtu.be/x"), esperado);
  assert.deepEqual(parsearLinea("3. El Credo\thttps://youtu.be/x"), esperado);
});

test("solo título: lección de texto", () => {
  assert.deepEqual(parsearLinea("* Repasar los mandamientos"), { titulo: "Repasar los mandamientos", url: null });
  assert.deepEqual(parsearLinea("Padre | Nuestro"), { titulo: "Padre Nuestro", url: null });
});

test("parsearLista: ignora vacías, respeta el orden y el tope", () => {
  assert.deepEqual(parsearLista("\n\nUno | https://a.com/1\n\n  \nhttps://a.com/2\r\nTres\n").map((l) => l.titulo), ["Uno", "", "Tres"]);
  assert.equal(parsearLista(Array.from({ length: 150 }, (_, i) => `L${i}`).join("\n")).length, MAX_LECCIONES_POR_LOTE);
  assert.deepEqual(parsearLista(""), []);
});
