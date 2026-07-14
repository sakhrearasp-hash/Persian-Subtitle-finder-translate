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
  lines?: SubtitleLine[];
  linesCount?: number;
}

export type TranslationProvider = "ollama" | "cerebras";
