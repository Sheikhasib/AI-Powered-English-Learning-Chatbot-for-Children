import {
  HUMAN_CLAIM_PATTERNS,
  MAX_REPLY_SENTENCES,
  MAX_REPLY_WORDS,
  MEETING_PATTERNS,
  OUTPUT_ONLY_BLOCKLIST,
  PERSONAL_QUESTION_PATTERNS,
  UNSAFE_WORDS,
} from "./lists";
import { normalise, wholeWordMatcher } from "./text";

export type OutputGuardReason =
  | "empty"
  | "too_long"
  | "too_many_sentences"
  | "url"
  | "blocklisted"
  | "personal_question"
  | "meeting"
  | "human_claim";

export type OutputGuardResult = { ok: true } | { ok: false; reason: OutputGuardReason };

const blocklistMatcher = wholeWordMatcher([...UNSAFE_WORDS, ...OUTPUT_ONLY_BLOCKLIST]);
const URL_LIKE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|io|co|app|dev|edu|gov|tv|me|ly|ai)\b/i;

function countSentences(text: string): number {
  return text.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim().length > 0).length;
}

function matchesAny(patterns: readonly RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/** Passes an LLM reply only if it is at most 40 words and 3 sentences, link-free, clean and asks nothing personal. */
export function outputGuard(reply: string): OutputGuardResult {
  const trimmed = reply.trim();
  if (trimmed.length === 0) return { ok: false, reason: "empty" };
  if (trimmed.split(/\s+/).length > MAX_REPLY_WORDS) return { ok: false, reason: "too_long" };
  if (countSentences(trimmed) > MAX_REPLY_SENTENCES) return { ok: false, reason: "too_many_sentences" };
  if (URL_LIKE.test(trimmed)) return { ok: false, reason: "url" };

  const plain = normalise(trimmed);
  if (blocklistMatcher.test(plain)) return { ok: false, reason: "blocklisted" };
  if (matchesAny(PERSONAL_QUESTION_PATTERNS, plain)) return { ok: false, reason: "personal_question" };
  if (matchesAny(MEETING_PATTERNS, plain)) return { ok: false, reason: "meeting" };
  if (matchesAny(HUMAN_CLAIM_PATTERNS, plain)) return { ok: false, reason: "human_claim" };
  return { ok: true };
}
