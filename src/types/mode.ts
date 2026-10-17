import type { Mode, Mood } from "./domain";

export type TurnKind = "text" | "voice" | "card" | "mood" | "break";

/** The child's latest turn, already passed through the input guard. */
export type TurnInput = {
  text: string;
  kind: TurnKind;
  /** Mood face the child tapped, if any. */
  tappedMood: Mood | null;
  /** Milliseconds from cards appearing to the tap; null for non-card turns. */
  answerMs: number | null;
  /** True when the input guard flagged a harm or danger disclosure. */
  safetyDisclosure: boolean;
};

/** What the app remembers about the session so far. */
export type TurnHistory = {
  /** SkillState.streak of the skill being taught: +n correct, -n wrong. */
  skillStreak: number;
  previousFastGuess: boolean;
  lastBotAt: Date | null;
  teachingStreak: number;
  sessionStartedAt: Date;
  lastMood: Mood | null;
};

export type Signals = {
  feeling: Mood | null;
  wantsBreak: boolean;
  refusal: boolean;
  isQuestion: boolean;
  isStory: boolean;
  isGreeting: boolean;
  /** Child tapped a happy face or said they are ready to go on. */
  isReady: boolean;
  safetyDisclosure: boolean;
  correctStreak: number;
  wrongStreak: number;
  fastGuess: boolean;
  previousFastGuess: boolean;
  silenceMs: number;
  teachingStreak: number;
  sessionMinutes: number;
  /** True only on the first turn past the break time, so the suggestion comes once and never traps the child in Calm. */
  breakTimeReached: boolean;
  lastMood: Mood | null;
};

/** The mode of the previous turn, kept to apply hysteresis and alternate breaks. */
export type PreviousMode = {
  mode: Mode;
  turnsInMode: number;
  /** Which break Pip took last when the teaching streak ran out. */
  lastBreak: "CHAT" | "PLAY" | null;
};

export type ModeDecision = {
  mode: Mode;
  mood: Mood;
  confidence: number;
  /** Plain-language reason the parent view can show. */
  reason: string;
};
