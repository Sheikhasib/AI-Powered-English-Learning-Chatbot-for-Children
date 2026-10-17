import { BREATH_CYCLES, BREATH_SECONDS } from "../config";
import type { Choice } from "../curriculum/types";
import { pickOne } from "../rng";
import type { Mood, Rng } from "@/types/domain";

export type SupportStep = {
  kind: "validate" | "offer" | "ready-check";
  line: string;
  choices?: Choice[];
};

export const SUPPORT_OFFER_LINE = "Do you want to breathe, or play a slow game?";

const GENERAL_VALIDATION = "I hear you. Thank you for telling me.";

const VALIDATION: Partial<Record<Mood, string>> = {
  SAD: "It's okay to feel sad. I'm here with you.",
  SCARED: "It's okay to feel scared. I'm right here.",
  ANGRY: "It's okay to feel angry. Big feelings are okay.",
  TIRED: "You feel tired. Resting is okay.",
};

const COPING_CHOICES: Choice[] = [
  { id: "breathe", label: "Breathe", picture: "🫧" },
  { id: "slow-game", label: "Slow game", picture: "🐢" },
];

/** Support always validates first, then offers one coping choice as two picture cards; no teaching happens here. */
export function supportOpening(feeling: Mood | null): SupportStep[] {
  const validation = (feeling && VALIDATION[feeling]) || GENERAL_VALIDATION;
  return [
    { kind: "validate", line: validation },
    { kind: "offer", line: SUPPORT_OFFER_LINE, choices: COPING_CHOICES },
  ];
}

/** Asked after coping and before any teaching resumes. */
export function readyCheck(): SupportStep {
  return {
    kind: "ready-check",
    line: "Are you ready to play?",
    choices: [
      { id: "ready", label: "Ready", picture: "👍" },
      { id: "not-yet", label: "Not yet", picture: "🌙" },
    ],
  };
}

export const CALM_ACTIVITY_IDS = [
  "name-feeling",
  "belly-breathing",
  "count-five",
  "hug-squeeze",
  "take-a-break",
] as const;
export type CalmActivityId = (typeof CALM_ACTIVITY_IDS)[number];

export type CalmActivity = {
  id: CalmActivityId;
  title: string;
  /** What Pip says, in order. */
  lines: string[];
  /** Timing for the growing breathing bubble. */
  breaths?: { inSeconds: number; outSeconds: number; cycles: number };
};

export const CALM_ACTIVITIES: readonly CalmActivity[] = [
  {
    id: "name-feeling",
    title: "Name the feeling",
    lines: ["Let's name the feeling.", "Is it a big feeling or a small one?"],
  },
  {
    id: "belly-breathing",
    title: "Belly breathing",
    lines: ["Put your hand on your belly.", "Breathe in slowly. Count to 4.", "Now breathe out. Count to 4."],
    breaths: { inSeconds: BREATH_SECONDS, outSeconds: BREATH_SECONDS, cycles: BREATH_CYCLES },
  },
  {
    id: "count-five",
    title: "Count five things",
    lines: ["Let's find 5 things you can see.", "Point to each one. Count with me."],
  },
  {
    id: "hug-squeeze",
    title: "Hug yourself",
    lines: ["Give yourself a big hug.", "Squeeze, squeeze, squeeze. Now let go."],
  },
  {
    id: "take-a-break",
    title: "Take a break",
    lines: ["It's okay to take a break.", "We can play again later."],
  },
];

/** Picks a calm activity, skipping the one just used so Pip does not repeat itself. */
export function pickCalmActivity(rng: Rng, exclude?: CalmActivityId): CalmActivity {
  return pickOne(CALM_ACTIVITIES.filter((a) => a.id !== exclude), rng);
}
