import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { eventosDelAlumno, tokenDeCalendario, tokenValido } from "./calendario.ts";

after(async () => {
  await prisma.$disconnect();
});

test("la firma del enlace: propia del alumno, estable y sin el sufijo .ics", () => {
  const t = tokenDeCalendario(7);
  assert.match(t, /^[0-9a-f]{32}$/);
  assert.equal(t, tokenDeCalendario(7));
  assert.notEqual(t, tokenDeCalendario(8));
  assert.equal(tokenValido(7, t), true);
  assert.equal(tokenValido(7, `${t}.ics`), true);
  assert.equal(tokenValido(8, t), false);
  assert.equal(tokenValido(7, t.slice(1) + "0"), false);
  assert.equal(tokenValido(7, ""), false);
  assert.equal(tokenValido(7, "x".repeat(32)), false);
});

// Solo lectura contra la base
test("un id que no es de un hijo no tiene calendario; el de un hijo real, sí", async () => {
  assert.equal(await eventosDelAlumno(999999999, "2026-10-16"), null);
  const hijo = await prisma.usuario.findFirst({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true, nombre: true } });
  if (!hijo) return;
  const cal = await eventosDelAlumno(hijo.id, "2026-10-16");
  assert.equal(cal?.nombre, `Estudio de ${hijo.nombre}`);
  assert.ok(Array.isArray(cal?.eventos));
  const padre = await prisma.usuario.findFirst({ where: { rolFamiliar: { in: ["Padre", "Madre"] } }, select: { id: true } });
  if (padre) assert.equal(await eventosDelAlumno(padre.id, "2026-10-16"), null);
});
