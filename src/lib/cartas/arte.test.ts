// node --test src/lib/cartas/arte.test.ts — correcciones de la lane 39
import test from "node:test";
import assert from "node:assert/strict";
import { parsearGrado, rutaEnDiscoArte, rutaPermitida, urlArte } from "./arte.ts";
import { diasHastaFiesta, inicioDelDiaEnTz } from "./eventos.ts";

const carta = {
  imagenUrl: "/cartas/san-jose/1.webp",
  imagenGrado2Url: "/cartas/san-jose/2.webp",
  imagenGrado3Url: null,
  imagenGrado4Url: "/cartas/san-jose/4.webp",
  fragmentosRequeridos: 10,
};

test("parsearGrado: solo enteros 0 a 4 (antes ?grado=abc daba el grado IV)", () => {
  assert.equal(parsearGrado(null), 1);
  assert.equal(parsearGrado("0"), 0);
  assert.equal(parsearGrado("4"), 4);
  for (const malo of ["abc", "", "5", "-1", "2.5", "1e1", " 2", "NaN"]) assert.equal(parsearGrado(malo), null, malo);
});

test("rutaPermitida: solo el arte del grado actual; bloqueada ve el grado I", () => {
  assert.equal(rutaPermitida(carta, 0, 0), "/cartas/san-jose/1.webp");
  assert.equal(rutaPermitida(carta, 10, 1), "/cartas/san-jose/1.webp");
  assert.equal(rutaPermitida(carta, 15, 2), "/cartas/san-jose/2.webp");
  assert.equal(rutaPermitida(carta, 20, 3), "/cartas/san-jose/2.webp"); // grado III sin imagen propia → la del II
  assert.equal(rutaPermitida(carta, 30, 4), "/cartas/san-jose/4.webp");
  // D20: con fragmentos para el grado IV pero solo el II reclamado, se ve el II
  assert.equal(rutaPermitida(carta, 30, 2), "/cartas/san-jose/2.webp");
});

test("rutaEnDiscoArte y urlArte: arte fuera de public/, sin salir de su carpeta", () => {
  assert.equal(rutaEnDiscoArte("/cartas/san-jose/2.webp"), "arte-cartas/san-jose/2.webp");
  assert.equal(rutaEnDiscoArte("/api/archivos/0f8fad5b-d9cb-469f-a165-70867728950e"), null); // va por la base
  for (const mala of ["/cartas/../.env", "/cartas/san-jose/../../.env", "/etc/passwd", "/cartas/x/1.svg", "/uploads/../.env"]) {
    assert.equal(rutaEnDiscoArte(mala), null, mala);
  }
  assert.equal(urlArte("/cartas/san-jose/1.webp"), "/api/cartas/arte?ruta=%2Fcartas%2Fsan-jose%2F1.webp");
  assert.equal(urlArte("/api/archivos/0f8fad5b-d9cb-469f-a165-70867728950e"), "/api/archivos/0f8fad5b-d9cb-469f-a165-70867728950e");
  assert.equal(urlArte(null), "");
});

test("fechas en la zona de la familia (Montevideo, UTC-3), no en la del servidor", () => {
  // 01:00 UTC del 11-oct = 22:00 del 10-oct en Montevideo
  const ahora = new Date("2026-10-11T01:00:00Z");
  assert.equal(inicioDelDiaEnTz(ahora, "America/Montevideo").getTime(), Date.parse("2026-10-10T03:00:00.000Z"));
  assert.equal(diasHastaFiesta("10-10", ahora, "America/Montevideo"), 0);
  assert.equal(diasHastaFiesta("10-11", ahora, "America/Montevideo"), 1);
  assert.equal(diasHastaFiesta("10-09", ahora, "America/Montevideo"), 364);
});
