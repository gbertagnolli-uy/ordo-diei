import { test } from "node:test";
import assert from "node:assert/strict";
import { llevaPadding, migasDeRuta } from "./rutasDashboard.ts";

test("migasDeRuta elige el prefijo más largo y cae en un título genérico", () => {
  assert.deepEqual(migasDeRuta("/dashboard/biblioteca"), { group: "Lectura y escritura", title: "Biblioteca" });
  assert.equal(migasDeRuta("/dashboard/biblioteca/libro/12").title, "Libro");
  assert.equal(migasDeRuta("/dashboard/biblioteca/libro/12").groupHref, "/dashboard/biblioteca");
  assert.equal(migasDeRuta("/dashboard/diario/familia").title, "Diario familiar");
  assert.equal(migasDeRuta("/dashboard/admin/tienda").title, "Tienda");
  assert.equal(migasDeRuta("/dashboard/admin/tienda").group, "Administración");
  // Un prefijo no coincide a mitad de palabra
  assert.equal(migasDeRuta("/dashboard/premios").title, "Premios sorpresa");
  assert.equal(migasDeRuta("/dashboard/premio-grupal").title, "Premio grupal");
  // Ruta nueva sin entrada: hereda la de /dashboard; fuera de /dashboard o sin ruta, el nombre de la app
  assert.equal(migasDeRuta("/dashboard/algo-nuevo").title, "Inicio");
  assert.equal(migasDeRuta(null).title, "Ordo Diei");
});

test("llevaPadding: todo lleva padding salvo las pantallas de SIN_PADDING", () => {
  assert.equal(llevaPadding("/dashboard/biblioteca"), true);
  assert.equal(llevaPadding("/dashboard/algo-nuevo"), true);
  assert.equal(llevaPadding("/dashboard"), false);
  assert.equal(llevaPadding("/dashboard/notas"), false);
  assert.equal(llevaPadding("/dashboard/homeschooling/mensajes"), false);
  // La grilla de materias lleva padding; una materia no
  assert.equal(llevaPadding("/dashboard/homeschooling/materias"), true);
  assert.equal(llevaPadding("/dashboard/homeschooling/materias/7"), false);
  assert.equal(llevaPadding(null), true);
});
