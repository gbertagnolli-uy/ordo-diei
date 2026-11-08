import { test } from "node:test";
import assert from "node:assert/strict";
import { conContexto, correrAgente, historialParaElModelo, type DependenciasAgente, type EventoAgente } from "./agente.ts";
import type { EventoIA, MensajeIA } from "./protocolos.ts";
import { turnoDeAsistente, turnoDeUsuario } from "./sesiones.ts";

async function* de(eventos: EventoIA[]): AsyncGenerator<EventoIA> {
  for (const e of eventos) yield e;
}

async function juntar(g: AsyncGenerator<EventoAgente>): Promise<EventoAgente[]> {
  const salida: EventoAgente[] = [];
  for await (const e of g) salida.push(e);
  return salida;
}

const fin = (motivo: "completo" | "herramientas" | "longitud" = "completo"): EventoIA => ({ t: "fin", motivo });
const inicio: MensajeIA[] = [{ rol: "usuario", texto: "hola" }];

function deps(turnos: EventoIA[][], extra: Partial<DependenciasAgente> = {}) {
  const vistos: MensajeIA[][] = [];
  const ejecutadas: string[] = [];
  const d: DependenciasAgente = {
    turno(mensajes) {
      vistos.push(structuredClone(mensajes));
      const t = turnos.shift();
      if (!t) throw new Error("sin más turnos");
      return de(t);
    },
    async ejecutar(nombre, args) {
      ejecutadas.push(`${nombre}:${JSON.stringify(args)}`);
      return `ok ${nombre}`;
    },
    async aprobar() {
      return true;
    },
    ...extra,
  };
  return { d, vistos, ejecutadas };
}

test("responde sin herramientas: texto y fin", async () => {
  const { d } = deps([[{ t: "texto", d: "Hola" }, fin()]]);
  const r = await juntar(correrAgente(d, { mensajes: inicio, modo: "confirm", senal: new AbortController().signal }));
  assert.deepEqual(r, [{ t: "texto", d: "Hola" }, { t: "fin", motivo: "completo" }]);
});

test("una lectura se ejecuta sin pedir permiso y su resultado vuelve al modelo", async () => {
  const { d, vistos, ejecutadas } = deps([
    [{ t: "llamada", id: "1", nombre: "searchDiaries", args: '{"query":"playa"}' }, fin("herramientas")],
    [{ t: "texto", d: "Encontré una." }, fin()],
  ]);
  const r = await juntar(correrAgente(d, { mensajes: inicio, modo: "confirm", senal: new AbortController().signal }));
  assert.deepEqual(r.map((e) => e.t), ["llamada", "resultado", "texto", "fin"]);
  assert.deepEqual(ejecutadas, ['searchDiaries:{"query":"playa"}']);
  assert.equal((r[0] as { pideAprobacion: boolean }).pideAprobacion, false);
  assert.deepEqual(vistos[1].slice(1), [
    { rol: "asistente", texto: "", llamadas: [{ id: "1", nombre: "searchDiaries", args: '{"query":"playa"}' }] },
    { rol: "resultado", id: "1", nombre: "searchDiaries", texto: "ok searchDiaries" },
  ]);
});

test("escribir pide permiso en modo confirm; si se rechaza no se ejecuta y el modelo lo sabe", async () => {
  const pedidas: string[] = [];
  const { d, vistos, ejecutadas } = deps(
    [[{ t: "llamada", id: "1", nombre: "createDiary", args: '{"items":[{"content":"x"}]}' }, fin("herramientas")], [{ t: "texto", d: "Entendido." }, fin()]],
    {
      async aprobar(id, nombre, _args, nivel) {
        pedidas.push(`${id}:${nombre}:${nivel}`);
        return false;
      },
    },
  );
  const r = await juntar(correrAgente(d, { mensajes: inicio, modo: "confirm", senal: new AbortController().signal }));
  assert.deepEqual(pedidas, ["1:createDiary:write"]);
  assert.deepEqual(ejecutadas, []);
  assert.equal((r[0] as { pideAprobacion: boolean }).pideAprobacion, true);
  assert.match((r[1] as { resultado: string }).resultado, /^Skipped: the user declined createDiary/);
  assert.match((vistos[1].at(-1) as { texto: string }).texto, /^Skipped:/);
});

test("modo auto solo pregunta por lo destructivo; modo full no pregunta", async () => {
  for (const [modo, esperadas] of [["auto", ["deleteDiary"]], ["full", []]] as const) {
    const pedidas: string[] = [];
    const { d } = deps(
      [[{ t: "llamada", id: "1", nombre: "createDiary", args: "{}" }, { t: "llamada", id: "2", nombre: "deleteDiary", args: '{"ids":[1]}' }, fin("herramientas")], [fin()]],
      {
        async aprobar(_id, nombre) {
          pedidas.push(nombre);
          return true;
        },
      },
    );
    await juntar(correrAgente(d, { mensajes: inicio, modo, senal: new AbortController().signal }));
    assert.deepEqual(pedidas, esperadas, modo);
  }
});

test("herramienta desconocida y herramienta que falla: el modelo recibe un 'Failed'", async () => {
  const { d } = deps(
    [[{ t: "llamada", id: "1", nombre: "runJavascript", args: "{}" }, { t: "llamada", id: "2", nombre: "getDiary", args: '{"ids":[1]}' }, fin("herramientas")], [fin()]],
    {
      async ejecutar() {
        throw new Error("se cayó");
      },
    },
  );
  const r = await juntar(correrAgente(d, { mensajes: inicio, modo: "full", senal: new AbortController().signal }));
  const res = r.filter((e) => e.t === "resultado") as { resultado: string }[];
  assert.match(res[0].resultado, /^Failed: unknown tool "runJavascript"/);
  assert.match(res[1].resultado, /^Failed: getDiary threw se cayó/);
});

