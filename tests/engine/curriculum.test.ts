import { describe, expect, it } from "vitest";
import {
  curriculum,
  getLevel,
  getSkill,
  skillsForLevel,
} from "@/engine/curriculum";
import { skillSchema, type LevelId } from "@/engine/curriculum/types";

const allSkills = curriculum.flatMap((level) => level.skills);
const levels: LevelId[] = [1, 2, 3];

describe("curriculum content", () => {
  it("passes the skill schema", () => {
    for (const skill of allSkills) {
      expect(skillSchema.safeParse(skill).success, skill.id).toBe(true);
    }
  });

  it("has at least 6 skills in every level", () => {
    for (const level of levels) {
      expect(skillsForLevel(level).length).toBeGreaterThanOrEqual(6);
    }
  });

  it("gives every skill 4 to 10 items", () => {
    for (const skill of allSkills) {
      expect(skill.items.length, skill.id).toBeGreaterThanOrEqual(4);
      expect(skill.items.length, skill.id).toBeLessThanOrEqual(10);
    }
  });

  it("uses unique skill ids and unique item ids", () => {
    const skillIds = allSkills.map((s) => s.id);
    const itemIds = allSkills.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(skillIds).size).toBe(skillIds.length);
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it("gives every item a picture and no repeated picture inside a skill", () => {
    for (const skill of allSkills) {
      const pictures = skill.items.map((i) => i.picture);
      expect(pictures.every((p) => p.length > 0), skill.id).toBe(true);
      expect(new Set(pictures).size, skill.id).toBe(pictures.length);
    }
  });

  it("puts each skill in the level its id names", () => {
    for (const skill of allSkills) {
      expect(skill.id.startsWith(`l${skill.level}.`), skill.id).toBe(true);
    }
  });

  it("orders skills inside a level by their order field", () => {
    for (const level of levels) {
      const orders = skillsForLevel(level).map((s) => s.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
      expect(new Set(orders).size).toBe(orders.length);
    }
  });

  it("looks skills and levels up by id", () => {
    expect(getSkill("l2.animals")?.title).toBe("Animals");
    expect(getSkill("nope")).toBeUndefined();
    expect(getLevel(3).id).toBe(3);
  });
});
