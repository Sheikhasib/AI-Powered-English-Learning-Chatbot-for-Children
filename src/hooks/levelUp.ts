import { curriculum } from "@/engine/curriculum";
import type { LevelId } from "@/engine/curriculum/types";

const UNLOCKED_REASON = /^Unlocked Level ([1-9])\b/;

/**
 * Reads the new level out of a celebrate turn. The engine words a level-up
 * reason as "Unlocked Level N: ..."; any other celebrate is a plain right answer.
 */
export function unlockedLevel(reason: string): LevelId | null {
  const level = Number(UNLOCKED_REASON.exec(reason)?.[1]);
  return curriculum.find((l) => l.id === level)?.id ?? null;
}
