"use client";
import { Trophy, Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MEDAL = ["#E6B800", "#B8B8B8", "#C07A3A"];

function rateTone(pct: number) {
  return pct >= 90 ? "var(--success)" : pct >= 70 ? "var(--secondary)" : "var(--error)";
}

export function LeaderboardModal({ users, isOpen, onClose }: { users: any[], isOpen: boolean, onClose: () => void }) {
  const currentUser = useAuthStore(state => state.currentUser);
  // Sort users by: 1. completionPercentage, 2. stars, 3. puntosAcumulados
  const sortedUsers = [...users].sort((a, b) => {
    // Principal: completionPercentage
    const diff1 = (b.completionPercentage || 0) - (a.completionPercentage || 0);
    if (diff1 !== 0) return diff1;
    // Secundario: stars
    const diff2 = (b.stars || 0) - (a.stars || 0);
    if (diff2 !== 0) return diff2;
    // Terciario: puntos
    return (b.puntosAcumulados || 0) - (a.puntosAcumulados || 0);
  });

  const getTrophy = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  // Podio: 2º, 1º, 3º
  const podium = [1, 0, 2].filter((i) => sortedUsers[i]);
  const pillar = ["h-24 sm:h-28", "h-32 sm:h-40", "h-20 sm:h-24"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏆 Tabla de Líderes" width="lg">
      <div className="flex flex-col gap-6">
        <p className="px-4 text-center text-sm text-muted-foreground">
          ¡Esfuérzate para ser el mejor! El ranking se basa principalmente en el porcentaje de tareas completadas con éxito.
        </p>

        {/* Podio */}
        <div className="flex items-end justify-center gap-3 px-2 pt-6 sm:gap-5">
          {podium.map((i) => {
            const u = sortedUsers[i];
            const first = i === 0;
            return (
              <div key={u.id} className={cn("flex max-w-[132px] flex-1 flex-col items-center gap-2", first && "max-w-[148px]")}>
                {first && <Trophy className="size-7 animate-bounce text-[#E6B800]" fill="#E6B800" />}
                <div className="relative">
                  <Avatar className={cn("ring-4", first ? "size-20 sm:size-24" : "size-16 sm:size-20")} style={{ ["--tw-ring-color" as any]: MEDAL[i] }}>
                    <AvatarImage src={u.fotoUrl ?? undefined} alt={u.nombre} className="object-cover" />
                    <AvatarFallback className="text-2xl font-semibold">{u.nombre.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-2 left-1/2 h-5 -translate-x-1/2 border-0 text-[10px] text-black" style={{ background: MEDAL[i] }}>
                    {["1RO", "2DO", "3RO"][i]}
                  </Badge>
                </div>
                <span className="w-full truncate text-center text-sm font-medium">{u.nombre}</span>
                <div className={cn("flex w-full flex-col items-center justify-center rounded-t-lg border border-b-0 bg-muted/60", pillar[[1, 0, 2].indexOf(i)], first && "border-primary/40 bg-primary/10")}>
                  <span className={cn("font-heading tabular-nums", first ? "text-2xl text-primary" : "text-xl")}>{u.completionPercentage}%</span>
                  <span className="mt-0.5 text-[10px] font-medium text-muted-foreground uppercase tabular-nums">{u.puntosAcumulados} pts</span>
                  {first && (
                    <div className="mt-1 flex gap-0.5">
                      {[0, 1, 2].map((k) => <Star key={k} className="size-3 fill-secondary text-secondary" />)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-14 text-center">Pos</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-center" title="Racha">🔥</TableHead>
                <TableHead className="text-center" title="Estrellas">⭐</TableHead>
                <TableHead className="text-center">🏆 Pts</TableHead>
                <TableHead className="text-center" title="Premios sorpresa">🎁</TableHead>
                <TableHead className="text-right">% Éxito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user, index) => {
                const trophy = getTrophy(index);
                const isCurrentUser = currentUser?.id === user.id;

                // Calculate points to next position
                let pointsToNext = null;
                if (index > 0 && sortedUsers[index - 1]) {
                  const pointsDiff = (sortedUsers[index - 1].puntosAcumulados || 0) - (user.puntosAcumulados || 0);
                  if (pointsDiff > 0) pointsToNext = pointsDiff;
                }

                return (
                  <TableRow key={user.id} data-state={isCurrentUser ? "selected" : undefined} className={cn(isCurrentUser && "shadow-[inset_3px_0_0_var(--primary)]")}>
                    <TableCell className="text-center">
                      {trophy ? <span className="text-xl">{trophy}</span> : <span className="text-sm font-medium text-muted-foreground tabular-nums">{index + 1}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 rounded-lg">
                          <AvatarImage src={user.fotoUrl ?? undefined} alt={user.nombre} className="object-cover" />
                          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">{user.nombre.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("max-w-[120px] truncate font-medium", isCurrentUser && "text-primary")}>{user.nombre}</span>
                            {isCurrentUser && <Badge className="h-4 px-1.5 text-[10px]">TÚ</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">Lvl {Math.floor(Math.sqrt((user.puntosAcumulados || 0)/100))+1}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums text-orange-500" title="Racha Actual">{user.streakDays || 0}</TableCell>
                    <TableCell className="text-center font-medium tabular-nums text-secondary" title="Estrellas">{user.stars}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center font-medium tabular-nums text-primary">
                        <span>{user.puntosAcumulados}</span>
                        {pointsToNext && isCurrentUser && (
                          <span className="mt-0.5 text-[10px] font-normal whitespace-nowrap text-muted-foreground">a {pointsToNext} del #{index}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium tabular-nums text-destructive" title="Premios Sorpresa">{user.surprises}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: rateTone(user.completionPercentage) }}>{user.completionPercentage}%</span>
                        <Progress
                          value={user.completionPercentage}
                          className="h-1.5 w-16 [&>[data-slot=progress-indicator]]:bg-(--progress-color)"
                          style={{ ["--progress-color" as any]: rateTone(user.completionPercentage) }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Button size="lg" onClick={onClose} className="w-full">
          ¡Cerrar con Orgullo!
        </Button>
      </div>
    </Modal>
  );
}
