const fs = require('fs');

const file = 'src/components/dashboard/NoticeBar.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `
      // Activar warning solo si son entre las 20:00 y las 22:00
      if (hour >= 20 && hour < 22) {`;

const replaceStr = `
      // Activar happy hour de 15:00 a 18:00
      if (hour >= 15 && hour < 18) {
        setIsVisible(true);
        setMessageType("happy_hour");
      }
      // Activar warning solo si son entre las 20:00 y las 22:00
      else if (hour >= 20 && hour < 22) {`;

content = content.replace(searchStr, replaceStr);

const stateSearch = `const [messageType, setMessageType] = useState<"morning" | "afternoon" | "evening" | "warning" | null>(null);`;
const stateReplace = `const [messageType, setMessageType] = useState<"morning" | "afternoon" | "evening" | "warning" | "happy_hour" | null>(null);`;
content = content.replace(stateSearch, stateReplace);

const renderSearch = `  if (messageType === "warning") {`;
const renderReplace = `  if (messageType === "happy_hour") {
    return (
      <div className="fixed top-0 left-0 w-full z-[100] bg-[color-mix(in-srgb,var(--primary)_80%,transparent)] text-[var(--on-primary)] p-2 font-headline font-bold text-center elevation-ambient shadow-lg animate-pulse tracking-wide border-b border-[color-mix(in-srgb,var(--secondary)_50%,transparent)]">
        ⭐ ¡HAPPY HOUR! Termina tareas ahora y gana x1.5 puntos ⭐
      </div>
    );
  }

  if (messageType === "warning") {`;

content = content.replace(renderSearch, renderReplace);

fs.writeFileSync(file, content);
console.log("Success NoticeBar");
