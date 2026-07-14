#!/bin/bash
sed -i '115a\
  const [selectedEngines, setSelectedEngines] = useState({\
    opensubtitles: true,\
    subscene: true,\
    yify: true,\
    addic7ed: true,\
    google: false\
  });\
\
  const toggleEngine = (engine: keyof typeof selectedEngines) => {\
    setSelectedEngines(prev => ({ ...prev, [engine]: !prev[engine] }));\
  };\
  const [remainingTokens, setRemainingTokens] = useState<string | null>(null);' src/App.tsx
