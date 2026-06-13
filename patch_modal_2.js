const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

const renderLogic = `      {type === "SURPRISE_AWARD" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Felicidades!" width="md">
          <SurpriseAwardPopup data={data} onClose={closeModal} />
        </Modal>
      )}

      {type === "LEVEL_UP" && (
        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Subiste de Nivel!" width="md">
          <LevelUpPopup data={data} onClose={closeModal} />
        </Modal>
      )}`;

content = content.replace('      {type === "SURPRISE_AWARD" && (\n        <Modal isOpen={isOpen} onClose={closeModal} title="🎉 ¡Felicidades!" width="md">\n          <SurpriseAwardPopup data={data} onClose={closeModal} />\n        </Modal>\n      )}', renderLogic);

fs.writeFileSync('src/components/dashboard/ModalManager.tsx', content);
