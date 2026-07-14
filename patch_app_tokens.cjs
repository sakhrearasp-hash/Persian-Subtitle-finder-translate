const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add token state
content = content.replace(
  /const \[translationProgress, setTranslationProgress\] = useState\(0\);/,
  `const [translationProgress, setTranslationProgress] = useState(0);
  const [remainingTokens, setRemainingTokens] = useState<string | null>(null);`
);

// Update setRemainingTokens on translate
content = content.replace(
  /const translatedResults = parsedData\.translations \|\| \[\];/,
  `if (data.message && data.message.remainingTokens) {
    setRemainingTokens(data.message.remainingTokens);
  }
  const translatedResults = parsedData.translations || [];`
);

// Update setRemainingTokens on autocorrect
content = content.replace(
  /const correctedResults = parsedData\.corrections \|\| \[\];/,
  `if (data.message && data.message.remainingTokens) {
    setRemainingTokens(data.message.remainingTokens);
  }
  const correctedResults = parsedData.corrections || [];`
);

// Add remaining tokens display
content = content.replace(
  /<\/select>\s*<\/div>\s*<\/div>/,
  `</select>
    </div>
    {provider === "cerebras" && remainingTokens && (
      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <span className="text-[10px] font-bold text-slate-400">موجودی توکن (دقیقه):</span>
        <span className="text-xs text-amber-300 font-mono">{remainingTokens}</span>
      </div>
    )}
  </div>`
);

fs.writeFileSync('src/App.tsx', content);
