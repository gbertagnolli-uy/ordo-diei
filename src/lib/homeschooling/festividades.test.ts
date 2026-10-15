import { test } from "node:test";
import assert from "node:assert/strict";
import { aFestividades, COLOR_LITURGICO, esFestividadMarcada, tituloEnEspanol } from "./festividades.ts";

const d = (fecha: string, rango: string, dominical = false, tituloEs: string | null = null, color = "blanco") => ({ fecha, titulo: `T ${fecha}`, tituloEs, rango, color, dominical });

test("esFestividadMarcada: domingos y fiestas de 1.ª/2.ª clase", () => {
  assert.equal(esFestividadMarcada({ rango: "Duplex I. classis", dominical: false }), true);
  assert.equal(esFestividadMarcada({ rango: "Duplex II. classis", dominical: false }), true);
  assert.equal(esFestividadMarcada({ rango: "Semiduplex Dominica minor", dominical: true }), true);
  for (const rango of ["Duplex", "Semiduplex", "Simplex", "Feria", "Feria major", "Duplex majus", "Feria privilegiata"]) assert.equal(esFestividadMarcada({ rango, dominical: false }), false, rango);
});

test("aFestividades: filtra, usa el título en español, marca las mayores y ordena por fecha", () => {
  const r = aFestividades([
    d("2026-12-25", "Duplex I. classis", false, "La Natividad del Señor"),
    d("2026-10-18", "Semiduplex Dominica minor", true),
    d("2026-10-19", "Feria"),
    d("2026-11-01", "Duplex I. classis", false, null, "blanco"),
    d("2026-10-25", "Duplex II. classis", false, "Cristo Rey"),
  ]);
  assert.deepEqual(r.map((f) => f.fecha), ["2026-10-18", "2026-10-25", "2026-11-01", "2026-12-25"]);
  assert.equal(r[3].titulo, "La Natividad del Señor");
  assert.equal(r[2].titulo, "T 2026-11-01");
  assert.deepEqual(r.map((f) => f.mayor), [false, false, true, true]);
});

test("hay un color de fondo y de texto para cada color litúrgico", () => {
  for (const c of ["blanco", "rojo", "verde", "morado", "negro", "rosa"]) assert.ok(COLOR_LITURGICO[c].fondo.startsWith("#") && COLOR_LITURGICO[c].texto.startsWith("#"), c);
});

test("tituloEnEspanol: el de la base, si no la lista, si no el original", () => {
  assert.equal(tituloEnEspanol("S. Matthiæ Apostoli", "S. Matías, Apóstol"), "S. Matías, Apóstol");
  assert.equal(tituloEnEspanol("In Nativitate Domini", null), "La Natividad del Señor (Navidad)");
  assert.equal(tituloEnEspanol("In Conceptione Immaculata Beatæ Mariæ Virginis", null), "La Inmaculada Concepción");
  assert.equal(tituloEnEspanol("In Epiphania Domini", "  "), "La Epifanía del Señor");
  assert.equal(tituloEnEspanol("Titulus ignotus", null), "Titulus ignotus");
});
