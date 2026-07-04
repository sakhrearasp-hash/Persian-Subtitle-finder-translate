#!/bin/bash
cat << 'INNER_EOF' > src/types.ts
export interface SubtitleLine {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  translatedText?: string;
}

export interface SubtitleSearchResult {
  id: string;
  fileName: string;
  language: string;
  languageCode: string;
  source?: string;
  fps?: string;
  downloadCount?: number;
  release?: string;
  fileId?: string;
}

export type TranslationProvider = "ollama";
INNER_EOF
