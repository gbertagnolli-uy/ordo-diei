// Portado de vendor/dovli/packages/sync/src/http.ts (MayankJha0333/dovli@eb453e0)
// Adaptado a Ordo (lane 271, D2): rutas /api/notas/sync/* con la cookie de sesión, sin token Bearer.
import type { PageRow, PushResult, SyncTransport } from "./types.ts";

/**
 * Pages through Ordo's own server (/api/notas/sync/*). The session cookie says who is signed in.
 * `baseUrl` is empty on the web (same site).
 */
export function httpTransport({ baseUrl = "" }: { baseUrl?: string } = {}): SyncTransport {
  async function call<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `No se pudo sincronizar (${res.status}).`);
    return data as T;
  }
  return {
    pull: async (cursor, limit) => (await call<{ rows: PageRow[] }>("/api/notas/sync/pull", { cursor, limit })).rows,
    push: (c) => call<PushResult>("/api/notas/sync/push", c),
  };
}
