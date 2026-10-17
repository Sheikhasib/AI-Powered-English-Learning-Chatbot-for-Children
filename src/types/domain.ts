/** Shared domain vocabulary. Values match the Prisma enums so rows map 1:1. */

export const AGE_BANDS = ["AGE_3_4", "AGE_5_6"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const MODES = ["LEARN", "CHAT", "PLAY", "SUPPORT", "CALM"] as const;
export type Mode = (typeof MODES)[number];

export const MOODS = [
  "HAPPY",
  "OKAY",
  "SAD",
  "ANGRY",
  "TIRED",
  "SCARED",
  "EXCITED",
] as const;
export type Mood = (typeof MOODS)[number];

/** Seeded random source returning a float in [0, 1). Engine code never calls Math.random. */
export type Rng = () => number;
