import { describe, expect, it } from "vitest";
import { skillsForLevel } from "@/engine/curriculum";
import { evaluateLevel } from "@/engine/progression";
import { newSkillState } from "@/engine/mastery";
import type { LevelId } from "@/engine/curriculum/types";
import type { LearnerProfile, SkillState } from "@/types/engine";

function profile(level: LevelId): LearnerProfile {
  return { level, ageBand: "AGE_5_6", interests: [] };
}

function masteredFirst(level: LevelId, count: number): SkillState[] {
  return skillsForLevel(level)
    .slice(0, count)
    .map((s) => ({ ...newSkillState(s.id), mastery: 0.9 }));
}

describe("evaluateLevel", () => {
  const total = skillsForLevel(1).length;
  const needed = Math.ceil(total * 0.8);

  it("unlocks the next level at exactly 80% of skills mastered", () => {
    const result = evaluateLevel(profile(1), masteredFirst(1, needed));
    expect(result).toMatchObject({ level: 2, changed: "up", celebrate: true });
    expect(result.reason).toBe(`Unlocked Level 2: ${needed} of ${total} skills mastered`);
  });

  it("stays put below 80%", () => {
    const result = evaluateLevel(profile(1), masteredFirst(1, needed - 1));
    expect(result).toMatchObject({ level: 1, changed: "none", celebrate: false });
    expect(result.reason).toBe(`Level 1: ${needed - 1} of ${total} skills mastered, ${needed} needed`);
  });

  it("counts a skill as mastered at exactly 0.8", () => {
    const skills = skillsForLevel(1).map((s) => ({ ...newSkillState(s.id), mastery: 0.8 }));
    expect(evaluateLevel(profile(1), skills).changed).toBe("up");
  });

  it("treats skills with no state yet as unmastered", () => {
    expect(evaluateLevel(profile(1), []).changed).toBe("none");
  });

  it("only counts skills from the current level", () => {
    const wrongLevel = masteredFirst(2, skillsForLevel(2).length);
    expect(evaluateLevel(profile(1), wrongLevel).changed).toBe("none");
  });

  it("never goes down, even if mastery drops", () => {
    const result = evaluateLevel(profile(2), []);
    expect(result.level).toBe(2);
    expect(result.changed).toBe("none");
  });

  it("stays on the last level when everything is mastered", () => {
    const all = masteredFirst(3, skillsForLevel(3).length);
    const result = evaluateLevel(profile(3), all);
    expect(result).toMatchObject({ level: 3, changed: "none", celebrate: false });
    expect(result.reason).toBe("Level 3 is the last level: all skills are open");
  });
});
