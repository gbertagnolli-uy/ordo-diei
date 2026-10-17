import test from "node:test";
import assert from "node:assert/strict";
import { calcularRachaApp } from "./racha.ts";
import { HITOS_RACHA, hitosAlcanzados, proximoHito, origenHito } from "./hitos.ts";
import { cofreGanado, misionesDeHoy, PUNTOS_MISION, type ContextoMisiones } from "./misiones.ts";

const HOY = "2026-10-16";

test("racha: días seguidos incluyendo hoy", () => {
  const r = calcularRachaApp(["2026-10-14", "2026-10-15", "2026-10-16"], HOY);
  assert.equal(r.dias, 3);
  assert.equal(r.inicio, "2026-10-14");
  assert.equal(r.ingresoHoy, true);
  assert.equal(r.comodinDisponible, true);
});

test("racha: si todavía no entró hoy, la racha de ayer sigue viva", () => {
  const r = calcularRachaApp(["2026-10-14", "2026-10-15"], HOY);
  assert.equal(r.dias, 2);
  assert.equal(r.ingresoHoy, false);
});

test("racha: un día perdido se perdona con el comodín y no suma", () => {
  const r = calcularRachaApp(["2026-10-13", "2026-10-15", "2026-10-16"], HOY);
  assert.equal(r.dias, 3);
  assert.equal(r.ultimoComodin, "2026-10-14");
  assert.equal(r.comodinDisponible, false);
});

test("racha: dos días perdidos seguidos cortan la racha", () => {
  const r = calcularRachaApp(["2026-10-12", "2026-10-15", "2026-10-16"], HOY);
  assert.equal(r.dias, 2);
  assert.equal(r.inicio, "2026-10-15");
});

