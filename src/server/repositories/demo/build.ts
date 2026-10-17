import { detectMode } from "@/engine/detectMode";
import { createRng } from "@/engine/rng";
import type { Mode, Mood, Rng } from "@/types/domain";
import type { ModeDecision, PreviousMode, Signals } from "@/types/mode";
import { DEMO_SESSIONS, type DemoStep } from "./script";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const SESSION_LEAD_MIN = 45;
const TIMING_SEED = 2026;

export const DEMO_PROFILE = {
  nickname: "Mina",
  ageBand: "AGE_5_6",
  avatar: "fox",
  interests: ["animals", "music"],
  level: 2,
  stars: 47,
  summary: "Mina loves animals and singing. She counts well and likes short games.",
} as const;

/** [skillId, mastery, attempts]: Level 1 mostly mastered (8 of 10), Level 2 just begun. */
const SKILLS: readonly (readonly [string, number, number])[] = [
  ["l1.letters.a-e", 0.95, 14], ["l1.letters.f-j", 0.9, 12], ["l1.letters.k-o", 0.88, 11],
  ["l1.letters.p-t", 0.84, 10], ["l1.letters.u-z", 0.72, 8], ["l1.colors", 0.93, 13],
  ["l1.numbers.1-5", 0.86, 12], ["l1.numbers.6-10", 0.64, 7], ["l1.greetings", 0.91, 9],
  ["l1.shapes", 0.8, 8], ["l2.animals", 0.7, 9], ["l2.food", 0.55, 6],
  ["l2.family", 0.3, 3], ["l2.body", 0.15, 2],
];

export type DemoTurn = {
  createdAt: Date;
  childInput: string;
  inputKind: string;
  botReply: string;
  mode: Mode;
  modeReason: string;
  mood: Mood;
  activityId: string | null;
  correct: boolean | null;
  fallback: boolean;
  safetyFlag: string | null;
  tGuard: number;
  tContext: number;
  tEngine: number;
  tFirstToken: number;
  tTotal: number;
};
export type DemoSessionRows = { startedAt: Date; endedAt: Date; checkIn: Mood; turns: DemoTurn[] };
export type DemoSkillRow = {
  skillId: string;
  mastery: number;
  attempts: number;
  streak: number;
  lastSeenAt: Date;
  dueAt: Date;
};

const between = (rng: Rng, low: number, high: number) => low + Math.floor(rng() * (high - low + 1));

/** Made-up timings in the ranges a healthy deployment might show; they are sample data, never measurements. */
function sampleTimings(rng: Rng) {
  const tFirstToken = between(rng, 80, 400);
  return {
    tGuard: between(rng, 1, 4),
    tContext: between(rng, 8, 30),
    tEngine: between(rng, 1, 5),
    tFirstToken,
    tTotal: Math.max(between(rng, 150, 900), tFirstToken + 60),
  };
}

function signalsFor(step: DemoStep, run: number, teachingStreak: number, previousFast: boolean): Signals {
  return {
    feeling: null, wantsBreak: false, refusal: false, isQuestion: false, isStory: false,
    isGreeting: false, isReady: false, safetyDisclosure: false,
    correctStreak: Math.max(run, 0), wrongStreak: Math.max(-run, 0),
    fastGuess: step.fast ?? false, previousFastGuess: previousFast, silenceMs: 0,
    teachingStreak, sessionMinutes: step.atMin, breakTimeReached: false, lastMood: null,
    ...step.signals,
  };
}

/** Builds the whole demo history from the script, asking the real `detectMode` for every mode and reason. */
export function buildDemoSessions(now: Date): DemoSessionRows[] {
  const rng = createRng(TIMING_SEED);
  let lastBreak: PreviousMode["lastBreak"] = null;

  return DEMO_SESSIONS.map((session) => {
    const startedAt = new Date(now.getTime() - session.daysAgo * DAY_MS - SESSION_LEAD_MIN * MINUTE_MS);
    let prev: PreviousMode = { mode: "CHAT", turnsInMode: 0, lastBreak };
    let run = 0;
    let learnRun = 0;
    let previousFast = false;
    const turns: DemoTurn[] = [];

    session.steps.forEach((step, index) => {
      if (step.correct !== null) run = step.correct ? Math.max(run, 0) + 1 : Math.min(run, 0) - 1;
      const signals = signalsFor(step, run, learnRun, previousFast);
      const decision: ModeDecision = step.forced
        ? { ...detectMode(signals, prev), ...step.forced }
        : detectMode(signals, prev);

      if (decision.reason.includes("learning turns in a row")) lastBreak = decision.mode === "PLAY" ? "PLAY" : "CHAT";
      learnRun = decision.mode === "LEARN" ? learnRun + 1 : 0;
      previousFast = step.fast ?? false;
      prev = {
        mode: decision.mode,
        turnsInMode: decision.mode === prev.mode ? prev.turnsInMode + 1 : 1,
        lastBreak,
      };

      turns.push({
        createdAt: new Date(startedAt.getTime() + step.atMin * MINUTE_MS + index * 1000),
        childInput: step.text,
        inputKind: step.kind,
        botReply: step.reply,
        mode: decision.mode,
        modeReason: decision.reason,
        mood: decision.mood,
        activityId: step.skillId ? `${step.skillId}:picture-match:${index}` : null,
        correct: step.correct,
        fallback: step.fallback ?? false,
        safetyFlag: step.safetyFlag ?? null,
        ...sampleTimings(rng),
      });
    });

    const lastTurn = turns[turns.length - 1];
    return { startedAt, endedAt: new Date(lastTurn.createdAt.getTime() + MINUTE_MS), checkIn: session.checkIn, turns };
  });
}

/** Skill rows that make /parent show Level 1 nearly done and Level 2 started. */
export function buildDemoSkills(now: Date): DemoSkillRow[] {
  return SKILLS.map(([skillId, mastery, attempts], i) => ({
    skillId,
    mastery,
    attempts,
    streak: mastery >= 0.8 ? 3 : 1,
    lastSeenAt: new Date(now.getTime() - (i % 6) * DAY_MS),
    dueAt: new Date(now.getTime() + ((i % 4) + 1) * DAY_MS),
  }));
}
