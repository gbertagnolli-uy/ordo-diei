import { test } from "node:test";
import assert from "node:assert/strict";
import { mapGroup, mapModule, mapModuleWithProgress, mapRecording, unidadesCubiertas } from "./dto.ts";
import { hasPermission, rolDeGrupo } from "./permisos.ts";

const recurso = {
  id: 7, materiaId: 2, titulo: "Historia", descripcion: null, portadaUrl: null, orden: 3, creadorId: 1, tipo: "libro",
  unidadTipo: "pagina", totalUnidades: 10, url: null, libroId: null, minutosPorUnidad: 20, umbralAprobacion: 70,
  navegacionLibre: false, createdAt: new Date(), updatedAt: new Date(),
} as const;
const leccion = (id: number, orden: number) =>
  ({ id, recursoId: 7, orden, titulo: `L${orden}`, instrucciones: "texto", url: null, videoPlataforma: null, videoId: null, miniaturaUrl: null, creadorId: 1, createdAt: new Date() }) as const;

test("mapModule usa los nombres de Roost", () => {
  const m = mapModule(recurso);
  assert.equal(m.display_order, 3);
  assert.equal(m.materia_id, 2);
  assert.equal(m.title, "Historia");
  assert.equal(m.total_unidades, 10);
});

test("mapRecording: display_order, video_* y is_completed", () => {
  const r = mapRecording(leccion(1, 4), true);
  assert.equal(r.display_order, 4);
  assert.equal(r.description, "texto");
  assert.equal(r.video_url, null);
  assert.equal(r.is_completed, true);
});

test("mapGroup", () => {
  const g = mapGroup({ id: 1, nombre: "Mate", descripcion: null, portadaUrl: null, icono: "Calculator", color: "primary", dificultad: "Media", orden: 0, activa: true, creadorId: 1, createdAt: new Date() });
  assert.deepEqual([g.name, g.icon, g.is_active], ["Mate", "Calculator", true]);
});

test("progreso: unidades de días hecha u omitida sobre el total", () => {
  const cub = unidadesCubiertas([
    { estado: "hecha", unidadDesde: 1, unidadHasta: 3 },
    { estado: "omitida", unidadDesde: 4, unidadHasta: 4 },
    { estado: "pendiente", unidadDesde: 5, unidadHasta: 9 },
    { estado: "movida", unidadDesde: 10, unidadHasta: 10 },
  ]);
  assert.deepEqual([...cub], [1, 2, 3, 4]);
  const m = mapModuleWithProgress(recurso, [leccion(1, 1), leccion(2, 5)], cub, true);
  assert.equal(m.progress_percentage, 40);
  assert.equal(m.completed_count, 4);
  assert.equal(m.recording_count, 2);
  assert.deepEqual(m.recordings?.map((r) => r.is_completed), [true, false]);
});

test("sin plan el progreso es 0 y no incluye lecciones si no se piden", () => {
  const m = mapModuleWithProgress(recurso, [], new Set(), false);
  assert.equal(m.progress_percentage, 0);
  assert.equal(m.recordings, undefined);
});

test("hasPermission con los roles mapeados", () => {
  assert.equal(rolDeGrupo("Padre"), "admin");
  assert.equal(rolDeGrupo("Madre"), "admin");
  assert.equal(rolDeGrupo("Hijo"), "member");
  assert.equal(rolDeGrupo("Hija"), "member");
  assert.equal(rolDeGrupo(undefined), "member");
  assert.equal(hasPermission("admin", "crear_curso"), true);
  assert.equal(hasPermission("member", "crear_curso"), false);
  assert.equal(hasPermission("member", "desmarcar_leccion"), false);
  assert.equal(hasPermission("member", "ver"), true);
  assert.equal(hasPermission(null, "ver"), false);
});
