// Meta semanal en familia contra la base (lane 202).
// Escribe en la base de DATABASE_URL: solo corre con PERMITIR_TESTS_DB=1 (usar una base local, no la real).
import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../prisma.ts";
import { aFecha } from "../habitos/server.ts";
import { fijarMetaSemanal, logrosDeLaSemana, metaDeLaSemana } from "./metaServidor.ts";
import { lunesDe } from "./meta.ts";
import { format } from "date-fns";
import { tz } from "@date-fns/tz";
import { APP_TZ } from "../cartas/eventos.ts";

const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base)";

test("meta semanal: se fija, avanza con los logros de los hijos y entrega un vale a cada uno una sola vez", { skip: sinBase }, async () => {
  const marca = `__test_meta_${Date.now()}__`;
  const mk = (n: string, rolFamiliar: "Padre" | "Hijo") =>
    prisma.usuario.create({ data: { nombre: `${marca}${n}`, pinSecretoHash: "x", fechaNacimiento: new Date("1990-01-01"), rolFamiliar } });
  const padre = await mk("padre", "Padre");
  const hijo = await mk("hijo", "Hijo");
  const hoy = format(new Date(), "yyyy-MM-dd", { in: tz(APP_TZ) });
  const semana = aFecha(lunesDe(hoy));
  try {
    // Sin meta: el padre recibe una sugerencia y el hijo nada
    assert.equal((await metaDeLaSemana({ id: hijo.id, rol: "Hijo" })).meta, null);

    // Solo los padres la fijan, y se valida
    await assert.rejects(fijarMetaSemanal({ id: hijo.id, rol: "Hijo" }, { objetivo: 2, premio: "Pizza" }), /Solo un padre/);
    await assert.rejects(fijarMetaSemanal({ id: padre.id, rol: "Padre" }, { objetivo: 0, premio: "Pizza" }), /entre 1 y/);
    const base = await logrosDeLaSemana(lunesDe(hoy));
    await fijarMetaSemanal({ id: padre.id, rol: "Padre" }, { objetivo: base + 2, premio: "una noche de pizza" });
    const v0 = await metaDeLaSemana({ id: hijo.id, rol: "Hijo" });
    assert.equal(v0.meta?.cumplida, false);
    assert.equal(v0.meta?.actual, base);

    // Se corrige mientras no se cumpla (misma semana, misma fila)
    await fijarMetaSemanal({ id: padre.id, rol: "Padre" }, { objetivo: base + 2, premio: "pizza y película" });
    assert.equal(await prisma.metaSemanal.count({ where: { semana } }), 1);

    // Dos tareas aprobadas del hijo esta semana → meta cumplida
    for (const n of [1, 2]) {
      const t = await prisma.tarea.create({ data: { titulo: `${marca}t${n}`, creadorId: padre.id, asignadoId: hijo.id, tiempoEjecucionEstimadoSeg: 60, estado: "Aprobada" } });
      await prisma.historialAccion.create({ data: { tareaId: t.id, actorId: padre.id, estadoNuevo: "Aprobada" } });
    }
    const v1 = await metaDeLaSemana({ id: hijo.id, rol: "Hijo" });
    assert.equal(v1.meta?.cumplida, true);
    assert.equal(v1.meta?.actual, base + 2);

    // El hijo recibió exactamente un vale; volver a mirar no duplica
    await metaDeLaSemana({ id: padre.id, rol: "Padre" });
    const vales = await prisma.recompensa.findMany({ where: { usuarioId: hijo.id, tipo: "vale" } });
    assert.equal(vales.length, 1);
    assert.equal(vales[0].titulo, "pizza y película");
    assert.match(vales[0].origen ?? "", /Meta de la semana/);
    // El padre no recibe vale (es de los hijos)
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: padre.id } }), 0);

    // Cumplida, ya no se cambia
    await assert.rejects(fijarMetaSemanal({ id: padre.id, rol: "Padre" }, { objetivo: 99, premio: "otra" }), /ya se cumplió/);
  } finally {
    await prisma.metaSemanal.deleteMany({ where: { semana } });
    await prisma.historialAccion.deleteMany({ where: { actorId: padre.id } });
    await prisma.tarea.deleteMany({ where: { creadorId: padre.id } });
    await prisma.recompensa.deleteMany({ where: { usuarioId: { in: [padre.id, hijo.id] } } });
    // Los vales de la meta también llegaron a otros hijos de la base de pruebas: se retiran los de esta ejecución
    await prisma.recompensa.deleteMany({ where: { origen: { startsWith: "Meta de la semana" }, titulo: "pizza y película" } });
    await prisma.usuario.deleteMany({ where: { id: { in: [padre.id, hijo.id] } } });
  }
});
