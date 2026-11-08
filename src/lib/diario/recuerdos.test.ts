import { test } from "node:test";
import assert from "node:assert/strict";
import {
  OPCIONES_RECUERDOS,
  calcularRecuerdos,
  diaEstupendo,
  diaMalo,
  elegirDelDia,
  esDiaMes,
  esOpcionesRecuerdos,
  fechaDeRespuesta,
  fechasDelDiaMes,
  generador,
  haceAnios,
  haceMeses,
  haceSemanas,
  mesesExactos,
  mismoDiaDelAnio,
  semillaDelDia,
  tituloDeRetrospectiva,
  type FilaRecuerdo,
} from "./recuerdos.ts";

let siguiente = 1;
const fila = (fecha: string, animo: number | null = null, hora = 600): FilaRecuerdo => ({ id: siguiente++, fecha, hora, animo });
const HOY = "2026-11-08";
const todo = { activos: OPCIONES_RECUERDOS.activos, sinMalos: false };
const ninguno = { activos: { anios: false, seis: false, uno: false, semana: false, bueno: false, azar: false }, sinMalos: false };

test("textos en singular y plural", () => {
  assert.equal(haceSemanas(1), "Hace 1 semana");
  assert.equal(haceMeses(6), "Hace 6 meses");
  assert.equal(haceMeses(1), "Hace 1 mes");
  assert.equal(haceAnios(1), "Hace 1 año");
  assert.equal(haceAnios(3), "Hace 3 años");
});

test("mesesExactos: mismo número de día en otro mes, si no -1", () => {
  assert.equal(mesesExactos("2026-05-08", HOY), 6);
  assert.equal(mesesExactos("2026-10-08", HOY), 1);
  assert.equal(mesesExactos("2026-10-09", HOY), -1);
  assert.equal(mesesExactos("2026-11-08", HOY), -1); // mismo mes
  assert.equal(mesesExactos("2025-11-08", HOY), 12);
  assert.equal(mesesExactos("2026-04-30", "2026-10-31"), -1);
});

test("mismoDiaDelAnio compara día y mes", () => {
  assert.equal(mismoDiaDelAnio("2024-11-08", HOY), true);
  assert.equal(mismoDiaDelAnio("2024-11-09", HOY), false);
});

test("días malos y estupendos", () => {
  assert.deepEqual([1, 2, 3, 4, 5, null].map(diaMalo), [true, true, false, false, false, false]);
  assert.deepEqual([1, 2, 3, 4, 5, null].map(diaEstupendo), [false, false, false, true, true, false]);
});

test("semillaDelDia no rellena con ceros", () => {
  assert.equal(semillaDelDia("2026-11-08"), 2026118);
  assert.equal(semillaDelDia("2026-01-05"), 202615);
  assert.equal(semillaDelDia("2026-12-25"), 20261225);
});

