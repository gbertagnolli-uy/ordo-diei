import { test } from "node:test";
import assert from "node:assert/strict";
import {
  estaBloqueado, estadoSincronizado, estimadoSegundos, motivoGuardia, motivoLeccionBloqueada, rangoTexto, tituloTarea, vencimientoLeccion,
} from "./dia.ts";

const TZ = "America/Montevideo"; // UTC-3 todo el año

test("vencimientoLeccion: 18:00 menos el estimado, en la hora de Montevideo", () => {
  assert.equal(vencimientoLeccion("2026-10-14", "18:00", 1800, TZ).toISOString(), "2026-10-14T20:30:00.000Z"); // 17:30
});

test("con la fórmula de complete (horaEjecucion + estimado) se paga completo hasta las 18:00", () => {
  const estimado = 1800;
  const limite = vencimientoLeccion("2026-10-14", "18:00", estimado, TZ).getTime() + estimado * 1000;
  assert.equal(new Date(limite).toISOString(), "2026-10-14T21:00:00.000Z"); // 18:00 locales
  const a = (hora: string) => new Date(`2026-10-14T${hora}:00.000Z`).getTime(); // en UTC
  assert.ok(a("13:00") <= limite); // 10:00 locales: a tiempo
  assert.ok(a("21:01") > limite); // 18:01 locales: tarde
});

test("un estimado de 20 horas no empieza antes de las 00:00 del día", () => {
  assert.equal(vencimientoLeccion("2026-10-14", "18:00", 20 * 3600, TZ).toISOString(), "2026-10-14T03:00:00.000Z");
});

test("rango, título y estimado", () => {
  assert.equal(rangoTexto("pagina", 22, 25), "Páginas 22 a 25");
  assert.equal(rangoTexto("leccion", 7, 7), "Lección 7");
  assert.equal(tituloTarea("Historia", "Uruguay", "leccion", 3, 4), "Historia: Uruguay — lecciones 3 a 4");
  assert.equal(tituloTarea("Historia", "Uruguay", "pagina", 5, 5), "Historia: Uruguay — página 5");
  assert.equal(estimadoSegundos(22, 25, 20), 4800);
});

test("estadoSincronizado: pendiente→hecha con la Tarea hecha; hecha→pendiente si la rechazan; el resto no cambia", () => {
  for (const t of ["Completada", "Esperando_Aprobacion", "Aprobada"]) assert.equal(estadoSincronizado("pendiente", t), "hecha");
  for (const t of ["Pendiente", "En_progreso", "Pausada", "Rechazada", "Vencida", "Expirada", "No_Realizada", null]) assert.equal(estadoSincronizado("pendiente", t), "pendiente");
  assert.equal(estadoSincronizado("hecha", "Rechazada"), "pendiente");
  assert.equal(estadoSincronizado("hecha", "Aprobada"), "hecha");
  assert.equal(estadoSincronizado("movida", "Aprobada"), "movida");
  assert.equal(estadoSincronizado("omitida", "Completada"), "omitida");
});

test("estaBloqueado: hoy libre; futuro bloqueado; con navegación libre solo si el anterior está hecho", () => {
  const base = { hoy: "2026-10-14", navegacionLibre: false, anteriorEstado: "hecha" as string | null };
  assert.equal(estaBloqueado({ ...base, fecha: "2026-10-14" }), false);
  assert.equal(estaBloqueado({ ...base, fecha: "2026-10-13" }), false);
  assert.equal(estaBloqueado({ ...base, fecha: "2026-10-15" }), true);
  assert.equal(estaBloqueado({ ...base, fecha: "2026-10-15", navegacionLibre: true }), false);
  assert.equal(estaBloqueado({ ...base, fecha: "2026-10-15", navegacionLibre: true, anteriorEstado: "omitida" }), false);
  assert.equal(estaBloqueado({ ...base, fecha: "2026-10-15", navegacionLibre: true, anteriorEstado: "pendiente" }), true);
  assert.equal(estaBloqueado({ ...base, fecha: "2026-10-15", navegacionLibre: true, anteriorEstado: null }), true);
});

test("lección k exige la k−1", () => {
  assert.equal(motivoLeccionBloqueada(1, undefined, () => false), null);
  assert.equal(motivoLeccionBloqueada(3, "Dos", (u) => u === 2), null);
  assert.equal(motivoLeccionBloqueada(3, "Dos", () => false), "Terminá «Dos» primero");
});

test("motivoGuardia: común → null; movida → texto; faltan lecciones → texto; todas hechas → null", () => {
  const ok = { diaEstado: "pendiente", conLecciones: true, leccionesDelRango: 2, leccionesHechas: 2 };
  assert.equal(motivoGuardia(ok), null);
  assert.ok(motivoGuardia({ ...ok, diaEstado: "movida" }));
  assert.ok(motivoGuardia({ ...ok, diaEstado: "omitida" }));
  assert.ok(motivoGuardia({ ...ok, leccionesHechas: 1 }));
  assert.equal(motivoGuardia({ ...ok, conLecciones: false, leccionesHechas: 0 }), null); // libro o PDF: sin lecciones
  assert.equal(motivoGuardia({ ...ok, diaEstado: "hecha" }), null); // Tarea rechazada: puede volver a completarla
});
