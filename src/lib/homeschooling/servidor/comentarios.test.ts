import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { alternarReaccion, borrarComentario, comentar, conversacion } from "./comentarios.ts";
import { contarSinLeer, marcarLeidos, misAvisos } from "./avisos.ts";

// --- Sin base: se rechaza antes de consultar ---
test("un comentario vacío o enorme y una reacción rara se rechazan", async () => {
  const a = { id: 1, rol: "Padre" };
  await assert.rejects(comentar(a, { leccionId: 1 }, "   "), { status: 400 });
  await assert.rejects(comentar(a, { leccionId: 1 }, "x".repeat(1001)), { status: 400 });
  await assert.rejects(alternarReaccion(a, { comentarioId: 1 }, "😂"), { status: 400 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_com_${Date.now()}`;
const ids = { padre: 0, hijo: 0, hermano: 0, materia: 0, recurso: 0, leccion: 0 };

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") => prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.hermano = (await u("hermano", "Hijo")).id;
  ids.materia = (await prisma.materia.create({ data: { nombre: "M" + sufijo, creadorId: ids.padre } })).id;
  ids.recurso = (await prisma.recursoCurso.create({ data: { materiaId: ids.materia, titulo: "C" + sufijo, creadorId: ids.padre, tipo: "curso_videos", unidadTipo: "leccion", totalUnidades: 1 } })).id;
  ids.leccion = (await prisma.leccionCurso.create({ data: { recursoId: ids.recurso, orden: 1, titulo: "L" + sufijo, creadorId: ids.padre } })).id;
  await prisma.planCurso.create({ data: { recursoId: ids.recurso, alumnoId: ids.hijo, inicio: new Date("2031-01-01"), fin: new Date("2031-02-01"), diasSemana: [1] } });
});

after(async () => {
  if (!sinBase) {
    await prisma.materia.deleteMany({ where: { id: ids.materia } });
    await prisma.usuario.deleteMany({ where: { id: { in: [ids.padre, ids.hijo, ids.hermano].filter(Boolean) } } });
  }
  await prisma.$disconnect();
});

test("la conversación de una lección: el hijo escribe y avisa a los padres; el hermano no entra; el padre responde y avisa al hijo", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const hijo = { id: ids.hijo, rol: "Hijo" };
  const hermano = { id: ids.hermano, rol: "Hijo" };
  const d = { leccionId: ids.leccion };

  const c1 = await comentar(hijo, d, "No entendí el segundo punto");
  assert.equal(c1.autor.esPadre, false);
  await assert.rejects(conversacion(hermano, d), { status: 403 });
  await assert.rejects(comentar(hermano, d, "hola"), { status: 403 });
  assert.ok((await contarSinLeer(ids.padre)) >= 1);

  const c2 = await comentar(padre, d, "Lo vemos juntos esta tarde");
  assert.equal((await misAvisos(hijo)).sinLeer, 1);
  assert.match((await misAvisos(hijo)).avisos[0].titulo, new RegExp(`padre${sufijo}`));

  const conv = await conversacion(hijo, d);
  assert.deepEqual(conv.comentarios.map((c) => c.id), [c1.id, c2.id]);
  assert.equal(conv.comentarios[0].puedeBorrar, true);
  assert.equal(conv.comentarios[1].puedeBorrar, false);

  const r = await alternarReaccion(hijo, { comentarioId: c2.id }, "🙏");
  assert.deepEqual([r["🙏"].total, r["🙏"].mia], [1, true]);
  assert.equal((await alternarReaccion(hijo, { comentarioId: c2.id }, "🙏"))["🙏"].total, 0);

  await assert.rejects(borrarComentario(hijo, c2.id), { status: 403 });
  await borrarComentario(padre, c1.id);
  await borrarComentario(hijo, c2.id).catch(() => {});
  assert.equal(await marcarLeidos(hijo), 1);
});
