export interface WordBoundaryItem {
  type: string;
  offset: number; // 100-nanosecond ticks (10,000,000 ticks = 1 second)
  duration: number;
  text: string;
}

/**
 * Formats ticks (100ns units) into SRT timestamp format: HH:MM:SS,mmm
 */
export function formatSrtTimestamp(ticks: number): string {
  const totalMs = Math.floor(ticks / 10000);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hours = Math.floor(totalMin / 60);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(min)}:${pad(sec)},${pad(ms, 3)}`;
}

/**
 * Converts Edge TTS word boundaries into natural, readable SubRip (.srt) subtitle cues.
 * Groups words into coherent phrases based on punctuation or max 6-8 words per subtitle.
 */
export function generateSrtFromWordBoundaries(
  boundaries: WordBoundaryItem[],
  fullFallbackText?: string
): string {
  if (!boundaries || boundaries.length === 0) {
    // If no word boundaries available, create a single subtitle cue for the entire text
    if (fullFallbackText) {
      return `1\n00:00:00,000 --> 00:00:05,000\n${fullFallbackText.trim()}\n\n`;
    }
    return '';
  }

  const srtCues: Array<{ start: number; end: number; text: string }> = [];
  let currentGroup: WordBoundaryItem[] = [];

  const flushGroup = () => {
    if (currentGroup.length === 0) return;
    const start = currentGroup[0].offset;
    const last = currentGroup[currentGroup.length - 1];
    const end = last.offset + last.duration;
    const text = currentGroup.map((w) => w.text).join(' ');

    srtCues.push({ start, end, text });
    currentGroup = [];
  };

  for (let i = 0; i < boundaries.length; i++) {
    const item = boundaries[i];
    currentGroup.push(item);

    const hasSentenceEnding = /[.!?]$/.test(item.text);
    const hasClauseEnding = /[,;:]$/.test(item.text);
    const isTooLong = currentGroup.length >= 7;

    // Check pause between current and next word
    const nextItem = boundaries[i + 1];
    const hasLongPause =
      nextItem && nextItem.offset - (item.offset + item.duration) > 5000000; // > 0.5s pause

    if (hasSentenceEnding || isTooLong || hasLongPause || (hasClauseEnding && currentGroup.length >= 4)) {
      flushGroup();
    }
  }

  // Flush remaining words
  flushGroup();

  // Format into standard SRT string
  return srtCues
    .map((cue, idx) => {
      const cueNumber = idx + 1;
      const startTime = formatSrtTimestamp(cue.start);
      const endTime = formatSrtTimestamp(cue.end);
      return `${cueNumber}\n${startTime} --> ${endTime}\n${cue.text}\n`;
    })
    .join('\n');
}
