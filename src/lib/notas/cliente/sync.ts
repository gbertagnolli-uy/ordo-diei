// Portado de vendor/dovli/apps/web/src/lib/sync.ts (MayankJha0333/dovli@eb453e0)
// Adaptado a Ordo (lane 271, D2): siempre hay sesión; el transporte es /api/notas/sync/* con la cookie.
// Connects the store to the cloud. Every local change is noted in the "outbox" (IndexedDB);
// the shared SyncEngine sends it, pulls other devices' changes and merges conflicts.

import { useSyncExternalStore } from "react";
import { SyncEngine } from "@/lib/notas/sync/engine";
import { httpTransport } from "@/lib/notas/sync/http";
import type { SyncHost, SyncStatus } from "@/lib/notas/sync/types";
import type { Page } from "@/lib/notas/core";
import { db, getMeta, setMeta } from "./db";
import { filesToUpload, markUploaded, setRemoteFileSource } from "./files";
import { onLocalChange, store } from "./store";

/** En Ordo siempre hay sesión: las notas se sincronizan siempre. */
export const syncOn = true;

const CURSOR_KEY = "sync.cursor";
const OWNER_KEY = "sync.owner";

const host: SyncHost = {
  getPage: (id) => store.get().pages[id],
  applyFromCloud: (pages, removed) => store.applyFromCloud(pages, removed),
  pending: async () => (await db()).getAll("outbox"),
  async clearPending(id, pushed) {
    const current = store.get().pages[id] ?? null;
    if (pushed && JSON.stringify(current) !== JSON.stringify(pushed)) return; // changed again since: keep it
    await (await db()).delete("outbox", id);
  },
  getSynced: async (id) => (await db()).get("synced", id),
  setSynced: async (copy) => void (await (await db()).put("synced", copy)),
  removeSynced: async (id) => void (await (await db()).delete("synced", id)),
  getCursor: async () => (await getMeta<number>(CURSOR_KEY)) ?? 0,
  setCursor: (rev) => setMeta(CURSOR_KEY, rev),
  async pendingFiles() {
    return (await filesToUpload()).map((f) => ({ id: f.id, blob: f.blob, type: f.type }));
  },
  markFileUploaded: (id) => markUploaded(id),
};

let status: SyncStatus = { state: "signed-out", pending: 0, lastSyncedAt: null };
const listeners = new Set<() => void>();

let engine: SyncEngine | null = null;

/** Note local changes in the outbox, so they are sent once online. */
onLocalChange(async (ids, purged) => {
  const d = await db();
  const tx = d.transaction("outbox", "readwrite");
  for (const id of ids) await tx.store.put({ id, base: null, baseRev: null });
  for (const id of purged) await tx.store.put({ id, base: null, baseRev: null, purge: true });
  await tx.done;
  engine?.notifyLocalChange();
});

/** First sync on this device for this account: queue every page the cloud does not know yet. */
async function queueUnsyncedPages() {
  const d = await db();
  const synced = new Set(await d.getAllKeys("synced"));
  const tx = d.transaction("outbox", "readwrite");
  for (const p of Object.values(store.get().pages) as Page[]) if (!synced.has(p.id)) await tx.store.put({ id: p.id, base: null, baseRev: null });
  await tx.done;
}

/** Forget sync bookkeeping when a different account signs in on this device. */
async function prepareFor(userId: string) {
  const owner = await getMeta<string>(OWNER_KEY);
  if (owner === userId) return;
  const d = await db();
  await Promise.all([d.clear("synced"), d.clear("outbox")]);
  await setMeta(CURSOR_KEY, 0);
  await setMeta(OWNER_KEY, userId);
}

/** Arranca el sync para el usuario de la sesión (llamar después de initStore). */
export function startSync(userId: string) {
  if (engine) return;
  const e = new SyncEngine({
    transport: httpTransport(),
    host,
    onOnline: (cb) => {
      window.addEventListener("online", cb);
      return () => window.removeEventListener("online", cb);
    },
  });
  engine = e;
  e.subscribe((s) => {
    status = s;
    listeners.forEach((l) => l());
  });
  if (e.syncsFiles) setRemoteFileSource((id) => e.downloadFile(id), () => e.notifyLocalChange());
  // Check for changes from other devices whenever the page comes back into view (plus every 30 s).
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && e.syncSoon(0));
  window.addEventListener("focus", () => e.syncSoon(0));
  // Losing the connection: say "offline" now, not at the next try.
  window.addEventListener("offline", () => e.syncSoon(0));

  void (async () => {
    await prepareFor(userId);
    const first = (await getMeta<number>(CURSOR_KEY)) === 0;
    e.start(userId);
    if (first) {
      // Pull the cloud first, then send whatever this device has that the cloud does not.
      await e.syncNow();
      await queueUnsyncedPages();
      e.syncSoon(0);
    }
  })();
}

export const sync = {
  get: () => status,
  now: () => engine?.syncSoon(0),
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(sync.subscribe, () => status, () => status);
}
