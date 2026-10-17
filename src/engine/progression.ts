import { curriculum, skillsForLevel } from "./curriculum";
import { LEVEL_UNLOCK_SHARE, MASTERED } from "./config";
import type { LevelId } from "./curriculum/types";
import type { LearnerProfile, SkillState } from "@/types/engine";

export type LevelDecision = {
  level: LevelId;
  changed: "up" | "none";
  /** True on a level-up so the UI can celebrate. */
  celebrate: boolean;
  reason: string;
};

/** Unlocks the next level when 80% of the current level's skills are mastered; levels never go down. */
export function evaluateLevel(profile: LearnerProfile, skills: SkillState[]): LevelDecision {
  const { level } = profile;
  if (level === curriculum.length) {
    return { level, changed: "none", celebrate: false, reason: `Level ${level} is the last level: all skills are open` };
  }

  const masteryById = new Map(skills.map((s) => [s.skillId, s.mastery]));
  const levelSkills = skillsForLevel(level);
  const masteredCount = levelSkills.filter((s) => (masteryById.get(s.id) ?? 0) >= MASTERED).length;

  if (masteredCount / levelSkills.length >= LEVEL_UNLOCK_SHARE) {
    const next = (level + 1) as LevelId; // safe: level < last level here
    return {
      level: next,
      changed: "up",
      celebrate: true,
      reason: `Unlocked Level ${next}: ${masteredCount} of ${levelSkills.length} skills mastered`,
    };
  }
  const needed = Math.ceil(levelSkills.length * LEVEL_UNLOCK_SHARE);
  return {
    level,
    changed: "none",
    celebrate: false,
    reason: `Level ${level}: ${masteredCount} of ${levelSkills.length} skills mastered, ${needed} needed`,
  };
}
