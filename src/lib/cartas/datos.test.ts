// Tests de integración para servicios y datos de cartas católicas (Lane 31)

import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../prisma.ts";
import {
  listarCartasUsuario,
  obtenerDetalleCarta,
  comprarSobre,
  comprarFragmentosDirectos,
  reclamarFiesta,
  reclamarCumpleanos,
  reclamarGrado,
  eventosDeHoy,
} from "./server.ts";
import { hoyMesDiaEnTz, APP_TZ } from "./eventos.ts";

// Escribe en la base de DATABASE_URL, que hoy es la de producción: solo corre con PERMITIR_TESTS_DB=1
const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base real)";

test("Lane 31: Datos, transacciones atómicas, D13 y eventos en base de datos real", { skip: sinBase }, async (t) => {
  const timestamp = Date.now();
  const hoyMMdd = hoyMesDiaEnTz(new Date(), APP_TZ);

  // 1. Crear usuarios de prueba temporales
  const usuarioA = await prisma.usuario.create({
    data: {
      nombre: `__test_user_a_${timestamp}__`,
      pinSecretoHash: "hash_test",
      fechaNacimiento: new Date("1995-10-10T00:00:00.000Z"),
      rolFamiliar: "Hijo",
      availablePoints: 20, // Saldo bajo inicial
      incienso: 0,
    },
  });

  const usuarioB = await prisma.usuario.create({
    data: {
      nombre: `__test_user_b_${timestamp}__`,
      pinSecretoHash: "hash_test",
      fechaNacimiento: new Date("2000-01-01T00:00:00.000Z"),
      rolFamiliar: "Hija",
      availablePoints: 500,
      incienso: 10,
    },
  });

  // Asegurar una carta con celebración hoy para probar reclamo de fiesta
  const cartaFiesta = await prisma.carta.upsert({
    where: { clave: `carta-test-fiesta-${timestamp}` },
    create: {
      clave: `carta-test-fiesta-${timestamp}`,
      nombre: "Carta Festiva de Prueba",
      categoria: "Santo",
      rareza: "Comun",
      celebracion: hoyMMdd,
      historia: "TEXTO_SECRETO_HISTORIA: Historia festiva de prueba.",
      oracion: "TEXTO_SECRETO_ORACION: Oración festiva de prueba.",
      frase: "TEXTO_SECRETO_FRASE: Frase festiva de prueba.",
      datasheet: [
        { etiqueta: "Dato 1", valor: "VALOR_SECRETO_1" },
        { etiqueta: "Dato 2", valor: "VALOR_SECRETO_2" },
        { etiqueta: "Dato 3", valor: "VALOR_SECRETO_3" },
        { etiqueta: "Dato 4", valor: "VALOR_SECRETO_4" },
      ],
      imagenUrl: "/cartas/test/1.webp",
      fragmentosRequeridos: 10,
      origen: "Manual",
      activa: true,
    },
    update: { celebracion: hoyMMdd },
  });

  t.after(async () => {
    // Limpieza de todos los datos de prueba
    await prisma.movimientoFragmento.deleteMany({
      where: { usuarioId: { in: [usuarioA.id, usuarioB.id] } },
    });
    await prisma.reclamoCarta.deleteMany({
      where: { usuarioId: { in: [usuarioA.id, usuarioB.id] } },
    });
    await prisma.cartaUsuario.deleteMany({
      where: {
        OR: [
          { usuarioId: { in: [usuarioA.id, usuarioB.id] } },
          { cartaId: cartaFiesta.id },
        ],
      },
    });
    await prisma.carta.deleteMany({
      where: { id: cartaFiesta.id },
    });
    await prisma.usuario.deleteMany({
      where: { id: { in: [usuarioA.id, usuarioB.id] } },
    });
  });

  // Test 1: Compra con puntos insuficientes es rechazada
  await assert.rejects(
    async () => {
      await comprarSobre(usuarioA.id, "meditacion"); // Meditación cuesta 40, usuarioA tiene 20
    },
    { message: /Puntos insuficientes/ }
  );

  // Test 2: Compra válida con puntos descuenta saldo y asigna fragmentos atómicamente
  await prisma.usuario.update({
    where: { id: usuarioA.id },
    data: { availablePoints: 200 },
  });

  const resSobre = await comprarSobre(usuarioA.id, "meditacion");
  assert.equal(resSobre.puntosGastados, 40);
  assert.equal(resSobre.nuevoSaldoPuntos, 160);
  assert.ok(resSobre.cartasAfectadas.length >= 1);

  // Verificar movimiento en el libro mayor
  const movs = await prisma.movimientoFragmento.findMany({
    where: { usuarioId: usuarioA.id },
  });
  assert.ok(movs.length >= 1);
  assert.equal(movs[0].tipo, "Sobre");

  // Test 3: Redacción del contenido D13 en 0, 10, 30, 60 y 100 % de fragmentos
  // 0%
  const det0 = await obtenerDetalleCarta(usuarioB.id, cartaFiesta.clave);
  assert.ok(det0);
  assert.equal(det0.oracion.visible, false);
  assert.equal(det0.oracion.valor, "???");
  assert.equal(det0.frase.visible, false);
  assert.equal(det0.historia.visible, false);
  assert.equal(det0.datasheet.every((d) => !d.visible), true);
  assert.ok(!JSON.stringify(det0).includes("TEXTO_SECRETO"));

  // 10% (1 de 10 fragmentos): oración visible
  await prisma.cartaUsuario.upsert({
    where: { usuarioId_cartaId: { usuarioId: usuarioB.id, cartaId: cartaFiesta.id } },
    create: { usuarioId: usuarioB.id, cartaId: cartaFiesta.id, fragmentos: 1 },
    update: { fragmentos: 1 },
  });
  const det10 = await obtenerDetalleCarta(usuarioB.id, cartaFiesta.clave);
  assert.ok(det10);
  assert.equal(det10.oracion.visible, true);
  assert.ok(det10.oracion.valor.includes("Oración festiva"));
  assert.equal(det10.frase.visible, false);
  assert.equal(det10.historia.visible, false);

  // 30% (3 de 10 fragmentos): frase visible y 1 dato del datasheet
  await prisma.cartaUsuario.update({
    where: { usuarioId_cartaId: { usuarioId: usuarioB.id, cartaId: cartaFiesta.id } },
    data: { fragmentos: 3 },
  });
  const det30 = await obtenerDetalleCarta(usuarioB.id, cartaFiesta.clave);
  assert.ok(det30);
  assert.equal(det30.frase.visible, true);
  assert.ok(det30.frase.valor.includes("Frase festiva"));
  assert.equal(det30.historia.visible, false);
  assert.equal(det30.datasheet.filter((d) => d.visible).length, 1);

  // 60% (6 de 10 fragmentos): datasheet con 2 datos visibles
  await prisma.cartaUsuario.update({
    where: { usuarioId_cartaId: { usuarioId: usuarioB.id, cartaId: cartaFiesta.id } },
    data: { fragmentos: 6 },
  });
  const det60 = await obtenerDetalleCarta(usuarioB.id, cartaFiesta.clave);
  assert.ok(det60);
  assert.equal(det60.historia.visible, false);
  assert.equal(det60.datasheet.filter((d) => d.visible).length, 2);

  // 100% (10 de 10 fragmentos): historia visible y datasheet completo
  await prisma.cartaUsuario.update({
    where: { usuarioId_cartaId: { usuarioId: usuarioB.id, cartaId: cartaFiesta.id } },
    data: { fragmentos: 10 },
  });
  // D20: al 100 % sin reclamar sigue bloqueada y sin historia
  const det100SinReclamar = await obtenerDetalleCarta(usuarioB.id, cartaFiesta.clave);
  assert.ok(det100SinReclamar);
  assert.equal(det100SinReclamar.desbloqueada, false);
  assert.equal(det100SinReclamar.reclamable, true);
  assert.equal(det100SinReclamar.historia.visible, false);
  assert.ok(!JSON.stringify(det100SinReclamar).includes("Historia festiva"));

  const resGrado = await reclamarGrado(usuarioB.id, cartaFiesta.id);
  assert.equal(resGrado.cartasAfectadas[0].desbloquea, true);
  await assert.rejects(() => reclamarGrado(usuarioB.id, cartaFiesta.id), { message: /nada para reclamar/ });

  const det100 = await obtenerDetalleCarta(usuarioB.id, cartaFiesta.clave);
  assert.ok(det100);
  assert.equal(det100.desbloqueada, true);
  assert.equal(det100.historia.visible, true);
  assert.ok(det100.historia.valor.includes("Historia festiva"));
  assert.equal(det100.datasheet.every((d) => d.visible), true);

  // Test 4: Límite diario de compra con puntos (D2: máx 10 por día) y tope con conversión a Incienso
  await assert.rejects(
    async () => {
      await comprarFragmentosDirectos(usuarioB.id, cartaFiesta.id, 11, "puntos");
    },
    { message: /Superaste el límite diario/ }
  );

  // Situamos la carta en 25 fragmentos (Grado II = 15, Grado III = 20)
  await prisma.cartaUsuario.update({
    where: { usuarioId_cartaId: { usuarioId: usuarioB.id, cartaId: cartaFiesta.id } },
    data: { fragmentos: 25 },
  });

  // Grado IV tope = 30 fragmentos. Comprar 10 fragmentos con puntos -> total 35 -> tope 30 + 5 excedente
  // Cada excedente de Común otorga 1 Incienso (5 Incienso total)
  const resCompraDirecta = await comprarFragmentosDirectos(
    usuarioB.id,
    cartaFiesta.id,
    10,
    "puntos"
  );
  // Con bono de fiesta hoy (×1.5): 10 fragmentos comprados se convierten en 15.
  // Base 25 + 15 = 40. Tope = 30 -> Excedente = 10 -> Incienso ganado = 10
  assert.equal(resCompraDirecta.fragmentosDespues, 30); // Tope alcanzado
  assert.equal(resCompraDirecta.gradoDespues, 1); // D20: sigue en el grado reclamado
  assert.equal(resCompraDirecta.reclamable, true); // Grado IV listo para reclamar
  assert.equal(resCompraDirecta.bonoFiestaAplicado, true);
  assert.equal(resCompraDirecta.cantidadFinal, 15);
  assert.equal(resCompraDirecta.excedente, 10);
  assert.equal(resCompraDirecta.inciensoGanado, 10);

  // Test 5: Compra con Granos de Incienso
  const saldoInciensoAntes = resCompraDirecta.nuevoSaldoIncienso;
  const resIncienso = await comprarFragmentosDirectos(
    usuarioB.id,
    cartaFiesta.id,
    2,
    "incienso"
  );
  assert.equal(resIncienso.costo, 2); // 2 frags Común = 2 Incienso
  // Como ya estaba al tope (30) y con bono fiesta (2 × 1.5 = 3), los 3 fragmentos re-desbordan en 3 Incienso
  assert.equal(resIncienso.excedente, 3);
  assert.equal(resIncienso.inciensoGanado, 3);
  assert.equal(resIncienso.nuevoSaldoIncienso, saldoInciensoAntes - 2 + 3);

  // Test 6: Reclamo de fiesta litúrgica (D5) e idempotencia
  const resFiesta1 = await reclamarFiesta(usuarioA.id, cartaFiesta.id);
  assert.ok(resFiesta1.fragmentosGanados >= 10); // D21: la carta entera

  // Segundo reclamo el mismo año DEBE fallar
  await assert.rejects(
    async () => {
      await reclamarFiesta(usuarioA.id, cartaFiesta.id);
    },
    { message: /ya fue reclamado este año/ }
  );

  // Test 7: Cumpleaños con fecha de hoy
  // Configurar usuarioA para que su cumpleaños sea hoy
  const anioNac = "1990";
  await prisma.usuario.update({
    where: { id: usuarioA.id },
    data: { fechaNacimiento: new Date(`${anioNac}-${hoyMMdd}T00:00:00.000Z`) },
  });

  const elegibleA = (await eventosDeHoy(usuarioA.id)).cumpleElegibles[0];
  const resCumple1 = await reclamarCumpleanos(usuarioA.id, elegibleA?.cartaId);
  assert.ok(resCumple1.tipo === "carta_elegida" || resCumple1.tipo === "sobre_revelacion_gratis");

  // Segundo reclamo de cumpleaños el mismo año DEBE fallar
  await assert.rejects(
    async () => {
      await reclamarCumpleanos(usuarioA.id);
    },
    { message: /ya fue reclamado este año/ }
  );

  // Test 8: Aislamiento entre usuarios
  const listaA = await listarCartasUsuario(usuarioA.id);
  const listaB = await listarCartasUsuario(usuarioB.id);
  const cartaEnA = listaA.cartas.find((c) => c.id === cartaFiesta.id);
  const cartaEnB = listaB.cartas.find((c) => c.id === cartaFiesta.id);
  assert.notEqual(cartaEnA?.fragmentos, cartaEnB?.fragmentos);

  // Test 9: Consulta de eventos de hoy
  const eventos = await eventosDeHoy(usuarioA.id);
  assert.equal(eventos.fechaHoy, hoyMMdd);
  assert.equal(eventos.esCumple, true);
  assert.equal(eventos.cumpleReclamado, true);
  assert.ok(eventos.fiestas.some((f) => f.cartaId === cartaFiesta.id && f.reclamado === true));
});
