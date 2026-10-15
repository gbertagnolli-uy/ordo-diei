import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { aClave, aFecha } from "../../habitos/server.ts";
import { cambiarPlan, crearPlan, marcarNoLectivo, moverDia, omitirDia, quitarPlan, recalcular } from "./planes.ts";

// Escribe en la base de DATABASE_URL, que hoy es la de producción: solo corre con PERMITIR_TESTS_DB=1
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";

const sufijo = `__test_hs_${Date.now()}`;
const ids = { padre: 0, hijoA: 0, hijoB: 0, materia: 0, recurso: 0 };
const L_V = [1, 2, 3, 4, 5];

const nuevoUsuario = (nombre: string, rolFamiliar: "Padre" | "Hijo") =>
  prisma.usuario.create({ data: { nombre: nombre + sufijo, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar } });

before(async () => {
  if (sinBase) return;
  ids.padre = (await nuevoUsuario("padre", "Padre")).id;
  ids.hijoA = (await nuevoUsuario("a", "Hijo")).id;
  ids.hijoB = (await nuevoUsuario("b", "Hijo")).id;
  ids.materia = (await prisma.materia.create({ data: { nombre: "Matemática" + sufijo, creadorId: ids.padre } })).id;
  ids.recurso = (
    await prisma.recursoCurso.create({
      data: { materiaId: ids.materia, titulo: "Curso" + sufijo, creadorId: ids.padre, tipo: "libre", unidadTipo: "leccion", totalUnidades: 20 },
    })
  ).id;
});

after(async () => {
  if (sinBase) return;
  const usuarios = [ids.padre, ids.hijoA, ids.hijoB].filter(Boolean);
  await prisma.tarea.deleteMany({ where: { creadorId: { in: usuarios } } });
  await prisma.materia.deleteMany({ where: { id: ids.materia || -1 } }); // cascada: recursos → planes → días
  await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } });
  await prisma.$disconnect();
});

const plan = (alumnoId: number) => ({ actorId: ids.padre, alumnoId, recursoId: ids.recurso, inicio: "2030-03-04", fin: "2030-03-29", diasSemana: L_V });

test("dos alumnos con el mismo recurso: dos planes independientes; el repetido da 409", { skip: sinBase }, async () => {
  const a = await crearPlan(plan(ids.hijoA));
  const b = await crearPlan(plan(ids.hijoB));
  assert.notEqual(a.plan.id, b.plan.id);
  assert.equal(a.dias, 20);
  await assert.rejects(crearPlan(plan(ids.hijoA)), { status: 409 });
  await assert.rejects(crearPlan({ ...plan(ids.hijoB), actorId: ids.hijoA }), { status: 403 });
});

test("día no lectivo de un alumno recalcula solo sus planes y no mueve fin", { skip: sinBase }, async () => {
  const hoy = "2030-03-12";
  const planA = await prisma.planCurso.findFirstOrThrow({ where: { alumnoId: ids.hijoA, recursoId: ids.recurso } });
  const planB = await prisma.planCurso.findFirstOrThrow({ where: { alumnoId: ids.hijoB, recursoId: ids.recurso } });

  // El primer día lo hizo; hasta el 11 no hizo nada: el recálculo los pasa a `movida` y reparte desde hoy
  await prisma.diaLectivo.updateMany({ where: { planId: planA.id, fecha: aFecha("2030-03-04") }, data: { estado: "hecha" } });
  await recalcular(planA.id, hoy);
  const dias = await prisma.diaLectivo.findMany({ where: { planId: planA.id }, orderBy: { fecha: "asc" } });
  assert.ok(dias.filter((d) => aClave(d.fecha) > "2030-03-04" && aClave(d.fecha) < hoy).every((d) => d.estado === "movida"));
  const nuevos = dias.filter((d) => d.estado === "pendiente");
  assert.equal(aClave(nuevos[0].fecha), hoy);
  assert.equal(nuevos[0].unidadDesde, 2);
  assert.equal(nuevos.at(-1)!.unidadHasta, 20);

  // Hoy con una Tarea en curso se conserva aunque se marque un día sin clase
  const tarea = await prisma.tarea.create({
    data: { titulo: "Lección" + sufijo, creadorId: ids.padre, asignadoId: ids.hijoA, tiempoEjecucionEstimadoSeg: 1200, estado: "En_progreso" },
  });
  await prisma.diaLectivo.update({ where: { id: nuevos[0].id }, data: { tareaId: tarea.id } });
  const antesB = await prisma.diaLectivo.count({ where: { planId: planB.id } });

  await marcarNoLectivo({ actorId: ids.padre, alumnoIds: [ids.hijoA], fecha: "2030-03-14", motivo: "Médico", hoy });

  const despues = await prisma.diaLectivo.findMany({ where: { planId: planA.id, estado: "pendiente" }, orderBy: { fecha: "asc" } });
  assert.equal(despues[0].id, nuevos[0].id);
  assert.equal(despues[0].tareaId, tarea.id);
  assert.ok(!despues.some((d) => aClave(d.fecha) === "2030-03-14"));
  assert.equal(despues.at(-1)!.unidadHasta, 20);
  assert.ok(despues.every((d) => aClave(d.fecha) <= "2030-03-29"));
  const planAfter = await prisma.planCurso.findUniqueOrThrow({ where: { id: planA.id } });
  assert.equal(aClave(planAfter.fin), "2030-03-29");
  assert.equal(await prisma.diaLectivo.count({ where: { planId: planB.id } }), antesB); // el otro alumno no cambia
});

