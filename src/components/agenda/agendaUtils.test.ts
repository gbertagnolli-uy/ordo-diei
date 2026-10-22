import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularEstadisticasAgenda,
  filtrarTareasAgenda,
  agruparTareasPorMiembro,
  type AgendaTaskItem,
  type AgendaUser,
} from "./agendaUtils.ts";

const mockUsers: AgendaUser[] = [
  { id: 1, nombre: "Papá", rolFamiliar: "Padre", fotoUrl: "/papa.jpg" },
  { id: 2, nombre: "Juan", rolFamiliar: "Hijo", fotoUrl: "/juan.jpg" },
  { id: 3, nombre: "Lucía", rolFamiliar: "Hija", fotoUrl: "/lucia.jpg" },
];

const mockTasks: AgendaTaskItem[] = [
  {
    id: 101,
    title: "Tender la cama",
    estado: "Pendiente",
    asignados: [mockUsers[1]], // Juan
  },
  {
    id: 102,
    title: "Lavar platos",
    estado: "Esperando_Aprobacion",
    asignados: [mockUsers[1], mockUsers[2]], // Juan y Lucía
  },
  {
    id: 103,
    title: "Rezar Ángelus",
    estado: "Aprobada",
    asignados: [mockUsers[2]], // Lucía
  },
  {
    id: 104,
    title: "Sacar la basura",
    estado: "En_progreso",
    asignados: [mockUsers[0]], // Papá
  },
];

test("calcularEstadisticasAgenda calcula correctamente totales, pendientes, en revisión y completadas", () => {
  const stats = calcularEstadisticasAgenda(mockTasks);
  assert.equal(stats.total, 4);
  assert.equal(stats.pendientes, 1);
  assert.equal(stats.enRevision, 1);
  assert.equal(stats.completadas, 1);
  assert.equal(stats.enProgreso, 1);
  assert.equal(stats.pct, 25); // 1 de 4 = 25%
});

test("filtrarTareasAgenda por usuario retorna las tareas donde el usuario está asignado (individual o co-responsable)", () => {
  // Juan tiene tarea 101 y tarea compartida 102
  const tareasJuan = filtrarTareasAgenda(mockTasks, { userId: 2 });
  assert.equal(tareasJuan.length, 2);
  assert.deepEqual(
    tareasJuan.map((t) => t.id),
    [101, 102]
  );

  // Lucía tiene tarea compartida 102 y tarea 103
  const tareasLucia = filtrarTareasAgenda(mockTasks, { userId: 3 });
  assert.equal(tareasLucia.length, 2);
  assert.deepEqual(
    tareasLucia.map((t) => t.id),
    [102, 103]
  );
});

test("filtrarTareasAgenda por estado y búsqueda", () => {
  const pendientes = filtrarTareasAgenda(mockTasks, { estado: "pendientes" });
  assert.equal(pendientes.length, 3); // 101, 102, 104

  const completadas = filtrarTareasAgenda(mockTasks, { estado: "completadas" });
  assert.equal(completadas.length, 1);
  assert.equal(completadas[0].id, 103);

  const busqueda = filtrarTareasAgenda(mockTasks, { busqueda: "platos" });
  assert.equal(busqueda.length, 1);
  assert.equal(busqueda[0].id, 102);
});

test("agruparTareasPorMiembro agrupa correctamente para la vista de columnas", () => {
  const grupos = agruparTareasPorMiembro(mockUsers, mockTasks, null);
  assert.equal(grupos.length, 3);

  const grupoJuan = grupos.find((g) => g.usuario.id === 2);
  assert.ok(grupoJuan);
  assert.equal(grupoJuan.tareas.length, 2);

  // Si se selecciona un usuario específico, solo retorna ese grupo
  const grupoSoloLucia = agruparTareasPorMiembro(mockUsers, mockTasks, 3);
  assert.equal(grupoSoloLucia.length, 1);
  assert.equal(grupoSoloLucia[0].usuario.id, 3);
  assert.equal(grupoSoloLucia[0].tareas.length, 2);
});
