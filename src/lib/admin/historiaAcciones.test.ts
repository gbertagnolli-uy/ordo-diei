import test from "node:test";
import assert from "node:assert/strict";
import { esPadre } from "../habitos/permisos.ts";
import type { TipoAccionHistorial, AccionHistorial } from "./historiaAcciones.ts";

test("historiaAcciones: tipos de acción soportados", () => {
  const tipos: TipoAccionHistorial[] = ["tarea", "habito", "premio", "compra"];
  assert.equal(tipos.length, 4);
  assert.ok(tipos.includes("tarea"));
  assert.ok(tipos.includes("habito"));
  assert.ok(tipos.includes("premio"));
  assert.ok(tipos.includes("compra"));
});

test("historiaAcciones: solo los padres son reconocidos como administradores para revertir", () => {
  assert.equal(esPadre("Padre"), true);
  assert.equal(esPadre("Madre"), true);
  assert.equal(esPadre("Hijo"), false);
  assert.equal(esPadre("Hija"), false);
  assert.equal(esPadre(undefined), false);
});

test("historiaAcciones: estructura de acción en el log", () => {
  const item: AccionHistorial = {
    id: "tarea-10",
    tipo: "tarea",
    referenciaId: 10,
    titulo: "Tarea aprobada: Tender la cama",
    subtitulo: "En la mañana",
    fecha: new Date().toISOString(),
    usuario: {
      id: 2,
      nombre: "Ignacio",
      fotoUrl: null,
      rolFamiliar: "Hijo",
    },
    actor: {
      id: 1,
      nombre: "Papá",
      fotoUrl: null,
    },
    detalles: {
      puntos: 30,
      estrellas: 0,
      estadoOriginal: "Aprobada",
    },
    revertible: true,
    estado: "activa",
  };

  assert.equal(item.tipo, "tarea");
  assert.equal(item.revertible, true);
  assert.equal(item.estado, "activa");
  assert.equal(item.usuario.nombre, "Ignacio");
});
