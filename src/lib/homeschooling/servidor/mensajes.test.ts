import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { contarSinLeer, conversaciones, enviar, hilo } from "./mensajes.ts";

// --- Sin base / solo lectura ---
test("un mensaje vacío, enorme o a uno mismo se rechaza antes de consultar", async () => {
  const a = { id: 5, rol: "Hijo" };
  await assert.rejects(enviar(a, 6, "   "), { status: 400 });
  await assert.rejects(enviar(a, 6, "x".repeat(1001)), { status: 400 });
  await assert.rejects(enviar(a, 5, "hola"), { status: 400 });
  await assert.rejects(hilo(a, 5), { status: 400 });
});

test("la lista de conversaciones se lee sin error y no incluye al propio usuario", { skip: !process.env.DATABASE_URL && "requiere DATABASE_URL" }, async () => {
  const r = await conversaciones({ id: 1, rol: "Padre" });
  assert.ok(r.personas.length > 0 && r.personas.every((p) => p.id !== 1));
  assert.equal(r.sinLeer, r.personas.reduce((n, p) => n + p.sinLeer, 0));
  assert.equal(typeof (await contarSinLeer(1)), "number");
  await assert.rejects(hilo({ id: 1, rol: "Padre" }, 999999999), { status: 404 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_msg_${Date.now()}`;
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

test("un mensaje llega, se marca leído al abrir el hilo y solo lo ven los dos", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const hijo = { id: ids.hijo, rol: "Hijo" };
  const hermano = { id: ids.hermano, rol: "Hijo" };
  await enviar(hijo, ids.padre, "¿Me ayudás con la tarea?");
  await enviar(hijo, ids.padre, "Es de fracciones");
  assert.equal(await contarSinLeer(ids.padre), 2);
  const lista = (await conversaciones(padre)).personas.find((p) => p.id === ids.hijo)!;
  assert.deepEqual([lista.sinLeer, lista.ultimo?.deMi, lista.ultimo?.texto], [2, false, "Es de fracciones"]);

  const h = await hilo(padre, ids.hijo);
  assert.deepEqual(h.map((m) => m.texto), ["¿Me ayudás con la tarea?", "Es de fracciones"]);
  assert.equal(await contarSinLeer(ids.padre), 0);
  await enviar(padre, ids.hijo, "Sí, después de merendar");
  assert.equal((await hilo(hijo, ids.padre)).length, 3);
  assert.equal((await hilo(hermano, ids.padre)).length, 0);
  assert.equal((await hilo(hermano, ids.hijo)).length, 0);
});
