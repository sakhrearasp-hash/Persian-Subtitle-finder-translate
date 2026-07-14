const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace the translation loop logic to use the backend
content = content.replace(
  /const subtitleLinesPrompt = chunk\.map\(\(s: any\) => \`Line \$\{s\.id\}: "\$\{s\.text\}"\`\)\.join\("\\n"\);[\s\S]*?if \(!response\.ok\) \{[\s\S]*?throw new Error\("خطا در ترجمه دسته اول زیرنویس‌ها با Ollama\."\);[\s\S]*?\}/,
  `const response = await fetch("/api/translate-subtitles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtitles: chunk,
            model: selectedModel,
            provider: provider,
            cerebrasApiKey: cerebrasApiKey
          }),
        });

        if (!response.ok) {
          const errText = await response.json().catch(() => ({}));
          throw new Error(errText.error || \`خطا در ترجمه دسته زیرنویس‌ها با \${provider}.\`);
        }`
);

// Replace the autocorrect loop logic to use the backend
content = content.replace(
  /const subtitleLinesPrompt = chunk\.map\(\(s: any\) => \`Line \$\{s\.id\}: "\$\{s\.translatedText \|\| s\.text\}"\`\)\.join\("\\n"\);[\s\S]*?if \(!response\.ok\) \{[\s\S]*?throw new Error\("خطا در اصلاح دسته اول زیرنویس‌ها با Ollama\."\);[\s\S]*?\}/,
  `const response = await fetch("/api/autocorrect-subtitles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subtitles: chunk,
            model: selectedModel,
            provider: provider,
            cerebrasApiKey: cerebrasApiKey
          }),
        });

        if (!response.ok) {
          const errText = await response.json().catch(() => ({}));
          throw new Error(errText.error || \`خطا در اصلاح دسته زیرنویس‌ها با \${provider}.\`);
        }`
);

fs.writeFileSync('src/App.tsx', content);
