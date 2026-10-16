// Compañero que evoluciona contra la base (lane 203).
// Escribe en la base de DATABASE_URL: solo corre con PERMITIR_TESTS_DB=1 (usar una base local, no la real).
import test from "node:test";
import assert from "node:assert/strict";
import { addDays, format, parseISO } from "date-fns";
import prisma from "../prisma.ts";
import { aFecha, hoyEnFamilia } from "../habitos/server.ts";
import { companeroDe, festejarEtapa, nombrarCompanero } from "./companeroServidor.ts";

const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base)";
const haceDias = (n: number) => aFecha(format(addDays(parseISO(hoyEnFamilia()), -n), "yyyy-MM-dd"));

test("compañero: etapa por días de uso, nombre, festejo y regreso sin culpa", { skip: sinBase }, async () => {
  const u = await prisma.usuario.create({ data: { nombre: `__test_companero_${Date.now()}__`, pinSecretoHash: "x", fechaNacimiento: new Date("2016-01-01"), rolFamiliar: "Hijo" } });
  try {
    // Primer día: huevito, sin nombre, nada que festejar ni que dar la bienvenida
    const a = await companeroDe(u.id);
    assert.equal(a.etapa.nombre, "Huevito");
    assert.equal(a.diasDeUso, 1);
    assert.equal(a.tieneNombre, false);
    assert.equal(a.nuevaEtapa, false);
    assert.equal(a.regreso, null);
    assert.equal(a.proxima?.faltan, 2);

    // Se estrena con el nombre; validaciones
    await assert.rejects(nombrarCompanero(u.id, "   "), /Escribí un nombre/);
    await nombrarCompanero(u.id, "  Luz  ");
    assert.equal((await companeroDe(u.id)).nombre, "Luz");

    // Pasó el tiempo: entró 6 y 5 días atrás (y hoy) → 3 días de uso: nace el Pichón y hay festejo
    await prisma.actividadDia.createMany({ data: [6, 5].map((n) => ({ usuarioId: u.id, fecha: haceDias(n) })) });
    const b = await companeroDe(u.id);
    assert.equal(b.diasDeUso, 3);
    assert.equal(b.etapa.nombre, "Pichón");
    assert.equal(b.nuevaEtapa, true);
    // Faltó varios días (la última vez fue hace 5): bienvenida cálida, sin números
    assert.match(b.regreso ?? "", /Luz se despertó contento/);
    assert.doesNotMatch(b.regreso ?? "", /\d/);

    // Festejar apaga el aviso y no se vuelve a mostrar
    await festejarEtapa(u.id);
    assert.equal((await companeroDe(u.id)).nuevaEtapa, false);

    // Faltar nunca achica: la etapa depende de los días acumulados
    assert.equal((await companeroDe(u.id)).etapa.nombre, "Pichón");
  } finally {
    await prisma.usuario.delete({ where: { id: u.id } });
  }
});
