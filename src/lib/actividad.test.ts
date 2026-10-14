import { test } from "node:test";
import assert from "node:assert/strict";
import {
  crearLimitador,
  crearMonitorInactividad,
  crearRegistroExenciones,
  esMovimientoReal,
  type Canal,
  type MensajeCanal,
  type Reloj,
} from "./actividad.ts";

/** Reloj de mentira: el tiempo solo avanza con `avanzar` y los temporizadores se disparan en orden. */
function crearRelojFalso(): Reloj & { avanzar(ms: number): void } {
  let t = 0;
  let id = 0;
  const pendientes = new Map<number, { en: number; fn: () => void }>();
  return {
    ahora: () => t,
    setTimeout(fn, ms) {
      pendientes.set(++id, { en: t + ms, fn });
      return id;
    },
    clearTimeout(h) {
      pendientes.delete(h as number);
    },
    avanzar(ms) {
      const fin = t + ms;
      for (;;) {
        const sig = [...pendientes.entries()].filter(([, p]) => p.en <= fin).sort((a, b) => a[1].en - b[1].en)[0];
        if (!sig) break;
        pendientes.delete(sig[0]);
        t = sig[1].en;
        sig[1].fn();
      }
      t = fin;
    },
  };
}

function crearBus() {
  const nodos = new Set<(m: MensajeCanal) => void>();
  return (): Canal => {
    let mio: ((m: MensajeCanal) => void) | null = null;
    return {
      publicar: (m) => nodos.forEach((f) => f !== mio && f(m)),
      suscribir(f) {
        mio = f;
        nodos.add(f);
        return () => nodos.delete(f);
      },
    };
  };
}

test("vence a los 60 s sin actividad (login: 15 s)", () => {
  const reloj = crearRelojFalso();
  let vencio = 0;
  const m = crearMonitorInactividad({ umbralMs: 60_000, alVencer: () => vencio++, reloj, registro: crearRegistroExenciones(), canal: null });
  m.iniciar();
  reloj.avanzar(59_999);
  assert.equal(vencio, 0);
  reloj.avanzar(1);
  assert.equal(vencio, 1);
  assert.equal(m.estado(), "vencido");
  reloj.avanzar(120_000);
  assert.equal(vencio, 1, "vence una sola vez");

  let login = 0;
  const l = crearMonitorInactividad({ umbralMs: 15_000, alVencer: () => login++, reloj, registro: crearRegistroExenciones(), canal: null });
  l.iniciar();
  reloj.avanzar(15_000);
  assert.equal(login, 1);
});

test("la actividad reinicia la cuenta", () => {
  const reloj = crearRelojFalso();
  let vencio = 0;
  const m = crearMonitorInactividad({ umbralMs: 60_000, alVencer: () => vencio++, reloj, registro: crearRegistroExenciones(), canal: null });
  m.iniciar();
  reloj.avanzar(50_000);
  m.actividad();
  reloj.avanzar(50_000);
  assert.equal(vencio, 0);
  assert.equal(m.restanteMs(), 10_000);
  reloj.avanzar(10_000);
  assert.equal(vencio, 1);
});

test("aviso previo a los 50 s; cualquier actividad lo cancela y reinicia los 60 s (SPEC §2.1)", () => {
  const reloj = crearRelojFalso();
  const log: string[] = [];
  const m = crearMonitorInactividad({
    umbralMs: 60_000,
    avisoMs: 10_000,
    alAvisar: () => log.push("aviso"),
    alVencer: () => log.push("vence"),
    reloj,
    registro: crearRegistroExenciones(),
    canal: null,
  });
  m.iniciar();
  reloj.avanzar(49_999);
  assert.deepEqual(log, []);
  reloj.avanzar(1);
  assert.deepEqual(log, ["aviso"]);
  assert.equal(m.estado(), "avisado");
  m.actividad();
  assert.equal(m.estado(), "corriendo");
  reloj.avanzar(49_999);
  assert.deepEqual(log, ["aviso"]);
  reloj.avanzar(1);
  assert.deepEqual(log, ["aviso", "aviso"]);
  reloj.avanzar(10_000);
  assert.deepEqual(log, ["aviso", "aviso", "vence"]);
});

