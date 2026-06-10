const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/MyTasksBoard.tsx', 'utf8');

const progressUI = `      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-display text-[var(--on-surface)] flex items-center gap-3">
            <Flame className="w-8 h-8 text-[var(--secondary)]" />
            MIS TAREAS
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Progreso Diario ({doneTodayTasks}/{totalTodayTasks})
            </span>
            <div className="flex-1 max-w-[200px] h-2 bg-[var(--surface-container-high)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--success)] transition-all duration-500"
                style={{ width: \`\${progressPercentage}%\` }}
              />
            </div>
            <span className="text-xs font-bold text-[var(--success)]">{progressPercentage}%</span>
          </div>
        </div>`;

content = content.replace('      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">\n        <h2 className="text-3xl font-display text-[var(--on-surface)] flex items-center gap-3">\n          <Flame className="w-8 h-8 text-[var(--secondary)]" />\n          MIS TAREAS', progressUI);

// Clean up trailing </h2> if it remained due to replace logic
content = content.replace('          MIS TAREAS\n        </h2>\n        <div className="flex flex-col md:flex-row gap-2">', '        <div className="flex flex-col md:flex-row gap-2">');

fs.writeFileSync('src/components/dashboard/MyTasksBoard.tsx', content);
