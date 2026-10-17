import type { Mood } from "@/types/domain";

export type MoodFace = { mood: Mood; face: string; word: string };

/** The six feelings of the session check-in (spec 05). Emoji faces are the one allowed use. */
export const CHECK_IN_FACES: readonly MoodFace[] = [
  { mood: "HAPPY", face: "😊", word: "happy" },
  { mood: "OKAY", face: "😐", word: "okay" },
  { mood: "SAD", face: "😢", word: "sad" },
  { mood: "ANGRY", face: "😠", word: "angry" },
  { mood: "TIRED", face: "😴", word: "tired" },
  { mood: "EXCITED", face: "🤩", word: "excited" },
];

/** The always-visible strip only has room for three, at 64 px with 16 px gaps on a 360 px phone. */
export const QUICK_FACES: readonly MoodFace[] = CHECK_IN_FACES.filter((f) =>
  ["HAPPY", "SAD", "ANGRY"].includes(f.mood),
);
