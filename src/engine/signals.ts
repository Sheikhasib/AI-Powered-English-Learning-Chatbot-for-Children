import { FAST_GUESS_MS, STORY_MIN_WORDS } from "./config";
import {
  BREAK_PHRASES,
  GREETING_PHRASES,
  QUESTION_OPENERS,
  QUESTION_STARTERS,
  READY_PHRASES,
  REFUSAL_PHRASES,
  STORY_PHRASES,
  findFeeling,
  hasPhrase,
  tokenize,
} from "./lexicon";
import type { Signals, TurnHistory, TurnInput } from "@/types/mode";

const MS_PER_MINUTE = 60_000;

function isQuestion(tokens: string[]): boolean {
  return (
    tokens.includes("?") ||
    QUESTION_STARTERS.has(tokens[0]) ||
    hasPhrase(tokens.slice(0, 2), QUESTION_OPENERS)
  );
}

/** Turns the child's input and session history into the flat signals the mode rules read. */
export function extractSignals(input: TurnInput, history: TurnHistory, now: Date): Signals {
  const tokens = tokenize(input.text);
  const wordCount = tokens.filter((t) => t !== "?").length;
  const tappedHappy = input.tappedMood === "HAPPY" || input.tappedMood === "EXCITED";

  return {
    feeling: input.tappedMood ?? findFeeling(tokens),
    wantsBreak: input.kind === "break" || hasPhrase(tokens, BREAK_PHRASES),
    refusal: hasPhrase(tokens, REFUSAL_PHRASES),
    isQuestion: isQuestion(tokens),
    isStory: hasPhrase(tokens, STORY_PHRASES) || wordCount >= STORY_MIN_WORDS,
    isGreeting: hasPhrase(tokens, GREETING_PHRASES),
    isReady: tappedHappy || hasPhrase(tokens, READY_PHRASES),
    safetyDisclosure: input.safetyDisclosure,
    correctStreak: Math.max(0, history.skillStreak),
    wrongStreak: Math.max(0, -history.skillStreak),
    fastGuess: input.kind === "card" && input.answerMs !== null && input.answerMs < FAST_GUESS_MS,
    previousFastGuess: history.previousFastGuess,
    silenceMs: history.lastBotAt ? now.getTime() - history.lastBotAt.getTime() : 0,
    teachingStreak: history.teachingStreak,
    sessionMinutes: (now.getTime() - history.sessionStartedAt.getTime()) / MS_PER_MINUTE,
    lastMood: history.lastMood,
  };
}
