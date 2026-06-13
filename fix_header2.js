const fs = require('fs');
let file = 'src/components/dashboard/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `          {currentUser && (
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

const replaceStr = `          {currentUser && (
            <>
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
              </div>
              <div className="hidden sm:flex flex-col items-end mr-1" onClick={handleLogout} title="Cerrar Sesión">
                 <span className="text-xs font-bold text-[var(--primary)] hover:underline">Cerrar</span>
                 <span className="text-xs font-bold text-[var(--primary)] hover:underline">Sesión</span>
              </div>
            </>
          )}`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
console.log("Fixed Header.tsx properly");
