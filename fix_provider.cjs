const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Update changeProvider
content = content.replace(
  /const changeProvider = \(val: "ollama" \| "cerebras"\) => \{[\s\S]*?if \(val === "cerebras"\) \{[\s\S]*?setAvailableModels\(\[\{name: "llama3\.1-8b"\}\]\);[\s\S]*?setSelectedModel\("llama3\.1-8b"\);[\s\S]*?\} else \{[\s\S]*?validateOllamaConnection\(\);[\s\S]*?\}[\s\S]*?\};/,
  `const changeProvider = (val: "ollama" | "cerebras") => {
    setProvider(val);
    localStorage.setItem("persian_sub_provider", val);
    if (val === "cerebras") {
      setAvailableModels([]);
      setIsCerebrasConfigOpen(true);
    } else {
      validateOllamaConnection();
    }
  };`
);

// In the UI, hide the model dropdown and token part for Cerebras until models are available
// We look for the active model dropdown part
content = content.replace(
  /<div className="flex items-center justify-between mt-1 pt-2 border-t border-teal-500\/20">\s*<div className="flex items-center gap-2">\s*<span className="w-2\.5 h-2\.5 rounded-full bg-teal-400 animate-pulse" \/>\s*<span className="text-\[11px\] font-bold text-white">مدل فعال:<\/span>\s*<\/div>\s*<select[\s\S]*?<\/select>\s*<\/div>/,
  `{((provider === "ollama") || (provider === "cerebras" && availableModels.length > 0)) && (
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-teal-500/20">
         <div className="flex items-center gap-2">
           <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
           <span className="text-[11px] font-bold text-white">مدل فعال:</span>
         </div>
         <select
           value={selectedModel}
           onChange={(e) => changeModel(e.target.value)}
           className="bg-black/60 border border-teal-900/30 text-[11px] text-white rounded-3xl px-2 py-1 outline-none max-w-[150px]"
         >
           {availableModels.length > 0 ? (
             availableModels.map((m: any) => (
               <option key={m.name} value={m.name}>{m.name}</option>
             ))
           ) : (
             <option value={selectedModel}>{selectedModel}</option>
           )}
         </select>
       </div>
    )}`
);

fs.writeFileSync('src/App.tsx', content);
