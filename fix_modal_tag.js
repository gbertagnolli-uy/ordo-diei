const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

const badFooter = `      </div>
    </div>
    </div>
  );
}`;

const goodFooter = `      </div>
    </div>
  );
}`;

content = content.replace(badFooter, goodFooter);
fs.writeFileSync('src/components/dashboard/ModalManager.tsx', content);
