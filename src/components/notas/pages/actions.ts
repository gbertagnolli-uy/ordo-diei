"use client";
// Portado de vendor/dovli/apps/web/src/features/pages/actions.ts (MayankJha0333/dovli@eb453e0)
import { displayTitle, type Page } from "@/lib/notas/core";
import { toast } from "@/components/notas/ui";
import { store } from "@/lib/notas/cliente/store";
import { requestTitleFocus, ui } from "@/lib/notas/cliente/ui";

/* ------------------------------------------------------------------ */
/* Page actions shared by the sidebar, page menu, palette and home      */
/* ------------------------------------------------------------------ */

export function newPage(kind: "doc" | "board" = "doc", parentId: string | null = null) {
  const page = store.createPage({ kind, parentId });
  if (kind === "doc") requestTitleFocus(page.id);
  store.navigate({ name: "page", id: page.id });
  return page;
}

/** Move a page to the trash, with an Undo button in the toast. */
export function trashWithUndo(page: Page) {
  const ids = store.trashPage(page.id);
  if (!ids.length) return;
  const n = ids.length - 1;
  toast(n ? `Se movió «${displayTitle(page)}» y ${n} ${n > 1 ? "páginas" : "página"} de adentro a la papelera` : `Se movió «${displayTitle(page)}» a la papelera`, {
    action: { label: "Deshacer", onClick: () => store.restorePages([page.id]) },
  });
}

export function duplicate(page: Page) {
  const copy = store.duplicatePage(page.id);
  if (copy) {
    store.navigate({ name: "page", id: copy.id });
    toast("Página duplicada");
  }
}

export async function moveWithPicker(page: Page) {
  const to = await ui.pickPage(`Mover «${displayTitle(page)}» a…`, page.id);
  if (to === null) return;
  store.movePage(page.id, to === "__root__" ? null : to);
  toast(to === "__root__" ? "Movida al primer nivel" : `Movida adentro de «${displayTitle(store.get().pages[to])}»`);
}

export async function copyLink(page: Page) {
  try {
    await navigator.clipboard.writeText(`${location.origin}/dashboard/notas#p-${page.id}`);
    toast("Enlace copiado. Abre esta página con tu sesión de Ordo.");
  } catch {
    toast("No se pudo usar el portapapeles.", { tone: "danger" });
  }
}
