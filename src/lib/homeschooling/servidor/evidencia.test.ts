import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import prisma from "../../prisma.ts";
import { actuarSobreEvidencia, agregarImagen, borrarEvidencia, crearEvidencia, limpiarArchivo, listarEvidencias, validarUrlImagen } from "./evidencia.ts";

const hijo = { id: 999999, rol: "Hijo" };

// --- Sin base: permisos que se rechazan antes de consultar, y garantía de que no se tocan saldos ---
test("un Hijo no aprueba, pide ajuste ni destaca", { skip: !process.env.DATABASE_URL && "requiere DATABASE_URL" }, async () => {
  for (const accion of [{ accion: "aprobar" as const }, { accion: "ajustar" as const, comentario: "x" }, { accion: "destacar" as const }, { accion: "quitar_destacada" as const }]) {
    await assert.rejects(actuarSobreEvidencia(hijo, 1, accion), (e: { status?: number }) => e.status === 403 || e.status === 404);
  }
});

test("la URL de una imagen tiene que ser /api/archivos/<uuid>", async () => {
  await assert.rejects(validarUrlImagen(prisma, "https://example.com/foto.jpg"), { status: 400 });
  await assert.rejects(validarUrlImagen(prisma, "/api/archivos/no-es-uuid"), { status: 400 });
  assert.equal(await limpiarArchivo(prisma, "https://example.com/foto.jpg"), false);
});

test("aprobar o destacar no toca puntos, estrellas ni experiencia (el módulo no los menciona)", () => {
  const fuente = readFileSync(new URL("./evidencia.ts", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  for (const campo of ["availablePoints", "lockedPoints", "puntosAcumulados", "stars", "surprises", "experienciaHabitos", "usuario.update"]) {
    assert.ok(!fuente.includes(campo), `evidencia.ts no debe tocar ${campo}`);
  }
});

// --- Con base real: solo con PERMITIR_TESTS_DB=1 ---
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";
const sufijo = `__test_hs_evi_${Date.now()}`;
const ids = { padre: 0, hijo: 0, hermano: 0 };
const claves: string[] = [];

const nuevaImagen = async () => {
  const clave = crypto.randomUUID();
  claves.push(clave);
  await prisma.archivo.create({ data: { clave, tipo: "image/webp", datos: Buffer.from("x"), bytes: 1 } });
  return `/api/archivos/${clave}`;
};

before(async () => {
  if (sinBase) return;
  const u = (nombre: string, rolFamiliar: "Padre" | "Hijo") =>
    prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });
  ids.padre = (await u("padre", "Padre")).id;
  ids.hijo = (await u("hijo", "Hijo")).id;
  ids.hermano = (await u("hermano", "Hijo")).id;
});

after(async () => {
  if (sinBase) return;
  const usuarios = [ids.padre, ids.hijo, ids.hermano].filter(Boolean);
  await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
  await prisma.archivo.deleteMany({ where: { clave: { in: claves } } });
  await prisma.$disconnect();
});

test("flujo: el hijo sube, el hermano no la ve, el padre aprueba sin cambiar saldos y limpia el archivo al borrar", { skip: sinBase }, async () => {
  const yo = { id: ids.hijo, rol: "Hijo" };
  const padre = { id: ids.padre, rol: "Padre" };
  const antes = await prisma.usuario.findUniqueOrThrow({ where: { id: ids.hijo }, select: { availablePoints: true, lockedPoints: true, stars: true, experienciaHabitos: true } });

  const url = await nuevaImagen();
  const e = await crearEvidencia(yo, { titulo: "Maqueta", imagenes: [url] });
  assert.equal(e.status, "pendiente");
  assert.equal((await listarEvidencias({ id: ids.hermano, rol: "Hijo" })).some((x) => x.id === e.id), false);
  await assert.rejects(agregarImagen({ id: ids.hermano, rol: "Hijo" }, e.id, await nuevaImagen()), { status: 403 });

  const aprobada = await actuarSobreEvidencia(padre, e.id, { accion: "aprobar", estrellas: 4 });
  assert.deepEqual([aprobada.status, aprobada.stars], ["aprobada", 4]);
  assert.equal((await actuarSobreEvidencia(padre, e.id, { accion: "destacar" })).is_featured, true);
  const despues = await prisma.usuario.findUniqueOrThrow({ where: { id: ids.hijo }, select: { availablePoints: true, lockedPoints: true, stars: true, experienciaHabitos: true } });
  assert.deepEqual(despues, antes);

  await borrarEvidencia(padre, e.id);
  assert.equal(await prisma.archivo.count({ where: { clave: url.split("/").pop() } }), 0);
});

test("pedir ajuste exige comentario y el hijo puede reenviar", { skip: sinBase }, async () => {
  const yo = { id: ids.hijo, rol: "Hijo" };
  const padre = { id: ids.padre, rol: "Padre" };
  const e = await crearEvidencia(yo, { imagenes: [await nuevaImagen()] });
  await assert.rejects(actuarSobreEvidencia(padre, e.id, { accion: "ajustar", comentario: "  " }), { status: 400 });
  assert.equal((await actuarSobreEvidencia(padre, e.id, { accion: "ajustar", comentario: "Falta la hoja 2" })).status, "ajustar");
  assert.equal((await actuarSobreEvidencia(yo, e.id, { accion: "reenviar" })).status, "pendiente");
  await borrarEvidencia(padre, e.id);
});
