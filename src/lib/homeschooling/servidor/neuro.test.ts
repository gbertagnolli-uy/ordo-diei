import { test } from "node:test";
import assert from "node:assert/strict";
import { borrarHistoria, crearHistoria, editarHistoria, guardarPreferencia, listarHistorias, mostrarHoy } from "./neuro.ts";

const hijo = { id: 999999, rol: "Hijo" };
const pasos = [1, 2, 3].map((n) => ({ texto: `Paso ${n}`, icono: "Check" }));

test("un Hijo no administra historias sociales", async () => {
  await assert.rejects(listarHistorias(hijo), { status: 403 });
  await assert.rejects(crearHistoria(hijo, { titulo: "x", pasos }), { status: 403 });
  await assert.rejects(editarHistoria(hijo, 1, { titulo: "x", pasos }), { status: 403 });
  await assert.rejects(borrarHistoria(hijo, 1), { status: 403 });
  await assert.rejects(mostrarHoy(hijo, 1, [1]), { status: 403 });
});

test("el alumno solo cambia su propio modo relajado; lo demás es de los padres", async () => {
  await assert.rejects(guardarPreferencia(hijo, 1, { modoRelajado: true }), { status: 403 }); // de otro alumno
  await assert.rejects(guardarPreferencia(hijo, hijo.id, { primeroDespues: true }), { status: 403 });
  await assert.rejects(guardarPreferencia(hijo, hijo.id, { modoRelajado: true, recompensaDespues: "Lego" }), { status: 403 });
});

test("una historia necesita de 3 a 5 pasos con texto (se valida antes de tocar la base)", async () => {
  const padre = { id: 1, rol: "Padre" };
  await assert.rejects(crearHistoria(padre, { titulo: "Corta", pasos: pasos.slice(0, 2) }), { status: 400 });
  await assert.rejects(crearHistoria(padre, { titulo: "Larga", pasos: [...pasos, ...pasos] }), { status: 400 });
  await assert.rejects(crearHistoria(padre, { titulo: "  ", pasos }), { status: 400 });
});
