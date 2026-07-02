import { SubtitleLine } from "../types";

/**
 * Parses an SRT string into an array of SubtitleLine objects.
 */
export function parseSRT(content: string): SubtitleLine[] {
  if (!content) return [];

  // Normalize line endings and split by empty lines (supports both CRLF and LF)
  const normalized = content.replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n\s*\n/);
  const subtitles: SubtitleLine[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Line 1 is usually the index (e.g. "1")
    let index = parseInt(lines[0].trim(), 10);
    let timeLineIdx = 1;

    // If the first line doesn't look like an index, it might be that the index was omitted
    if (isNaN(index) || !lines[0].trim()) {
      // Try to see if line 0 has the arrow "-->", which means index line is missing
      if (lines[0].includes("-->")) {
        index = subtitles.length + 1;
        timeLineIdx = 0;
      } else {
        continue;
      }
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes("-->")) continue;

    const [startPart, endPart] = timeLine.split("-->").map(s => s.trim());
    if (!startPart || !endPart) continue;

    // Dialogue text is everything after the timeline
    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join("\n").trim();

    subtitles.push({
      id: index,
      startTime: startPart,
      endTime: endPart,
      text,
      translatedText: "",
    });
  }

  // Sort by start time or ID to preserve sequence
  return subtitles.sort((a, b) => a.id - b.id);
}

/**
 * Converts an array of SubtitleLine objects back into an SRT string.
 */
export function stringifySRT(subtitles: SubtitleLine[], useTranslation = false): string {
  return subtitles
    .map((sub, idx) => {
      const index = idx + 1;
      const content = useTranslation && sub.translatedText ? sub.translatedText : sub.text;
      return `${index}\n${sub.startTime} --> ${sub.endTime}\n${content}`;
    })
    .join("\n\n") + "\n";
}
