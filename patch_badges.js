const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

const badgesLogic = `      {/* Sección de Logros Resumidos */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--primary)_20%,transparent)]">
          <div className="text-[var(--primary)] font-bold text-2xl">{user.totalTasksCompleted || 0}</div>
          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Tareas de por Vida</div>
        </div>
        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--secondary)_20%,transparent)]">
          <div className="text-orange-500 font-bold text-2xl flex items-center justify-center gap-1">
            🔥 {user.streakDays || 0}
          </div>
          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Racha Actual</div>
        </div>
      </div>

      {/* Insignias Dinámicas */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {(user.totalTasksCompleted || 0) >= 10 && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--primary)_10%,transparent)] border border-[color-mix(in-srgb,var(--primary)_20%,transparent)] rounded-full px-3 py-1 text-xs font-bold text-[var(--primary)]" title="Francotirador: Completaste 10+ tareas">
            🎯 Francotirador
          </div>
        )}
        {(user.streakDays || 0) >= 3 && (
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-xs font-bold text-orange-600" title="Imparable: Racha de 3+ días">
            🔥 Imparable
          </div>
        )}
        {getLevelInfo(user.puntosAcumulados || 0).level >= 5 && (
          <div className="flex items-center gap-1 bg-[color-mix(in-srgb,var(--warning)_10%,transparent)] border border-[color-mix(in-srgb,var(--warning)_20%,transparent)] rounded-full px-3 py-1 text-xs font-bold text-[var(--warning)]" title="Estrella Naciente: Alcanzaste el Nivel 5+">
            🌟 Estrella Naciente
          </div>
        )}
      </div>`;

content = content.replace('      {/* Sección de Logros Resumidos */}\n      <div className="grid grid-cols-2 gap-2 mb-2">\n        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--primary)_20%,transparent)]">\n          <div className="text-[var(--primary)] font-bold text-2xl">{user.totalTasksCompleted || 0}</div>\n          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Tareas de por Vida</div>\n        </div>\n        <div className="bg-[var(--surface-container)] rounded-md p-3 text-center border border-[color-mix(in-srgb,var(--secondary)_20%,transparent)]">\n          <div className="text-orange-500 font-bold text-2xl flex items-center justify-center gap-1">\n            🔥 {user.streakDays || 0}\n          </div>\n          <div className="text-xs text-[var(--on-surface-variant)] uppercase font-bold tracking-wider">Racha Actual</div>\n        </div>\n      </div>', badgesLogic);


// ensure getLevelInfo is imported
if (!content.includes('import { getLevelInfo }')) {
  content = content.replace('import { useAuthStore } from "@/store/authStore";', 'import { useAuthStore } from "@/store/authStore";\nimport { getLevelInfo } from "@/lib/levelUtils";');
}

fs.writeFileSync('src/components/dashboard/ModalManager.tsx', content);