test("exenciones: mientras haya un motivo el contador no corre; al liberar, la cuenta arranca de cero", () => {
  const reloj = crearRelojFalso();
  const registro = crearRegistroExenciones();
  let vencio = 0;
  const m = crearMonitorInactividad({ umbralMs: 60_000, alVencer: () => vencio++, reloj, registro, canal: null });
  m.iniciar();
  reloj.avanzar(40_000);
  const liberarVideo = registro.mantenerActivo("video");
  assert.equal(m.estado(), "suspendido");
  reloj.avanzar(600_000);
  assert.equal(vencio, 0, "un video largo no cierra la sesión");
  liberarVideo();
  assert.equal(m.estado(), "corriendo");
  reloj.avanzar(59_999);
  assert.equal(vencio, 0);
  reloj.avanzar(1);
  assert.equal(vencio, 1);
});

test("exenciones: varios registros del mismo motivo se cuentan y liberar es idempotente", () => {
  const registro = crearRegistroExenciones();
  const a = registro.mantenerActivo("temporizador");
  const b = registro.mantenerActivo("temporizador");
  assert.deepEqual(registro.motivos(), ["temporizador"]);
  a();
  a();
  assert.equal(registro.hayExenciones(), true);
  b();
  assert.equal(registro.hayExenciones(), false);
});

test("volver de una suspensión con el umbral cumplido vence al instante (revisar)", () => {
  // el navegador congeló los temporizadores (pestaña dormida): el reloj salta sin dispararlos
  let t = 0;
  const congelado: Reloj = { ahora: () => t, setTimeout: () => 0, clearTimeout: () => {} };
  let vencio = 0;
  const m = crearMonitorInactividad({ umbralMs: 60_000, alVencer: () => vencio++, reloj: congelado, registro: crearRegistroExenciones(), canal: null });
  m.iniciar();
  t = 30_000;
  m.revisar();
  assert.equal(vencio, 0);
  t = 61_000;
  m.revisar();
  assert.equal(vencio, 1);
  m.revisar();
  assert.equal(vencio, 1, "no vence dos veces");
});

test("dos pestañas: la actividad en una evita el cierre en la otra; al vencer, la otra recibe «cerrar»", () => {
  const reloj = crearRelojFalso();
  const canal = crearBus();
  const logs: string[] = [];
  const a = crearMonitorInactividad({ umbralMs: 60_000, alVencer: () => logs.push("A"), reloj, registro: crearRegistroExenciones(), canal: canal() });
  const b = crearMonitorInactividad({ umbralMs: 60_000, alVencer: () => logs.push("B"), reloj, registro: crearRegistroExenciones(), canal: canal() });
  a.iniciar();
  b.iniciar();
  reloj.avanzar(50_000);
  a.actividad(); // el usuario toca la pestaña A
  reloj.avanzar(50_000);
  assert.deepEqual(logs, [], "B no cierra: A tuvo actividad hace 50 s");
  reloj.avanzar(10_000);
  assert.deepEqual([...logs].sort(), ["A", "B"], "sin actividad en ninguna: cierran las dos");
});

test("un monitor detenido no hace nada y puede volver a iniciarse", () => {
  const reloj = crearRelojFalso();
  let vencio = 0;
  const m = crearMonitorInactividad({ umbralMs: 1_000, alVencer: () => vencio++, reloj, registro: crearRegistroExenciones(), canal: null });
  m.iniciar();
  m.detener();
  reloj.avanzar(5_000);
  assert.equal(vencio, 0);
  m.iniciar();
  reloj.avanzar(1_000);
  assert.equal(vencio, 1);
  m.reiniciar();
  assert.equal(m.estado(), "corriendo", "reiniciar vuelve a empezar la cuenta (p. ej. tras volver al selector)");
  reloj.avanzar(1_000);
  assert.equal(vencio, 2);
});

test("pointermove: solo cuenta si se movió al menos 4 px (ignora la vibración)", () => {
  assert.equal(esMovimientoReal(null, { x: 0, y: 0 }), true);
  assert.equal(esMovimientoReal({ x: 10, y: 10 }, { x: 11, y: 12 }), false);
  assert.equal(esMovimientoReal({ x: 10, y: 10 }, { x: 13, y: 14 }), true);
});

test("limitador: un evento por ventana de 500 ms", () => {
  const reloj = crearRelojFalso();
  const pasa = crearLimitador(reloj);
  assert.equal(pasa(), true);
  reloj.avanzar(499);
  assert.equal(pasa(), false);
  reloj.avanzar(1);
  assert.equal(pasa(), true);
});
