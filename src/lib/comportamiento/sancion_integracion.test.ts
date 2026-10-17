// Día con sanción (vault/LANE_200_SANCION_Y_ENGAGEMENT.md), de punta a punta contra la base.
// Escribe en la base de DATABASE_URL: solo corre con PERMITIR_TESTS_DB=1 (usar una base local, no la real).
import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../prisma.ts";
import { haySancion, origenCofreDelDia } from "./sancionServer.ts";
import { abrirPremioSorpresa, otorgarCofreDelDia, registrarComportamiento, eliminarComportamiento } from "./server.ts";
import { registrarConducta } from "../conducta/server.ts";
import { comprarSobre, eventosDeHoy, reclamarBienvenida } from "../cartas/server.ts";
import { comprarProducto } from "../tienda/server.ts";
import { calcularRecompensa } from "../habitos/server.ts";
import { errorBloqueo } from "./sancion.ts";
import { cofreDeHoy } from "./cofreHorario.ts";

const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base)";

test("un día con sanción: cofre perdido, premios a la mitad, sin cartas ni tienda", { skip: sinBase }, async () => {
  const marca = `__test_sancion_${Date.now()}__`;
  const padre = await prisma.usuario.create({ data: { nombre: `${marca}padre`, pinSecretoHash: "x", fechaNacimiento: new Date("1980-01-01"), rolFamiliar: "Padre" } });
  const hijo = await prisma.usuario.create({
    data: { nombre: `${marca}hijo`, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar: "Hijo", availablePoints: 500 },
  });
  const actor = { id: padre.id, rol: "Padre" };
  try {
    // 1. Un día normal: sin sanción
    assert.equal(await haySancion(prisma, hijo.id), false);

    // 2. Un negativo de AYER no cuenta
    const ayer = new Date(Date.now() - 36 * 3_600_000);
    await prisma.comportamiento.create({ data: { usuarioId: hijo.id, registradoPorId: padre.id, tipo: "Negativo", titulo: "ayer", createdAt: ayer } });
    assert.equal(await haySancion(prisma, hijo.id), false);

    // 3. Premio normal y cofre del día ya entregado, todavía sin abrir
    const premio = await prisma.recompensa.create({
      data: { usuarioId: hijo.id, tipo: "comportamiento", titulo: "Premio", origen: "Comportamiento", contenido: [{ tipo: "puntos", cantidad: 10 }, { tipo: "xp", cantidad: 51 }] },
    });
    const premioConCarta = await prisma.recompensa.create({
      data: { usuarioId: hijo.id, tipo: "comportamiento", titulo: "Con carta", origen: "Comportamiento", contenido: [{ tipo: "carta", cartaId: 1, nombre: "X", modo: "fragmentos", cantidad: 1 }] },
    });
    const viejo = await prisma.recompensa.create({
      data: { usuarioId: hijo.id, tipo: "cofre", titulo: "Cofre sorpresa", origen: "Buen comportamiento · 2000-01-01", contenido: [{ tipo: "puntos", cantidad: 10 }] },
    });
    const deHoy = await prisma.recompensa.create({
      data: { usuarioId: hijo.id, tipo: "cofre", titulo: "Cofre sorpresa", origen: origenCofreDelDia(new Date()), contenido: [{ tipo: "puntos", cantidad: 10 }] },
    });

    // 4. Un padre registra la sanción
    await registrarComportamiento(actor, { usuarioId: hijo.id, tipo: "Negativo", titulo: "Se portó mal", penitencia: "", puntosPenalizados: 0 });
    assert.equal(await haySancion(prisma, hijo.id), true);
    // El cofre de hoy sin abrir se retira; el de otro día queda esperando
    assert.equal(await prisma.recompensa.count({ where: { id: deHoy.id } }), 0);
    assert.equal(await prisma.recompensa.count({ where: { id: viejo.id } }), 1);

    // 5. No llega cofre aunque el día tenga más positivos que negativos (a las 21:00 de la familia)
    await prisma.comportamiento.createMany({
      data: [1, 2, 3].map((n) => ({ usuarioId: hijo.id, registradoPorId: padre.id, tipo: "Positivo" as const, titulo: `bien ${n}` })),
    });
    const las21 = new Date(cofreDeHoy(Date.now()) + 3 * 3_600_000);
    assert.equal(await otorgarCofreDelDia(hijo.id, las21), false);
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: hijo.id, origen: origenCofreDelDia(las21) } }), 0);

    // 6. Abrir un cofre: bloqueado. Premio con cartas: bloqueado. Premio normal: la mitad.
    await assert.rejects(abrirPremioSorpresa(hijo.id, viejo.id), { message: errorBloqueo("cofre") });
    await assert.rejects(abrirPremioSorpresa(hijo.id, premioConCarta.id), /abrilo mañana/);
    const antes = await prisma.usuario.findUniqueOrThrow({ where: { id: hijo.id } });
    const apertura = await abrirPremioSorpresa(hijo.id, premio.id);
    const despues = await prisma.usuario.findUniqueOrThrow({ where: { id: hijo.id } });
    assert.equal(despues.availablePoints - antes.availablePoints, 5);
    assert.equal(despues.experienciaHabitos - antes.experienciaHabitos, 25); // 51 → 25 (hacia abajo)
    assert.match(apertura.lineas[0], /la mitad/);
    // El premio guarda lo realmente acreditado
    const guardado = await prisma.recompensa.findUniqueOrThrow({ where: { id: premio.id } });
    assert.deepEqual(guardado.contenido, [{ tipo: "puntos", cantidad: 5 }, { tipo: "xp", cantidad: 25 }]);

    // 7. Cartas y tienda deshabilitadas, y sin eventos pendientes
    await assert.rejects(comprarSobre(hijo.id, "meditacion"), { message: errorBloqueo("cartas") });
    await assert.rejects(reclamarBienvenida(hijo.id), { message: errorBloqueo("cartas") });
    await assert.rejects(comprarProducto(hijo.id, 1, 0, `${marca}clave`), { message: errorBloqueo("tienda") });
    const ev = await eventosDeHoy(hijo.id);
    assert.equal(ev.bloqueado, true);
    assert.equal(ev.hayPendientes, false);

    // 8. Hábitos: la mitad
    assert.equal(calcularRecompensa(null, "hecho", [], "orden", await haySancion(prisma, hijo.id)).nuevoPuntos, 2);

    // 9. Si el padre elimina la sanción, todo vuelve a la normalidad
    const negativo = await prisma.comportamiento.findFirstOrThrow({ where: { usuarioId: hijo.id, titulo: "Se portó mal" } });
    await eliminarComportamiento("Padre", negativo.id);
    assert.equal(await haySancion(prisma, hijo.id), false);
  } finally {
    await prisma.recompensa.deleteMany({ where: { usuarioId: hijo.id } });
    await prisma.comportamiento.deleteMany({ where: { usuarioId: hijo.id } });
    await prisma.reclamoCarta.deleteMany({ where: { usuarioId: hijo.id } }).catch(() => {});
    await prisma.usuario.deleteMany({ where: { id: { in: [hijo.id, padre.id] } } });
  }
});

