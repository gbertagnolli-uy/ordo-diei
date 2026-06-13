const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/ModalManager.tsx', 'utf8');

const replacement = `      </div>
    </div>
  );
}`;

content = content.replace(replacement, `      </div>
    </div>
    </div>
  );
}`);

fs.writeFileSync('src/components/dashboard/ModalManager.tsx', content);
