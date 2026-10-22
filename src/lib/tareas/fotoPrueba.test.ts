import { test } from "node:test";
import assert from "node:assert/strict";
import { fotoPruebaPendiente, pideFotoPrueba } from "./fotoPrueba.ts";

test("una tarea sin exigencia de foto no tiene la foto pendiente", () => {
  assert.equal(fotoPruebaPendiente({ requiereFotoPrueba: false, fotoPruebaUrl: null }), false);
  assert.equal(pideFotoPrueba({ requiereFotoPrueba: false, fotoPruebaUrl: null }), false);
});

test("una tarea que exige foto y todavía no la subió está pendiente", () => {
  assert.equal(fotoPruebaPendiente({ requiereFotoPrueba: true, fotoPruebaUrl: null }), true);
  assert.equal(pideFotoPrueba({ requiereFotoPrueba: true, fotoPruebaUrl: null }), true);
});

test("una tarea que exige foto y ya la subió no está pendiente", () => {
  const tarea = { requiereFotoPrueba: true, fotoPruebaUrl: "/api/archivos/018f4e1a-0000-4000-8000-000000000000" };
  assert.equal(fotoPruebaPendiente(tarea), false);
  assert.equal(pideFotoPrueba(tarea), true);
});

test("una foto existente se sigue mostrando aunque la exigencia se haya apagado", () => {
  assert.equal(fotoPruebaPendiente({ requiereFotoPrueba: false, fotoPruebaUrl: "/api/archivos/abc" }), false);
  assert.equal(pideFotoPrueba({ requiereFotoPrueba: false, fotoPruebaUrl: "/api/archivos/abc" }), true);
});
