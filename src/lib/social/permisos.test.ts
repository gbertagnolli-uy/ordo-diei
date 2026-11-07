import { test } from "node:test";
import assert from "node:assert/strict";
import { extraerMenciones, puedeBorrarPost, puedeEditarPost, puedeFijar, puedeVerCanal, usernameDe } from "./permisos.ts";

const papa = { id: 1, rol: "Padre" };
const mama = { id: 2, rol: "Madre" };
const juan = { id: 3, rol: "Hijo" };
const ana = { id: 4, rol: "Hija" };

test("puedeVerCanal: público para todos; privado o de materia, miembros y padres", () => {
  assert.equal(puedeVerCanal({ tipo: "publico", materiaId: null }, ana, []), true);
  const privado = { tipo: "privado" as const, materiaId: null };
  assert.equal(puedeVerCanal(privado, juan, [3]), true);
  assert.equal(puedeVerCanal(privado, ana, [3]), false);
  assert.equal(puedeVerCanal(privado, mama, []), true);
  const materia = { tipo: "publico" as const, materiaId: 7 };
  assert.equal(puedeVerCanal(materia, ana, [3]), false);
  assert.equal(puedeVerCanal(materia, juan, [3]), true);
  assert.equal(puedeVerCanal(materia, papa, []), true);
});

test("puedeEditarPost: solo el autor", () => {
  assert.equal(puedeEditarPost({ autorId: 3 }, juan), true);
  assert.equal(puedeEditarPost({ autorId: 3 }, papa), false);
});

test("puedeBorrarPost: el autor o un padre", () => {
  assert.equal(puedeBorrarPost({ autorId: 3 }, juan), true);
  assert.equal(puedeBorrarPost({ autorId: 3 }, mama), true);
  assert.equal(puedeBorrarPost({ autorId: 3 }, ana), false);
});

test("puedeFijar: solo padres", () => {
  assert.equal(puedeFijar(papa), true);
  assert.equal(puedeFijar(juan), false);
  assert.equal(puedeFijar({ id: 9 }), false);
});

test("usernameDe: sin tildes, minúsculas, guiones bajos", () => {
  assert.equal(usernameDe("Ana Prueba"), "ana_prueba");
  assert.equal(usernameDe("Mamá"), "mama");
  assert.equal(usernameDe("  José-María  Núñez "), "jose_maria_nunez");
  assert.equal(usernameDe("¡¿?!"), "usuario");
});

test("extraerMenciones: @username en orden, sin duplicados ni autor", () => {
  const usuarios = [
    { id: 3, nombre: "Juan" },
    { id: 5, nombre: "Juan Pablo" },
    { id: 4, nombre: "Ana" },
    { id: 2, nombre: "Mamá" },
    { id: 9, nombre: "Ána" },
  ];
  assert.deepEqual(extraerMenciones("Hola @ana y @Ana otra vez", usuarios, 1), [4]);
  assert.deepEqual(extraerMenciones("@juan_pablo y @juan", usuarios, 1), [5, 3]);
  assert.deepEqual(extraerMenciones("Gracias @mama!", usuarios, 1), [2]);
  assert.deepEqual(extraerMenciones("Yo @ana", usuarios, 4), []);
  assert.deepEqual(extraerMenciones("@anabel no existe", usuarios, 1), []);
  assert.deepEqual(extraerMenciones("correo a@ana.com", usuarios, 1), [4]); // igual que OpenCircle
  assert.deepEqual(extraerMenciones("@ana", [{ id: 9, nombre: "Ána" }, { id: 4, nombre: "Ana" }], 1), [4]); // mismo username: id menor
  assert.deepEqual(extraerMenciones("sin menciones", usuarios, 1), []);
});
