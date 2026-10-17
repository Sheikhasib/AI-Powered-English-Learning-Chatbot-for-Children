import type { Mood } from "@/types/domain";

export type CheckInFace = { mood: Mood; emoji: string; label: string };

export const CHECK_IN_PROMPT = "How do you feel today?";

/** The six faces shown at the start of every session. */
export const CHECK_IN_FACES: readonly CheckInFace[] = [
  { mood: "HAPPY", emoji: "😊", label: "happy" },
  { mood: "OKAY", emoji: "😐", label: "okay" },
  { mood: "SAD", emoji: "😢", label: "sad" },
  { mood: "ANGRY", emoji: "😠", label: "angry" },
  { mood: "TIRED", emoji: "😴", label: "tired" },
  { mood: "EXCITED", emoji: "🤩", label: "excited" },
];

export type CheckInReply = { line: string; feeling: Mood };

/** Names the chosen feeling back and returns it so it seeds `feeling` for the first turn. */
export function checkInReply(mood: Mood): CheckInReply {
  return { line: `You feel ${mood.toLowerCase()}. Thank you for telling me.`, feeling: mood };
}
