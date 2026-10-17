import test from "node:test";
import assert from "node:assert/strict";
import { avisoCofre, avisoPrueba, avisoRegistrarDia, puedeAvisarHoy, suscripcionCaducada, validarSuscripcion } from "./avisos.ts";

test("los avisos tienen título, texto, destino y etiqueta", () => {
  for (const a of [avisoCofre(), avisoPrueba(), avisoRegistrarDia(["Ana"])!]) {
    assert.ok(a.title && a.body && a.tag);
    assert.match(a.url, /^\/dashboard/);
  }
});

test("el recordatorio a los padres nombra a quién falta y se acorta con muchos", () => {
  assert.equal(avisoRegistrarDia([]), null);
  assert.match(avisoRegistrarDia(["Ana", "Luis"])!.body, /^Ana, Luis:/);
  assert.match(avisoRegistrarDia(["A", "B", "C", "D", "E"])!.body, /^A, B, C y 2 más:/);
  assert.equal(avisoRegistrarDia(["Ana"])!.url, "/dashboard/admin/conducta");
});

test("un dispositivo recibe como máximo un aviso por día de la familia", () => {
  const zona = "America/Montevideo";
  const ahora = new Date("2026-10-16T21:00:00Z"); // 18:00 en Montevideo
  assert.equal(puedeAvisarHoy(null, ahora, zona), true);
  assert.equal(puedeAvisarHoy(new Date("2026-10-16T14:00:00Z"), ahora, zona), false); // hoy 11:00
  assert.equal(puedeAvisarHoy(new Date("2026-10-15T23:00:00Z"), ahora, zona), true); // ayer 20:00
  // 02:30Z del 17 sigue siendo el 16 para la familia (23:30)
  assert.equal(puedeAvisarHoy(new Date("2026-10-17T02:30:00Z"), new Date("2026-10-17T02:45:00Z"), zona), false);
});

test("la suscripción del navegador se valida", () => {
  const ok = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "BPx", auth: "xyz" } };
  assert.deepEqual(validarSuscripcion(ok), ok);
  assert.throws(() => validarSuscripcion({ ...ok, endpoint: "http://inseguro" }), /no es válida/);
  assert.throws(() => validarSuscripcion({ endpoint: ok.endpoint }), /no es válida/);
  assert.throws(() => validarSuscripcion(null), /no es válida/);
});

test("404 y 410 son suscripciones caducadas; el resto no", () => {
  assert.equal(suscripcionCaducada(410), true);
  assert.equal(suscripcionCaducada(404), true);
  assert.equal(suscripcionCaducada(500), false);
  assert.equal(suscripcionCaducada(undefined), false);
});
