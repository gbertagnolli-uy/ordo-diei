import { test } from "node:test";
import assert from "node:assert/strict";
import { combinarKalendarios, parsearKalendario } from "./kalendarios.ts";

const k1570 = parsearKalendario(`*January*
01-11=01-11~01-11cc=Sexta die infra Octavam Epiphaniae=2=S. Hygini Papæ et Martyris=1=
01-29=01-29=S. Francisci Salesii=3=
`);
const k1888 = parsearKalendario(`#solo diferencias
*January*
01-29=01-29=S. Francisci Salesii Episcopi Confessoris Ecclesiae Doctoris=3=
`);

test("parsea archivo, nombre, rango y conmemoración", () => {
  assert.deepEqual(k1570[0], {
    fecha: "01-11",
    archivo: "Sancti/01-11",
    nombre: "Sexta die infra Octavam Epiphaniae",
    rango: 2,
    conmemoracion: { archivo: "Sancti/01-11cc", nombre: "S. Hygini Papæ et Martyris", rango: 1 },
  });
});

test("1888 pisa a 1570 solo donde difiere; 1570 queda intacto", () => {
  const a = combinarKalendarios({ "1570": k1570, "1888": k1888 }, "1888");
  assert.equal(a.length, 2);
  assert.equal(a.find((e) => e.fecha === "01-29")?.nombre, "S. Francisci Salesii Episcopi Confessoris Ecclesiae Doctoris");
  const b = combinarKalendarios({ "1570": k1570, "1888": k1888 }, "1570");
  assert.equal(b.find((e) => e.fecha === "01-29")?.nombre, "S. Francisci Salesii");
});
