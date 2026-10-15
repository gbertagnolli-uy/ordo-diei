import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../../prisma.ts";
import { agregarDelCatalogo, calificarRecitado, colaDeHoy, crearPropia, listaDeMemoria, quitarDeMemoria } from "./memoria.ts";
import { nuevaTarjeta, responderNivel } from "./repaso.ts";

after(async () => {
  await prisma.$disconnect();
});

test("responderNivel: bien/fácil alejan la próxima fecha más que difícil y otra vez; se domina tras tres aciertos con ≥ 30 días", () => {
  const t0 = new Date("2031-01-01T10:00:00Z");
  const base = nuevaTarjeta(t0).tarjeta;
  const otra = responderNivel(base, "otra_vez", t0);
  const dificil = responderNivel(base, "dificil", t0);
  const bien = responderNivel(base, "bien", t0);
  const facil = responderNivel(base, "facil", t0);
  assert.ok(otra.proximo <= dificil.proximo && dificil.proximo <= bien.proximo && bien.proximo <= facil.proximo);
  assert.equal(otra.resuelta, false);
  assert.equal(otra.tarjeta._aciertos, 0);
  assert.equal(bien.tarjeta._aciertos, 1);

  // Tres «fácil» seguidos, esperando a que venza cada vez: llega a dominada
  let tarjeta = base;
  let ahora = t0;
  let dominada = false;
  for (let i = 0; i < 6 && !dominada; i++) {
    const r = responderNivel(tarjeta, "facil", ahora);
    tarjeta = r.tarjeta;
    ahora = r.proximo;
    dominada = r.resuelta;
  }
  assert.equal(dominada, true);
});

test("solo padres agregan, califican o quitan; el catálogo y los datos se validan", async () => {
  const hijo = { id: 5, rol: "Hijo" };
  const padre = { id: 1, rol: "Padre" };
  await assert.rejects(agregarDelCatalogo(hijo, [5], ["padre-nuestro"]), { status: 403 });
  await assert.rejects(calificarRecitado(hijo, 1, "bien"), { status: 403 });
  await assert.rejects(quitarDeMemoria(hijo, 1), { status: 403 });
  await assert.rejects(colaDeHoy(hijo, 5), { status: 403 });
  await assert.rejects(listaDeMemoria(hijo, 6), { status: 403 });
  await assert.rejects(agregarDelCatalogo(padre, [], ["padre-nuestro"]), { status: 400 });
  await assert.rejects(agregarDelCatalogo(padre, [5], ["no-existe"]), { status: 400 });
  await assert.rejects(calificarRecitado(padre, 1, "genial"), { status: 400 });
  await assert.rejects(crearPropia(padre, { alumnoId: 5, titulo: "  ", texto: "algo largo" }), { status: 400 });
  await assert.rejects(crearPropia(padre, { alumnoId: 5, titulo: "x", texto: "ab" }), { status: 400 });
});
