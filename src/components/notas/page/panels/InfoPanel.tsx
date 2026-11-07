"use client";
// Portado de vendor/dovli/apps/web/src/features/page/panels/InfoPanel.tsx (MayankJha0333/dovli@eb453e0)
/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */
// The Info panel: two tabs. "Page info" has the details (dates, where it lives, stats, outline,
// links, tags) and AI document review. "Actions" has everything you can do with the page.

import { useMemo, useState } from "react";
import { ancestors, backlinksOf, childrenOf, displayTitle, outline, pageText, timeAgo, wordCount, type Page } from "@/lib/notas/core";
import { Icon, Segmented, cn, modKey } from "@/components/notas/ui";
import { store, useStore } from "@/lib/notas/cliente/store";
import { copyLink, duplicate, moveWithPicker, trashWithUndo } from "@/components/notas/pages/actions";
import { scrollToBlock } from "../PageInfo";
import { ActionRow, PanelTitle, Prop, Section } from "./kit";

const fullDate = (t: number) => new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

function countBlocks(blocks: any[] | undefined): number {
  return (blocks ?? []).reduce((n, b) => n + 1 + countBlocks(b.children), 0);
}

export function InfoPanel({ page, onFind, onPresent, close }: { page: Page; onFind: () => void; onPresent: () => void; close: () => void }) {
  const [tab, setTab] = useState<"info" | "actions">("info");
  const pages = useStore((s) => s.pages);
  const trail = ancestors(pages, page.id);
  const heads = useMemo(() => outline(page), [page]);
  const back = useMemo(() => backlinksOf(pages, page.id), [pages, page.id]);
  const stats = useMemo(() => {
    const text = pageText(page);
    const words = wordCount(page);
    return { words, chars: text.replace(/\s/g, "").length, blocks: countBlocks(page.blocks), minutes: Math.max(1, Math.round(words / 220)) };
  }, [page]);
  const kids = childrenOf(pages, page.id).length;
  const isDoc = page.kind === "doc";
  const go = (fn: () => void) => () => {
    close();
    fn();
  };

  return (
    <div>
      <PanelTitle>Información</PanelTitle>
      <Segmented
        label="Pestaña del panel"
        value={tab}
        onValueChange={setTab}
        className="mb-2 grid w-full grid-cols-2 [&>button]:justify-center"
        options={[
          { value: "info", label: "Datos de la página" },
          { value: "actions", label: "Acciones" },
        ]}
      />

      {tab === "info" ? (
        <>
          <Section title="Propiedades" collapsible>
            <div title={fullDate(page.createdAt)}>
              <Prop icon="clock" label="Creada">
                {timeAgo(page.createdAt)}
              </Prop>
            </div>
            <div title={fullDate(page.updatedAt)}>
              <Prop icon="pencil" label="Editada">
                {timeAgo(page.updatedAt)}
              </Prop>
            </div>
          </Section>

          <Section title="Ubicación" collapsible>
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <button type="button" onClick={go(() => store.navigate({ name: "home" }))} className="rounded-sm px-1.5 py-0.5 text-ink-2 hover:bg-hover hover:text-ink">
                Notas
              </button>
              {trail.map((a) => (
                <span key={a.id} className="contents">
                  <Icon name="chevron" size={11} className="text-ink-4" />
                  <button type="button" onClick={go(() => store.navigate({ name: "page", id: a.id }))} className="max-w-[160px] truncate rounded-sm px-1.5 py-0.5 text-ink-2 hover:bg-hover hover:text-ink">
                    {a.mark} {displayTitle(a)}
                  </button>
                </span>
              ))}
              <Icon name="chevron" size={11} className="text-ink-4" />
              <span className="max-w-[160px] truncate px-1.5 font-medium text-ink">{displayTitle(page)}</span>
            </div>
          </Section>

          {isDoc && (
            <Section title="Estadísticas" collapsible>
              <dl className="m-0 grid grid-cols-2 gap-1.5">
                {(
                  [
                    ["Palabras", stats.words],
                    ["Caracteres", stats.chars],
                    ["Bloques", stats.blocks],
                    ["Tiempo de lectura", `${stats.minutes} min`],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-md bg-well px-3 py-2">
                    <dt className="text-xs text-ink-3">{k}</dt>
                    <dd className="m-0 text-md font-semibold tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              {kids > 0 && <p className="m-0 mt-2 text-sm text-ink-3">{kids === 1 ? "1 página adentro" : `${kids} páginas adentro`}</p>}
            </Section>
          )}

          {isDoc && heads.length > 0 && (
            <Section title="En esta página" collapsible>
              <ul className="m-0 flex list-none flex-col p-0">
                {heads.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => scrollToBlock(h.id)}
                      className={cn("w-full truncate rounded-sm py-1 pr-2 text-left text-sm text-ink-2 hover:bg-hover hover:text-ink", h.level === 1 ? "pl-1.5" : h.level === 2 ? "pl-4" : "pl-6")}
                    >
                      {h.text}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {back.length > 0 && (
            <Section title="Enlazada desde" collapsible>
              <div className="flex flex-col gap-1">
                {back.map((p) => (
                  <ActionRow key={p.id} icon="link" onClick={go(() => store.navigate({ name: "page", id: p.id }))}>
                    {p.mark} {displayTitle(p)}
                  </ActionRow>
                ))}
              </div>
            </Section>
          )}

        </>
      ) : (
        <div className="flex flex-col gap-1.5 pt-2">
          {isDoc && (
            <ActionRow icon="play" onClick={go(onPresent)} hint="Esc para terminar">
              Presentar
            </ActionRow>
          )}
          {isDoc && (
            <ActionRow icon="search" onClick={go(onFind)} hint={`${modKey()}F`}>
              Buscar y reemplazar
            </ActionRow>
          )}
          <ActionRow icon={page.favorite ? "starFilled" : "star"} onClick={() => store.toggleFavorite(page.id)}>
            {page.favorite ? "Quitar de favoritas" : "Agregar a favoritas"}
          </ActionRow>
          <ActionRow icon="move" onClick={go(() => void moveWithPicker(page))}>
            Mover a…
          </ActionRow>
          <ActionRow icon="duplicate" onClick={go(() => duplicate(page))}>
            Duplicar
          </ActionRow>
          <ActionRow icon="link" onClick={() => void copyLink(page)}>
            Copiar enlace
          </ActionRow>
          <ActionRow icon="trash" danger onClick={go(() => trashWithUndo(page))}>
            Mover a la papelera
          </ActionRow>
        </div>
      )}
    </div>
  );
}
