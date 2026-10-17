import {
  BREAK_AFTER_MINUTES,
  CORRECT_STREAK_HAPPY,
  MAX_TEACHING_STREAK,
  MIN_TURNS_IN_SUPPORT,
  SILENCE_PLAY_MS,
  WRONG_STREAK_SUPPORT,
} from "./config";
import type { Mode, Mood } from "@/types/domain";
import type { ModeDecision, PreviousMode, Signals } from "@/types/mode";

type Rule = { mode: Mode; confidence: number; reason: string };

/** Where a brand-new session starts: no history, so no hysteresis applies. */
export const INITIAL_MODE: PreviousMode = { mode: "CHAT", turnsInMode: 0, lastBreak: null };

const GENTLE_MODES: Mode[] = ["SUPPORT", "CALM"];
const NEGATIVE_FEELINGS: Mood[] = ["SAD", "SCARED", "ANGRY"];

function breakReason(s: Signals): string {
  if (s.wantsBreak) return "child asked for a break";
  if (s.lastMood === "TIRED") return "child seemed tired last turn";
  return `session reached ${BREAK_AFTER_MINUTES} minutes`;
}

function playReason(s: Signals): string {
  if (s.refusal) return "child did not want to continue";
  if (s.silenceMs > SILENCE_PLAY_MS) return "child went quiet";
  return "child tapped very fast twice";
}

/** The seven rules in priority order; the first match wins. */
function matchRule(s: Signals, prev: PreviousMode): Rule {
  if (s.feeling && NEGATIVE_FEELINGS.includes(s.feeling)) {
    return { mode: "SUPPORT", confidence: 0.95, reason: `child said or showed they feel ${s.feeling.toLowerCase()}` };
  }
  if (s.safetyDisclosure) {
    return { mode: "SUPPORT", confidence: 1, reason: "child shared something for a grown-up (safety flag)" };
  }
  // Break time and tiredness only suggest a rest; a child who says they are ready may go on.
  if (s.wantsBreak || (!s.isReady && (s.breakTimeReached || s.lastMood === "TIRED"))) {
    return { mode: "CALM", confidence: 0.9, reason: breakReason(s) };
  }
  if (s.wrongStreak >= WRONG_STREAK_SUPPORT || (s.refusal && s.wrongStreak >= 1)) {
    return { mode: "SUPPORT", confidence: 0.85, reason: "child is stuck or upset after misses" };
  }
  if (s.refusal || (s.fastGuess && s.previousFastGuess) || s.silenceMs > SILENCE_PLAY_MS) {
    return { mode: "PLAY", confidence: 0.8, reason: `${playReason(s)}, so a playful turn` };
  }
  if (s.isQuestion || s.isStory || s.isGreeting) {
    return { mode: "CHAT", confidence: 0.8, reason: "child asked, told or greeted, so Pip chats" };
  }
  if (s.teachingStreak >= MAX_TEACHING_STREAK) {
    const mode = prev.lastBreak === "CHAT" ? "PLAY" : "CHAT";
    return { mode, confidence: 0.75, reason: `${s.teachingStreak} learning turns in a row, time for a ${mode.toLowerCase()} break` };
  }
  return { mode: "LEARN", confidence: 0.7, reason: "nothing needs a change, so keep learning" };
}

/** Holds Support and Calm for 2 turns unless the child is ready, and never leaves them straight to Learn. */
function applyHysteresis(rule: Rule, s: Signals, prev: PreviousMode): Rule {
  if (!GENTLE_MODES.includes(prev.mode) || GENTLE_MODES.includes(rule.mode)) return rule;
  if (prev.turnsInMode < MIN_TURNS_IN_SUPPORT && !s.isReady) {
    return { mode: prev.mode, confidence: 0.7, reason: `staying in ${prev.mode.toLowerCase()} a little longer` };
  }
  if (rule.mode === "LEARN") {
    const mode = prev.mode === "SUPPORT" ? "CHAT" : "PLAY";
    return { mode, confidence: 0.7, reason: `easing back from ${prev.mode.toLowerCase()} with ${mode.toLowerCase()} first` };
  }
  return rule;
}

const UPBEAT_MOODS: Mood[] = ["HAPPY", "EXCITED"];

function inferMood(s: Signals): Mood {
  if (s.feeling) return s.feeling;
  // Saying "ready" ends a tired or upset spell, so the old mood does not pull Pip back next turn.
  if (s.isReady) return s.lastMood && UPBEAT_MOODS.includes(s.lastMood) ? s.lastMood : "OKAY";
  if (s.lastMood) return s.lastMood;
  if (s.correctStreak >= CORRECT_STREAK_HAPPY) return "HAPPY";
  return "OKAY";
}

/** First matching rule wins (feeling, break, stuck, bored, curious, streak, learn); Support and Calm are sticky. */
export function detectMode(signals: Signals, prev: PreviousMode): ModeDecision {
  const rule = applyHysteresis(matchRule(signals, prev), signals, prev);
  return { mode: rule.mode, mood: inferMood(signals), confidence: rule.confidence, reason: rule.reason };
}
