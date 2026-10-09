import { cn } from "@/lib/utils";

export function StatusBadge({ label, color, className }: { label: string; color: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-[var(--on-surface)] whitespace-nowrap", className)}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

const SIZES = { xs: "w-5 h-5 text-[10px]", sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm" };

export function Avatar({ user, size = "sm" }: { user: { nombre: string; fotoUrl?: string | null }; size?: keyof typeof SIZES }) {
  return (
    <span className={cn("rounded-full overflow-hidden shrink-0 inline-flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] font-bold", SIZES[size])}>
      {user.fotoUrl ? <img src={user.fotoUrl} alt="" className="w-full h-full object-cover" /> : user.nombre?.charAt(0)}
    </span>
  );
}

export function CountBadge({ value, active }: { value: number; active?: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto min-w-5 px-1.5 text-center text-[11px] font-semibold tabular-nums rounded-full",
        active ? "bg-[color-mix(in-srgb,var(--on-primary)_20%,transparent)] text-[var(--on-primary)]" : "text-[var(--on-surface-variant)]"
      )}
    >
      {value}
    </span>
  );
}