test("registrar conducta diaria desbloquea el cofre del hijo al instante y lo retira si se corrige a menos de 4", { skip: sinBase }, async () => {
  const marca = `__test_conducta_cofre_${Date.now()}__`;
  const padre = await prisma.usuario.create({ data: { nombre: `${marca}padre`, pinSecretoHash: "x", fechaNacimiento: new Date("1980-01-01"), rolFamiliar: "Padre" } });
  const hijo = await prisma.usuario.create({ data: { nombre: `${marca}hijo`, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar: "Hijo" } });
  const actor = { id: padre.id, rol: "Padre" };
  const origen = origenCofreDelDia(new Date());
  try {
    await registrarConducta(actor, { usuarioId: hijo.id, nivel: 4, nota: "Se portó bien" });
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: hijo.id, tipo: "cofre", origen } }), 1);

    // Corregir a Regular (3) retira el cofre de hoy sin abrir
    await registrarConducta(actor, { usuarioId: hijo.id, nivel: 3, nota: "Regular" });
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: hijo.id, tipo: "cofre", origen } }), 0);

    // Volver a Excelente (5) lo vuelve a desbloquear
    await registrarConducta(actor, { usuarioId: hijo.id, nivel: 5, nota: "Excelente" });
    assert.equal(await prisma.recompensa.count({ where: { usuarioId: hijo.id, tipo: "cofre", origen } }), 1);
  } finally {
    await prisma.recompensa.deleteMany({ where: { usuarioId: { in: [hijo.id, padre.id] } } });
    await prisma.conductaDia.deleteMany({ where: { usuarioId: hijo.id } });
    await prisma.usuario.deleteMany({ where: { id: { in: [hijo.id, padre.id] } } });
  }
});
