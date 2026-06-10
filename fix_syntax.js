const fs = require('fs');

// Header.tsx fix
let header = fs.readFileSync('src/components/dashboard/Header.tsx', 'utf8');

const badHeaderCode = `          {currentUser && (
            <div className="hidden sm:flex flex-col items-end mr-2">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-[var(--primary)]">Nivel {getLevelInfo(currentUser.puntosAcumulados || 0).level}</span>
                 {currentUser.streakDays > 0 && (
                   <span className="text-xs text-orange-500 font-bold flex items-center gap-1" title="Racha actual">
                     🔥 {currentUser.streakDays}
                   </span>
                 )}
               </div>
               {/* Progress bar below level */}
               <div className="w-24 h-1.5 bg-[var(--surface-container-high)] rounded-full mt-1 overflow-hidden" title={\`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}% al siguiente nivel\`}>
                 <div
                   className="h-full bg-[var(--primary)] transition-all duration-500"
                   style={{ width: \`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}%\` }}
                 />
               </div>
            <div className="hidden sm:flex flex-col items-end mr-1" onClick={handleLogout} title="Cerrar Sesión">
               <span className="text-xs font-bold text-[var(--primary)] hover:underline">Nivel {getLevelInfo(currentUser.puntosAcumulados || 0).level}</span>
               {currentUser.streakDays > 0 && (
                 <span className="text-xs text-orange-500 font-bold flex items-center gap-1">
                   🔥 {currentUser.streakDays}
                 </span>
               )}
            </div>
          )}`;

const fixedHeaderCode = `          {currentUser && (
            <div className="hidden sm:flex flex-col items-end mr-2" onClick={handleLogout} title="Cerrar Sesión">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-[var(--primary)] hover:underline">Nivel {getLevelInfo(currentUser.puntosAcumulados || 0).level}</span>
                 {currentUser.streakDays > 0 && (
                   <span className="text-xs text-orange-500 font-bold flex items-center gap-1" title="Racha actual">
                     🔥 {currentUser.streakDays}
                   </span>
                 )}
               </div>
               {/* Progress bar below level */}
               <div className="w-24 h-1.5 bg-[var(--surface-container-high)] rounded-full mt-1 overflow-hidden" title={\`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}% al siguiente nivel\`}>
                 <div
                   className="h-full bg-[var(--primary)] transition-all duration-500"
                   style={{ width: \`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}%\` }}
                 />
               </div>
            </div>
          )}`;

header = header.replace(badHeaderCode, fixedHeaderCode);

if(header.includes(badHeaderCode)){
   console.log("Could not find bad header code block");
}

fs.writeFileSync('src/components/dashboard/Header.tsx', header);


// ModalManager.tsx fix
let modal = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

const badModalCode = `      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mb-[-8px]">Tareas Asignadas</div>

      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
      {tareas.map((t: any) => (
        <div key={t.id} className="flex items-center gap-3 p-3 bg-[var(--surface-container-low)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] rounded-md hover:bg-[var(--surface-container-lowest)] ghost-border transition-colors">
          {getIcon(t.estado, t.horaEjecucion || t.fechaVencimiento)}
          <div className="flex-1 min-w-0">
            <span className={\`font-headline font-bold block \${["Completada", "Aprobada", "Esperando_Aprobacion", "Expirada"].includes(t.estado) ? "text-[var(--on-surface-variant)] line-through" : "text-[var(--on-surface)]"}\`}>
              {t.titulo}
            </span>
            <div className="flex items-center gap-2 text-xs font-body text-[var(--on-surface-variant)] mt-0.5">
              {t.fechaVencimiento && (
                <span>{new Date(t.fechaVencimiento).toLocaleDateString()}</span>
              )}
              {t.horaEjecucion && (
                <span className="font-title font-bold text-[var(--error)]">
                  {new Date(t.horaEjecucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}`;

const fixedModalCode = `      <div className="text-sm font-bold text-[var(--on-surface)] uppercase tracking-wider mb-[-8px]">Tareas Asignadas</div>

      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
      {tareas.map((t: any) => (
        <div key={t.id} className="flex items-center gap-3 p-3 bg-[var(--surface-container-low)] border border-[color-mix(in-srgb,var(--outline-variant)_15%,transparent)] rounded-md hover:bg-[var(--surface-container-lowest)] ghost-border transition-colors">
          {getIcon(t.estado, t.horaEjecucion || t.fechaVencimiento)}
          <div className="flex-1 min-w-0">
            <span className={\`font-headline font-bold block \${["Completada", "Aprobada", "Esperando_Aprobacion", "Expirada"].includes(t.estado) ? "text-[var(--on-surface-variant)] line-through" : "text-[var(--on-surface)]"}\`}>
              {t.titulo}
            </span>
            <div className="flex items-center gap-2 text-xs font-body text-[var(--on-surface-variant)] mt-0.5">
              {t.fechaVencimiento && (
                <span>{new Date(t.fechaVencimiento).toLocaleDateString()}</span>
              )}
              {t.horaEjecucion && (
                <span className="font-title font-bold text-[var(--error)]">
                  {new Date(t.horaEjecucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
    </div>
  );
}`;

modal = modal.replace(badModalCode, fixedModalCode);
fs.writeFileSync('src/components/dashboard/ModalManager.tsx', modal);
