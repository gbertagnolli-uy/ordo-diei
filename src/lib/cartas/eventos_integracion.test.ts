// Tests de integración para eventos litúrgicos, cumpleaños y casos de borde (Lane 37)

import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../prisma.ts";
import {
  reclamarFiesta,
  reclamarCumpleanos,
  eventosDeHoy,
} from "./server.ts";
import {
  hoyMesDiaEnTz,
  esCumpleHoy,
  APP_TZ,
} from "./eventos.ts";

test("Lane 37: Eventos temporales, reclamos de fiesta, cumpleaños, 29-feb y topes", async (t) => {
  const timestamp = Date.now();
  const hoyMMdd = hoyMesDiaEnTz(new Date(), APP_TZ);

  // 1. Crear usuario para pruebas
  const usuario = await prisma.usuario.create({
    data: {
      nombre: `__test_eventos_user_${timestamp}__`,
      pinSecretoHash: "hash_test",
      fechaNacimiento: new Date("1996-02-29T00:00:00.000Z"), // Nacido un 29 de febrero
      rolFamiliar: "Hijo",
      availablePoints: 100,
      incienso: 0,
    },
  });

  // 2. Crear dos cartas de prueba con fiesta hoy
  const cartaFiesta1 = await prisma.carta.create({
    data: {
      clave: `test-fiesta-1-${timestamp}`,
      nombre: "Santo Patrono Fiesta 1",
      categoria: "Santo",
      rareza: "Comun", // req = 20
      celebracion: hoyMMdd,
      historia: "Historia de prueba para evento litúrgico uno.",
      oracion: "Oración devocional de fiesta uno.",
      frase: "Frase célebre de fiesta uno.",
      datasheet: [
        { etiqueta: "Dato 1", valor: "Valor 1" },
        { etiqueta: "Dato 2", valor: "Valor 2" },
        { etiqueta: "Dato 3", valor: "Valor 3" },
        { etiqueta: "Dato 4", valor: "Valor 4" },
      ],
      imagenUrl: "/cartas/test/fiesta-1.webp",
      fragmentosRequeridos: 20,
      origen: "Manual",
      activa: true,
    },
  });

  const cartaFiesta2 = await prisma.carta.create({
    data: {
      clave: `test-fiesta-2-${timestamp}`,
      nombre: "Santo Patrono Fiesta 2",
      categoria: "Santo",
      rareza: "Buena", // req = 60
      celebracion: hoyMMdd,
      historia: "Historia de prueba para evento litúrgico dos.",
      oracion: "Oración devocional de fiesta dos.",
      frase: "Frase célebre de fiesta dos.",
      datasheet: [
        { etiqueta: "Dato 1", valor: "Valor 1" },
        { etiqueta: "Dato 2", valor: "Valor 2" },
        { etiqueta: "Dato 3", valor: "Valor 3" },
        { etiqueta: "Dato 4", valor: "Valor 4" },
      ],
      imagenUrl: "/cartas/test/fiesta-2.webp",
      fragmentosRequeridos: 60,
      origen: "Manual",
      activa: true,
    },
  });

  t.after(async () => {
    // Limpieza de todos los datos creados
    await prisma.movimientoFragmento.deleteMany({
      where: { usuarioId: usuario.id },
    });
    await prisma.reclamoCarta.deleteMany({
      where: { usuarioId: usuario.id },
    });
    await prisma.cartaUsuario.deleteMany({
      where: {
        OR: [
          { usuarioId: usuario.id },
          { cartaId: { in: [cartaFiesta1.id, cartaFiesta2.id] } },
        ],
      },
    });
    await prisma.carta.deleteMany({
      where: { id: { in: [cartaFiesta1.id, cartaFiesta2.id] } },
    });
    await prisma.usuario.deleteMany({
      where: { id: usuario.id },
    });
  });

  // Test 1: Reclamar fiesta 1 (50% de 20 = 10 fragmentos)
  const resFiesta1 = await reclamarFiesta(usuario.id, cartaFiesta1.id);
  assert.equal(resFiesta1.tipo, "fiesta");
  assert.equal(resFiesta1.fragmentosGanados, 10);
  assert.equal(resFiesta1.fragmentosDespues, 10);
  assert.equal(resFiesta1.desbloquea, false); // 10 < 20

  // Test 2: Segundo reclamo de la misma fiesta en el mismo año DEBE fallar
  await assert.rejects(
    async () => {
      await reclamarFiesta(usuario.id, cartaFiesta1.id);
    },
    { message: /ya fue reclamado este año/ }
  );

  // Test 3: Reclamar fiesta cuando el usuario ya tiene la carta al 100 % (suma a grados)
  await prisma.cartaUsuario.create({
    data: {
      usuarioId: usuario.id,
      cartaId: cartaFiesta2.id,
      fragmentos: 60, // Ya al 100% (Grado I)
      desbloqueadaEn: new Date(),
    },
  });

  // Fiesta 2: 50% de 60 = 30 fragmentos. 60 + 30 = 90 (150% = Grado II)
  const resFiesta2 = await reclamarFiesta(usuario.id, cartaFiesta2.id);
  assert.equal(resFiesta2.fragmentosGanados, 30);
  assert.equal(resFiesta2.fragmentosDespues, 90);

  const cu2 = await prisma.cartaUsuario.findUnique({
    where: { usuarioId_cartaId: { usuarioId: usuario.id, cartaId: cartaFiesta2.id } },
  });
  assert.equal(cu2?.fragmentos, 90);

  // Test 4: Reclamar fiesta en el tope máximo (300% de 60 = 180 fragmentos)
  // Crear una tercera carta con tope
  const cartaTope = await prisma.carta.create({
    data: {
      clave: `test-fiesta-tope-${timestamp}`,
      nombre: "Carta en Tope Máximo",
      categoria: "Santo",
      rareza: "Comun",
      celebracion: hoyMMdd,
      historia: "Historia de carta en tope máximo.",
      oracion: "Oración devocional en tope.",
      frase: "Frase en tope máximo.",
      datasheet: [
        { etiqueta: "D1", valor: "V1" },
        { etiqueta: "D2", valor: "V2" },
        { etiqueta: "D3", valor: "V3" },
        { etiqueta: "D4", valor: "V4" },
      ],
      imagenUrl: "/cartas/test/tope.webp",
      fragmentosRequeridos: 20, // tope = 20 * 3 = 60
      origen: "Manual",
      activa: true,
    },
  });

  await prisma.cartaUsuario.create({
    data: {
      usuarioId: usuario.id,
      cartaId: cartaTope.id,
      fragmentos: 60, // En tope máximo exacto
      desbloqueadaEn: new Date(),
    },
  });

  // Reclamar fiesta: 50% de 20 = 10 fragmentos. Como ya está en 60, los 10 se convierten a Incienso
  const saldoInciensoAntes = (await prisma.usuario.findUnique({ where: { id: usuario.id } }))?.incienso ?? 0;
  const resTope = await reclamarFiesta(usuario.id, cartaTope.id);
  assert.equal(resTope.fragmentosDespues, 60); // Permanece en 60
  assert.ok(resTope.inciensoGanado > 0); // Convertido a Incienso

  const usuarioPostTope = await prisma.usuario.findUnique({ where: { id: usuario.id } });
  assert.equal(usuarioPostTope?.incienso, saldoInciensoAntes + resTope.inciensoGanado);

  // Limpiar cartaTope
  await prisma.cartaUsuario.deleteMany({ where: { cartaId: cartaTope.id } });
  await prisma.carta.deleteMany({ where: { id: cartaTope.id } });

  // Test 5: Regla de 29-feb en año bisiesto y no bisiesto
  const cumple29Feb = new Date("2000-02-29T00:00:00.000Z");
  // 2024 es bisiesto: se celebra el 29 de febrero
  const d2024Feb29 = new Date("2024-02-29T12:00:00.000Z");
  const d2024Feb28 = new Date("2024-02-28T12:00:00.000Z");
  assert.equal(esCumpleHoy(cumple29Feb, d2024Feb29, APP_TZ), true);
  assert.equal(esCumpleHoy(cumple29Feb, d2024Feb28, APP_TZ), false);

  // 2026 NO es bisiesto: se celebra el 28 de febrero
  const d2026Feb28 = new Date("2026-02-28T12:00:00.000Z");
  assert.equal(esCumpleHoy(cumple29Feb, d2026Feb28, APP_TZ), true);

  // Test 6: Reclamo de cumpleaños del usuario (ajustamos fechaNacimiento a hoy)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { fechaNacimiento: new Date(`1995-${hoyMMdd}T00:00:00.000Z`) },
  });

  const resCumple = await reclamarCumpleanos(usuario.id);
  // Dado que hay cartas de hoy (cartaFiesta1 está al 50%), debe completar las faltantes para 100%
  if (resCumple.tipo === "santos_del_dia") {
    assert.ok(resCumple.cartas.length >= 1);
    const c1 = resCumple.cartas.find((c) => c.cartaId === cartaFiesta1.id);
    if (c1) {
      assert.equal(c1.desbloqueada, true);
    }
  } else {
    // Si ya estuvieran al 100%, entrega sobre de revelación
    assert.equal(resCumple.tipo, "sobre_revelacion_gratis");
    assert.ok(resCumple.cartasAfectadas.length >= 1);
  }

  // Test 7: Segundo reclamo de cumpleaños en el mismo año DEBE fallar
  await assert.rejects(
    async () => {
      await reclamarCumpleanos(usuario.id);
    },
    { message: /ya fue reclamado este año/ }
  );

  // Test 8: Consulta de eventosDeHoy muestra estado actualizado
  const ev = await eventosDeHoy(usuario.id);
  assert.equal(ev.fechaHoy, hoyMMdd);
  assert.equal(ev.esCumple, true);
  assert.equal(ev.cumpleReclamado, true);
  assert.equal(ev.fiestas.find((f) => f.cartaId === cartaFiesta1.id)?.reclamado, true);
});
