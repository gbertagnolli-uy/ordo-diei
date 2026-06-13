const fs = require('fs');
let file = 'src/components/dashboard/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `               <div className="w-24 h-1.5 bg-[var(--surface-container-high)] rounded-full mt-1 overflow-hidden" title={\`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}% al siguiente nivel\`}>
                 <div
                   className="h-full bg-[var(--primary)] transition-all duration-500"
                   style={{ width: \`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}%\` }}
                 />
               </div>
            <div className="hidden sm:flex flex-col items-end mr-1" onClick={handleLogout} title="Cerrar Sesión">`;

const replaceStr = `               <div className="w-24 h-1.5 bg-[var(--surface-container-high)] rounded-full mt-1 overflow-hidden" title={\`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}% al siguiente nivel\`}>
                 <div
                   className="h-full bg-[var(--primary)] transition-all duration-500"
                   style={{ width: \`\${getLevelInfo(currentUser.puntosAcumulados || 0).progressPercentage}%\` }}
                 />
               </div>
            </div>
            <div className="hidden sm:flex flex-col items-end mr-1" onClick={handleLogout} title="Cerrar Sesión">`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(file, content);
console.log("Fixed Header.tsx");
