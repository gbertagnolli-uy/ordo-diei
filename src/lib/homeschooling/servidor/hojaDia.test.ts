import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { darImpresionExtraDia, hojaDiaPorToken, hojasRestantes, registrarImpresionDia, resumenHojaDia } from "./hojaDia.ts";

// --- Sin base (solo lectura) ---
test("permisos: un hijo no da extras ni ve el resumen; un token que no existe es 404", async () => {
  const hijo = { id: 5, rol: "Hijo" };
  await assert.rejects(darImpresionExtraDia(hijo, 1), { status: 403 });
  await assert.rejects(resumenHojaDia(hijo, 1), { status: 403 });
  await assert.rejects(hojaDiaPorToken(hijo, "no-existe"), { status: 404 });
  await assert.rejects(registrarImpresionDia(hijo, 999999999), { status: 404 });
  assert.deepEqual([...(await hojasRestantes(5, [])).entries()], []);
  assert.equal((await hojasRestantes(5, [123])).get(123), 2);
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_hoja_${Date.now()}`;
const ids = { padre: 0, hijo: 0, hermano: 0, materia: 0, dia: 0 };

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") => prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.hermano = (await u("hermano", "Hijo")).id;
  ids.materia = (await prisma.materia.create({ data: { nombre: "M" + sufijo, creadorId: ids.padre } })).id;
  const recurso = await prisma.recursoCurso.create({ data: { materiaId: ids.materia, titulo: "Curso" + sufijo, creadorId: ids.padre, tipo: "libro", unidadTipo: "pagina", totalUnidades: 10 } });
  const plan = await prisma.planCurso.create({ data: { recursoId: recurso.id, alumnoId: ids.hijo, inicio: new Date("2031-01-01"), fin: new Date("2031-02-01"), diasSemana: [1] } });
  ids.dia = (await prisma.diaLectivo.create({ data: { planId: plan.id, fecha: new Date("2031-01-06"), unidadDesde: 1, unidadHasta: 3 } })).id;
});

after(async () => {
  if (!sinBase) {
    await prisma.materia.deleteMany({ where: { id: ids.materia } });
    await prisma.usuario.deleteMany({ where: { id: { in: [ids.padre, ids.hijo, ids.hermano].filter(Boolean) } } });
  }
  await prisma.$disconnect();
});

test("la hoja del día: dos impresiones, la tercera se niega, un extra la habilita, el hermano no entra", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const yo = { id: ids.hijo, rol: "Hijo" };
  const hermano = { id: ids.hermano, rol: "Hijo" };
  const a = await registrarImpresionDia(yo, ids.dia);
  assert.equal(a.restantes, 1);
  assert.equal((await registrarImpresionDia(yo, ids.dia)).restantes, 0);
  await assert.rejects(registrarImpresionDia(yo, ids.dia), { status: 409 });
  await assert.rejects(registrarImpresionDia(hermano, ids.dia), { status: 403 });
  assert.equal((await hojasRestantes(ids.hijo, [ids.dia])).get(ids.dia), 0);

  const hoja = await hojaDiaPorToken(yo, a.hojaUrl.split("/").pop()!);
  assert.deepEqual([hoja.alumno, hoja.rango, hoja.minutos], [`hijo${sufijo}`, "Páginas 1 a 3", 60]);
  await assert.rejects(hojaDiaPorToken(hermano, a.hojaUrl.split("/").pop()!), { status: 403 });

  await darImpresionExtraDia(padre, ids.dia);
  assert.equal((await registrarImpresionDia(yo, ids.dia)).restantes, 0);
  assert.deepEqual(await resumenHojaDia(padre, ids.dia), { usadas: 3, permitidas: 3 });
  assert.equal((await registrarImpresionDia(padre, ids.dia)).restantes, null);
});
