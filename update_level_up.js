const fs = require('fs');

// 1. Update modalStore.ts
let storeFile = 'src/store/modalStore.ts';
let storeContent = fs.readFileSync(storeFile, 'utf8');
storeContent = storeContent.replace(/type: "CONFIRM_TASK" \| "USER_STATS" \| "RULES" \| "TASK_SUCCESS" \| "HISTORY" \| "LEADERBOARD" \| "SURPRISE_AWARD" \| "MOOD_SELECTOR" \| null;/g, `type: "CONFIRM_TASK" | "USER_STATS" | "RULES" | "TASK_SUCCESS" | "HISTORY" | "LEADERBOARD" | "SURPRISE_AWARD" | "MOOD_SELECTOR" | "LEVEL_UP" | null;`);
storeContent = storeContent.replace(/openModal: \(type: "CONFIRM_TASK" \| "USER_STATS" \| "RULES" \| "TASK_SUCCESS" \| "HISTORY" \| "LEADERBOARD" \| "SURPRISE_AWARD" \| "MOOD_SELECTOR"/g, `openModal: (type: "CONFIRM_TASK" | "USER_STATS" | "RULES" | "TASK_SUCCESS" | "HISTORY" | "LEADERBOARD" | "SURPRISE_AWARD" | "MOOD_SELECTOR" | "LEVEL_UP"`);
fs.writeFileSync(storeFile, storeContent);

// 2. Update Header.tsx
let headerFile = 'src/components/dashboard/Header.tsx';
let headerContent = fs.readFileSync(headerFile, 'utf8');

const effectSearch = `  useEffect(() => {
    const updateTime = () => {`;
const effectReplace = `  useEffect(() => {
    // Check for Level Up
    if (currentUser) {
      const currentLevel = getLevelInfo(currentUser.puntosAcumulados || 0).level;
      const lastSeenLevel = localStorage.getItem(\`lastSeenLevel_\${currentUser.id}\`);

      if (lastSeenLevel) {
        if (currentLevel > parseInt(lastSeenLevel)) {
          openModal("LEVEL_UP", { level: currentLevel, title: getLevelInfo(currentUser.puntosAcumulados || 0).title });
          localStorage.setItem(\`lastSeenLevel_\${currentUser.id}\`, currentLevel.toString());
        }
      } else {
        localStorage.setItem(\`lastSeenLevel_\${currentUser.id}\`, currentLevel.toString());
      }
    }

    const updateTime = () => {`;
headerContent = headerContent.replace(effectSearch, effectReplace);
fs.writeFileSync(headerFile, headerContent);

// 3. Update ModalManager.tsx
let managerFile = 'src/components/dashboard/ModalManager.tsx';
let managerContent = fs.readFileSync(managerFile, 'utf8');

const effectModalSearch = `    if (isOpen && type === "TASK_SUCCESS") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }`;
const effectModalReplace = `    if (isOpen && (type === "TASK_SUCCESS" || type === "LEVEL_UP")) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: type === "LEVEL_UP" ? ['#FFD700', '#FFA500', '#FF8C00', '#8A2BE2', '#00CED1'] : undefined
      });
    }`;
managerContent = managerContent.replace(effectModalSearch, effectModalReplace);

const renderModalSearch = `      {type === "TASK_SUCCESS" && (`;
const renderModalReplace = `      {type === "LEVEL_UP" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Subiste de Nivel!">
          <div className="flex flex-col items-center text-center py-6">
            <img
              src="/winners-animate.svg"
              alt="¡Subiste de Nivel!"
              className="w-48 h-48 mb-6 drop-shadow-xl animate-bounce"
            />
            <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
              ¡Nivel {data?.level}!
            </h3>
            <p className="text-[var(--on-surface-variant)] text-xl mb-4 font-body font-bold">
              Nuevo Rango: <span className="text-[var(--primary)]">{data?.title}</span>
            </p>
            <p className="text-[var(--on-surface-variant)] text-md mb-6 px-4">
              ¡Tu esfuerzo está dando frutos! Sigue completando tareas para alcanzar el siguiente rango.
            </p>
            <button
              onClick={closeModal}
              className="btn-primary w-full py-4 text-lg shadow-lg"
            >
              ¡A seguir subiendo!
            </button>
          </div>
        </Modal>
      )}

      {type === "TASK_SUCCESS" && (`;
managerContent = managerContent.replace(renderModalSearch, renderModalReplace);

fs.writeFileSync(managerFile, managerContent);
console.log("Success Level Up");
