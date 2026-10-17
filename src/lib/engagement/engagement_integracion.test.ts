// Ingreso diario, racha y «Tu parte de hoy» contra la base (lane 201).
// Escribe en la base de DATABASE_URL: solo corre con PERMITIR_TESTS_DB=1 (usar una base local, no la real).
import test from "node:test";
import assert from "node:assert/strict";
import { addDays, format, parseISO } from "date-fns";
import prisma from "../prisma.ts";
import { aFecha, hoyEnFamilia } from "../habitos/server.ts";
import { desbloquearCofresDePadres, parteDeHoy, rachaDe, registrarIngreso } from "./servidor.ts";
import { PUNTOS_MISION } from "./misiones.ts";

const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base)";
const haceDias = (n: number) => format(addDays(parseISO(hoyEnFamilia()), -n), "yyyy-MM-dd");

test("ingreso diario: una fila por día, racha y premios por hito sin duplicarse", { skip: sinBase }, async () => {
  const u = await prisma.usuario.create({ data: { nombre: `__test_racha_${Date.now()}__`, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar: "Hijo" } });
  try {
    // Entró hace dos días y ayer: hoy son 3 seguidos → hito de 3 días
    await prisma.actividadDia.createMany({ data: [haceDias(2), haceDias(1)].map((f) => ({ usuarioId: u.id, fecha: aFecha(f) })) });
    const a = await registrarIngreso(u.id);
    assert.equal(a.nuevo, true);
    assert.deepEqual(a.hitos.map((h) => h.dias), [3]);
    // Volver a entrar el mismo día no hace nada
    assert.deepEqual(await registrarIngreso(u.id), { nuevo: false, hitos: [] });
    assert.equal(await prisma.actividadDia.count({ where: { usuarioId: u.id } }), 3);
    assert.equal((await rachaDe(u.id)).dias, 3);

    // El premio queda en «Mis premios» como sorpresa, una sola vez aunque se recalcule
    const premios = await prisma.recompensa.findMany({ where: { usuarioId: u.id } });
    assert.equal(premios.length, 1);
    assert.equal(premios[0].tipo, "comportamiento");
    assert.match(premios[0].origen ?? "", /Racha en la app · 3 días/);
    await prisma.actividadDia.deleteMany({ where: { usuarioId: u.id, fecha: aFecha(haceDias(0)) } });
    assert.deepEqual((await registrarIngreso(u.id)).hitos, []);
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: u.id } }), 1);
  } finally {
    await prisma.recompensa.deleteMany({ where: { usuarioId: u.id } });
    await prisma.usuario.delete({ where: { id: u.id } });
  }
});

