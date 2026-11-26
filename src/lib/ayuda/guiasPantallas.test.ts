import { test } from "node:test";
import assert from "node:assert/strict";
import { RUTAS } from "../../components/app/rutasDashboard.ts";
import { esRutaDeImpresion, GUIAS_POR_CLAVE, obtenerGuiaDeRuta } from "./guiasPantallas.ts";

const TODAS_LAS_RUTAS = [
  "/",
  "/agenda",
  "/agenda-del-dia",
  ...Object.keys(RUTAS),
  "/dashboard/rutina",
  "/dashboard/oracion",
  "/dashboard/homeschooling/plan",
  "/dashboard/homeschooling/semana",
  "/dashboard/homeschooling/materias",
  "/dashboard/homeschooling/materias/42",
  "/dashboard/homeschooling/lectura",
  "/dashboard/homeschooling/memoria",
  "/dashboard/homeschooling/memoria/recitar",
  "/dashboard/homeschooling/memoria/copia/5",
  "/dashboard/homeschooling/horas",
  "/dashboard/homeschooling/portafolio",
  "/dashboard/homeschooling/portafolio/imprimir",
  "/dashboard/homeschooling/revision",
  "/dashboard/homeschooling/reportes",
  "/dashboard/homeschooling/boletin",
  "/dashboard/homeschooling/libreta",
  "/dashboard/homeschooling/dias-sin-clase",
  "/dashboard/homeschooling/muro",
  "/dashboard/homeschooling/mensajes",
  "/dashboard/homeschooling/neurodivergencia",
  "/dashboard/homeschooling/imprimir/tok123",
  "/dashboard/homeschooling/imprimir/dia/tok123",
  "/dashboard/homeschooling/imprimir/quiz/9",
  "/dashboard/liturgia/calendarium",
  "/dashboard/liturgia/breviarium",
  "/dashboard/liturgia/breviarium/Laudes",
  "/dashboard/liturgia/missale",
  "/dashboard/liturgia/ordinarium",
  "/dashboard/liturgia/psalterium",
  "/dashboard/liturgia/proprium-de-tempore",
  "/dashboard/liturgia/proprium-sanctorum",
  "/dashboard/liturgia/rosarium",
  "/dashboard/liturgia/rosarium/rezar",
  "/dashboard/liturgia/rosarium/rezar-completo",
  "/dashboard/cartas/san-jose",
  "/dashboard/diario/compartido",
  "/dashboard/admin/agenda",
];

test("todas las pantallas tienen una guía válida con pasos y botones explicados", () => {
  for (const ruta of TODAS_LAS_RUTAS) {
    const guia = obtenerGuiaDeRuta(ruta, null, "Padre");
    assert.ok(guia.clave, `Falta clave para ${ruta}`);
    assert.ok(guia.titulo.length > 0, `Falta título para ${ruta}`);
    assert.ok(guia.pasos.length >= 2, `Faltan pasos en ${ruta} (${guia.clave})`);
    assert.ok(guia.botonesClave.length >= 1, `Faltan botones en ${ruta} (${guia.clave})`);
  }
});

test("distingue secciones de /dashboard y roles en /dashboard/homeschooling", () => {
  assert.equal(obtenerGuiaDeRuta("/dashboard", new URLSearchParams("s=history"), "Hijo").clave, "dashboard-historial");
  assert.equal(obtenerGuiaDeRuta("/dashboard", new URLSearchParams("s=family"), "Hijo").clave, "dashboard-familia");
  assert.equal(obtenerGuiaDeRuta("/dashboard", new URLSearchParams("s=today"), "Hijo").clave, "dashboard-tareas");

  assert.equal(obtenerGuiaDeRuta("/dashboard/homeschooling", null, "Padre").clave, "estudio-padres");
  assert.equal(obtenerGuiaDeRuta("/dashboard/homeschooling", null, "Hijo").clave, "estudio-hoy");

  assert.equal(obtenerGuiaDeRuta("/dashboard/cartas", null, "Hijo").clave, "cartas");
  assert.equal(obtenerGuiaDeRuta("/dashboard/cartas/san-jose", null, "Hijo").clave, "cartas-detalle");
  assert.equal(obtenerGuiaDeRuta("/dashboard/cartas/admin", null, "Padre").clave, "cartas-admin");
});

test("ninguna clave definida en GUIAS_POR_CLAVE tiene pasos vacíos tras filtrar por rol", () => {
  for (const clave of Object.keys(GUIAS_POR_CLAVE)) {
    assert.ok(GUIAS_POR_CLAVE[clave].pasos.length >= 2, `${clave} debe tener al menos 2 pasos`);
  }
  assert.equal(esRutaDeImpresion("/dashboard/homeschooling/imprimir/quiz/1"), true);
  assert.equal(esRutaDeImpresion("/dashboard/homeschooling/memoria/copia/3"), true);
  assert.equal(esRutaDeImpresion("/dashboard/horarios"), false);
});
