"use client";
// Portado de vendor/dovli/apps/web/src/features/trash/TrashView.tsx (MayankJha0333/dovli@eb453e0)
import { useState } from "react";
import { daysLeftInTrash, descendantIds, displayTitle, TRASH_DAYS, trashRoots, type Page } from "@/lib/notas/core";
import { Button, EmptyState, Icon, toast } from "@/components/notas/ui";
import { store, useStore } from "@/lib/notas/cliente/store";
import { Crumb, TopBar } from "@/components/notas/TopBar";
const wide = "mx-auto flex max-w-[1180px] flex-col gap-10 px-8 pb-24 pt-10 max-[640px]:gap-8 max-[640px]:px-4 max-[640px]:pb-20 max-[640px]:pt-6";

function TrashRow({ page }: { page: Page }) {
  const pages = useStore((s) => s.pages);
  const inside = descendantIds(pages, page.id).length;
  const days = daysLeftInTrash(page);
  return (
    <li className="flex items-center gap-3 rounded-lg bg-well px-4 py-3 max-[640px]:flex-wrap">
      <span className="grid size-9 flex-none place-items-center rounded-sm bg-panel font-serif text-lg text-ink-3 shadow-sm">{page.mark}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold text-ink">{displayTitle(page)}</span>
        <span className="text-xs text-ink-3">
          {inside ? `${inside} ${inside > 1 ? "páginas" : "página"} adentro · ` : ""}
          {days === 0 ? "Se borra para siempre hoy" : `Se borra para siempre en ${days} ${days > 1 ? "días" : "día"}`}
        </span>
      </span>
      <Button
        size="sm"
        icon="restore"
        onClick={() => {
          store.restorePages([page.id]);
          toast(`Se restauró «${displayTitle(page)}»`, { action: { label: "Abrir", onClick: () => store.navigate({ name: "page", id: page.id }) } });
        }}
      >
        Restaurar
      </Button>
      <Button size="sm" variant="dangerGhost" onClick={() => store.deleteForever([page.id])}>
        Borrar para siempre
      </Button>
    </li>
  );
}

export function TrashView() {
  const pages = useStore((s) => s.pages);
  const roots = trashRoots(pages);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex h-full flex-col">
      <TopBar
        crumbs={
          <Crumb current>
            <Icon name="trash" size={14} className="text-ink-3" />
            Papelera
          </Crumb>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div className={wide}>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="display-text m-0 text-[clamp(2.2rem,4.2vw,3rem)]">Papelera</h1>
              <p className="m-0 max-w-[56ch] text-md text-ink-2">Las páginas borradas esperan acá {TRASH_DAYS} días y después se borran para siempre. Restaurá una para devolverla a su lugar.</p>
            </div>
            {roots.length > 0 &&
              (confirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-2">¿Borrar para siempre todo lo que hay acá?</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      store.emptyTrash();
                      setConfirm(false);
                      toast("Papelera vaciada");
                    }}
                  >
                    Vaciar la papelera
                  </Button>
                </div>
              ) : (
                <Button variant="dangerGhost" icon="trash" onClick={() => setConfirm(true)}>
                  Vaciar la papelera
                </Button>
              ))}
          </header>
          {roots.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {roots.map((p) => (
                <TrashRow key={p.id} page={p} />
              ))}
            </ul>
          ) : (
            <EmptyState icon="trash" title="La papelera está vacía">
              Las páginas que borrás aparecen acá, por si cambiás de idea.
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
}
