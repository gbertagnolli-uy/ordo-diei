import { test } from "node:test";
import assert from "node:assert/strict";
import { FORMATO_PAQUETE, leerPaquete, nombreArchivoPaquete } from "./paquete.ts";

const base = { formato: FORMATO_PAQUETE, version: 1, curso: { titulo: "Catecismo", tipo: "curso_videos", unidadTipo: "leccion" }, lecciones: [{ titulo: "El Credo", url: "https://youtu.be/x" }] };

test("un paquete mínimo es válido", () => {
  const r = leerPaquete(base);
  assert.equal(r.ok, true);
});

test("rechaza lo que no es un curso de Ordo, con mensaje en español", () => {
  for (const [malo, texto] of [
    [{ ...base, formato: "otra-cosa" }, "no es un curso de Ordo"],
    [{ ...base, version: 2 }, "versión más nueva"],
    [{ ...base, curso: { ...base.curso, titulo: "" } }, "no tiene título"],
    [{ ...base, curso: { ...base.curso, tipo: "magia" } }, ""],
    [null, ""],
    ["texto", ""],
  ] as const) {
    const r = leerPaquete(malo);
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.error.includes(texto), r.error);
  }
});

test("valida preguntas y material de las lecciones", () => {
  const malaPregunta = { ...base, lecciones: [{ titulo: "x", preguntas: [{ enunciado: "¿?", opciones: ["solo una"], correcta: 0 }] }] };
  assert.equal(leerPaquete(malaPregunta).ok, false);
  const bien = { ...base, lecciones: [{ titulo: "x", preguntas: [{ enunciado: "¿?", opciones: ["a", "b"], correcta: 1, segundoVideo: 30 }], materiales: [{ titulo: "Hoja", contenido: "# Hola", limiteImpresiones: 1 }] }] };
  assert.equal(leerPaquete(bien).ok, true);
  assert.equal(leerPaquete({ ...bien, lecciones: [{ titulo: "x", materiales: [{ titulo: "Hoja", limiteImpresiones: 99 }] }] }).ok, false);
});

test("nombreArchivoPaquete: sin acentos ni símbolos", () => {
  assert.equal(nombreArchivoPaquete("Catecismo de San Pío X: Lección 1"), "catecismo-de-san-pio-x-leccion-1.ordo-curso.json");
  assert.equal(nombreArchivoPaquete("¿¿??"), "curso.ordo-curso.json");
});
