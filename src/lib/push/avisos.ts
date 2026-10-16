// Avisos push (vault/ENGAGEMENT_PLAN.md, lane 204): contenido de cada aviso y reglas para no repetirlos. Módulo puro.
import { format } from "date-fns";
import { tz } from "@date-fns/tz";

export type Aviso = {
  title: string;
  body: string;
  /** A dónde lleva el toque del aviso */
  url: string;
  /** Un aviso nuevo con la misma etiqueta reemplaza al anterior en vez de apilarse */
  tag: string;
};

/** Al niño: su cofre del día ya se puede abrir */
export const avisoCofre = (): Aviso => ({
  title: "¡Te ganaste el cofre del día! 🎁",
  body: "Tus papás vieron que te portaste bien. Abrilo en «Mis premios».",
  url: "/dashboard/mis-premios",
  tag: "cofre-del-dia",
});

/** A los padres: faltan hijos por registrar (de eso depende el cofre de cada uno) */
export function avisoRegistrarDia(nombres: string[]): Aviso | null {
  if (nombres.length === 0) return null;
  const lista = nombres.length <= 3 ? nombres.join(", ") : `${nombres.slice(0, 3).join(", ")} y ${nombres.length - 3} más`;
  return {
    title: "Falta registrar el día de tus hijos",
    body: `${lista}: el cofre de cada uno llega cuando registrás cómo se portó.`,
    url: "/dashboard/admin/comportamiento",
    tag: "registrar-dia",
  };
}

export const avisoPrueba = (): Aviso => ({
  title: "Avisos activados ✅",
  body: "Así te vamos a avisar desde Ordo Diei. Nunca más de uno por día.",
  url: "/dashboard",
  tag: "prueba",
});

/** Un dispositivo recibe como máximo un aviso por día de la familia */
export function puedeAvisarHoy(ultimoAvisoEn: Date | null | undefined, ahora: Date, zona: string): boolean {
  if (!ultimoAvisoEn) return true;
  const dia = (d: Date) => format(d, "yyyy-MM-dd", { in: tz(zona) });
  return dia(ultimoAvisoEn) !== dia(ahora);
}

export type SuscripcionNavegador = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Valida lo que manda el navegador (`PushSubscription.toJSON()`) */
export function validarSuscripcion(x: unknown): SuscripcionNavegador {
  const s = (x ?? {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = typeof s.endpoint === "string" ? s.endpoint : "";
  const p256dh = typeof s.keys?.p256dh === "string" ? s.keys.p256dh : "";
  const auth = typeof s.keys?.auth === "string" ? s.keys.auth : "";
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 2000) throw new Error("La suscripción no es válida");
  if (!p256dh || !auth || p256dh.length > 200 || auth.length > 100) throw new Error("La suscripción no es válida");
  return { endpoint, keys: { p256dh, auth } };
}

/** Códigos con los que el servicio de push dice que la suscripción ya no existe */
export const suscripcionCaducada = (status: unknown) => status === 404 || status === 410;
