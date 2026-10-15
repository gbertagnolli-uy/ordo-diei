import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { crearMaterial } from "./materiales.ts";
import { darImpresionExtra, hojaPorToken, registrarImpresion, resumenImpresiones } from "./impresiones.ts";

const hijo = { id: 999999, rol: "Hijo" };

// --- Sin base: permisos ---
test("un Hijo no da impresiones extra ni ve el resumen", async () => {
  await assert.rejects(darImpresionExtra(hijo, 1, 2), { status: 403 });
  await assert.rejects(resumenImpresiones(hijo, 1), { status: 403 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_imp_${Date.now()}`;
const ids = { padre: 0, hijo: 0, hermano: 0 };

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") => prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.hermano = (await u("hermano", "Hijo")).id;
});

after(async () => {
  if (!sinBase) await prisma.usuario.deleteMany({ where: { id: { in: [ids.padre, ids.hijo, ids.hermano].filter(Boolean) } } });
  await prisma.$disconnect();
});

test("el tope: dos impresiones y la tercera se niega; un extra del padre la habilita; la hoja es solo suya", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const yo = { id: ids.hijo, rol: "Hijo" };
  const hermano = { id: ids.hermano, rol: "Hijo" };
  const m = await crearMaterial(padre, { destino: { alumnoId: ids.hijo, fecha: "2031-05-06" }, entrada: "# Hoja\nResolvé los ejercicios" });

  const a = await registrarImpresion(yo, m.id);
  assert.equal(a.restantes, 1);
  assert.match(a.hojaUrl ?? "", /^\/dashboard\/homeschooling\/imprimir\/[0-9a-f-]{36}$/);
  assert.equal((await registrarImpresion(yo, m.id)).restantes, 0);
  await assert.rejects(registrarImpresion(yo, m.id), { status: 409 });
  await assert.rejects(registrarImpresion(hermano, m.id), { status: 403 });

  const token = a.hojaUrl!.split("/").pop()!;
  assert.equal((await hojaPorToken(yo, token)).material.titulo, "Hoja");
  await assert.rejects(hojaPorToken(hermano, token), { status: 403 });
  assert.equal((await hojaPorToken(padre, token)).alumno, `hijo${sufijo}`);

  await darImpresionExtra(padre, m.id, ids.hijo);
  assert.equal((await registrarImpresion(yo, m.id)).restantes, 0);
  const resumen = await resumenImpresiones(padre, m.id);
  assert.deepEqual(resumen.map((r) => [r.usadas, r.permitidas]), [[3, 3]]);
  await assert.rejects(darImpresionExtra(padre, m.id, ids.padre), { status: 400 });
});

test("límite 0 o tipo no imprimible: no se imprime", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const yo = { id: ids.hijo, rol: "Hijo" };
  const cero = await crearMaterial(padre, { destino: { alumnoId: ids.hijo, fecha: "2031-05-06" }, entrada: "texto", limiteImpresiones: 0 });
  await assert.rejects(registrarImpresion(yo, cero.id), { status: 400 });
  const video = await crearMaterial(padre, { destino: { alumnoId: ids.hijo, fecha: "2031-05-06" }, entrada: "https://youtu.be/dQw4w9WgXcQ", titulo: "v" });
  await assert.rejects(registrarImpresion(yo, video.id), { status: 400 });
});
