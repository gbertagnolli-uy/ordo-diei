const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

// Insert LevelUpPopup component definition
const levelUpComponent = `
function LevelUpPopup({ data, onClose }: { data: any; onClose: () => void }) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#FFA500', '#FF8C00']
    });
  }, []);

  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="text-6xl mb-4 animate-bounce">🌟</div>
      <h3 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-2">
        ¡Nivel {data?.level}!
      </h3>
      <p className="text-2xl font-display font-bold text-[var(--warning)] mb-4">
        {data?.title}
      </p>
      <p className="text-[var(--on-surface-variant)] text-lg mb-6 font-body">
        ¡Increíble trabajo! Has acumulado suficientes puntos para subir de nivel.
      </p>
      <button
        onClick={onClose}
        className="btn-primary w-full py-4 text-lg shadow-lg"
      >
        ¡Genial!
      </button>
    </div>
  );
}

`;

content = content.replace('export function ModalManager() {', levelUpComponent + 'export function ModalManager() {');

// Add to modal render logic
const renderLogic = `      {type === "SURPRISE_AWARD" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎁 Premio Sorpresa" width="lg">
          <SurpriseAwardPopup data={data} onClose={closeModal} />
        </Modal>
      )}

      {type === "LEVEL_UP" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Subiste de Nivel!" width="md">
          <LevelUpPopup data={data} onClose={closeModal} />
        </Modal>
      )}`;

content = content.replace('      {type === "SURPRISE_AWARD" && (\n        <Modal isOpen={isOpen} onClose={closeModal} title="🎁 Premio Sorpresa" width="lg">\n          <SurpriseAwardPopup data={data} onClose={closeModal} />\n        </Modal>\n      )}', renderLogic);


fs.writeFileSync('src/components/dashboard/ModalManager.tsx', content);
