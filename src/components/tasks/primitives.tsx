import { Badge } from "@/components/ui/badge";
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function StatusBadge({ label, color, className }: { label: string; color: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("h-5 gap-1.5 font-medium", className)}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {label}
    </Badge>
  );
}

const SIZES = { xs: "size-5 text-[10px]", sm: "size-7 text-xs", md: "size-9 text-sm" };

export function Avatar({ user, size = "sm" }: { user: { nombre: string; fotoUrl?: string | null }; size?: keyof typeof SIZES }) {
  return (
    <UIAvatar className={SIZES[size]}>
      <AvatarImage src={user.fotoUrl ?? undefined} alt="" className="object-cover" />
      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{user.nombre?.charAt(0)}</AvatarFallback>
    </UIAvatar>
  );
}
