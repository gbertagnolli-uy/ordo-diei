import { test } from "node:test";
import assert from "node:assert/strict";
import { construirIcs, plegar } from "./ics.ts";

const ahora = new Date("2026-10-16T12:00:00Z");

test("evento de día completo: fecha sin hora y fin al día siguiente", () => {
  const ics = construirIcs("Leo", [{ uid: "a@x", titulo: "Matemática: páginas 3 a 5", dia: "2026-10-31" }], ahora);
  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261031\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261101\r\n/);
  assert.match(ics, /DTSTAMP:20261016T120000Z\r\n/);
  assert.match(ics, /END:VEVENT\r\nEND:VCALENDAR\r\n$/);
});

test("evento con hora en UTC y escapes de coma, punto y coma, barra y salto", () => {
  const ics = construirIcs("Casa; Leo, 8", [{ uid: "b@x", titulo: "Clase de piano, 2º", descripcion: "Llevar partituras;\nlibro\\2", lugar: "Calle 1, Montevideo", inicio: new Date("2026-10-20T18:30:00Z"), fin: new Date("2026-10-20T19:30:00Z") }], ahora);
  assert.match(ics, /X-WR-CALNAME:Casa\; Leo\\, 8\r\n/);
  assert.match(ics, /DTSTART:20261020T183000Z\r\n/);
  assert.match(ics, /DTEND:20261020T193000Z\r\n/);
  assert.match(ics, /SUMMARY:Clase de piano\\, 2º\r\n/);
  assert.match(ics, /DESCRIPTION:Llevar partituras\;\\nlibro\\\\2\r\n/);
  assert.match(ics, /LOCATION:Calle 1\\, Montevideo\r\n/);
});

test("sin fin, el evento dura una hora; un evento sin fecha se omite", () => {
  const ics = construirIcs("x", [{ uid: "c@x", titulo: "t", inicio: new Date("2026-10-20T10:00:00Z") }, { uid: "d@x", titulo: "sin fecha" }], ahora);
  assert.match(ics, /DTEND:20261020T110000Z/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 1);
});

test("plegar: líneas largas se cortan a 75 octetos sin partir caracteres", () => {
  const larga = "SUMMARY:" + "ñ".repeat(80);
  const ps = plegar(larga).split("\r\n ");
  assert.ok(ps.length > 1);
  assert.ok(ps.every((p, i) => new TextEncoder().encode(p).length <= (i === 0 ? 75 : 74)));
  assert.equal(ps.join(""), larga);
  assert.equal(plegar("corta"), "corta");
});
