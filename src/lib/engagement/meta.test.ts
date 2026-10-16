import test from "node:test";
import assert from "node:assert/strict";
import { cumple, lunesAnterior, lunesDe, lunesSiguiente, porcentaje, sugerirObjetivo, validarMeta } from "./meta.ts";

test("la semana va de lunes a domingo", () => {
  assert.equal(lunesDe("2026-10-16"), "2026-10-12"); // viernes
  assert.equal(lunesDe("2026-10-12"), "2026-10-12"); // lunes
  assert.equal(lunesDe("2026-10-18"), "2026-10-12"); // domingo
  assert.equal(lunesDe("2026-10-19"), "2026-10-19");
  assert.equal(lunesSiguiente("2026-10-12"), "2026-10-19");
  assert.equal(lunesAnterior("2026-10-12"), "2026-10-05");
  assert.equal(lunesSiguiente("2026-12-28"), "2027-01-04");
});

test("objetivo sugerido: un poco más que la semana pasada, con un piso", () => {
  assert.equal(sugerirObjetivo(0), 10);
  assert.equal(sugerirObjetivo(2), 5);
  assert.equal(sugerirObjetivo(40), 44);
  assert.equal(sugerirObjetivo(41), 46);
});

test("validación de la meta", () => {
  assert.deepEqual(validarMeta({ objetivo: "30", premio: "  Noche de pizza " }), { objetivo: 30, premio: "Noche de pizza" });
  assert.throws(() => validarMeta({ objetivo: 0, premio: "Pizza" }), /entre 1 y/);
  assert.throws(() => validarMeta({ objetivo: 1.5, premio: "Pizza" }), /entero/);
  assert.throws(() => validarMeta({ objetivo: 10, premio: "  " }), /premio/);
  assert.throws(() => validarMeta({ objetivo: 10, premio: "x".repeat(81) }), /80/);
});

test("avance y cumplimiento", () => {
  assert.equal(porcentaje(0, 20), 0);
  assert.equal(porcentaje(5, 20), 25);
  assert.equal(porcentaje(19, 20), 95);
  assert.equal(porcentaje(30, 20), 100);
  assert.equal(cumple(19, 20), false);
  assert.equal(cumple(20, 20), true);
});
