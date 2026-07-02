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
  linesCount: number;
  lines: SubtitleLine[];
}

export type TranslationProvider = "groq";
