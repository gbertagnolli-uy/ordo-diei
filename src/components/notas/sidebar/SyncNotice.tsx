"use client";
// Portado de vendor/dovli/apps/web/src/features/sidebar/SyncNotice.tsx (MayankJha0333/dovli@eb453e0)
import { Icon, cn, type IconName } from "@/components/notas/ui";
import { useStore } from "@/lib/notas/cliente/store";
import { useSyncStatus } from "@/lib/notas/cliente/sync";

/**
 * Saving and syncing happen on their own, so the sidebar says nothing while they work.
 * This note appears only when something needs you: a page couldn't be saved, sync has stopped,
 * or you're offline with changes waiting. Click it for the details in Settings.
 */
export function SyncNotice() {
  const save = useStore((s) => s.saveStatus);
  const sync = useSyncStatus();

  let note: { icon: IconName; text: string; tone: "danger" | "warn" } | null = null;
  if (save === "error") note = { icon: "alert", text: "No se pudo guardar. El almacenamiento está lleno o bloqueado", tone: "danger" };
  else if (sync.state === "error")
    note = { icon: "alert", text: sync.error?.includes("demasiado grande") ? sync.error : "Sincronización en pausa. Reintentando", tone: "danger" };
  else if (sync.state === "offline" && sync.pending)
    note = { icon: "cloudOff", text: `Sin conexión. ${sync.pending > 1 ? `${sync.pending} cambios se van` : "1 cambio se va"} a sincronizar después`, tone: "warn" };

  return (
    <div aria-live="polite" className="empty:hidden">
      {note && (
        <p
          title={note.text}
          className={cn(
            "mb-1 flex w-full min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-[filter] hover:brightness-95",
            note.tone === "danger" ? "bg-danger-soft text-[color-mix(in_srgb,var(--d-danger)_78%,var(--d-ink))]" : "bg-[color-mix(in_srgb,var(--d-warn)_14%,transparent)] text-[color-mix(in_srgb,var(--d-warn)_70%,var(--d-ink))]",
          )}
        >
          <Icon name={note.icon} size={14} className="flex-none" />
          <span className="truncate">{note.text}</span>
        </p>
      )}
    </div>
  );
}
