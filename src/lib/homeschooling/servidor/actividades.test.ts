import { test } from "node:test";
import assert from "node:assert/strict";
import { borrarActividad, crearActividad, editarActividad } from "./actividades.ts";
import { fijarMeta } from "./horas.ts";

const hijo = { id: 999999, rol: "Hijo" };
const d = { materiaId: 1, titulo: "Museo", inicio: new Date("2030-03-12T13:00:00Z"), fin: new Date("2030-03-12T14:30:00Z"), alumnoIds: [1] };

test("un Hijo no crea, edita ni borra actividades ni fija metas", async () => {
  await assert.rejects(crearActividad(hijo, d), { status: 403 });
  await assert.rejects(editarActividad(hijo, 1, d), { status: 403 });
  await assert.rejects(borrarActividad(hijo, 1), { status: 403 });
  await assert.rejects(fijarMeta(hijo, { alumnoId: 1, materiaId: 1, horas: 10 }), { status: 403 });
});

test("fin tiene que ser posterior al inicio y hace falta al menos un alumno (antes de tocar la base)", async () => {
  const padre = { id: 1, rol: "Padre" };
  await assert.rejects(crearActividad(padre, { ...d, fin: d.inicio }), { status: 400 });
  await assert.rejects(crearActividad(padre, { ...d, fin: new Date("2030-03-12T12:00:00Z") }), { status: 400 });
  await assert.rejects(crearActividad(padre, { ...d, alumnoIds: [] }), { status: 400 });
  await assert.rejects(crearActividad(padre, { ...d, titulo: "  " }), { status: 400 });
  await assert.rejects(fijarMeta(padre, { alumnoId: 1, materiaId: 1, horas: -1 }), { status: 400 });
});
