import { MASTERED } from "@/engine/config";
import { curriculum } from "@/engine/curriculum";
import type { LevelId } from "@/engine/curriculum/types";
import { evaluateLevel } from "@/engine/progression";
import type { SkillState } from "@/types/engine";

export type SkillView = { id: string; title: string; mastered: boolean; current: boolean };
export type IslandView = {
  level: LevelId;
  title: string;
  /** Foggy on the map until the engine unlocks it. */
  locked: boolean;
  skills: SkillView[];
};
export type Sticker = { skillId: string; title: string; picture: string };

const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });

/** A sticker shows one picture, so "⭐⭐⭐" becomes "⭐"; image paths pass through untouched. */
export function stickerPicture(picture: string): string {
  if (picture.startsWith("/")) return picture;
  return graphemes.segment(picture)[Symbol.iterator]().next().value?.segment ?? picture;
}

function masteryById(states: SkillState[]): Map<string, number> {
  return new Map(states.map((s) => [s.skillId, s.mastery]));
}

/** The highest level open to the child, using the engine's own unlock rule so map and teaching never disagree. */
export function highestOpenLevel(states: SkillState[]): LevelId {
  let level: LevelId = 1;
  for (;;) {
    // Age and interests do not affect unlocking.
    const decision = evaluateLevel({ level, ageBand: "AGE_5_6", interests: [] }, states);
    if (decision.changed === "none") return level;
    level = decision.level;
  }
}

/** One island per level; the first unmastered skill of the highest open level is "current". */
export function buildIslands(states: SkillState[]): IslandView[] {
  const mastery = masteryById(states);
  const open = highestOpenLevel(states);
  const current = curriculum
    .find((l) => l.id === open)
    ?.skills.find((s) => (mastery.get(s.id) ?? 0) < MASTERED)?.id;

  return curriculum.map((level) => ({
    level: level.id,
    title: level.title,
    locked: level.id > open,
    skills: level.skills.map((skill) => ({
      id: skill.id,
      title: skill.title,
      mastered: (mastery.get(skill.id) ?? 0) >= MASTERED,
      current: skill.id === current,
    })),
  }));
}

/** One sticker per mastered skill, in curriculum order, pictured by the skill's first word. */
export function earnedStickers(states: SkillState[]): Sticker[] {
  const mastery = masteryById(states);
  return curriculum
    .flatMap((level) => level.skills)
    .filter((skill) => (mastery.get(skill.id) ?? 0) >= MASTERED)
    .map((skill) => ({ skillId: skill.id, title: skill.title, picture: stickerPicture(skill.items[0].picture) }));
}
