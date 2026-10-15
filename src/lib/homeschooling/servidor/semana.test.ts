import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { hojaSemana } from "./semana.ts";

after(async () => {
  await prisma.$disconnect();
});

test("un Hijo no pide la hoja semanal", async () => {
  await assert.rejects(hojaSemana({ id: 5, rol: "Hijo" }, 5, "2026-10-12"), { status: 403 });
});

// Solo lectura contra la base: la consulta es válida y la forma de la hoja es la esperada
test("la hoja de un hijo real trae siete días seguidos de lunes a domingo", async () => {
  const hijo = await prisma.usuario.findFirst({ where: { rolFamiliar: { in: ["Hijo", "Hija"] } }, select: { id: true } });
  if (!hijo) return;
  const h = await hojaSemana({ id: 1, rol: "Padre" }, hijo.id, "2026-10-12");
  assert.equal(h.dias.length, 7);
  assert.deepEqual([h.dias[0].fecha, h.dias[6].fecha, h.anterior, h.siguiente], ["2026-10-12", "2026-10-18", "2026-10-05", "2026-10-19"]);
  assert.equal(h.minutosTotales, h.dias.flatMap((d) => d.items).reduce((n, i) => n + i.minutos, 0));
  await assert.rejects(hojaSemana({ id: 1, rol: "Padre" }, 1, "2026-10-12"), (e: { status?: number }) => e.status === 404);
});
