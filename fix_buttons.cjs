const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /<span>ترجمه هوشمند کل زیرنویس با هوش مصنوعی \(Farsi translation\)<\/span>/,
  `<span>ترجمه هوشمند کل زیرنویس با {provider === "cerebras" ? "Cerebras" : "Ollama"} (Farsi translation)</span>`
);

content = content.replace(
  /<span>اصلاح خودکار قواعد نگارشی و نیم‌فاصله‌ها با Ollama<\/span>/,
  `<span>اصلاح خودکار قواعد نگارشی و نیم‌فاصله‌ها با {provider === "cerebras" ? "Cerebras" : "Ollama"}</span>`
);

fs.writeFileSync('src/App.tsx', content);
