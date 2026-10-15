import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { actualizarMaterial, borrarMaterial, crearMaterial, listarMateriales, marcarMaterialHecho, materialSueltoDeHoy, obtenerMaterial } from "./materiales.ts";

const hijo = { id: 999999, rol: "Hijo" };
const rechazo = (e: { status?: number }) => e.status === 403;

// --- Sin base: los permisos se rechazan antes de consultar ---
test("un Hijo no crea, edita ni borra material", async () => {
  await assert.rejects(crearMaterial(hijo, { destino: { diaLectivoId: 1 }, entrada: "hola" }), rechazo);
  await assert.rejects(actualizarMaterial(hijo, 1, { titulo: "x" }), rechazo);
  await assert.rejects(borrarMaterial(hijo, 1), rechazo);
});

test("un padre no puede dejar el límite de impresiones fuera de 0–10 ni un texto vacío", async () => {
  const padre = { id: 1, rol: "Padre" };
  await assert.rejects(crearMaterial(padre, { destino: { diaLectivoId: 1 }, entrada: "   " }), { status: 400 });
  await assert.rejects(crearMaterial(padre, { destino: { diaLectivoId: 1 }, entrada: "hola", limiteImpresiones: 11 }), { status: 400 });
  await assert.rejects(actualizarMaterial(padre, 1, { limiteImpresiones: -1 }), { status: 400 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_mat_${Date.now()}`;
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

test("flujo del material suelto: el padre lo deja, el hermano no lo ve, el hijo lo marca hecho", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const yo = { id: ids.hijo, rol: "Hijo" };
  const hermano = { id: ids.hermano, rol: "Hijo" };
  const fecha = "2031-03-04";

  const texto = await crearMaterial(padre, { destino: { alumnoId: ids.hijo, fecha }, entrada: "# Lectura\nLeé **Lucas 1**", titulo: null });
  assert.equal(texto.tipo, "markdown");
  assert.equal(texto.titulo, "Lectura");
  assert.equal(texto.imprimible, true);
  const enlace = await crearMaterial(padre, { destino: { alumnoId: ids.hijo, fecha }, entrada: "https://youtu.be/dQw4w9WgXcQ", titulo: "Canto", limiteImpresiones: 0 });
  assert.equal(enlace.tipo, "video");
  assert.equal(enlace.imprimible, false);
  assert.equal(enlace.orden, 1);

  assert.equal((await listarMateriales(yo, { alumnoId: ids.hijo, fecha })).length, 2);
  await assert.rejects(listarMateriales(hermano, { alumnoId: ids.hijo, fecha }), rechazo);
  assert.equal((await materialSueltoDeHoy(ids.hijo, fecha)).length, 2);
  await assert.rejects(marcarMaterialHecho(hermano, texto.id, true), rechazo);
  assert.equal((await marcarMaterialHecho(yo, texto.id, true)).hecho, true);
  assert.equal((await marcarMaterialHecho(yo, texto.id, false)).hecho, false);

  const editado = await actualizarMaterial(padre, texto.id, { titulo: "Lectura del día", limiteImpresiones: 1 });
  assert.deepEqual([editado.titulo, editado.limiteImpresiones], ["Lectura del día", 1]);
  await assert.rejects(actualizarMaterial(padre, enlace.id, { contenido: "no" }), { status: 400 });
  await borrarMaterial(padre, texto.id);
  await borrarMaterial(padre, enlace.id);
  await assert.rejects(borrarMaterial(padre, enlace.id), { status: 404 });
});

test("el material suelto es solo para hijos", { skip: sinBase }, async () => {
  await assert.rejects(crearMaterial({ id: ids.padre, rol: "Padre" }, { destino: { alumnoId: ids.padre, fecha: "2031-03-04" }, entrada: "x" }), { status: 400 });
});

test("la clave de respuestas (solo padres) no la ve ni la lista el hijo", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const yo = { id: ids.hijo, rol: "Hijo" };
  const fecha = "2031-03-05";
  const hoja = await crearMaterial(padre, { destino: { alumnoId: ids.hijo, fecha }, entrada: "Ejercicios 1 a 5" });
  const clave = await crearMaterial(padre, { destino: { alumnoId: ids.hijo, fecha }, entrada: "1) 4  2) 9  3) 16", titulo: "Clave", soloPadres: true });
  assert.equal(clave.soloPadres, true);
  assert.deepEqual((await listarMateriales(yo, { alumnoId: ids.hijo, fecha })).map((m) => m.id), [hoja.id]);
  assert.deepEqual((await listarMateriales(padre, { alumnoId: ids.hijo, fecha })).map((m) => m.id), [hoja.id, clave.id]);
  assert.deepEqual((await materialSueltoDeHoy(ids.hijo, fecha)).map((m) => m.id), [hoja.id]);
  await assert.rejects(obtenerMaterial(yo, clave.id), { status: 403 });
  assert.equal((await obtenerMaterial(padre, clave.id)).titulo, "Clave");
  await borrarMaterial(padre, hoja.id);
  await borrarMaterial(padre, clave.id);
});
