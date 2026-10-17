import { level1Skills } from "./l1";
import { level2Skills } from "./l2";
import { level3Skills } from "./l3";
import { skillSchema, type LevelId, type Skill } from "./types";

export type Level = { id: LevelId; title: string; skills: Skill[] };

function sortByOrder(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => a.order - b.order);
}

export const curriculum: readonly Level[] = [
  { id: 1, title: "Sounds and letters", skills: sortByOrder(level1Skills) },
  { id: 2, title: "Words", skills: sortByOrder(level2Skills) },
  { id: 3, title: "Sentences", skills: sortByOrder(level3Skills) },
];

if (process.env.NODE_ENV !== "production") {
  // Bad content should fail loudly in dev and tests, never reach a child.
  for (const level of curriculum) {
    for (const skill of level.skills) skillSchema.parse(skill);
  }
}

const skillsById = new Map(
  curriculum.flatMap((level) => level.skills).map((skill) => [skill.id, skill]),
);

/** Looks a skill up by id; undefined when the id is unknown. */
export function getSkill(id: string): Skill | undefined {
  return skillsById.get(id);
}

/** Returns the level definition including its ordered skills. */
export function getLevel(n: LevelId): Level {
  return curriculum[n - 1];
}

/** Returns a level's skills in teaching order. */
export function skillsForLevel(n: LevelId): Skill[] {
  return getLevel(n).skills;
}
