#!/bin/bash
cat << 'INNER_EOF' > metadata.json
{
  "name": "Persian Subtitle AI Translator",
  "description": "An intelligent web app that searches for real subtitle files via OpenSubtitles API and leverages local Ollama models to contextually translate English subtitles into natural Persian.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
INNER_EOF
