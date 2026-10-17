import type { Mood } from "@/types/domain";

/** Repeated letters collapse ("sadd", "saaad" -> "sad"), so spelling slips and speech-to-text stretches still match. */
function collapse(word: string): string {
  return word.replace(/(.)\1+/g, "$1");
}

const phrases = (list: readonly string[]): string[][] =>
  list.map((phrase) => phrase.split(" ").map(collapse));

/** Lowercases, drops apostrophes ("don't" -> "dont") and returns collapsed word tokens; "?" survives as its own token. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\?/g, " ? ")
    .split(/[^a-z0-9?]+/)
    .filter(Boolean)
    .map(collapse);
}

function startsAt(tokens: string[], at: number, phrase: string[]): boolean {
  return phrase.every((word, i) => tokens[at + i] === word);
}

/** True when any phrase appears as consecutive tokens. */
export function hasPhrase(tokens: string[], list: string[][]): boolean {
  return list.some((phrase) => tokens.some((_, at) => startsAt(tokens, at, phrase)));
}

/** Worrying feelings are listed first so they win when a child names several. */
const FEELING_WORDS: readonly (readonly [Mood, string[][]])[] = [
  ["SCARED", phrases(["scared", "skared", "scaired", "afraid", "frightened", "nervous", "worried"])],
  ["SAD", phrases(["sad", "cry", "crying", "unhappy", "upset", "lonely"])],
  ["ANGRY", phrases(["angry", "angrey", "angri", "mad", "grumpy", "cross"])],
  ["TIRED", phrases(["tired", "tird", "sleepy", "yawn", "exhausted"])],
  ["EXCITED", phrases(["excited", "exited", "yay", "wow"])],
  ["HAPPY", phrases(["happy", "happi", "glad"])],
  ["OKAY", phrases(["okay", "ok", "fine", "alright"])],
];

const NEGATIONS = new Set(["not", "dont", "never", "no"]);

/** First feeling word that is not negated ("not sad"), or null. */
export function findFeeling(tokens: string[]): Mood | null {
  for (const [mood, list] of FEELING_WORDS) {
    const found = tokens.some(
      (_, at) => !NEGATIONS.has(tokens[at - 1]) && list.some((phrase) => startsAt(tokens, at, phrase)),
    );
    if (found) return mood;
  }
  return null;
}

export const BREAK_PHRASES = phrases(["stop", "break", "no more", "all done", "im done", "go home", "bye", "tired", "sleepy"]);
export const REFUSAL_PHRASES = phrases(["no", "nope", "dont want", "dont wanna", "boring", "bored", "i hate", "not playing"]);
export const READY_PHRASES = phrases(["ready", "lets play", "lets go", "i feel better", "im better"]);
export const GREETING_PHRASES = phrases(["hello", "hi", "hey", "hiya", "good morning", "good afternoon", "good evening", "whats up"]);
export const STORY_PHRASES = phrases([
  "my dog", "my cat", "my mom", "my dad", "my mum", "my brother", "my sister", "my friend", "my teddy",
  "today i", "yesterday", "i went", "i saw", "we went", "i have a", "once upon",
]);

/** Words that open a question even when speech-to-text drops the question mark. */
export const QUESTION_STARTERS = new Set(["why", "what", "who", "where", "when", "how", "which"]);
export const QUESTION_OPENERS = phrases(["can you", "do you", "are you", "is it", "did you"]);
