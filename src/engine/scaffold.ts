import { EASIER_AFTER_MISSES, HINT_AFTER_MISSES } from "./config";
import type { Item, Skill } from "./curriculum/types";

export type Scaffold = { showHint: boolean; easier: boolean };

/** Hint after 2 misses in a row; after 3, also fewer cards and the easiest item. */
export function scaffoldFor(consecutiveMisses: number): Scaffold {
  return {
    showHint: consecutiveMisses >= HINT_AFTER_MISSES,
    easier: consecutiveMisses >= EASIER_AFTER_MISSES,
  };
}

/** The easiest item is the first one in teaching order, which the curriculum lists simplest first. */
export function easiestItem(skill: Skill): Item {
  return skill.items[0];
}
