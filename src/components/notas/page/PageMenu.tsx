"use client";
// Portado de vendor/dovli/apps/web/src/features/page/PageMenu.tsx (MayankJha0333/dovli@eb453e0)
import type { ReactElement } from "react";
import type { Page } from "@/lib/notas/core";
import { MenuContent, MenuItem, MenuRoot, MenuSeparator, MenuTrigger, modKey } from "@/components/notas/ui";
import { store } from "@/lib/notas/cliente/store";
import { ui } from "@/lib/notas/cliente/ui";
import { copyLink, duplicate, moveWithPicker, newPage, trashWithUndo } from "@/components/notas/pages/actions";

/** Everything you can do with a page, in one menu. Used in the sidebar and in the page's top bar. */
export function PageMenu({ page, trigger, onFind }: { page: Page; trigger: ReactElement; onFind?: () => void }) {
  const isDoc = page.kind === "doc";
  const mod = modKey();
  return (
    <MenuRoot>
      <MenuTrigger asChild>{trigger}</MenuTrigger>
      <MenuContent className="w-60">
        <MenuItem icon={page.favorite ? "starFilled" : "star"} onSelect={() => store.toggleFavorite(page.id)}>
          {page.favorite ? "Quitar de favoritas" : "Agregar a favoritas"}
        </MenuItem>
        <MenuItem icon="link" onSelect={() => copyLink(page)}>
          Copiar enlace
        </MenuItem>
        <MenuSeparator />
        {isDoc && onFind && (
          <MenuItem icon="search" shortcut={`${mod}F`} onSelect={onFind}>
            Buscar y reemplazar
          </MenuItem>
        )}
        {isDoc && (
          <MenuItem icon="palette" onSelect={() => ui.set({ styleFor: page.id })}>
            Estilo de página
          </MenuItem>
        )}
        <MenuItem icon="pagePlus" onSelect={() => newPage("doc", page.id)}>
          Agregar una página adentro
        </MenuItem>
        <MenuItem icon="duplicate" onSelect={() => duplicate(page)}>
          Duplicar
        </MenuItem>
        <MenuItem icon="move" onSelect={() => void moveWithPicker(page)}>
          Mover a…
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon="trash" danger onSelect={() => trashWithUndo(page)}>
          Mover a la papelera
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