test("racha: un segundo día perdido en la misma semana corta; después de 7 días se vuelve a perdonar", () => {
  // Perdidos el 14 y el 11: solo 3 días de distancia → el segundo corta
  const corta = calcularRachaApp(["2026-10-10", "2026-10-12", "2026-10-13", "2026-10-15", "2026-10-16"], HOY);
  assert.equal(corta.dias, 4); // 16, 15, 13, 12 (perdona el 14); el 11 no se perdona → termina en el 12
  assert.equal(corta.inicio, "2026-10-12");
  // Perdidos el 14 y el 7 (7 días de distancia) → los dos se perdonan
  const larga = calcularRachaApp(["2026-10-05", "2026-10-06", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-15", "2026-10-16"], HOY);
  assert.equal(larga.inicio, "2026-10-05");
  assert.equal(larga.dias, 10);
});

test("racha: un perdón no puede abrirse paso hacia atrás sin ingreso previo ni sin historia", () => {
  assert.equal(calcularRachaApp([], HOY).dias, 0);
  // Ayer se perdió y antes de ayer no hay nada: no hay racha que salvar
  assert.equal(calcularRachaApp(["2026-10-16"], HOY).dias, 1);
  assert.equal(calcularRachaApp(["2026-10-10"], HOY).dias, 0);
});

test("racha: el comodín vuelve a estar disponible a los 7 días del último perdón", () => {
  const fechas = ["2026-10-07", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"];
  const r = calcularRachaApp(fechas, HOY); // perdona el 8
  assert.equal(r.ultimoComodin, "2026-10-08");
  assert.equal(r.comodinDisponible, true);
});

test("hitos: ordenados y con premios que crecen", () => {
  const dias = HITOS_RACHA.map((h) => h.dias);
  assert.deepEqual(dias, [...dias].sort((a, b) => a - b));
  for (let i = 1; i < HITOS_RACHA.length; i++) assert.ok(HITOS_RACHA[i].puntos > HITOS_RACHA[i - 1].puntos);
  assert.deepEqual(hitosAlcanzados(7).map((h) => h.dias), [3, 7]);
  assert.equal(proximoHito(7)?.dias, 14);
  assert.equal(proximoHito(400), null);
  assert.equal(origenHito(HITOS_RACHA[0], "2026-10-14"), "Racha en la app · 3 días · desde 2026-10-14");
});

const base: ContextoMisiones = {
  hijos: [
    { id: 2, nombre: "Ana", registradoHoy: true },
    { id: 3, nombre: "Luis", registradoHoy: false },
  ],
  estudioHoy: 0,
  pendientes: 0,
  aprobadasHoy: 0,
  mensajesHoy: 0,
};

test("misiones: sin pendientes, la tercera es escribirle algo a un hijo", () => {
  const m = misionesDeHoy(base);
  assert.deepEqual(m.map((x) => x.clave), ["comportamiento", "estudio", "mensaje"]);
  assert.equal(m[0].actual, 1);
  assert.equal(m[0].total, 2);
  assert.equal(m[0].hecha, false);
  assert.match(m[0].detalle, /Luis/);
  assert.ok(m.every((x) => x.puntos === PUNTOS_MISION));
});

test("misiones: con tareas por aprobar, esa pasa a ser la tercera; se cumple al dejar la bandeja vacía", () => {
  const con = misionesDeHoy({ ...base, pendientes: 2 });
  assert.deepEqual(con.map((x) => x.clave), ["comportamiento", "estudio", "pendientes"]);
  assert.equal(con[2].hecha, false);
  const lista = misionesDeHoy({ ...base, pendientes: 0, aprobadasHoy: 2 });
  assert.equal(lista[2].clave, "pendientes");
  assert.equal(lista[2].hecha, true);
});

test("misiones: sin hijos no hay misión de comportamiento", () => {
  const m = misionesDeHoy({ ...base, hijos: [], pendientes: 1 });
  assert.deepEqual(m.map((x) => x.clave), ["estudio", "pendientes", "mensaje"]);
});

test("misiones: una ya premiada se conserva aunque cambie lo que falta durante el día", () => {
  // Por la mañana cumplió «mensaje»; por la tarde un hijo manda algo a aprobar y «pendientes» desplaza a «mensaje»
  const m = misionesDeHoy({ ...base, mensajesHoy: 1, pendientes: 1 }, ["mensaje"]);
  assert.ok(m.some((x) => x.clave === "mensaje" && x.hecha));
  assert.equal(m.length, 3);
});

test("misiones: lo ya premiado queda como hecho aunque después se deshaga", () => {
  // Registró a los dos hijos (premiada) y después un padre borró uno de los registros
  const m = misionesDeHoy(base, ["comportamiento"]);
  assert.equal(m[0].clave, "comportamiento");
  assert.equal(m[0].hecha, true);
  assert.equal(m[0].actual, m[0].total);
});

test("misiones: con muchos hijos sin registrar, la lista de nombres se acorta", () => {
  const hijos = ["Ana", "Luis", "Eva", "Tomás", "Rosa"].map((nombre, id) => ({ id, nombre, registradoHoy: false }));
  const m = misionesDeHoy({ ...base, hijos });
  assert.match(m[0].detalle, /Ana, Luis, Eva y 2 más/);
});

test("cofre: alcanza con registrar a todos los hijos, sin importar las otras misiones", () => {
  assert.equal(cofreGanado(misionesDeHoy(base)), false);
  const registrados = { ...base, hijos: base.hijos.map((h) => ({ ...h, registradoHoy: true })) };
  assert.equal(cofreGanado(misionesDeHoy(registrados)), true);
  assert.equal(misionesDeHoy(registrados).some((m) => !m.hecha), true);
});

test("cofre: sin hijos hacen falta todas las misiones", () => {
  const sinHijos = { ...base, hijos: [] };
  assert.equal(cofreGanado(misionesDeHoy(sinHijos)), false);
  assert.equal(cofreGanado(misionesDeHoy({ ...sinHijos, estudioHoy: 1, mensajesHoy: 1 })), true);
});
