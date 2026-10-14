// Tests de la lógica pura de la Tienda: precios, requisitos, estados y validación
import test from "node:test";
import assert from "node:assert/strict";
import { aplicarDescuento, alcanza, diasParaJuntar, faltantes, saldosTrasPagar } from "./precios.ts";
import { evaluarRequisito, evaluarRequisitos, todosCumplidos, type ContextoRequisitos } from "./requisitos.ts";
import { estadoProducto, finPeriodo, inicioPeriodo, type DatosEstado } from "./estado.ts";
import { PreciosSchema, ProductoEntradaSchema, RequisitoSchema } from "./esquemas.ts";
import { textoCostos } from "./monedas.ts";

const saldos = { puntos: 300, estrellas: 2, incienso: 10 };

const ctx = (extra: Partial<ContextoRequisitos> = {}): ContextoRequisitos => ({
  nivel: 3,
  xp: 500,
  racha: 4,
  tareasCompletadas: 12,
  rol: "Hijo",
  gradoPorCarta: new Map([[1, 2], [2, 0], [3, 1]]),
  productosComprados: new Set([7]),
  desbloqueadoPorPadre: false,
  ...extra,
});

test("precios: alcanza y faltantes con canasta mixta", () => {
  const o = { costos: [{ moneda: "puntos" as const, monto: 250 }, { moneda: "estrellas" as const, monto: 3 }] };
  assert.equal(alcanza(o, saldos), false);
  assert.deepEqual(faltantes(o, saldos), [{ moneda: "estrellas", monto: 1 }]);
  assert.equal(alcanza({ costos: [{ moneda: "puntos", monto: 300 }] }, saldos), true);
});

test("precios: el descuento por racha rebaja solo los puntos y solo si está activo", () => {
  const o = { costos: [{ moneda: "puntos" as const, monto: 200 }, { moneda: "estrellas" as const, monto: 1 }] };
  assert.deepEqual(aplicarDescuento(o, 10, true).costos, [{ moneda: "puntos", monto: 180 }, { moneda: "estrellas", monto: 1 }]);
  assert.equal(aplicarDescuento(o, 10, false), o);
  assert.equal(aplicarDescuento(o, 0, true), o);
});

test("precios: saldos tras pagar y días para juntar", () => {
  const o = { costos: [{ moneda: "puntos" as const, monto: 100 }, { moneda: "incienso" as const, monto: 4 }] };
  assert.deepEqual(saldosTrasPagar(o, saldos), { puntos: 200, estrellas: 2, incienso: 6 });
  assert.equal(diasParaJuntar(o, 20), 5);
  assert.equal(diasParaJuntar({ costos: [{ moneda: "estrellas", monto: 1 }] }), null);
  assert.equal(textoCostos(o.costos), "100 pts + 4 granos");
});

test("requisitos: nivel, racha, tareas con progreso", () => {
  const n = evaluarRequisito({ tipo: "nivel", min: 5 }, ctx());
  assert.equal(n.cumplido, false);
  assert.equal(n.actual, 3);
  assert.equal(n.objetivo, 5);
  assert.equal(evaluarRequisito({ tipo: "racha", dias: 4 }, ctx()).cumplido, true);
  assert.equal(evaluarRequisito({ tipo: "tareas", cantidad: 13 }, ctx()).cumplido, false);
});

test("requisitos: carta con grado mínimo y colección", () => {
  assert.equal(evaluarRequisito({ tipo: "carta", cartaId: 1, gradoMin: 2 }, ctx()).cumplido, true);
  assert.equal(evaluarRequisito({ tipo: "carta", cartaId: 3, gradoMin: 2 }, ctx()).cumplido, false);
  assert.equal(evaluarRequisito({ tipo: "carta", cartaId: 2, gradoMin: 1 }, ctx()).cumplido, false);
  assert.equal(evaluarRequisito({ tipo: "coleccion", cantidad: 2 }, ctx()).cumplido, true);
  assert.equal(evaluarRequisito({ tipo: "coleccion", cantidad: 3 }, ctx()).cumplido, false);
});

test("requisitos: compra previa, rol y desbloqueo del padre", () => {
  assert.equal(evaluarRequisito({ tipo: "compraPrevia", productoId: 7 }, ctx()).cumplido, true);
  assert.equal(evaluarRequisito({ tipo: "compraPrevia", productoId: 8 }, ctx()).cumplido, false);
  assert.equal(evaluarRequisito({ tipo: "rol", roles: ["Hijo", "Hija"] }, ctx()).cumplido, true);
  assert.equal(evaluarRequisito({ tipo: "rol", roles: ["Padre"] }, ctx()).cumplido, false);
  assert.equal(evaluarRequisito({ tipo: "padre" }, ctx()).cumplido, false);
  assert.equal(evaluarRequisito({ tipo: "padre" }, ctx({ desbloqueadoPorPadre: true })).cumplido, true);
  assert.equal(todosCumplidos(evaluarRequisitos([], ctx())), true);
});

