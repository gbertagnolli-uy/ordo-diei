import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { borrarPublicacion, fijarPublicacion, leerMuro, publicarAviso, publicarLogro } from "./muro.ts";

// --- Sin base / solo lectura ---
test("un Hijo no publica avisos, ni fija, ni borra", async () => {
  const hijo = { id: 5, rol: "Hijo" };
  await assert.rejects(publicarAviso(hijo, { titulo: "x" }), { status: 403 });
  await assert.rejects(fijarPublicacion(hijo, 1, true), { status: 403 });
  await assert.rejects(borrarPublicacion(hijo, 1), { status: 403 });
});

test("un aviso vacío o enorme se rechaza", async () => {
  const padre = { id: 1, rol: "Padre" };
  await assert.rejects(publicarAviso(padre, { titulo: "   " }), { status: 400 });
  await assert.rejects(publicarAviso(padre, { titulo: "x".repeat(121) }), { status: 400 });
});

test("el muro se lee sin error y trae el día litúrgico si hay", async () => {
  const m = await leerMuro({ id: 1, rol: "Padre" }, 5, "2026-10-16");
  assert.ok(Array.isArray(m.publicaciones));
  assert.ok(m.hoyEnLaIglesia === null || typeof m.hoyEnLaIglesia.titulo === "string");
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_muro_${Date.now()}`;
const ids = { padre: 0, hijo: 0 };

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") => prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
});

after(async () => {
  if (!sinBase) await prisma.usuario.deleteMany({ where: { id: { in: [ids.padre, ids.hijo].filter(Boolean) } } });
  await prisma.$disconnect();
});

test("avisos fijados arriba, logros automáticos y aviso a los hijos", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const hijo = { id: ids.hijo, rol: "Hijo" };
  const a = await publicarAviso(padre, { titulo: "Mañana salimos" + sufijo, cuerpo: "Llevar abrigo" });
  await publicarLogro({ alumnoId: ids.hijo, titulo: "Logro" + sufijo });
  const b = await publicarAviso(padre, { titulo: "Fijado" + sufijo, fijada: true });
  const muro = await leerMuro(hijo, 100);
  const propias = muro.publicaciones.filter((p) => p.titulo.endsWith(sufijo));
  assert.equal(propias[0].id, b.id);
  assert.deepEqual(propias.map((p) => p.tipo), ["aviso", "logro", "aviso"]);
  assert.equal(propias.every((p) => p.puedeBorrar === false), true);
  await fijarPublicacion(padre, a.id, true);
  await borrarPublicacion(padre, a.id);
  await borrarPublicacion(padre, b.id);
  await assert.rejects(borrarPublicacion(padre, b.id), { status: 404 });
});
