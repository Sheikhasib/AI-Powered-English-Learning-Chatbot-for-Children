/** Browser speech APIs, typed narrowly and feature-detected so the app works without them. */

type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

export type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionCtor = new () => Recognition;

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionCtor;
  webkitSpeechRecognition?: RecognitionCtor;
};

export function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Female-sounding, clear English voices read well to small children; fall back to any English one. */
const PREFERRED_VOICE = /samantha|aria|jenny|google uk english female|google us english|zira|karen|female/i;

export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  return english.find((v) => PREFERRED_VOICE.test(v.name)) ?? english[0] ?? null;
}

/** Splits a line into sentences so speech can start on the first one. */
export function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
}

export type SentenceChunk = { text: string; /** Where the sentence starts in the full line. */ offset: number };

/** The sentences added to `text` after the first `consumed` characters, each with its place in the full line. */
export function newSentences(text: string, consumed: number): { chunks: SentenceChunk[]; consumed: number } {
  const chunks: SentenceChunk[] = [];
  for (const match of text.slice(consumed).matchAll(/[^.!?]+[.!?]*\s*/g)) {
    const spoken = match[0].trim();
    if (spoken) chunks.push({ text: spoken, offset: consumed + match.index + match[0].length - match[0].trimStart().length });
  }
  return { chunks, consumed: text.length };
}
