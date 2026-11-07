import { test } from "node:test";
import assert from "node:assert/strict";
import { validarRutinaFamiliar } from "./validarRutina.ts";
import { CONFIGURACION_DEFAULT } from "./tipos.ts";

const base = () => ({ etapas: structuredClone(CONFIGURACION_DEFAULT.etapas), semanalConfig: structuredClone(CONFIGURACION_DEFAULT.semanalConfig) });

test("la rutina por defecto es válida (incluida la etapa que cruza la medianoche)", () => {
  const r = validarRutinaFamiliar(base());
  assert.equal(r.ok, true);
});

test("ordena las etapas por hora de inicio", () => {
  const b = base();
  b.etapas.reverse();
  const r = validarRutinaFamiliar(b);
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.etapas[0].horaInicio <= r.etapas[1].horaInicio, true);
});

test("rechaza hora mal formada, id repetido, categoría desconocida y sin etapas", () => {
  const hora = base();
  hora.etapas[0].horaInicio = "8:00";
  assert.equal(validarRutinaFamiliar(hora).ok, false);

  const repetido = base();
  repetido.etapas[1].id = repetido.etapas[0].id;
  assert.equal(validarRutinaFamiliar(repetido).ok, false);

  const cat = base();
  (cat.etapas[0] as any).categoria = "inventada";
  assert.equal(validarRutinaFamiliar(cat).ok, false);

  assert.equal(validarRutinaFamiliar({ etapas: [], semanalConfig: base().semanalConfig }).ok, false);
  assert.equal(validarRutinaFamiliar({ etapas: base().etapas }).ok, false);
});
