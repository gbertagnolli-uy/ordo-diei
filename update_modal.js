const fs = require('fs');

const file = 'src/components/dashboard/ModalManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// Encuentra UserStatsPopup
const searchStr = `
      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mb-[-8px]">Tareas Asignadas</div>`;

const replaceStr = `
      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mt-2 mb-1">Logros Desbloqueados</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        <div className={\`p-2 rounded-md border text-center \${user.totalTasksCompleted >= 1 ? 'bg-[color-mix(in-srgb,var(--success)_10%,transparent)] border-[var(--success)] text-[var(--success)]' : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface-variant)] opacity-50'}\`}>
          <div className="text-lg">👶</div>
          <div className="text-[10px] font-bold uppercase tracking-tighter leading-tight mt-1">Primeros Pasos</div>
        </div>
        <div className={\`p-2 rounded-md border text-center \${user.streakDays >= 3 ? 'bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] border-[var(--warning)] text-[var(--warning)]' : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface-variant)] opacity-50'}\`}>
          <div className="text-lg">🔥</div>
          <div className="text-[10px] font-bold uppercase tracking-tighter leading-tight mt-1">Racha x3</div>
        </div>
        <div className={\`p-2 rounded-md border text-center \${user.streakDays >= 7 ? 'bg-[color-mix(in-srgb,var(--error)_10%,transparent)] border-[var(--error)] text-[var(--error)]' : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface-variant)] opacity-50'}\`}>
          <div className="text-lg">🚀</div>
          <div className="text-[10px] font-bold uppercase tracking-tighter leading-tight mt-1">Imparable</div>
        </div>
        <div className={\`p-2 rounded-md border text-center \${user.totalTasksCompleted >= 50 ? 'bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface-variant)] opacity-50'}\`}>
          <div className="text-lg">🎖️</div>
          <div className="text-[10px] font-bold uppercase tracking-tighter leading-tight mt-1">Veterano (50)</div>
        </div>
        <div className={\`p-2 rounded-md border text-center \${user.completionPercentage >= 90 && user.totalTasksCompleted >= 10 ? 'bg-[color-mix(in-srgb,var(--secondary)_10%,transparent)] border-[var(--secondary)] text-[var(--secondary)]' : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] text-[var(--on-surface-variant)] opacity-50'}\`}>
          <div className="text-lg">💎</div>
          <div className="text-[10px] font-bold uppercase tracking-tighter leading-tight mt-1">Perfeccionista</div>
        </div>
      </div>

      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mt-2 mb-[-8px]">Tareas Asignadas</div>`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log("Success");
} else {
  console.log("String not found");
}