test("mover y omitir: reglas de orden, y no se toca un día empezado", { skip: sinBase }, async () => {
  const hoy = "2030-03-12";
  const planB = await prisma.planCurso.findFirstOrThrow({ where: { alumnoId: ids.hijoB, recursoId: ids.recurso } });
  const dias = await prisma.diaLectivo.findMany({ where: { planId: planB.id }, orderBy: { fecha: "asc" } });
  const d = dias.find((x) => aClave(x.fecha) === "2030-03-13")!; // un día entre dos vecinos
  await assert.rejects(moverDia({ actorId: ids.padre, diaId: d.id, fecha: "2030-03-16", hoy }), { status: 400 }); // domingo
  await assert.rejects(moverDia({ actorId: ids.padre, diaId: d.id, fecha: "2030-03-14", hoy }), { status: 409 }); // ocupado
  await assert.rejects(moverDia({ actorId: ids.hijoB, diaId: d.id, fecha: "2030-03-14", hoy }), { status: 403 });
  const o = await omitirDia({ actorId: ids.padre, diaId: d.id });
  assert.equal(o.estado, "omitida");
  await assert.rejects(omitirDia({ actorId: ids.padre, diaId: d.id }), { status: 409 }); // ya no está pendiente
});

test("un Hijo no cambia ni quita planes", async () => {
  await assert.rejects(cambiarPlan({ id: 999999 }, 1, { estado: "pausado" }, "2030-03-12"), { status: 403 });
  await assert.rejects(quitarPlan({ id: 999999 }, 1), { status: 403 });
});

test("pausar, reanudar y extender el fin de un plan; quitarlo con días cumplidos da 409", { skip: sinBase }, async () => {
  const hoy = "2030-03-12";
  const padre = { id: ids.padre };
  const planB = await prisma.planCurso.findFirstOrThrow({ where: { alumnoId: ids.hijoB, recursoId: ids.recurso } });

  assert.equal((await cambiarPlan(padre, planB.id, { estado: "pausado" }, hoy)).estado, "pausado");
  const diasPausado = await prisma.diaLectivo.count({ where: { planId: planB.id } });

  // Al reanudar se recalcula: lo pasado sin hacer queda `movida` y el resto se reparte desde hoy hasta el fin
  await cambiarPlan(padre, planB.id, { estado: "activo" }, hoy);
  const pendientes = await prisma.diaLectivo.findMany({ where: { planId: planB.id, estado: "pendiente" }, orderBy: { fecha: "asc" } });
  assert.equal(aClave(pendientes[0].fecha) >= hoy, true);
  assert.equal(pendientes.at(-1)!.unidadHasta, 20);
  assert.ok(diasPausado > 0);

  // Extender el fin: los días se reparten hasta la nueva fecha; una fecha anterior a hoy se rechaza
  await cambiarPlan(padre, planB.id, { fin: "2030-04-12" }, hoy);
  const ultimo = await prisma.diaLectivo.findFirstOrThrow({ where: { planId: planB.id, estado: "pendiente" }, orderBy: { fecha: "desc" } });
  assert.ok(aClave(ultimo.fecha) <= "2030-04-12");
  await assert.rejects(cambiarPlan(padre, planB.id, { fin: "2030-03-01" }, hoy), { status: 400 });

  // Con un día cumplido ya no se puede quitar (los días se recrearon al extender el fin: se vuelve a consultar)
  const primero = await prisma.diaLectivo.findFirstOrThrow({ where: { planId: planB.id, estado: "pendiente" }, orderBy: { fecha: "asc" } });
  await prisma.diaLectivo.update({ where: { id: primero.id }, data: { estado: "hecha" } });
  await assert.rejects(quitarPlan(padre, planB.id), { status: 409 });
});
