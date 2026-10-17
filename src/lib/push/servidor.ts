// Avisos push, lado servidor (lane 204): guarda los dispositivos y manda los avisos con `web-push`.
// Sin claves VAPID no se rompe nada: simplemente no se envía.
import webpush from "web-push";
import prisma from "../prisma.ts";
import { APP_TZ } from "../cartas/eventos.ts";
import { puedeAvisarHoy, suscripcionCaducada, validarSuscripcion, type Aviso } from "./avisos.ts";

export const pushConfigurado = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export type Enviador = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, carga: string) => Promise<unknown>;

let vapidListo = false;
const enviadorReal: Enviador = (sub, carga) => {
  if (!vapidListo) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:avisos@example.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    vapidListo = true;
  }
  return webpush.sendNotification(sub, carga, { TTL: 60 * 60 * 6 }); // un aviso de cofre no sirve pasadas 6 horas
};

export async function guardarSuscripcion(usuarioId: number, entrada: unknown, agente?: string | null) {
  const s = validarSuscripcion(entrada);
  // El mismo dispositivo puede pasar de una persona a otra (tablet compartida): la última manda
  await prisma.suscripcionPush.upsert({
    where: { endpoint: s.endpoint },
    create: { usuarioId, endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, agente: agente?.slice(0, 300) ?? null },
    update: { usuarioId, p256dh: s.keys.p256dh, auth: s.keys.auth, agente: agente?.slice(0, 300) ?? null },
  });
}

export async function quitarSuscripcion(usuarioId: number, endpoint: unknown) {
  if (typeof endpoint !== "string") throw new Error("Falta el dispositivo");
  await prisma.suscripcionPush.deleteMany({ where: { usuarioId, endpoint } });
}

/**
 * Manda un aviso a todos los dispositivos de la persona. Con `unoPorDia` (los avisos automáticos) un dispositivo
 * que ya recibió uno hoy no recibe otro. Las suscripciones caducadas se borran solas.
 * @returns a cuántos dispositivos llegó.
 */
export async function enviarAviso(
  usuarioId: number,
  aviso: Aviso,
  opciones: { unoPorDia?: boolean; ahora?: Date; enviar?: Enviador } = {}
): Promise<number> {
  const { unoPorDia = true, ahora = new Date() } = opciones;
  const enviar = opciones.enviar ?? (pushConfigurado() ? enviadorReal : null);
  if (!enviar) return 0;

  const subs = await prisma.suscripcionPush.findMany({ where: { usuarioId } });
  const carga = JSON.stringify(aviso);
  let llegaron = 0;
  for (const s of subs) {
    if (unoPorDia && !puedeAvisarHoy(s.ultimoAvisoEn, ahora, APP_TZ)) continue;
    try {
      await enviar({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga);
      llegaron++;
      if (unoPorDia) await prisma.suscripcionPush.update({ where: { id: s.id }, data: { ultimoAvisoEn: ahora } });
    } catch (e) {
      if (suscripcionCaducada((e as { statusCode?: number }).statusCode)) await prisma.suscripcionPush.deleteMany({ where: { id: s.id } });
      else console.error("[Push]", (e as Error).message);
    }
  }
  return llegaron;
}
