import { test } from "node:test";
import assert from "node:assert/strict";
import { armarLibreta, letraDe, promedio, promedioGeneral, puntajeValido, tonoDe } from "./calificaciones.ts";

test("letraDe: cortes en 90/80/70/60", () => {
  assert.deepEqual([100, 90, 89, 80, 79, 70, 69, 60, 59, 0].map(letraDe), ["A", "A", "B", "B", "C", "C", "D", "D", "F", "F"]);
});

test("puntajeValido: entero de 0 a 100", () => {
  for (const n of [0, 55, 100]) assert.equal(puntajeValido(n), true);
  for (const n of [-1, 101, 7.5, NaN, "80", null, undefined]) assert.equal(puntajeValido(n), false, String(n));
});

test("promedio: un decimal, null sin notas", () => {
  assert.equal(promedio([]), null);
  assert.equal(promedio([100, 90, 85]), 91.7);
  assert.equal(promedio([70]), 70);
});

test("tonoDe", () => {
  assert.deepEqual([95, 80, 79, 60, 59].map(tonoDe), ["bien", "bien", "medio", "medio", "bajo"]);
});

test("armarLibreta: agrupa por materia, ordena y promedia; incluye materias sin notas", () => {
  const nota = (id: number, materiaId: number, materia: string, fecha: string, puntaje: number) => ({ id, materiaId, materia, color: null, fecha, titulo: `t${id}`, tipo: "tarea" as const, puntaje, comentario: null, diaLectivoId: null });
  const libreta = armarLibreta([nota(1, 2, "Matemática", "2026-10-01", 80), nota(2, 2, "Matemática", "2026-10-05", 100), nota(3, 1, "Historia", "2026-10-02", 55)], [{ id: 3, nombre: "Latín", color: null }]);
  assert.deepEqual(libreta.map((m) => m.materia), ["Historia", "Latín", "Matemática"]);
  const mate = libreta.find((m) => m.materiaId === 2)!;
  assert.deepEqual(mate.notas.map((n) => n.id), [2, 1]);
  assert.deepEqual([mate.promedio, mate.letra], [90, "A"]);
  assert.deepEqual([libreta[1].promedio, libreta[1].letra], [null, null]);
  assert.equal(promedioGeneral(libreta), 78.3);
  assert.equal(promedioGeneral([]), null);
});
