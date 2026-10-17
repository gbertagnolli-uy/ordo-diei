import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { festividadesAlrededor } from "./festividades.ts";

after(async () => {
  await prisma.$disconnect();
});

// Solo lectura contra la base: hay datos litúrgicos de 2026 a 2035
test("las fiestas de un año traen Navidad, Pascua y cada domingo, ordenadas", async () => {
  const f = await festividadesAlrededor("2026-12-31", 365, 0);
  assert.ok(f.length > 40, `solo ${f.length}`);
  assert.ok(f.every((x, i) => i === 0 || f[i - 1].fecha <= x.fecha));
  assert.ok(f.every((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.fecha) && x.titulo.length > 0));
  const navidad = f.find((x) => x.fecha === "2026-12-25");
  assert.ok(navidad, "falta Navidad");
  assert.equal(navidad.mayor, true);
  const domingos = f.filter((x) => new Date(`${x.fecha}T00:00:00Z`).getUTCDay() === 0);
  assert.ok(domingos.length >= 30);
});

test("fuera del rango de datos no hay nada (y no falla)", async () => {
  assert.deepEqual(await festividadesAlrededor("2060-01-01", 10, 10), []);
});
