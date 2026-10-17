import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { agregarLibro, borrarLibro, editarLibro, listaDeLectura, registrarLectura, terminarLibro } from "./lectura.ts";

// --- Sin base: permisos y validaciones previas ---
test("un hijo no ve la lista de otro ni agrega libros a otro", async () => {
  const yo = { id: 10, rol: "Hijo" };
  await assert.rejects(listaDeLectura(yo, 11), { status: 403 });
  await assert.rejects(agregarLibro(yo, { alumnoId: 11, titulo: "x" }), { status: 403 });
});

test("el libro necesita título y páginas razonables", async () => {
  const padre = { id: 1, rol: "Padre" };
  await assert.rejects(agregarLibro(padre, { alumnoId: 10, titulo: "  " }), { status: 400 });
  await assert.rejects(agregarLibro(padre, { alumnoId: 10, titulo: "x", paginasTotal: 0 }), { status: 400 });
  await assert.rejects(agregarLibro(padre, { alumnoId: 10, titulo: "x", paginasTotal: 9999 }), { status: 400 });
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_lec_${Date.now()}`;
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

test("del estante al libro terminado: avance, sesiones, racha, valoración y narración", { skip: sinBase }, async () => {
  const padre = { id: ids.padre, rol: "Padre" };
  const yo = { id: ids.hijo, rol: "Hijo" };
  const hermano = { id: ids.hermano, rol: "Hijo" };
  const hoy = "2031-06-10";

  const l = await agregarLibro(padre, { alumnoId: ids.hijo, titulo: "Vida de San Francisco", paginasTotal: 100 }, hoy);
  assert.deepEqual([l.estado, l.asignado, l.porcentaje], ["por_leer", true, 0]);
  await assert.rejects(registrarLectura(hermano, l.id, { hastaPagina: 5 }, hoy), { status: 403 });

  const a = await registrarLectura(yo, l.id, { hastaPagina: 30, minutos: 20 }, hoy);
  assert.deepEqual([a.estado, a.paginaActual, a.porcentaje, a.empezadoEn], ["leyendo", 30, 30, hoy]);
  await assert.rejects(registrarLectura(yo, l.id, { hastaPagina: 30 }, hoy), { status: 400 });
  await assert.rejects(registrarLectura(yo, l.id, { hastaPagina: 40, fecha: "2031-06-11" }, hoy), { status: 400 });

  const lista = await listaDeLectura(yo, ids.hijo, hoy);
  assert.deepEqual([lista.resumen.paginasSemana, lista.resumen.minutosSemana, lista.resumen.racha], [30, 20, 1]);

  const fin = await registrarLectura(yo, l.id, { hastaPagina: 500 }, hoy);
  assert.deepEqual([fin.estado, fin.paginaActual, fin.terminadoEn], ["leido", 100, hoy]);
  const cierre = await terminarLibro(padre, l.id, { estrellas: 5, narracion: "Un santo que amó a los pobres" }, hoy);
  assert.deepEqual([cierre.estrellas, cierre.narracion], [5, "Un santo que amó a los pobres"]);
  assert.equal((await listaDeLectura(padre, ids.hijo, hoy)).resumen.librosLeidosAnio, 1);

  const vuelta = await editarLibro(yo, l.id, { estado: "por_leer" }, hoy);
  assert.deepEqual([vuelta.estado, vuelta.paginaActual, vuelta.terminadoEn], ["por_leer", 0, null]);
  await borrarLibro(padre, l.id);
  await assert.rejects(borrarLibro(padre, l.id), { status: 404 });
});
