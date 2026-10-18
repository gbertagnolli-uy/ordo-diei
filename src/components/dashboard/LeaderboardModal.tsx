"use client";
import { Trophy, Star, Flame, Zap } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { calcularRankingUsuarios, MIN_RACHA_RANKING } from "@/lib/ranking";
import { nivelDe, xpTotal } from "@/lib/niveles";

const MEDAL = ["#E6B800", "#B8B8B8", "#C07A3A"];

function rateTone(pct: number) {
  return pct >= 90 ? "var(--success)" : pct >= 70 ? "var(--secondary)" : "var(--error)";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LeaderboardModal({ users, isOpen, onClose }: { users: any[]; isOpen: boolean; onClose: () => void }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { participantes: sortedUsers, noParticipantes } = calcularRankingUsuarios(users);

  // Podio: 2º, 1º, 3º
  const podium = [1, 0, 2].filter((i) => sortedUsers[i]);
  const pillar = ["h-28 sm:h-32", "h-36 sm:h-44", "h-24 sm:h-28"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏆 Tabla de Líderes" width="lg">
      <div className="flex flex-col gap-5">
        <div className="space-y-2 px-2 text-center">
          <p className="text-sm text-muted-foreground">
            Participan quienes tienen una <span className="font-semibold text-foreground">racha diaria de ingreso a la app de al menos {MIN_RACHA_RANKING} días</span>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Badge variant="secondary" className="gap-1">
              <span>🥇 1ro</span>
              <span className="font-bold text-primary">+5% puntos</span>
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <span>🥈 2do</span>
              <span className="font-bold text-primary">+3% puntos</span>
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <span>🥉 3ro</span>
              <span className="font-bold text-primary">+1% puntos</span>
            </Badge>
          </div>
        </div>

        {sortedUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            Todavía ningún integrante alcanzó los {MIN_RACHA_RANKING} días seguidos de ingreso a la app para abrir la tabla de líderes.
          </div>
        ) : (
          <>
            {/* Podio */}
            <div className="flex items-end justify-center gap-3 px-2 pt-4 sm:gap-5">
              {podium.map((i) => {
                const u = sortedUsers[i];
                const first = i === 0;
                return (
                  <div key={u.id} className={cn("flex max-w-[136px] flex-1 flex-col items-center gap-2", first && "max-w-[152px]")}>
                    {first && <Trophy className="size-7 animate-bounce text-[#E6B800]" fill="#E6B800" />}
                    <div className="relative">
                      <Avatar
                        className={cn("ring-4", first ? "size-20 sm:size-24" : "size-16 sm:size-20")}
                        style={{ ["--tw-ring-color" as string]: MEDAL[i] }}
                      >
                        <AvatarImage src={u.fotoUrl ?? undefined} alt={u.nombre} className="object-cover" />
                        <AvatarFallback className="text-2xl font-semibold">{u.nombre.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {u.emojiPodio && (
                        <span
                          aria-label={`Puesto ${u.puestoRanking}`}
                          className="absolute -top-1.5 -left-1.5 flex size-7 items-center justify-center rounded-full border bg-card text-base leading-none shadow-md"
                        >
                          {u.emojiPodio}
                        </span>
                      )}
                      <Badge
                        className="absolute -bottom-2 left-1/2 h-5 -translate-x-1/2 border-0 text-[10px] text-black"
                        style={{ background: MEDAL[i] }}
                      >
                        {["1RO", "2DO", "3RO"][i]}
                      </Badge>
                    </div>
                    <span className="w-full truncate text-center text-sm font-medium">{u.nombre}</span>
                    <div
                      className={cn(
                        "flex w-full flex-col items-center justify-center rounded-t-lg border border-b-0 bg-muted/60 px-1",
                        pillar[[1, 0, 2].indexOf(i)],
                        first && "border-primary/40 bg-primary/10"
                      )}
                    >
                      <span className={cn("font-heading tabular-nums", first ? "text-2xl text-primary" : "text-xl")}>
                        {u.completionPercentage ?? 0}%
                      </span>
                      <span className="mt-0.5 text-[10px] font-medium text-muted-foreground uppercase tabular-nums">
                        {u.puntosAcumulados ?? 0} pts
                      </span>
                      {u.aceleradorPct > 0 && (
                        <Badge variant="default" className="mt-1 h-4 gap-0.5 px-1.5 text-[10px]">
                          <Zap className="size-2.5" />+{u.aceleradorPct}% pts
                        </Badge>
                      )}
                      {first && (
                        <div className="mt-1 flex gap-0.5">
                          {[0, 1, 2].map((k) => (
                            <Star key={k} className="size-3 fill-secondary text-secondary" />
                          ))}
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
                    <TableHead className="text-center" title="Racha diaria de ingreso a la app">
                      🔥 App
                    </TableHead>
                    <TableHead className="text-center" title="Estrellas">
                      ⭐
                    </TableHead>
                    <TableHead className="text-center">🏆 Pts</TableHead>
                    <TableHead className="text-center" title="Premios sorpresa">
                      🎁
                    </TableHead>
                    <TableHead className="text-right">% Éxito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user, index) => {
                    const trophy = user.emojiPodio;
                    const isCurrentUser = currentUser?.id === user.id;
                    const lvl = nivelDe(xpTotal(user)).level;

                    // Calculate points to next position
                    let pointsToNext = null;
                    if (index > 0 && sortedUsers[index - 1]) {
                      const pointsDiff = (sortedUsers[index - 1].puntosAcumulados || 0) - (user.puntosAcumulados || 0);
                      if (pointsDiff > 0) pointsToNext = pointsDiff;
                    }

                    return (
                      <TableRow
                        key={user.id}
                        data-state={isCurrentUser ? "selected" : undefined}
                        className={cn(isCurrentUser && "shadow-[inset_3px_0_0_var(--primary)]")}
                      >
                        <TableCell className="text-center">
                          {trophy ? (
                            <span className="text-xl">{trophy}</span>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground tabular-nums">{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="size-9 rounded-lg">
                                <AvatarImage src={user.fotoUrl ?? undefined} alt={user.nombre} className="object-cover" />
                                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                                  {user.nombre.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {user.emojiPodio && (
                                <span
                                  aria-label={`Puesto ${user.puestoRanking}`}
                                  className="absolute -top-1.5 -left-1.5 text-xs leading-none drop-shadow"
                                >
                                  {user.emojiPodio}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={cn("max-w-[120px] truncate font-medium", isCurrentUser && "text-primary")}>
                                  {user.nombre}
                                </span>
                                {isCurrentUser && <Badge className="h-4 px-1.5 text-[10px]">TÚ</Badge>}
                                {user.aceleradorPct > 0 && (
                                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] text-primary">
                                    +{user.aceleradorPct}% pts
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">Lvl {lvl}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium tabular-nums text-orange-500" title="Racha de ingreso diario a la app">
                          {user.rachaAppDias}d
                        </TableCell>
                        <TableCell className="text-center font-medium tabular-nums text-secondary" title="Estrellas">
                          {user.stars || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center font-medium tabular-nums text-primary">
                            <span>{user.puntosAcumulados || 0}</span>
                            {pointsToNext && isCurrentUser && (
                              <span className="mt-0.5 text-[10px] font-normal whitespace-nowrap text-muted-foreground">
                                a {pointsToNext} del #{index}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium tabular-nums text-destructive" title="Premios Sorpresa">
                          {user.surprises || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className="text-sm font-semibold tabular-nums"
                              style={{ color: rateTone(user.completionPercentage || 0) }}
                            >
                              {user.completionPercentage || 0}%
                            </span>
                            <Progress
                              value={user.completionPercentage || 0}
                              className="h-1.5 w-16 [&>[data-slot=progress-indicator]]:bg-(--progress-color)"
                              style={{ ["--progress-color" as string]: rateTone(user.completionPercentage || 0) }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {noParticipantes.length > 0 && (
          <div className="rounded-xl border bg-muted/25 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Flame className="size-3.5 text-orange-500" />
              Necesitan {MIN_RACHA_RANKING} días de racha de ingreso a la app para participar en el ranking:
            </p>
            <div className="flex flex-wrap gap-2">
              {noParticipantes.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-xs"
                >
                  <Avatar className="size-6 rounded-md">
                    <AvatarImage src={u.fotoUrl ?? undefined} alt={u.nombre} className="object-cover" />
                    <AvatarFallback className="rounded-md text-[10px]">{u.nombre.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{u.nombre}</span>
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    🔥 {u.rachaAppDias}/{MIN_RACHA_RANKING}d
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button size="lg" onClick={onClose} className="w-full">
          ¡Cerrar con Orgullo!
        </Button>
      </div>
    </Modal>
  );
}
