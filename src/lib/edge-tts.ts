import { EdgeTTS, type Voice } from '@andresaya/edge-tts';
import { VoiceOption, TTSRequest } from '@/types/tts';
import { generateSrtFromWordBoundaries, WordBoundaryItem } from './srt';

// In-memory cache for voices to avoid redundant remote requests
let cachedVoices: VoiceOption[] | null = null;

/**
 * Parses locale name such as "English (United States)" into language and country
 */
function parseLocaleName(localeName: string): { language: string; country: string } {
  const match = localeName.match(/^([^(]+)(?:\(([^)]+)\))?/);
  if (match) {
    return {
      language: match[1]?.trim() || localeName,
      country: match[2]?.trim() || '',
    };
  }
  return { language: localeName, country: '' };
}

/**
 * Fetch and normalize the list of Edge TTS voices
 */
export async function getVoicesList(): Promise<VoiceOption[]> {
  if (cachedVoices && cachedVoices.length > 0) {
    return cachedVoices;
  }

  const tts = new EdgeTTS();
  const rawVoices: Voice[] = await tts.getVoices();

  const formatted: VoiceOption[] = rawVoices.map((v) => {
    const rawLocaleName = (v as any).LocaleName || v.FriendlyName || v.Locale;
    const { language, country } = parseLocaleName(rawLocaleName);
    const displayName =
      (v as any).DisplayName ||
      v.LocalName ||
      v.ShortName.split('-').slice(-1)[0].replace('Neural', '');

    return {
      id: v.ShortName,
      name: v.ShortName,
      displayName,
      gender: v.Gender,
      locale: v.Locale,
      localeName: rawLocaleName,
      friendlyName: v.FriendlyName || `${displayName} (${v.Locale})`,
      country: country || v.Locale,
      language: language || v.Locale,
    };
  });

  // Sort: english voices first, then alphabetically by language & country
  formatted.sort((a, b) => {
    const aIsEn = a.locale.startsWith('en-');
    const bIsEn = b.locale.startsWith('en-');
    if (aIsEn && !bIsEn) return -1;
    if (!aIsEn && bIsEn) return 1;
    return a.friendlyName.localeCompare(b.friendlyName);
  });

  cachedVoices = formatted;
  return formatted;
}

/**
 * Synthesizes text to speech in-memory using Edge TTS
 * Returns the audio Buffer and .srt subtitle timestamps without any file-system writes
 */
export async function synthesizeSpeechWithSrt(
  request: TTSRequest
): Promise<{ buffer: Buffer; srtContent: string }> {
  const { text, voice, rate, pitch, volume } = request;

  if (!text || !text.trim()) {
    throw new Error('Text to synthesize is required');
  }

  const selectedVoice = voice || 'en-US-JennyNeural';
  const tts = new EdgeTTS();

  const options: { rate?: string; pitch?: string; volume?: string } = {};
  if (rate) options.rate = rate;
  if (pitch) options.pitch = pitch;
  if (volume) options.volume = volume;

  await tts.synthesize(text, selectedVoice, options);
  const buffer = tts.toBuffer();

  if (!buffer || buffer.length === 0) {
    throw new Error('TTS synthesis produced empty audio buffer');
  }

  const rawBoundaries = tts.getWordBoundaries() || [];
  const srtContent = generateSrtFromWordBoundaries(
    rawBoundaries as WordBoundaryItem[],
    text
  );

  return { buffer, srtContent };
}

/**
 * Synthesizes text to speech in-memory using Edge TTS
 * Returns the audio Buffer without any file-system writes (100% Vercel safe)
 */
export async function synthesizeSpeech(request: TTSRequest): Promise<Buffer> {
  const { buffer } = await synthesizeSpeechWithSrt(request);
  return buffer;
}
