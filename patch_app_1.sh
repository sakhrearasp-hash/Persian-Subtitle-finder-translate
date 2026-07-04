#!/bin/bash
sed -i '91,102c\
  const [openSubtitlesApiKey, setOpenSubtitlesApiKey] = useState<string>(() => {\
    return localStorage.getItem("opensubtitles_api_key") || "";\
  });\
  const changeApiKey = (val: string) => {\
    setOpenSubtitlesApiKey(val);\
    localStorage.setItem("opensubtitles_api_key", val);\
  };' src/App.tsx
