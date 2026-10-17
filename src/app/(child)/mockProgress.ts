import { curriculum } from "@/engine/curriculum";
import { newSkillState } from "@/engine/mastery";
import type { SkillState } from "@/types/engine";

const MASTERED_LEVEL_ONE = 8;
const MASTERED_LEVEL_TWO = 3;

/**
 * Stand-in for GET /api/progress until it lands: level 1 almost done (so level 2 is open),
 * a few level 2 skills mastered, one in progress, level 3 still foggy.
 */
export function mockSkillStates(): SkillState[] {
  const mastery = (level: number, index: number): number => {
    if (level === 1) return index < MASTERED_LEVEL_ONE ? 0.9 : 0;
    if (level === 2) return index < MASTERED_LEVEL_TWO ? 0.85 : index === MASTERED_LEVEL_TWO ? 0.5 : 0;
    return 0;
  };
  return curriculum.flatMap((level) =>
    level.skills.map((skill, index) => ({ ...newSkillState(skill.id), mastery: mastery(level.id, index) })),
  );
}
