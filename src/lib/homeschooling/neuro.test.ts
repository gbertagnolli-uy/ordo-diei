import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirVista, errorDePasos, normalizarPasos, PLANTILLAS_HISTORIA } from "./neuro.ts";

test("decidirVista: normal, primero-después y relajado", () => {
  assert.deepEqual(decidirVista({ modoRelajado: false, primeroDespues: false }), { layout: "normal", relajado: false });
  assert.deepEqual(decidirVista({ modoRelajado: false, primeroDespues: true }), { layout: "primero-despues", relajado: false });
  assert.deepEqual(decidirVista({ modoRelajado: true, primeroDespues: false }), { layout: "normal", relajado: true });
  assert.deepEqual(decidirVista({ modoRelajado: true, primeroDespues: true }), { layout: "primero-despues", relajado: true });
});

test("normalizarPasos: recorta, descarta vacíos y reemplaza íconos inválidos", () => {
  const r = normalizarPasos([{ texto: "  Hola  ", icono: "Sun" }, { texto: "   ", icono: "Sun" }, { texto: "Chau", icono: "NoExiste" }, { texto: "x".repeat(300), icono: "Home" }]);
  assert.equal(r.length, 3);
  assert.deepEqual(r[0], { texto: "Hola", icono: "Sun" });
  assert.equal(r[1].icono, "Check");
  assert.equal(r[2].texto.length, 120);
});

test("errorDePasos: de 3 a 5 pasos con texto", () => {
  const paso = (n: number) => Array.from({ length: n }, (_, i) => ({ texto: `Paso ${i + 1}`, icono: "Check" }));
  assert.ok(errorDePasos(paso(2)));
  assert.equal(errorDePasos(paso(3)), null);
  assert.equal(errorDePasos(paso(5)), null);
  assert.ok(errorDePasos(paso(6)));
  assert.ok(errorDePasos([...paso(2), { texto: " ", icono: "Check" }])); // el vacío no cuenta
});

test("las 3 plantillas son válidas", () => {
  assert.deepEqual(PLANTILLAS_HISTORIA.map((p) => p.titulo), ["Hoy no hay clase", "Vamos al médico", "Vienen visitas"]);
  for (const p of PLANTILLAS_HISTORIA) {
    assert.equal(errorDePasos(p.pasos), null, p.titulo);
    assert.deepEqual(normalizarPasos(p.pasos), p.pasos, p.titulo); // ya vienen normalizadas
  }
});