test("«Tu parte de hoy»: cada misión se premia una vez y, registrar a los hijos deja un cofre", { skip: sinBase }, async () => {
  const marca = `__test_parte_${Date.now()}__`;
  const mk = (nombre: string, rolFamiliar: "Padre" | "Hijo") =>
    prisma.usuario.create({ data: { nombre: `${marca}${nombre}`, pinSecretoHash: "x", fechaNacimiento: new Date("1990-01-01"), rolFamiliar } });
  const padre = await mk("padre", "Padre");
  const hijo = await mk("hijo", "Hijo");
  const actor = { id: padre.id, rol: "Padre" };
  try {
    // Un hijo no tiene «Tu parte de hoy»
    assert.equal(await parteDeHoy({ id: hijo.id, rol: "Hijo" }), null);

    // Solo cuentan los hijos de la familia: los de otras pruebas pueden estar en la base, así que se mira por clave
    const antes = await parteDeHoy(actor);
    assert.ok(antes);
    assert.equal(antes.racha.ingresoHoy, true);
    assert.equal(antes.racha.dias, 1);
    assert.equal(antes.cofre, false);
    const comp = antes.misiones.find((m) => m.clave === "comportamiento");
    assert.ok(comp && !comp.hecha);

    // El padre escribe un mensaje: misión «mensaje» hecha, +5 puntos una sola vez
    await prisma.mensajeFamilia.create({ data: { deId: padre.id, paraId: hijo.id, texto: "Hola" } });
    const p1 = await parteDeHoy(actor);
    assert.ok(p1);
    assert.equal(p1.misiones.find((m) => m.clave === "mensaje")?.hecha, true);
    const puntos1 = (await prisma.usuario.findUniqueOrThrow({ where: { id: padre.id } })).availablePoints;
    assert.equal(puntos1, PUNTOS_MISION);
    await parteDeHoy(actor);
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: padre.id } })).availablePoints, PUNTOS_MISION);

    // Registrar a TODOS los hijos y cargar algo en Estudio (un comentario en el muro) completa las tres
    const hijos = await prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true } });
    await prisma.comportamiento.createMany({ data: hijos.map((h) => ({ usuarioId: h.id, registradoPorId: padre.id, tipo: "Positivo" as const, titulo: "bien" })) });
    const pub = await prisma.publicacionFamilia.create({ data: { autorId: padre.id, tipo: "nota", titulo: "Aviso" } });
    await prisma.comentarioEstudio.create({ data: { autorId: padre.id, publicacionId: pub.id, texto: "Muy bien" } });
    const fin = await parteDeHoy(actor);
    assert.ok(fin);
    // Registrar a los hijos alcanza para el cofre, aunque quede otra misión sin cumplir (p. ej. «pendientes»)
    assert.equal(fin.cofre, true);
    assert.equal(fin.misiones.find((m) => m.clave === "comportamiento")?.hecha, true);
    assert.equal(fin.misiones.find((m) => m.clave === "estudio")?.hecha, true);
    assert.equal(fin.hechas, fin.misiones.filter((m) => m.hecha).length);
    {
      const premio = await prisma.recompensa.findMany({ where: { usuarioId: padre.id, origen: { startsWith: "Tu parte de hoy" } } });
      assert.equal(premio.length, 1);
      await parteDeHoy(actor);
      assert.equal(await prisma.recompensa.count({ where: { usuarioId: padre.id, origen: { startsWith: "Tu parte de hoy" } } }), 1);
    }
    const pts = (await prisma.usuario.findUniqueOrThrow({ where: { id: padre.id } })).availablePoints;
    assert.equal(pts, fin.hechas * PUNTOS_MISION);
    await prisma.comentarioEstudio.deleteMany({ where: { autorId: padre.id } });
    await prisma.publicacionFamilia.deleteMany({ where: { autorId: padre.id } });
  } finally {
    await prisma.recompensa.deleteMany({ where: { usuarioId: { in: [padre.id, hijo.id] } } });
    await prisma.comportamiento.deleteMany({ where: { registradoPorId: padre.id } });
    await prisma.mensajeFamilia.deleteMany({ where: { deId: padre.id } });
    await prisma.usuario.deleteMany({ where: { id: { in: [padre.id, hijo.id] } } });
  }
});

test("cofres de padres: registrar a los hijos desbloquea el cofre de otro administrador sin que entre", { skip: sinBase }, async () => {
  const marca = `__test_cofres_${Date.now()}__`;
  const mk = (nombre: string, rolFamiliar: "Padre" | "Madre") =>
    prisma.usuario.create({ data: { nombre: `${marca}${nombre}`, pinSecretoHash: "x", fechaNacimiento: new Date("1990-01-01"), rolFamiliar } });
  const papa = await mk("papa", "Padre");
  const mama = await mk("mama", "Madre");
  try {
    const hijos = await prisma.usuario.findMany({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true } });
    if (hijos.length === 0) return;
    await prisma.comportamiento.createMany({ data: hijos.map((h) => ({ usuarioId: h.id, registradoPorId: papa.id, tipo: "Positivo" as const, titulo: "bien" })) });
    const nuevos = await desbloquearCofresDePadres();
    assert.ok(nuevos.includes(papa.id) && nuevos.includes(mama.id));
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: mama.id, origen: { startsWith: "Tu parte de hoy" } } }), 1);
    assert.deepEqual((await desbloquearCofresDePadres()).filter((id) => id === mama.id), []);
    // Cuando mamá entra no se duplica
    await parteDeHoy({ id: mama.id, rol: "Madre" });
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: mama.id, origen: { startsWith: "Tu parte de hoy" } } }), 1);
  } finally {
    await prisma.recompensa.deleteMany({ where: { usuarioId: { in: [papa.id, mama.id] } } });
    await prisma.comportamiento.deleteMany({ where: { registradoPorId: papa.id } });
    await prisma.actividadDia.deleteMany({ where: { usuarioId: { in: [papa.id, mama.id] } } });
    await prisma.usuario.deleteMany({ where: { id: { in: [papa.id, mama.id] } } });
  }
});
