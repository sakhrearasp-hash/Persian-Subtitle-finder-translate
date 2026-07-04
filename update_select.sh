#!/bin/bash
sed -i '639,651c\
                       <select\
                         value={selectedModel}\
                         onChange={(e) => changeModel(e.target.value)}\
                         className="w-full bg-black/60 border border-teal-900/30 text-xs text-white rounded-3xl px-2.5 py-1.5 outline-none focus:border-teal-500"\
                       >\
                         {availableModels.length > 0 ? (\
                           availableModels.map((m: any) => (\
                             <option key={m.name} value={m.name}>{m.name}</option>\
                           ))\
                         ) : (\
                           <option value={selectedModel}>{selectedModel}</option>\
                         )}\
                       </select>' src/App.tsx