test("tope de turnos", async () => {
  const turnos = Array.from({ length: 3 }, (_, i) => [{ t: "llamada" as const, id: String(i), nombre: "diaryOverview", args: "{}" }, fin("herramientas")]);
  const { d } = deps(turnos);
  const r = await juntar(correrAgente(d, { mensajes: inicio, modo: "full", senal: new AbortController().signal, maxTurnos: 3 }));
  assert.deepEqual(r.at(-1), { t: "fin", motivo: "max_turnos" });
  assert.equal(r.filter((e) => e.t === "llamada").length, 3);
});

test("error del proveedor, falla de red y respuesta cortada por longitud", async () => {
  const a = await juntar(correrAgente(deps([[{ t: "error", mensaje: "clave inválida" }]]).d, { mensajes: inicio, modo: "full", senal: new AbortController().signal }));
  assert.deepEqual(a, [{ t: "fin", motivo: "error", mensaje: "clave inválida" }]);
  const b = await juntar(
    correrAgente(
      deps([], {
        turno() {
          throw new Error("sin red");
        },
      }).d,
      { mensajes: inicio, modo: "full", senal: new AbortController().signal },
    ),
  );
  assert.deepEqual(b, [{ t: "fin", motivo: "error", mensaje: "sin red" }]);
  const c = await juntar(correrAgente(deps([[{ t: "texto", d: "se corta" }, { t: "llamada", id: "1", nombre: "getDiary", args: '{"ids"' }, fin("longitud")]]).d, { mensajes: inicio, modo: "full", senal: new AbortController().signal }));
  assert.deepEqual(c.at(-1), { t: "fin", motivo: "longitud" });
  assert.equal(c.some((e) => e.t === "llamada"), false);
});

test("cancelar corta el bucle y no ejecuta lo que falta", async () => {
  const ctl = new AbortController();
  const ejecutadas: string[] = [];
  const { d } = deps(
    [[{ t: "llamada", id: "1", nombre: "diaryOverview", args: "{}" }, { t: "llamada", id: "2", nombre: "listCategories", args: "{}" }, fin("herramientas")]],
    {
      async ejecutar(nombre) {
        ejecutadas.push(nombre);
        ctl.abort();
        return `ok ${nombre}`;
      },
    },
  );
  const r = await juntar(correrAgente(d, { mensajes: inicio, modo: "full", senal: ctl.signal }));
  assert.deepEqual(ejecutadas, ["diaryOverview"]);
  assert.deepEqual(r.at(-1), { t: "fin", motivo: "cancelado" });
  const abortado = await juntar(
    correrAgente(
      deps([], {
        turno() {
          throw new DOMException("x", "AbortError");
        },
      }).d,
      { mensajes: inicio, modo: "full", senal: new AbortController().signal },
    ),
  );
  assert.deepEqual(abortado, [{ t: "fin", motivo: "cancelado" }]);
});

test("el uso de tokens se reenvía", async () => {
  const r = await juntar(correrAgente(deps([[{ t: "uso", entrada: 5, salida: 2, cache: 0 }, fin()]]).d, { mensajes: inicio, modo: "full", senal: new AbortController().signal }));
  assert.deepEqual(r[0], { t: "uso", entrada: 5, salida: 2 });
});

test("historial: los turnos con herramientas llevan el bloque [tools already run]; 'continuar' y las citas se traducen", () => {
  const u1 = turnoDeUsuario("[diary:4]\n¿Qué dice?");
  const a1 = turnoDeAsistente("m", "p");
  a1.texto = "Dice esto.";
  a1.llamadas.push({ id: "1", nombre: "getDiary", args: '{"ids":[4]}', resultado: "id=4 …", hecha: true });
  const vacio = turnoDeAsistente("m", "p");
  const u2 = turnoDeUsuario("[continue]");
  const h = historialParaElModelo([a1, u1, a1, vacio, u2]);
  assert.equal(h[0].rol, "usuario");
  assert.match((h[0] as { texto: string }).texto, /^The user is asking about the diary entry with id=4/);
  assert.match((h[1] as { texto: string }).texto, /^\[tools already run\]\n- getDiary\(\{"ids":\[4\]\}\) → Leyó 1 entrada\n\nDice esto\.$/);
  assert.deepEqual(h.map((m) => m.rol), ["usuario", "asistente", "usuario"]);
  assert.match((h[2] as { texto: string }).texto, /^Continue exactly where you left off/);
});

test("el contexto del turno va delante del último mensaje de la persona", () => {
  const m: MensajeIA[] = [{ rol: "usuario", texto: "uno" }, { rol: "asistente", texto: "a", llamadas: [] }, { rol: "usuario", texto: "dos" }];
  const r = conContexto(m, "CTX");
  assert.equal((r[2] as { texto: string }).texto, "CTX\n\ndos");
  assert.equal((m[2] as { texto: string }).texto, "dos");
  assert.equal(conContexto(m, ""), m);
  assert.equal(conContexto([{ rol: "asistente", texto: "x", llamadas: [] }], "CTX").length, 1);
});
