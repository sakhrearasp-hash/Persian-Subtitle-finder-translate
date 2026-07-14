#!/bin/bash
sed -i 's/body: JSON.stringify({ movieName, apiKey: openSubtitlesApiKey }),/body: JSON.stringify({ movieName, apiKey: openSubtitlesApiKey, engines: selectedEngines }),/g' src/App.tsx
