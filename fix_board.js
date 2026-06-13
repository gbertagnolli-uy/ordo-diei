const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/MyTasksBoard.tsx', 'utf8');

// There's a stray </h2> and duplicate progress bar. Let's fix this.
const badCode = `            <span className="text-xs font-bold text-[var(--success)]">{progressPercentage}%</span>
          </div>
        </div>
        </h2>

        {totalTodayTasks > 0 && (
          <div className="bg-[var(--surface-container-lowest)] px-4 py-3 rounded-md elevation-ambient ghost-border flex flex-col gap-2 min-w-[250px]">
             <div className="flex justify-between items-center text-sm font-title font-bold text-[var(--on-surface)] uppercase tracking-wider">
               <span>Progreso Diario</span>
               <span className="text-[var(--primary)]">{progressPercentage}%</span>
             </div>
             <div className="w-full h-2 bg-[var(--surface-container)] rounded-full overflow-hidden">
                <div
                   className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-1000 ease-out"
                   style={{ width: \`\${progressPercentage}%\` }}
                />
             </div>
          </div>
        )}
      </div>`;

const fixedCode = `            <span className="text-xs font-bold text-[var(--success)]">{progressPercentage}%</span>
          </div>
        </div>
      </div>`;

content = content.replace(badCode, fixedCode);
fs.writeFileSync('src/components/dashboard/MyTasksBoard.tsx', content);
