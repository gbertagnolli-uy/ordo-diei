// Compañero «héroe» contra la base (lanes 203 y 220).
// Escribe en la base de DATABASE_URL: solo corre con PERMITIR_TESTS_DB=1 (usar una base local, no la real).
import test from "node:test";
import assert from "node:assert/strict";
import { addDays, format, parseISO } from "date-fns";
import prisma from "../prisma.ts";
import { aFecha, hoyEnFamilia } from "../habitos/server.ts";
import { comprarAccesorio, companeroDe, elegirPersonaje, equiparAccesorio, festejarNivel, nombrarCompanero } from "./companeroServidor.ts";

const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base)";
const haceDias = (n: number) => aFecha(format(addDays(parseISO(hoyEnFamilia()), -n), "yyyy-MM-dd"));
const crear = () => prisma.usuario.create({ data: { nombre: `__test_companero_${Date.now()}__`, pinSecretoHash: "x", fechaNacimiento: new Date("2016-01-01"), rolFamiliar: "Hijo" } });

test("compañero: elegir, nombre sugerido, días juntos, regreso sin culpa y festejo de nivel", { skip: sinBase }, async () => {
  const u = await crear();
  try {
    // Primer día: sin elegir nada que festejar ni que dar la bienvenida
    const a = await companeroDe(u.id);
    assert.equal(a.personaje, null);
    assert.equal(a.tieneNombre, false);
    assert.equal(a.nivelNuevo, false);
    assert.equal(a.regreso, null);
    assert.equal(a.diasJuntos, 1);
    assert.equal(a.nivel.numero, 1);

    // Personaje inexistente y nombre en blanco se rechazan; sin personaje no se puede nombrar
    await assert.rejects(elegirPersonaje(u.id, "dragon"), /no existe/);
    await assert.rejects(nombrarCompanero(u.id, "Luz"), /Primero elegí/);
    await assert.rejects(elegirPersonaje(u.id, "nina", "x".repeat(21)), /20/);

    // Se estrena con el nombre sugerido y el nivel actual ya cuenta como visto
    await elegirPersonaje(u.id, "nina");
    const b = await companeroDe(u.id);
    assert.equal(b.personaje, "nina");
    assert.equal(b.nombre, "Sofi");
    assert.equal(b.nivelNuevo, false);
    assert.deepEqual(b.equipados, { fondo: "capilla", objetos: ["veladora"] });
    await nombrarCompanero(u.id, "  Luz  ");
    assert.equal((await companeroDe(u.id)).nombre, "Luz");
    // Cambiar de personaje conserva el nombre
    await elegirPersonaje(u.id, "monja");
    assert.equal((await companeroDe(u.id)).nombre, "Luz");

    // Pasaron los días: entró hace 9 y 8 días (y hoy) → 3 días juntos y abrazo por haber faltado
    await prisma.actividadDia.createMany({ data: [9, 8].map((n) => ({ usuarioId: u.id, fecha: haceDias(n) })) });
    const c = await companeroDe(u.id);
    assert.equal(c.diasJuntos, 3);
    assert.equal(c.situacion, "regreso");
    assert.equal(c.pose, "abrazo");
    assert.match(c.regreso ?? "", /Luz/);
    assert.doesNotMatch(c.regreso ?? "", /\d/);

    // Sube de nivel con la XP de siempre (400 XP = nivel 3): hay festejo hasta que lo confirma
    await prisma.usuario.update({ where: { id: u.id }, data: { experienciaHabitos: 400 } });
    const d = await companeroDe(u.id);
    assert.equal(d.nivel.numero, 3);
    assert.equal(d.nivelNuevo, true);
    assert.equal(d.pose, "felicitando");
    assert.equal(d.situacion, "festejo");
    await festejarNivel(u.id);
    assert.equal((await companeroDe(u.id)).nivelNuevo, false);
  } finally {
    await prisma.usuario.delete({ where: { id: u.id } });
  }
});

test("accesorios: comprar con monedas, no dos veces, nivel, sanción y equipar con espacios", { skip: sinBase }, async () => {
  const u = await crear();
  try {
    await elegirPersonaje(u.id, "sacerdote");
    // Nivel 1: el jardín se abre en el 2
    await prisma.usuario.update({ where: { id: u.id }, data: { availablePoints: 500, incienso: 5 } });
    await assert.rejects(comprarAccesorio(u.id, "jardin"), /nivel 2/);
    await assert.rejects(comprarAccesorio(u.id, "capilla"), /de regalo/);
    await assert.rejects(comprarAccesorio(u.id, "nada"), /no existe/);

    // Nivel 2 (100 XP): se compra, se cobra una sola vez y no se paga dos veces
    await prisma.usuario.update({ where: { id: u.id }, data: { experienciaHabitos: 100 } });
    await comprarAccesorio(u.id, "jardin");
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: u.id } })).availablePoints, 450);
    await assert.rejects(comprarAccesorio(u.id, "jardin"), /Ya lo tenés/);
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: u.id } })).availablePoints, 450);

    // Sin saldo no se compra y no se descuenta nada
    await prisma.usuario.update({ where: { id: u.id }, data: { availablePoints: 10 } });
    await assert.rejects(comprarAccesorio(u.id, "maceta"), /monedas/);
    assert.equal((await prisma.usuario.findUniqueOrThrow({ where: { id: u.id } })).availablePoints, 10);

    // Equipar: solo lo que es suyo; un fondo reemplaza al otro
    await assert.rejects(equiparAccesorio(u.id, "noche", true), /Todavía no/);
    await equiparAccesorio(u.id, "jardin", true);
    assert.equal((await companeroDe(u.id)).equipados.fondo, "jardin");

    // Nivel 2 = un solo espacio de objetos, ocupado por la veladora
    await prisma.usuario.update({ where: { id: u.id }, data: { availablePoints: 100 } });
    await comprarAccesorio(u.id, "maceta");
    await assert.rejects(equiparAccesorio(u.id, "maceta", true), /más lugar/);
    await equiparAccesorio(u.id, "veladora", false);
    await equiparAccesorio(u.id, "maceta", true);
    assert.deepEqual((await companeroDe(u.id)).equipados.objetos, ["maceta"]);

    // Día con sanción: la tienda de accesorios está cerrada
    await prisma.comportamiento.create({ data: { usuarioId: u.id, registradoPorId: u.id, tipo: "Negativo", titulo: "prueba" } });
    await assert.rejects(comprarAccesorio(u.id, "libros"), /deshabilitad|1 día/i);
  } finally {
    await prisma.usuario.delete({ where: { id: u.id } });
  }
});
