import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { resumenSemanal } from "./resumenSemana.ts";

after(async () => {
  await prisma.$disconnect();
});

test("un Hijo no ve el resumen de la semana", async () => {
  await assert.rejects(resumenSemanal({ id: 5, rol: "Hijo" }), { status: 403 });
});

// Solo lectura contra la base: la forma del resumen
test("el resumen trae un renglón por hijo, de lunes a hoy", { skip: !process.env.DATABASE_URL && "requiere DATABASE_URL" }, async () => {
  const r = await resumenSemanal({ id: 1, rol: "Padre" }, "2026-10-16");
  assert.deepEqual([r.desde, r.hasta], ["2026-10-12", "2026-10-16"]);
  const hijos = await prisma.usuario.count({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } } });
  assert.equal(r.hijos.length, hijos);
  for (const h of r.hijos) {
    assert.ok(h.dias.hechos <= h.dias.planeados);
    assert.ok(h.minutos >= 0 && h.paginas >= 0 && h.recitados >= 0 && h.trabajos >= 0);
    assert.equal(h.notas.promedio === null, h.notas.cantidad === 0);
  }
});
