import { test } from "node:test";
import assert from "node:assert/strict";
import { leerPaquete } from "../paquete.ts";
import { BIBLIOTECA_CATOLICA, paqueteDeBiblioteca } from "./catolicos.ts";

test("cada paquete de la biblioteca es un paquete válido de curso", () => {
  for (const p of BIBLIOTECA_CATOLICA) {
    const r = leerPaquete(p.paquete);
    assert.equal(r.ok, true, `${p.clave}: ${r.ok ? "" : r.error}`);
  }
});

test("claves únicas, descripciones y lecciones con material para leer", () => {
  const claves = BIBLIOTECA_CATOLICA.map((p) => p.clave);
  assert.equal(new Set(claves).size, claves.length);
  for (const p of BIBLIOTECA_CATOLICA) {
    assert.ok(p.descripcion.length > 20 && p.edad.length > 3, p.clave);
    assert.ok(p.paquete.lecciones.length >= 4, p.clave);
    for (const l of p.paquete.lecciones) {
      assert.ok(l.titulo && l.instrucciones, `${p.clave}/${l.titulo}`);
      assert.ok((l.materiales?.[0]?.contenido ?? "").length > 40, `${p.clave}/${l.titulo}`);
    }
  }
});

test("cantidades exactas: 11 oraciones, 10 mandamientos, 7 sacramentos, 4 misterios, 5 tiempos, 14 obras", () => {
  const n = (c: string) => paqueteDeBiblioteca(c)!.paquete.lecciones.length;
  assert.deepEqual(["oraciones-del-cristiano", "diez-mandamientos", "siete-sacramentos", "rosario-en-familia", "anio-liturgico", "obras-de-misericordia"].map(n), [11, 10, 7, 4, 5, 14]);
  assert.equal(paqueteDeBiblioteca("nada"), null);
});

test("los textos de las oraciones son los del catálogo", () => {
  const padre = paqueteDeBiblioteca("oraciones-del-cristiano")!.paquete.lecciones.find((l) => l.titulo === "Padre nuestro")!;
  assert.match(padre.materiales![0].contenido!, /líbranos del mal/);
});
