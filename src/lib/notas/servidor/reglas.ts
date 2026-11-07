// Reglas del servidor de notas (lane 271). Mismo protocolo que dovli (vendor/dovli/packages/sync/src/types.ts):
// un push se acepta solo si se basa en la última revisión guardada; si no, se devuelve la copia del servidor para mezclar.

export const MAX_PAGE_CHARS = 900_000;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

export type FilaNota = { rev: number; datos: unknown | null; purgada: boolean };
export type PedidoPush = { id: string; data: unknown | null; baseRev: number | null; purged: boolean };
export type ResultadoPush = { ok: boolean; rev: number; data?: unknown | null; purged?: boolean; tooBig?: boolean };

export function validarPedido(body: unknown): PedidoPush {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.id !== "string" || !ID.test(b.id)) throw new Error("Id de página inválido");
  if (b.baseRev !== null && !(Number.isInteger(b.baseRev) && (b.baseRev as number) >= 0)) throw new Error("baseRev inválido");
  const purged = b.purged === true;
  const data = purged ? null : (b.data ?? null);
  if (!purged && (data === null || typeof data !== "object")) throw new Error("Falta la página");
  if (!purged && (data as { id?: unknown }).id !== b.id) throw new Error("La página no coincide con el id");
  return { id: b.id, data, baseRev: (b.baseRev as number | null) ?? null, purged };
}

/** ¿Se guarda? `actual` es la fila del servidor (o null si no existe). */
export function decidirPush(actual: FilaNota | null, pedido: PedidoPush): { guardar: true } | { guardar: false; respuesta: ResultadoPush } {
  if (!pedido.purged && JSON.stringify(pedido.data).length > MAX_PAGE_CHARS) {
    return { guardar: false, respuesta: { ok: false, rev: actual?.rev ?? 0, tooBig: true } };
  }
  const revActual = actual?.rev ?? null;
  if (pedido.baseRev !== revActual) {
    return { guardar: false, respuesta: { ok: false, rev: actual?.rev ?? 0, data: actual?.datos ?? null, purged: actual?.purgada ?? false } };
  }
  return { guardar: true };
}
