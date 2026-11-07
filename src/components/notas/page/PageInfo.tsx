"use client";
// Portado de vendor/dovli/apps/web/src/features/page/PageInfo.tsx (MayankJha0333/dovli@eb453e0)
import { useMemo } from "react";
import { backlinksOf, displayTitle, type Page } from "@/lib/notas/core";
import { store, useStore } from "@/lib/notas/cliente/store";

export function scrollToBlock(id: string) {
  const el = document.querySelector(`.bn-block-outer[data-id="${CSS.escape(id)}"]`);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LinkRow({ page }: { page: Page }) {
  return (
    <button
      type="button"
      onClick={() => store.navigate({ name: "page", id: page.id })}
      className="flex h-row w-full min-w-0 items-center gap-2 rounded-sm px-2 text-left text-sm text-ink-2 hover:bg-hover hover:text-ink"
    >
      <span className="w-4 flex-none text-center font-serif text-ink-3">{page.mark}</span>
      <span className="truncate">{displayTitle(page)}</span>
    </button>
  );
}

/** "Linked from": every page that links here, shown under the page (and in the side panel). */
export function Backlinks({ page }: { page: Page }) {
  const pages = useStore((s) => s.pages);
  const list = useMemo(() => backlinksOf(pages, page.id), [pages, page.id]);
  if (!list.length) return null;
  return (
    <section aria-label="Enlazada desde" className="mt-12 border-t border-line px-[54px] pt-5 max-[640px]:px-0" data-print="hide">
      <h2 className="label-text m-0 mb-2">Enlazada desde {list.length} {list.length > 1 ? "páginas" : "página"}</h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-1 p-0 max-[640px]:grid-cols-1">
        {list.map((p) => (
          <li key={p.id}>
            <LinkRow page={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

