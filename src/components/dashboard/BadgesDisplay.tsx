import { Award, Flame, Target, Trophy, Star } from "lucide-react";

interface BadgesDisplayProps {
  totalTasksCompleted: number;
  streakDays: number;
  stars: number;
  completionPercentage: number;
}

export function BadgesDisplay({ totalTasksCompleted, streakDays, stars, completionPercentage }: BadgesDisplayProps) {
  const badges = [];

  // Streak Badges
  if (streakDays >= 30) badges.push({ id: 's30', title: 'Leyenda del Hábito', icon: <Flame className="w-5 h-5" />, color: 'text-red-500', bg: 'bg-red-500/10' });
  else if (streakDays >= 7) badges.push({ id: 's7', title: 'Imparable', icon: <Flame className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10' });
  else if (streakDays >= 3) badges.push({ id: 's3', title: 'En Racha', icon: <Flame className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-500/10' });

  // Completion Badges
  if (completionPercentage >= 95 && totalTasksCompleted > 5) badges.push({ id: 'c95', title: 'Perfeccionista', icon: <Target className="w-5 h-5" />, color: 'text-[var(--success)]', bg: 'bg-[var(--success-container)]' });
  else if (completionPercentage >= 80 && totalTasksCompleted > 2) badges.push({ id: 'c80', title: 'Francotirador', icon: <Target className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' });

  // Tasks Total Badges
  if (totalTasksCompleted >= 100) badges.push({ id: 't100', title: 'Maestro Centurión', icon: <Trophy className="w-5 h-5" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' });
  else if (totalTasksCompleted >= 50) badges.push({ id: 't50', title: 'Veterano', icon: <Trophy className="w-5 h-5" />, color: 'text-purple-500', bg: 'bg-purple-500/10' });
  else if (totalTasksCompleted >= 10) badges.push({ id: 't10', title: 'Iniciado', icon: <Award className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-500/10' });

  // Stars Badges
  if (stars >= 50) badges.push({ id: 'st50', title: 'Superestrella', icon: <Star className="w-5 h-5" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10' });
  else if (stars >= 10) badges.push({ id: 'st10', title: 'Coleccionista', icon: <Star className="w-5 h-5" />, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-container)]' });

  if (badges.length === 0) {
    return (
      <div className="text-center py-4 text-xs font-title tracking-wider uppercase text-[var(--on-surface-variant)] border border-dashed border-[color-mix(in-srgb,var(--outline-variant)_30%,transparent)] rounded-md opacity-70">
        Completa más tareas para desbloquear medallas
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mb-[-4px]">Medallas Desbloqueadas ({badges.length})</div>
      <div className="flex flex-wrap gap-2">
        {badges.map(b => (
          <div key={b.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${b.bg} border border-[color-mix(in-srgb,currentColor_20%,transparent)]`}>
            <span className={b.color}>{b.icon}</span>
            <span className={`text-xs font-bold ${b.color}`}>{b.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
