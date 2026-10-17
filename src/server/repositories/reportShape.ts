import { curriculum } from "@/engine/curriculum";
import { MASTERED } from "@/engine/config";
import type { Mode } from "@/types/domain";

export type SkillRow = { id: string; title: string; mastery: number; mastered: boolean };
export type LevelProgress = { level: number; title: string; skills: SkillRow[]; masteredCount: number };

/** Lays the child's stored mastery over the full curriculum, so untouched skills show as empty bars. */
export function buildLevelProgress(states: { skillId: string; mastery: number }[]): LevelProgress[] {
  const masteryBySkill = new Map(states.map((state) => [state.skillId, state.mastery]));
  return curriculum.map((level) => {
    const skills = level.skills.map((skill) => {
      const mastery = masteryBySkill.get(skill.id) ?? 0;
      return { id: skill.id, title: skill.title, mastery, mastered: mastery >= MASTERED };
    });
    return {
      level: level.id,
      title: level.title,
      skills,
      masteredCount: skills.filter((skill) => skill.mastered).length,
    };
  });
}

export type ModeSwitch = { at: Date; mode: Mode; reason: string };

/** Keeps the first turn and every turn where the mode changed, so the timeline reads as switches. */
export function buildModeTimeline(turns: { createdAt: Date; mode: Mode; modeReason: string }[]): ModeSwitch[] {
  const switches: ModeSwitch[] = [];
  for (const turn of turns) {
    if (switches.at(-1)?.mode === turn.mode) continue;
    switches.push({ at: turn.createdAt, mode: turn.mode, reason: turn.modeReason });
  }
  return switches;
}
