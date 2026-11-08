import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ESCALA_PREDETERMINADA,
  MAX_NOMBRE_NIVEL,
  PRESETS_ESCALA,
  aplicarPreset,
  completarEscala,
  nivelDe,
  nombreDeNivel,
  nombrePredeterminado,
  puedeCambiarEscala,
  textoDeNivel,
  validarEscala,
} from "./escala.ts";
import { esIconoClave } from "./iconos.ts";

const nivelesValidos = () => ESCALA_PREDETERMINADA.map((n) => ({ ...n }));

test("la escala predeterminada es la de la lane 272: 5 niveles, emoji, sin nombre ni color propios", () => {
  assert.equal(ESCALA_PREDETERMINADA.length, 5);
  assert.deepEqual(ESCALA_PREDETERMINADA.map((n) => n.valor), [1, 2, 3, 4, 5]);
  assert.ok(ESCALA_PREDETERMINADA.every((n) => n.etiqueta === null && n.color === null && n.tipoIcono === "emoji" && n.icono));
  assert.deepEqual(ESCALA_PREDETERMINADA.map((n) => nombreDeNivel(n)), ["Muy mal", "Mal", "Normal", "Bien", "Muy bien"]);
});

test("los 3 presets tienen 5 niveles válidos (íconos del catálogo y colores #rrggbb)", () => {
  for (const [, p] of Object.entries(PRESETS_ESCALA)) {
    assert.equal(p.niveles.length, 5);
    for (const n of p.niveles) {
      assert.match(n.color ?? "", /^#[0-9a-f]{6}$/);
      if (n.tipoIcono === "icono") assert.ok(esIconoClave(n.icono), String(n.icono));
    }
  }
  assert.deepEqual(PRESETS_ESCALA.emoji.niveles.map((n) => n.icono), ["😔", "😕", "😐", "🙂", "☺️"]);
  assert.ok(PRESETS_ESCALA.colores.niveles.every((n) => n.icono === "circle"));
});

test("aplicarPreset cambia el aspecto y conserva los nombres propios (Daily You `_applyPreset`)", () => {
  const base = nivelesValidos();
  base[0].etiqueta = "Fatal";
  const r = aplicarPreset(base, "colores");
  assert.equal(r[0].etiqueta, "Fatal");
  assert.equal(r[0].icono, "circle");
  assert.equal(r[0].tipoIcono, "icono");
  assert.equal(r[4].color, "#0097a7");
  assert.equal(base[0].icono, "😣"); // no modifica el original
});

test("nombres: el propio si hay, si no el predeterminado; textoDeNivel usa el emoji o el nombre", () => {
  assert.equal(nombrePredeterminado(3), "Normal");
  assert.equal(nombreDeNivel({ valor: 3, etiqueta: "  Así así " }), "Así así");
  assert.equal(nombreDeNivel({ valor: 3, etiqueta: "   " }), "Normal");
  assert.equal(textoDeNivel({ valor: 2, etiqueta: null, icono: "🙁", tipoIcono: "emoji", color: null }), "🙁");
  assert.equal(textoDeNivel({ valor: 2, etiqueta: null, icono: "frown", tipoIcono: "icono", color: null }), "Mal");
  assert.equal(textoDeNivel({ valor: 5, etiqueta: "Genial", icono: null, tipoIcono: "emoji", color: null }), "Genial");
});

test("nivelDe busca por valor y devuelve null sin ánimo", () => {
  assert.equal(nivelDe(ESCALA_PREDETERMINADA, 4)?.icono, "🙂");
  assert.equal(nivelDe(ESCALA_PREDETERMINADA, null), null);
  assert.equal(nivelDe(ESCALA_PREDETERMINADA, 9), null);
});

test("completarEscala: las filas guardadas ganan y los niveles sin fila quedan como estaban", () => {
  const e = completarEscala([{ animo: 2, etiqueta: "Maso", icono: "frown", tipoIcono: "icono", color: "#112233" }]);
  assert.equal(e[1].etiqueta, "Maso");
  assert.equal(e[1].color, "#112233");
  assert.deepEqual(e[0], ESCALA_PREDETERMINADA[0]);
  assert.deepEqual(completarEscala([]), ESCALA_PREDETERMINADA);
});

test("validarEscala normaliza nombres, íconos y colores", () => {
  const n = nivelesValidos();
  n[0] = { valor: 1, etiqueta: "  Muy   mal  día ", icono: "angry", tipoIcono: "icono", color: "#F44336" };
  n[1] = { valor: 2, etiqueta: "", icono: "", tipoIcono: "emoji", color: "" };
  const r = validarEscala({ niveles: n.reverse() });
  assert.deepEqual(r.map((x) => x.valor), [1, 2, 3, 4, 5]);
  assert.deepEqual(r[0], { valor: 1, etiqueta: "Muy mal día", icono: "angry", tipoIcono: "icono", color: "#f44336" });
  assert.deepEqual(r[1], { valor: 2, etiqueta: null, icono: null, tipoIcono: "emoji", color: null });
});

test("validarEscala rechaza lo inválido", () => {
  const ok = nivelesValidos();
  assert.doesNotThrow(() => validarEscala({ niveles: ok }));
  const malos: unknown[] = [
    undefined,
    [],
    ok.slice(0, 4),
    [...ok, ok[0]],
    ok.map((n, i) => (i === 4 ? { ...n, valor: 1 } : n)),
    ok.map((n, i) => (i === 0 ? { ...n, valor: 0 } : n)),
    ok.map((n, i) => (i === 0 ? { ...n, valor: 6 } : n)),
    ok.map((n, i) => (i === 0 ? { ...n, valor: "1" } : n)),
    ok.map((n, i) => (i === 0 ? { ...n, etiqueta: "x".repeat(MAX_NOMBRE_NIVEL + 1) } : n)),
    ok.map((n, i) => (i === 0 ? { ...n, color: "rojo" } : n)),
    ok.map((n, i) => (i === 0 ? { ...n, icono: "no-existe", tipoIcono: "icono" } : n)),
    ok.map((n, i) => (i === 0 ? { ...n, icono: "dos emoji 😀😀", tipoIcono: "emoji" } : n)),
    [null, null, null, null, null],
  ];
  for (const niveles of malos) assert.throws(() => validarEscala({ niveles }), Error);
});

test("puedeCambiarEscala: la personal siempre; la familiar, solo un padre", () => {
  assert.equal(puedeCambiarEscala("personal", { id: 1, esPadre: false }), true);
  assert.equal(puedeCambiarEscala("familiar", { id: 1, esPadre: false }), false);
  assert.equal(puedeCambiarEscala("familiar", { id: 1, esPadre: true }), true);
});
