"use client";
// Contenedor de las notas dentro de Ordo (lane 271, D9). Hace lo que hacía el Workspace de dovli
// (vendor/dovli/apps/web/src/features/workspace/Workspace.tsx): arranca el almacenamiento y el sync,
// sigue el #hash de la dirección y muestra la barra lateral y la página. Sin IA, compartir, cuenta,
// ajustes, plantillas, etiquetas ni pizarras (fuera de la v1).
import "@/lib/notas/cliente/editorBridge";
import { useEffect } from "react";
import { Button, EmptyState, Spinner, Toaster, TooltipProvider, cn, modKey } from "@/components/notas/ui";
import { setAccountStorage } from "@/lib/notas/cliente/db";
import { settings, useSettings } from "@/lib/notas/cliente/settings";
import { initStore, routeFromHash, store, useStore } from "@/lib/notas/cliente/store";
import { startSync } from "@/lib/notas/cliente/sync";
import { ui, useUI } from "@/lib/notas/cliente/ui";
import { TopBar } from "@/components/notas/TopBar";
import { PageView } from "@/components/notas/page/PageView";
import { newPage } from "@/components/notas/pages/actions";
import { PagePicker } from "@/components/notas/pages/PagePicker";
import { StyleGallery } from "@/components/notas/page-styles/StyleGallery";
import { CommandPalette } from "@/components/notas/palette/CommandPalette";
import { Sidebar } from "@/components/notas/sidebar/Sidebar";
import { startSidebarFollow } from "@/components/notas/sidebar/follow";
import { TrashView } from "@/components/notas/trash/TrashView";

/** Lo que se ve sin una página abierta. */
function Inicio() {
  const hayPaginas = useStore((s) => Object.values(s.pages).some((p) => !p.deletedAt));
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto p-6">
        <EmptyState
          icon="page"
          title={hayPaginas ? "Elegí una página" : "Todavía no tenés notas"}
          action={
            <Button icon="pagePlus" onClick={() => newPage()}>
              Página nueva
            </Button>
          }
        >
          {hayPaginas ? `Abrila desde la barra lateral o buscala con ${modKey()}K.` : "Creá tu primera página para empezar a escribir."}
        </EmptyState>
      </div>
    </div>
  );
}

export default function NotasWorkspace({ usuarioId }: { usuarioId: string }) {
  const ready = useStore((s) => s.ready);
  const route = useStore((s) => s.route);
  const nav = useUI((s) => s.nav);
  const sidebarHidden = useSettings((s) => s.sidebarHidden);

  // Cada usuario tiene su propia base local; se elige antes de abrirla.
  useEffect(() => {
    setAccountStorage(usuarioId);
    void initStore().then(() => startSync(usuarioId));
  }, [usuarioId]);

  // Atrás / adelante y los enlaces #p-<id> dentro de las páginas.
  useEffect(() => {
    const onHash = () => store.navigate(routeFromHash(store.get().pages), { replace: true });
    window.addEventListener("popstate", onHash);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("popstate", onHash);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // Al cambiar de página se cierra el cajón del celular.
  useEffect(() => ui.set({ nav: false }), [route]);

  useEffect(() => {
    if (ready) startSidebarFollow();
  }, [ready]);

  // Atajos: Ctrl/⌘ K busca, Ctrl/⌘ \ muestra u oculta la barra lateral, Ctrl/⌘ Alt N crea una página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        ui.set({ palette: !ui.get().palette });
      } else if (e.key === "\\" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (window.matchMedia("(max-width: 860px)").matches) ui.set({ nav: !ui.get().nav });
        else settings.set({ sidebarHidden: !settings.get().sidebarHidden });
      } else if ((k === "n" || e.code === "KeyN") && e.altKey) {
        e.preventDefault();
        newPage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready)
    return (
      <div className="notas-dovli grid h-[calc(100dvh-6rem)] place-items-center bg-bg">
        <Spinner label="Abriendo tus notas" />
      </div>
    );

  return (
    <div className="notas-dovli h-[calc(100dvh-6rem)] bg-bg">
      <TooltipProvider>
        <div
          className={cn(
            "grid h-full gap-[var(--d-shell-gap)] p-[var(--d-shell-gap)] max-[860px]:grid-cols-1 max-[860px]:gap-0 max-[860px]:p-0",
            sidebarHidden ? "grid-cols-[minmax(0,1fr)]" : "grid-cols-[272px_minmax(0,1fr)]",
          )}
        >
          <div className={cn("contents", sidebarHidden && "min-[861px]:hidden")}>
            <Sidebar />
          </div>
          <div
            aria-hidden="true"
            onClick={() => ui.set({ nav: false })}
            className={cn("fixed inset-0 z-[55] bg-overlay transition-opacity min-[861px]:hidden", nav ? "opacity-100" : "pointer-events-none opacity-0")}
          />
          <div
            id="main"
            tabIndex={-1}
            className="relative min-h-0 min-w-0 overflow-hidden rounded-shell shadow-shell surface-panel focus:outline-none max-[860px]:rounded-none"
          >
            {route.name === "page" ? <PageView key={route.id} id={route.id} /> : route.name === "trash" ? <TrashView /> : <Inicio />}
          </div>
        </div>
        <CommandPalette />
        <PagePicker />
        <StyleGallery />
        <Toaster />
      </TooltipProvider>
    </div>
  );
}
