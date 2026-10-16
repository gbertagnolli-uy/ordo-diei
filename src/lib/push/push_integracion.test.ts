// Avisos push contra la base, con un enviador falso (lane 204: no se manda nada a ningún servicio real).
// Escribe en la base de DATABASE_URL: solo corre con PERMITIR_TESTS_DB=1 (usar una base local, no la real).
import test from "node:test";
import assert from "node:assert/strict";
import prisma from "../prisma.ts";
import { enviarAviso, guardarSuscripcion, quitarSuscripcion } from "./servidor.ts";
import { avisoCofre } from "./avisos.ts";

const sinBase = process.env.PERMITIR_TESTS_DB !== "1" && "requiere PERMITIR_TESTS_DB=1 (escribe en la base)";
const sub = (n: string) => ({ endpoint: `https://push.example.test/${n}`, keys: { p256dh: "BPxKey", auth: "authKey" } });

test("push: guarda dispositivos, manda uno por día y limpia las suscripciones caducadas", { skip: sinBase }, async () => {
  const marca = `__test_push_${Date.now()}`;
  const mk = (n: string) => prisma.usuario.create({ data: { nombre: `${marca}${n}`, pinSecretoHash: "x", fechaNacimiento: new Date("2015-01-01"), rolFamiliar: "Hijo" } });
  const a = await mk("a");
  const b = await mk("b");
  const enviados: string[] = [];
  const enviar = async (s: { endpoint: string }, carga: string) => {
    if (s.endpoint.endsWith(`${marca}-muerta`)) throw Object.assign(new Error("Gone"), { statusCode: 410 });
    enviados.push(`${s.endpoint}|${JSON.parse(carga).tag}`);
  };
  try {
    await guardarSuscripcion(a.id, sub(`${marca}-1`), "Chrome");
    await guardarSuscripcion(a.id, sub(`${marca}-muerta`), "Safari");
    await assert.rejects(guardarSuscripcion(a.id, { endpoint: "http://mal" }), /no es válida/);

    // Llega al dispositivo vivo; el caducado se borra solo
    assert.equal(await enviarAviso(a.id, avisoCofre(), { enviar }), 1);
    assert.deepEqual(enviados, [`${sub(`${marca}-1`).endpoint}|cofre-del-dia`]);
    assert.equal(await prisma.suscripcionPush.count({ where: { usuarioId: a.id } }), 1);

    // Un segundo aviso el mismo día no sale; el de prueba (sin límite) sí
    assert.equal(await enviarAviso(a.id, avisoCofre(), { enviar }), 0);
    assert.equal(await enviarAviso(a.id, avisoCofre(), { enviar, unoPorDia: false }), 1);
    // Mañana vuelve a salir
    const manana = new Date(Date.now() + 26 * 3_600_000);
    assert.equal(await enviarAviso(a.id, avisoCofre(), { enviar, ahora: manana }), 1);

    // La tablet pasa de una persona a otra: la suscripción cambia de dueño (una sola fila por dispositivo)
    await guardarSuscripcion(b.id, sub(`${marca}-1`));
    assert.equal(await prisma.suscripcionPush.count({ where: { endpoint: sub(`${marca}-1`).endpoint } }), 1);
    assert.equal((await prisma.suscripcionPush.findUniqueOrThrow({ where: { endpoint: sub(`${marca}-1`).endpoint } })).usuarioId, b.id);

    // Nadie quita el dispositivo de otro
    await quitarSuscripcion(a.id, sub(`${marca}-1`).endpoint);
    assert.equal(await prisma.suscripcionPush.count({ where: { usuarioId: b.id } }), 1);
    await quitarSuscripcion(b.id, sub(`${marca}-1`).endpoint);
    assert.equal(await prisma.suscripcionPush.count({ where: { usuarioId: b.id } }), 0);
  } finally {
    await prisma.usuario.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  }
});
