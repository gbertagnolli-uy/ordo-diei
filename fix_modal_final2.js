const fs = require('fs');
let file = 'src/components/dashboard/ModalManager.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mt-2 mb-[-8px]">Tareas Asignadas</div>

      </div>
      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">`;

const replaceStr = `      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mt-2 mb-[-8px]">Tareas Asignadas</div>

      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(file, content);
console.log("Fixed UserStatsPopup bracket correctly");
