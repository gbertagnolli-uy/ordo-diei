"use client";
// Portado de vendor/dovli/apps/web/src/components/TopBar.tsx (MayankJha0333/dovli@eb453e0)
import type { ReactNode } from "react";
import { IconButton, cn, modKey } from "@/components/notas/ui";
import { settings, useSettings } from "@/lib/notas/cliente/settings";
import { ui } from "@/lib/notas/cliente/ui";
import { newPage } from "@/components/notas/pages/actions";

/**
 * The bar at the top of every view: the sidebar button (when the sidebar is hidden), + (new page)
 * and breadcrumbs on the left, actions on the right. The groups are Craft-style glass pills that look
 * the same in every theme (see chrome-pill in @dovli/ui), so a theme only changes the page, never the buttons.
 */
export function TopBar({
  crumbs,
  children,
  className,
  bareActions,
  showCrumbs = false,
}: {
  crumbs?: ReactNode;
  children?: ReactNode;
  className?: string;
  bareActions?: boolean;
  /** Show the breadcrumbs on wide screens too (pages inside pages). Otherwise the view names itself. */
  showCrumbs?: boolean;
}) {
  const sidebarHidden = useSettings((s) => s.sidebarHidden);
  return (
    <header
      data-print="hide"
      className={cn(
        "relative z-20 flex h-14 flex-none items-center gap-2 px-3 max-[860px]:pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <IconButton icon="menu" label="Abrir la barra lateral" className="min-[861px]:hidden" onClick={() => ui.set({ nav: true })} />
      {sidebarHidden && (
        <IconButton
          icon="panelLeft"
          label="Mostrar la barra lateral"
          shortcut={`${modKey()}\\`}
          className="flex-none !rounded-full chrome-pill max-[860px]:hidden"
          onClick={() => settings.set({ sidebarHidden: false })}
        />
      )}
      <IconButton icon="plus" label="Página nueva" className="flex-none !rounded-full chrome-pill" onClick={() => newPage("doc")} />
      <nav aria-label="Ruta" className={cn("flex h-9 min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap px-1.5 chrome-pill", !showCrumbs && "min-[861px]:hidden")}>
        {crumbs}
      </nav>
      {bareActions ? (
        <div className="ml-auto flex flex-none items-center">{children}</div>
      ) : (
        <div className="ml-auto flex h-9 flex-none items-center gap-0.5 px-1 chrome-pill empty:hidden">{children}</div>
      )}
    </header>
  );
}

export function Crumb({ children, onClick, current }: { children: ReactNode; onClick?: () => void; current?: boolean }) {
  if (current)
    return (
      <span aria-current="page" className="flex min-w-0 items-center gap-1.5 truncate px-1.5 text-sm font-semibold text-ink">
        {children}
      </span>
    );
  return (
    <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-1.5 truncate rounded-sm px-1.5 py-1 text-sm text-ink-3 hover:bg-hover hover:text-ink max-[640px]:hidden">
      {children}
    </button>
  );
}

export function CrumbSep() {
  return (
    <span aria-hidden="true" className="text-ink-4 max-[640px]:hidden">
      /
    </span>
  );
}