test("generador con la misma semilla da la misma secuencia y valores en [0, 1)", () => {
  const a = generador(2026118);
  const b = generador(2026118);
  for (let i = 0; i < 20; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
  assert.notEqual(generador(1)(), generador(2)());
});

test("elegirDelDia: conserva el elegido si sigue en el pozo y no está usado", () => {
  const pozo = [fila("2026-01-01"), fila("2026-01-02"), fila("2026-01-03")];
  assert.equal(elegirDelDia(pozo[1].id, pozo, new Set(), 5), pozo[1].id);
  const nuevo = elegirDelDia(pozo[1].id, pozo, new Set([pozo[1].id]), 5);
  assert.notEqual(nuevo, pozo[1].id);
  assert.ok(pozo.some((f) => f.id === nuevo));
  assert.equal(elegirDelDia(null, [], new Set(), 5), null);
  assert.equal(elegirDelDia(null, pozo, new Set(pozo.map((f) => f.id)), 5), null);
  // estable: misma semilla, mismo resultado
  assert.equal(elegirDelDia(null, pozo, new Set(), 2026118), elegirDelDia(null, pozo, new Set(), 2026118));
});

test("sin entradas no hay recuerdos", () => {
  const r = calcularRecuerdos([], HOY, todo);
  assert.deepEqual(r.grupos, []);
  assert.deepEqual(r.elegidos, { fecha: HOY, bueno: null, azar: null });
});

test("«En este día»: mismo día de años anteriores, el más reciente primero, con «Hace N años»", () => {
  const a = fila("2024-11-08");
  const b = fila("2025-11-08");
  const c = fila("2026-11-08"); // este año: no cuenta
  const r = calcularRecuerdos([a, b, c], HOY, todo);
  assert.equal(r.grupos.length, 1);
  assert.equal(r.grupos[0].clave, "anios");
  assert.equal(r.grupos[0].enEsteDia, true);
  assert.deepEqual(r.grupos[0].entradas, [
    { id: b.id, etiqueta: "Hace 1 año" },
    { id: a.id, etiqueta: "Hace 2 años" },
  ]);
});

test("hace 6 meses, 1 mes y 1 semana", () => {
  const seis = fila("2026-05-08");
  const uno = fila("2026-10-08");
  const semana = fila("2026-11-01");
  const otra = fila("2026-09-15");
  const r = calcularRecuerdos([seis, uno, semana, otra], HOY, todo);
  assert.deepEqual(r.grupos.map((g) => [g.clave, g.titulo, g.entradas.map((e) => e.id)]), [
    ["seis", "Hace 6 meses", [seis.id]],
    ["uno", "Hace 1 mes", [uno.id]],
    ["semana", "Hace 1 semana", [semana.id]],
  ]);
  // una sola entrada en el grupo: la etiqueta es el título del grupo
  assert.equal(r.grupos[0].entradas[0].etiqueta, "Hace 6 meses");
});

test("varias entradas del mismo día en un grupo: cada una lleva su hora", () => {
  const a = fila("2026-10-08", null, 8 * 60 + 5);
  const b = fila("2026-10-08", null, 21 * 60);
  const r = calcularRecuerdos([b, a], HOY, todo);
  assert.deepEqual(r.grupos[0].entradas, [
    { id: a.id, etiqueta: "08:05" },
    { id: b.id, etiqueta: "21:00" },
  ]);
});

test("cada entrada cae en un solo grupo: hace 12 meses es «En este día», no «hace un mes»", () => {
  const f = fila("2025-11-08");
  const r = calcularRecuerdos([f], HOY, todo);
  assert.deepEqual(r.grupos.map((g) => g.clave), ["anios"]);
});

test("las opciones apagan cada grupo", () => {
  const filas = [fila("2025-11-08"), fila("2026-05-08"), fila("2026-10-08"), fila("2026-11-01")];
  assert.deepEqual(calcularRecuerdos(filas, HOY, ninguno).grupos, []);
  for (const clave of ["anios", "seis", "uno", "semana"] as const) {
    const r = calcularRecuerdos(filas, HOY, { ...ninguno, activos: { ...ninguno.activos, [clave]: true } });
    assert.deepEqual(r.grupos.map((g) => g.clave), [clave]);
  }
});

test("«excluir días malos» saca las entradas con ánimo 1 y 2", () => {
  const mala = fila("2026-10-08", 1);
  const buena = fila("2026-11-01", 4);
  const r = calcularRecuerdos([mala, buena], HOY, { ...todo, sinMalos: true });
  assert.deepEqual(r.grupos.map((g) => g.clave), ["semana"]);
  assert.equal(calcularRecuerdos([mala, buena], HOY, todo).grupos.length, 2);
});

test("con 7 entradas o menos no hay recuerdos al azar", () => {
  const filas = Array.from({ length: 7 }, (_, i) => fila(`2026-0${i + 1}-15`, 5));
  const r = calcularRecuerdos(filas, HOY, todo);
  assert.deepEqual(r.grupos, []);
  assert.deepEqual(r.elegidos, { fecha: HOY, bueno: null, azar: null });
});

test("con más de 7 entradas: un buen día y un día aleatorio, distintos entre sí", () => {
  const filas = [
    ...Array.from({ length: 6 }, (_, i) => fila(`2026-0${i + 1}-15`, 5)),
    ...Array.from({ length: 4 }, (_, i) => fila(`2025-0${i + 1}-20`, 3)),
  ];
  const r = calcularRecuerdos(filas, HOY, todo);
  const bueno = r.grupos.find((g) => g.clave === "bueno");
  const azar = r.grupos.find((g) => g.clave === "azar");
  assert.ok(bueno && azar);
  assert.equal(bueno.titulo, "Un buen día");
  assert.equal(azar.titulo, "Un día aleatorio");
  assert.notEqual(bueno.entradas[0].id, azar.entradas[0].id);
  const elegida = filas.find((f) => f.id === bueno.entradas[0].id)!;
  assert.equal(diaEstupendo(elegida.animo), true);
  assert.equal(r.elegidos.bueno, bueno.entradas[0].id);
  assert.equal(r.elegidos.azar, azar.entradas[0].id);
});

test("lo elegido hoy se conserva aunque cambie el resto, pero no de un día para otro", () => {
  const filas = Array.from({ length: 12 }, (_, i) => fila(`2026-0${(i % 9) + 1}-${10 + i}`, i % 2 ? 5 : 3));
  const primera = calcularRecuerdos(filas, HOY, todo);
  const nueva = fila("2026-10-30", 5);
  const segunda = calcularRecuerdos([...filas, nueva], HOY, todo, primera.elegidos);
  assert.equal(segunda.elegidos.bueno, primera.elegidos.bueno);
  assert.equal(segunda.elegidos.azar, primera.elegidos.azar);
  // con las elecciones de otro día se vuelve a elegir (no se reutiliza un id de ayer)
  const manana = calcularRecuerdos([...filas, nueva], "2026-11-09", todo, { ...primera.elegidos });
  assert.equal(manana.elegidos.fecha, "2026-11-09");
});

test("los recuerdos al azar no repiten una entrada ya usada por «hace 1 semana»", () => {
  const filas = [fila("2026-11-01", 5), ...Array.from({ length: 8 }, (_, i) => fila(`2026-0${i + 1}-15`, 3))];
  const r = calcularRecuerdos(filas, HOY, todo);
  const ids = r.grupos.flatMap((g) => g.entradas.map((e) => e.id));
  assert.equal(new Set(ids).size, ids.length);
});

test("esOpcionesRecuerdos valida lo guardado", () => {
  assert.equal(esOpcionesRecuerdos(OPCIONES_RECUERDOS), true);
  assert.equal(esOpcionesRecuerdos({ ...OPCIONES_RECUERDOS, activos: { anios: true } }), false);
  assert.equal(esOpcionesRecuerdos({ ...OPCIONES_RECUERDOS, mostrar: 1 }), false);
  assert.equal(esOpcionesRecuerdos(null), false);
});

test("esDiaMes acepta solo días y meses que existen", () => {
  for (const v of ["01-01", "02-29", "12-31", "11-08"]) assert.equal(esDiaMes(v), true, v);
  for (const v of ["13-01", "00-10", "02-30", "04-31", "1-1", "2026-11-08", 5, null]) assert.equal(esDiaMes(v), false, String(v));
});

test("fechasDelDiaMes: de más nueva a más vieja y sin los años donde no existe el día", () => {
  assert.deepEqual(fechasDelDiaMes("11-08", 2024, 2026), ["2026-11-08", "2025-11-08", "2024-11-08"]);
  assert.deepEqual(fechasDelDiaMes("02-29", 2023, 2028), ["2028-02-29", "2024-02-29"]);
  assert.deepEqual(fechasDelDiaMes("11-08", 2026, 2026), ["2026-11-08"]);
  assert.deepEqual(fechasDelDiaMes("11-08", 2027, 2026), []);
});

test("tituloDeRetrospectiva", () => {
  assert.equal(tituloDeRetrospectiva([2025, 2023], 2026, true), "Un recuerdo de hace 1 año.");
  assert.equal(tituloDeRetrospectiva([2023], 2026, true), "Un recuerdo de hace unos años.");
  assert.equal(tituloDeRetrospectiva([2025], 2026, false), "Un recuerdo de esta fecha.");
});

test("fechaDeRespuesta: ese día del año de hoy, o null si todavía no llegó", () => {
  assert.equal(fechaDeRespuesta("11-08", HOY), "2026-11-08");
  assert.equal(fechaDeRespuesta("03-15", HOY), "2026-03-15");
  assert.equal(fechaDeRespuesta("12-25", HOY), null);
  assert.equal(fechaDeRespuesta("02-29", HOY), null);
});
