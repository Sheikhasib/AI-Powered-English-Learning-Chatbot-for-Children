import { CALM_ACTIVITIES, readyCheck } from "@/engine/sel/support";
import type { Activity } from "@/engine/curriculum/types";

/** The coping turn that shows the breathing bubble; the id is how the buddy screen recognises it. */
export const BREATHING_ACTIVITY_ID = "calm:belly-breathing";

export type Breaths = { inSeconds: number; outSeconds: number; cycles: number };
export type BreathPhase = { kind: "in" | "out" | "done"; count: number };

const bellyBreathing = CALM_ACTIVITIES.find((a) => a.id === "belly-breathing");

/** Timing from the engine's belly-breathing activity; undefined if the engine ever drops it. */
export const BELLY_BREATHS: Breaths | undefined = bellyBreathing?.breaths;

/** True when this turn's activity asks the child to breathe with the bubble. */
export function isBreathingActivity(activity: Activity | null): boolean {
  return activity?.id === BREATHING_ACTIVITY_ID;
}

/** Pip's breathing turn: the engine's belly-breathing lines, then the "ready?" cards for afterwards. */
export function breathingActivity(): Activity {
  return {
    id: BREATHING_ACTIVITY_ID,
    skillId: "support",
    kind: "picture-match",
    prompt: bellyBreathing?.lines.slice(0, 2).join(" ") ?? "Let's breathe together.",
    choices: readyCheck().choices ?? [],
    answerId: null,
    hint: "Breathe in slowly, then out.",
  };
}

/** Which breath the child is on at a whole second: in for `inSeconds`, out for `outSeconds`, `cycles` times. */
export function breathAt(second: number, { inSeconds, outSeconds, cycles }: Breaths): BreathPhase {
  const cycleLength = inSeconds + outSeconds;
  if (second >= cycles * cycleLength) return { kind: "done", count: 0 };
  const within = second % cycleLength;
  return within < inSeconds
    ? { kind: "in", count: within + 1 }
    : { kind: "out", count: within - inSeconds + 1 };
}

/** How long the whole exercise lasts. */
export function totalBreathSeconds({ inSeconds, outSeconds, cycles }: Breaths): number {
  return (inSeconds + outSeconds) * cycles;
}