const base = (extra: Partial<DatosEstado> = {}): DatosEstado => ({
  activo: true,
  destinatarios: null,
  usuarioId: 1,
  disponibleDesde: null,
  disponibleHasta: null,
  stockRestante: null,
  limiteUsuario: null,
  periodoLimite: "siempre",
  descuentoRacha: false,
  precios: [{ costos: [{ moneda: "puntos", monto: 100 }] }],
  ...extra,
});
const env = (extra = {}) => ({ ahora: new Date("2026-10-14T12:00:00"), saldos, descuentoPct: 0, requisitos: [], comprasEnPeriodo: 0, ...extra });

test("estado: precedencia oculto > bloqueado > próximamente > agotado > límite > saldo", () => {
  assert.equal(estadoProducto(base({ activo: false }), env()).estado, "oculto");
  assert.equal(estadoProducto(base({ destinatarios: [2] }), env()).estado, "oculto");
  assert.equal(estadoProducto(base({ disponibleHasta: new Date("2026-10-01") }), env()).estado, "oculto");
  const bloq = evaluarRequisitos([{ tipo: "nivel", min: 9 }], ctx());
  assert.equal(estadoProducto(base({ stockRestante: 0 }), env({ requisitos: bloq })).estado, "bloqueado");
  assert.equal(estadoProducto(base({ disponibleDesde: new Date("2026-12-01"), stockRestante: 0 }), env()).estado, "proximamente");
  assert.equal(estadoProducto(base({ stockRestante: 0, limiteUsuario: 1 }), env({ comprasEnPeriodo: 1 })).estado, "agotado");
  assert.equal(estadoProducto(base({ limiteUsuario: 1, periodoLimite: "mes" }), env({ comprasEnPeriodo: 1 })).estado, "limite");
  assert.equal(estadoProducto(base({ precios: [{ costos: [{ moneda: "puntos", monto: 999 }] }] }), env()).estado, "sinSaldo");
  assert.equal(estadoProducto(base(), env()).estado, "comprable");
});

test("estado: elige la primera opción que alcanza y aplica el descuento", () => {
  const p = base({
    descuentoRacha: true,
    precios: [{ costos: [{ moneda: "puntos", monto: 400 }] }, { costos: [{ moneda: "estrellas", monto: 2 }] }],
  });
  const r = estadoProducto(p, env({ descuentoPct: 30 })); // 400 → 280 con 30 %: alcanza con 300
  assert.equal(r.estado, "comprable");
  assert.equal(r.opcionSugerida, 0);
  assert.equal(r.opciones[0].opcion.costos[0].monto, 280);
  assert.equal(estadoProducto(p, env({ descuentoPct: 0 })).opcionSugerida, 1);
});

test("estado: el límite informa cuándo vuelve a poder comprar", () => {
  const r = estadoProducto(base({ limiteUsuario: 1, periodoLimite: "semana" }), env({ comprasEnPeriodo: 1 }));
  assert.equal(r.proximaCompra?.getDay(), 1); // lunes
  assert.equal(inicioPeriodo("siempre", new Date()), null);
  assert.equal(inicioPeriodo("mes", new Date("2026-10-14T12:00:00"))?.getDate(), 1);
  assert.equal(finPeriodo("dia", new Date("2026-10-14T12:00:00"))?.getDate(), 15);
});

test("esquemas: precios, requisitos y producto", () => {
  assert.equal(PreciosSchema.safeParse([]).success, false);
  assert.equal(PreciosSchema.safeParse([{ costos: [{ moneda: "puntos", monto: 5 }, { moneda: "puntos", monto: 5 }] }]).success, false);
  assert.equal(PreciosSchema.safeParse([{ costos: [{ moneda: "oro", monto: 5 }] }]).success, false);
  assert.equal(PreciosSchema.safeParse([{ costos: [{ moneda: "puntos", monto: 0 }] }]).success, false);
  assert.equal(RequisitoSchema.safeParse({ tipo: "nivel", min: 5 }).success, true);
  assert.equal(RequisitoSchema.safeParse({ tipo: "nivel" }).success, false);
  const ok = ProductoEntradaSchema.safeParse({ tipo: "fisico", titulo: "Bicicleta", precios: [{ costos: [{ moneda: "puntos", monto: 1500 }] }] });
  assert.equal(ok.success, true);
  assert.equal(ProductoEntradaSchema.safeParse({ tipo: "sobre", titulo: "X", precios: [] }).success, false);
});
