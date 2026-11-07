"use client";
// Portado de vendor/dovli/apps/web/src/features/palette/CommandPalette.tsx (MayankJha0333/dovli@eb453e0)
import { useMemo, useState } from "react";
import { Command } from "cmdk";
import { Dialog as D } from "radix-ui";
import { ancestors, displayTitle, recentPages, searchPages } from "@/lib/notas/core";
import { Icon, Kbd, cn, modKey, type IconName } from "@/components/notas/ui";
import { store, useStore } from "@/lib/notas/cliente/store";
import { requestTitleFocus, ui, useUI } from "@/lib/notas/cliente/ui";
import { newPage } from "@/components/notas/pages/actions";

const item =
  "flex min-h-row cursor-pointer select-none items-center gap-3 rounded-md px-2.5 py-1.5 text-base text-ink-2 outline-none data-[selected=true]:bg-hover data-[selected=true]:text-ink";
const group = "[&_[cmdk-group-heading]]:label-text [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3";

function Row({ icon, mark, title, hint, shortcut, onSelect, value }: { icon?: IconName; mark?: string; title: React.ReactNode; hint?: React.ReactNode; shortcut?: string; onSelect: () => void; value: string }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className={item}>
      <span className="grid size-6 flex-none place-items-center text-ink-3">{mark ? <span className="font-serif text-md">{mark}</span> : icon ? <Icon name={icon} size={16} /> : null}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-ink">{title}</span>
        {hint && <span className="truncate text-xs text-ink-3">{hint}</span>}
      </span>
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </Command.Item>
  );
}

/** ⌘K: jump to any page, search all text, and run any command. */
export function CommandPalette() {
  const open = useUI((s) => s.palette);
  const pages = useStore((s) => s.pages);
  const [q, setQ] = useState("");
  const mod = modKey();

  const close = () => {
    ui.set({ palette: false });
    setQ("");
  };
  const run = (fn: () => void) => () => {
    close();
    fn();
  };

  const hits = useMemo(() => (q.trim() ? searchPages(pages, q, 20) : []), [pages, q]);
  const recent = useMemo(() => (q.trim() ? [] : recentPages(pages, 6)), [pages, q]);
  const term = q.trim().toLowerCase();
  const matches = (s: string) => !term || s.toLowerCase().includes(term);

  const commands: { id: string; icon: IconName; title: string; keywords: string; shortcut?: string; run: () => void }[] = [
    { id: "new", icon: "page", title: "Página nueva", keywords: "crear agregar página nueva documento", shortcut: `${mod}⌥N`, run: () => newPage() },
    { id: "trash", icon: "trash", title: "Abrir la papelera", keywords: "papelera borradas restaurar", run: () => store.navigate({ name: "trash" }) },
  ];
  const route = store.get().route;
  if (route.name === "page" && pages[route.id]) {
    const p = pages[route.id];
    commands.unshift(
      { id: "fav", icon: p.favorite ? "starFilled" : "star", title: p.favorite ? "Quitar la página de favoritas" : "Agregar la página a favoritas", keywords: "favorita estrella fijar", run: () => store.toggleFavorite(p.id) },
      { id: "style", icon: "palette", title: "Cambiar el estilo de la página", keywords: "estilo aspecto fondo tema página", run: () => ui.set({ styleFor: p.id }) },
    );
  }

  return (
    <D.Root open={open} onOpenChange={(o) => (o ? ui.set({ palette: true }) : close())}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[300] bg-overlay animate-fade-in" />
        <D.Content
          aria-label="Búsqueda y comandos"
          className="fixed left-1/2 top-[12vh] z-[301] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-xl text-ink surface-raised animate-pop-in focus:outline-none max-[640px]:top-3"
        >
          <D.Title className="sr-only">Búsqueda y comandos</D.Title>
          <D.Description className="sr-only">Escribí para buscar páginas y comandos. Usá las flechas y Enter.</D.Description>
          <Command label="Búsqueda y comandos" shouldFilter={false} loop className="flex max-h-[min(560px,76vh)] flex-col">
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Icon name="search" size={17} className="text-ink-3" />
              <Command.Input
                value={q}
                onValueChange={setQ}
                autoFocus
                placeholder="Buscá páginas o escribí un comando"
                className="h-14 min-w-0 flex-1 border-0 bg-transparent text-lg text-ink outline-none placeholder:text-ink-4"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="min-h-0 flex-1 overflow-y-auto p-1.5 [scroll-padding-block:8px]">
              <Command.Empty className="px-3 py-10 text-center text-sm text-ink-3">Todavía no hay nada. Empezá a escribir para buscar.</Command.Empty>

              {recent.length > 0 && (
                <Command.Group heading="Recientes" className={group}>
                  {recent.map((p) => (
                    <Row key={p.id} value={`recent-${p.id}`} mark={p.mark} title={displayTitle(p)} hint={ancestors(pages, p.id).map((a) => displayTitle(a)).join(" / ") || undefined} onSelect={run(() => store.navigate({ name: "page", id: p.id }))} />
                  ))}
                </Command.Group>
              )}

              {hits.length > 0 && (
                <Command.Group heading="Páginas" className={group}>
                  {hits.map(({ page: p, snippet }) => (
                    <Row
                      key={p.id}
                      value={`page-${p.id}`}
                      mark={p.mark}
                      title={displayTitle(p)}
                      hint={
                        snippet ? (
                          <>
                            {snippet.text.slice(0, snippet.start)}
                            <mark className="rounded-xs bg-accent-soft px-px text-accent">{snippet.text.slice(snippet.start, snippet.end)}</mark>
                            {snippet.text.slice(snippet.end)}
                          </>
                        ) : (
                          ancestors(pages, p.id).map((a) => displayTitle(a)).join(" / ") || undefined
                        )
                      }
                      onSelect={run(() => store.navigate({ name: "page", id: p.id }))}
                    />
                  ))}
                </Command.Group>
              )}

              {term && (
                <Command.Group heading="Crear" className={group}>
                  <Row
                    value="create-page"
                    icon="pagePlus"
                    title={`Página nueva «${q.trim()}»`}
                    onSelect={run(() => {
                      const p = store.createPage({ title: q.trim() });
                      requestTitleFocus(p.id);
                      store.navigate({ name: "page", id: p.id });
                    })}
                  />
                </Command.Group>
              )}

              {commands.filter((c) => matches(`${c.title} ${c.keywords}`)).length > 0 && (
                <Command.Group heading="Comandos" className={group}>
                  {commands
                    .filter((c) => matches(`${c.title} ${c.keywords}`))
                    .map((c) => (
                      <Row key={c.id} value={`cmd-${c.id}`} icon={c.icon} title={c.title} shortcut={c.shortcut} onSelect={run(c.run)} />
                    ))}
                </Command.Group>
              )}

            </Command.List>
            <div className={cn("flex items-center gap-4 border-t border-line px-4 py-2 text-xs text-ink-3 max-[640px]:hidden")}>
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> para moverte
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> para abrir
              </span>
              <span className="ml-auto">La búsqueda mira dentro de todas las páginas</span>
            </div>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
