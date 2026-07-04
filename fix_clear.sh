#!/bin/bash
sed -i '484,490c\
  // Clear/End Subtitle Search\
  const handleClearSearch = () => {\
    setMovieName("");\
    setSearchResults([]);\
    setSelectedResultId(null);\
    setError(null);\
  };\
\
  // Reset function to clear cache except for API Key\
  const handleResetCache = () => {\
    setMovieName("");\
    setSearchResults([]);\
    setSelectedResultId(null);\
    setSubtitles([]);\
    setActiveIndex(null);\
    setFilterQuery("");\
    setPastedText("");\
    setError(null);\
    setSuccess("حافظه موقت پاک شد.");\
  };' src/App.tsx
