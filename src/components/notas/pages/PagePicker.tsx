"use client";
// Portado de vendor/dovli/apps/web/src/features/pages/PagePicker.tsx (MayankJha0333/dovli@eb453e0)
import { useMemo, useState } from "react";
import { ancestors, descendantIds, displayTitle, livePages } from "@/lib/notas/core";
import { Dialog, Icon, IconInput, cn } from "@/components/notas/ui";
import { useStore } from "@/lib/notas/cliente/store";
import { ui, useUI } from "@/lib/notas/cliente/ui";

/** "Move to…": choose a page (or the top level). Opened through ui.pickPage(). */
export function PagePicker() {
  const picker = useUI((s) => s.picker);
  const pages = useStore((s) => s.pages);
  const [q, setQ] = useState("");

  const blocked = useMemo(() => (picker?.exclude ? new Set([picker.exclude, ...descendantIds(pages, picker.exclude)]) : new Set<string>()), [picker, pages]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return livePages(pages)
      .filter((p) => p.kind === "doc" && !blocked.has(p.id) && (!term || displayTitle(p).toLowerCase().includes(term)))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 40);
  }, [pages, q, blocked]);

  const close = (id: string | null) => {
    picker?.resolve(id);
    ui.set({ picker: null });
    setQ("");
  };

  const row = "flex h-row w-full items-center gap-2.5 rounded-md px-2.5 text-left text-base text-ink-2 hover:bg-hover hover:text-ink focus-visible:bg-hover";

  return (
    <Dialog open={!!picker} onOpenChange={(o) => !o && close(null)} title={picker?.title ?? "Elegí una página"} size="md">
      <IconInput icon="search" autoFocus placeholder="Buscar páginas" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar páginas" />
      <ul className="m-0 mt-3 flex max-h-[50vh] list-none flex-col gap-0.5 overflow-y-auto p-0">
        {picker?.exclude && pages[picker.exclude]?.parentId !== null && !q && (
          <li>
            <button type="button" className={row} onClick={() => close("__root__")}>
              <Icon name="home" size={15} className="text-ink-3" />
              <span className="font-medium">Primer nivel (sin página madre)</span>
            </button>
          </li>
        )}
        {list.map((p) => {
          const trail = ancestors(pages, p.id);
          return (
            <li key={p.id}>
              <button type="button" className={cn(row, "h-auto min-h-row py-1.5")} onClick={() => close(p.id)}>
                <span className="w-5 flex-none text-center font-serif text-ink-3">{p.mark}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-ink">{displayTitle(p)}</span>
                  {trail.length > 0 && <span className="truncate text-xs text-ink-4">{trail.map((a) => displayTitle(a)).join(" / ")}</span>}
                </span>
              </button>
            </li>
          );
        })}
        {!list.length && <li className="px-2.5 py-6 text-center text-sm text-ink-3">Ninguna página coincide.</li>}
      </ul>
    </Dialog>
  );
}
